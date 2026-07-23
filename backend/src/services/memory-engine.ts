import { z } from "zod";
import { memoryTypes, resolutionDecisions, type AnalyzeClaimInput, type AnalyzeClaimResult, type ConflictCase, type Identity, type RestoredContext, type TimelineEvent } from "../domain.js";
import type { MemoryRepository } from "../repository.js";
import type { MemoryModel } from "./model.js";

const identityInputSchema = z.object({
  displayName: z.string().trim().min(2).max(120),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80).optional(),
  description: z.string().trim().max(1200).optional(),
  actor: z.string().trim().min(1).max(120).default("human-owner")
});

const sourceSchema = z.object({
  kind: z.enum(["user", "document", "url", "system", "import"]).default("user"),
  title: z.string().trim().min(1).max(300).default("Direct user statement"),
  uri: z.string().url().max(2000).optional(),
  author: z.string().trim().max(200).optional(),
  occurredAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional()
});

const analyzeInputSchema = z.object({
  text: z.string().trim().min(3).max(8000),
  memoryType: z.enum(memoryTypes).optional(),
  source: sourceSchema.optional(),
  actor: z.string().trim().min(1).max(120).default("human-owner")
});

const resolutionInputSchema = z.object({
  decision: z.enum(resolutionDecisions),
  rationale: z.string().trim().min(3).max(2000),
  actor: z.string().trim().min(1).max(120).default("human-owner")
});

export class MemoryEngine {
  constructor(
    private readonly repository: MemoryRepository,
    private readonly model: MemoryModel
  ) {}

  health(): Promise<{ database: string; modelProvider: string }> {
    return this.repository.health().then((result) => ({ ...result, modelProvider: this.model.providerName }));
  }

  async createIdentity(rawInput: unknown): Promise<Identity> {
    const input = identityInputSchema.parse(rawInput);
    return this.repository.createIdentity({
      displayName: input.displayName,
      actor: input.actor,
      ...(input.slug ? { slug: input.slug } : {}),
      ...(input.description ? { description: input.description } : {})
    });
  }

  async analyzeClaim(identityId: string, rawInput: AnalyzeClaimInput | unknown): Promise<AnalyzeClaimResult> {
    const input = analyzeInputSchema.parse(rawInput);
    const identity = await this.repository.getIdentity(identityId);
    if (!identity) throw new Error("Identity not found");

    const structuredClaim = await this.model.extractClaim(input.text, input.memoryType);
    const embedding = await this.model.embed(structuredClaim.normalizedText);
    const candidates = await this.repository.findSimilarClaims(identityId, embedding, 8);
    const assessments = await this.model.assessConflicts(structuredClaim, candidates);

    return this.repository.storeAnalysis({
      identityId,
      originalText: input.text,
      structuredClaim,
      embedding,
      source: input.source
        ? {
            kind: input.source.kind,
            title: input.source.title,
            ...(input.source.uri ? { uri: input.source.uri } : {}),
            ...(input.source.author ? { author: input.source.author } : {}),
            ...(input.source.occurredAt ? { occurredAt: input.source.occurredAt } : {}),
            ...(input.source.metadata ? { metadata: input.source.metadata } : {})
          }
        : { kind: "user", title: "Direct user statement" },
      actor: input.actor,
      candidates,
      assessments,
      modelProvider: this.model.providerName
    });
  }

  getConflictCase(caseId: string): Promise<ConflictCase | null> {
    return this.repository.getConflictCase(caseId);
  }

  getOpenConflicts(identityId: string): Promise<ConflictCase[]> {
    return this.repository.getOpenConflicts(identityId);
  }

  async resolveConflict(caseId: string, rawInput: unknown): Promise<ConflictCase> {
    const input = resolutionInputSchema.parse(rawInput);
    return this.repository.resolveConflict({ caseId, ...input });
  }

  restoreContext(identityId: string): Promise<RestoredContext> {
    return this.repository.restoreContext(identityId);
  }

  getTimeline(identityId: string): Promise<TimelineEvent[]> {
    return this.repository.getTimeline(identityId);
  }

  buildExport(identityId: string) {
    return this.repository.buildExport(identityId);
  }
}
