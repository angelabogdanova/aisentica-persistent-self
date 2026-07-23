import { randomUUID } from "node:crypto";
import type {
  AnalyzeClaimResult,
  ConflictCase,
  ExportManifest,
  Identity,
  MemoryClaim,
  RestoredContext,
  TimelineEvent
} from "../domain.js";
import type {
  MemoryRepository,
  ResolveCaseInput,
  StoreAnalysisInput
} from "../repository.js";

interface StoredClaim extends MemoryClaim {
  embedding: number[];
}

function now(): string {
  return new Date().toISOString();
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function cosineSimilarity(left: number[], right: number[]): number {
  const length = Math.min(left.length, right.length);
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;
  for (let index = 0; index < length; index += 1) {
    const a = left[index] ?? 0;
    const b = right[index] ?? 0;
    dot += a * b;
    leftMagnitude += a * a;
    rightMagnitude += b * b;
  }
  if (leftMagnitude === 0 || rightMagnitude === 0) return 0;
  return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}

function publicClaim(claim: StoredClaim, similarity?: number): MemoryClaim {
  const { embedding: _embedding, ...rest } = claim;
  return similarity === undefined ? clone(rest) : { ...clone(rest), similarity };
}

export class InMemoryRepository implements MemoryRepository {
  private readonly identities = new Map<string, Identity>();
  private readonly claims = new Map<string, StoredClaim>();
  private readonly conflictCases = new Map<string, ConflictCase>();
  private readonly events = new Map<string, TimelineEvent[]>();
  private readonly snapshots = new Map<string, Map<number, string[]>>();

  async health(): Promise<{ database: string }> {
    return { database: "in-memory-test-repository" };
  }

  async createIdentity(input: {
    displayName: string;
    slug?: string;
    description?: string;
    actor: string;
  }): Promise<Identity> {
    const timestamp = now();
    const id = randomUUID();
    const slug = input.slug ?? `${input.displayName.toLocaleLowerCase("en").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "identity"}-${id.slice(0, 8)}`;
    const identity: Identity = {
      id,
      slug,
      displayName: input.displayName,
      description: input.description ?? null,
      currentVersion: 1,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    this.identities.set(id, identity);
    this.snapshots.set(id, new Map([[1, []]]));
    this.events.set(id, [{
      id: randomUUID(),
      eventType: "IDENTITY_CREATED",
      actor: input.actor,
      details: { slug },
      claimId: null,
      conflictCaseId: null,
      snapshotId: randomUUID(),
      createdAt: timestamp
    }]);
    return clone(identity);
  }

  async getIdentity(identityId: string): Promise<Identity | null> {
    const identity = this.identities.get(identityId);
    return identity ? clone(identity) : null;
  }

  async findSimilarClaims(identityId: string, embedding: number[], limit: number): Promise<MemoryClaim[]> {
    return [...this.claims.values()]
      .filter((claim) => claim.identityId === identityId && claim.status === "active")
      .map((claim) => ({ claim, similarity: cosineSimilarity(claim.embedding, embedding) }))
      .sort((left, right) => right.similarity - left.similarity)
      .slice(0, limit)
      .map(({ claim, similarity }) => publicClaim(claim, similarity));
  }

  private appendEvent(identityId: string, event: Omit<TimelineEvent, "id" | "createdAt">): TimelineEvent {
    const stored: TimelineEvent = { id: randomUUID(), createdAt: now(), ...event };
    const events = this.events.get(identityId) ?? [];
    events.push(stored);
    this.events.set(identityId, events);
    return stored;
  }

  private createSnapshot(identityId: string): number {
    const identity = this.identities.get(identityId);
    if (!identity) throw new Error("Identity not found");
    const version = identity.currentVersion + 1;
    const activeClaimIds = [...this.claims.values()]
      .filter((claim) => claim.identityId === identityId && claim.status === "active")
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id))
      .map((claim) => claim.id);
    const snapshots = this.snapshots.get(identityId) ?? new Map<number, string[]>();
    snapshots.set(version, activeClaimIds);
    this.snapshots.set(identityId, snapshots);
    identity.currentVersion = version;
    identity.updatedAt = now();
    return version;
  }

  async storeAnalysis(input: StoreAnalysisInput): Promise<AnalyzeClaimResult> {
    if (!this.identities.has(input.identityId)) throw new Error("Identity not found");
    const timestamp = now();
    const claim: StoredClaim = {
      id: randomUUID(),
      identityId: input.identityId,
      memoryType: input.structuredClaim.memoryType,
      subject: input.structuredClaim.subject,
      predicate: input.structuredClaim.predicate,
      object: input.structuredClaim.object,
      normalizedText: input.structuredClaim.normalizedText,
      originalText: input.originalText,
      confidence: input.structuredClaim.confidence,
      status: "active",
      sourceId: randomUUID(),
      supersedesClaimId: null,
      createdBy: input.actor,
      createdAt: timestamp,
      embedding: [...input.embedding]
    };
    const candidateIds = new Set(input.candidates.map((candidate) => candidate.id));
    const assessments = input.assessments.filter(
      (assessment) => assessment.hasConflict && candidateIds.has(assessment.existingClaimId)
    );

    if (assessments.length > 0) {
      claim.status = "candidate";
      this.claims.set(claim.id, claim);
      const caseId = randomUUID();
      const conflictCase: ConflictCase = {
        id: caseId,
        identityId: input.identityId,
        incomingClaim: publicClaim(claim),
        links: assessments.map((assessment) => {
          const existing = this.claims.get(assessment.existingClaimId);
          if (!existing) throw new Error("Conflict assessment points to a missing claim");
          const candidate = input.candidates.find((item) => item.id === existing.id);
          return {
            id: randomUUID(),
            ...assessment,
            similarity: candidate?.similarity ?? 1,
            existingClaim: publicClaim(existing)
          };
        }),
        status: "open",
        summary: `Incoming claim conflicts with ${assessments.length} active memory entr${assessments.length === 1 ? "y" : "ies"}.`,
        createdAt: timestamp,
        resolvedAt: null
      };
      this.conflictCases.set(caseId, conflictCase);
      this.appendEvent(input.identityId, {
        eventType: "CONFLICT_OPENED",
        actor: input.actor,
        details: { modelProvider: input.modelProvider, candidateCount: input.candidates.length },
        claimId: claim.id,
        conflictCaseId: caseId,
        snapshotId: null
      });
      return {
        outcome: "conflict",
        claim: publicClaim(claim),
        conflictCase: clone(conflictCase),
        modelProvider: input.modelProvider,
        candidateCount: input.candidates.length
      };
    }

    this.claims.set(claim.id, claim);
    const version = this.createSnapshot(input.identityId);
    this.appendEvent(input.identityId, {
      eventType: "CLAIM_COMMITTED",
      actor: input.actor,
      details: {
        modelProvider: input.modelProvider,
        candidateCount: input.candidates.length,
        source: clone(input.source),
        version
      },
      claimId: claim.id,
      conflictCaseId: null,
      snapshotId: randomUUID()
    });
    return {
      outcome: "committed",
      claim: publicClaim(claim),
      version,
      modelProvider: input.modelProvider,
      candidateCount: input.candidates.length
    };
  }

  async getConflictCase(caseId: string): Promise<ConflictCase | null> {
    const conflictCase = this.conflictCases.get(caseId);
    if (!conflictCase) return null;
    const incoming = this.claims.get(conflictCase.incomingClaim.id);
    const refreshed: ConflictCase = {
      ...clone(conflictCase),
      incomingClaim: incoming ? publicClaim(incoming) : clone(conflictCase.incomingClaim),
      links: conflictCase.links.map((link) => {
        const existing = this.claims.get(link.existingClaimId);
        return { ...clone(link), existingClaim: existing ? publicClaim(existing) : clone(link.existingClaim) };
      })
    };
    return refreshed;
  }

  async getOpenConflicts(identityId: string): Promise<ConflictCase[]> {
    const open = [...this.conflictCases.values()]
      .filter((conflictCase) => conflictCase.identityId === identityId && conflictCase.status === "open")
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
    return Promise.all(open.map(async (conflictCase) => (await this.getConflictCase(conflictCase.id)) as ConflictCase));
  }

  async resolveConflict(input: ResolveCaseInput): Promise<ConflictCase> {
    const conflictCase = this.conflictCases.get(input.caseId);
    if (!conflictCase) throw new Error("Conflict case not found");
    if (conflictCase.status !== "open") throw new Error("Conflict case is already resolved");
    const incoming = this.claims.get(conflictCase.incomingClaim.id);
    if (!incoming) throw new Error("Conflict case has no incoming claim");

    if (input.decision === "accept_incoming") {
      for (const link of conflictCase.links) {
        const existing = this.claims.get(link.existingClaimId);
        if (existing?.status === "active") existing.status = "superseded";
      }
      incoming.status = "active";
      incoming.supersedesClaimId = conflictCase.links[0]?.existingClaimId ?? null;
    } else if (input.decision === "keep_existing") {
      incoming.status = "rejected";
    } else {
      incoming.status = "active";
    }

    const version = this.createSnapshot(conflictCase.identityId);
    const resolvedAt = now();
    conflictCase.status = "resolved";
    conflictCase.resolvedAt = resolvedAt;
    conflictCase.resolution = {
      decision: input.decision,
      rationale: input.rationale,
      actor: input.actor,
      resultingVersion: version,
      createdAt: resolvedAt
    };
    this.appendEvent(conflictCase.identityId, {
      eventType: "CONFLICT_RESOLVED",
      actor: input.actor,
      details: {
        decision: input.decision,
        rationale: input.rationale,
        existingClaimIds: conflictCase.links.map((link) => link.existingClaimId),
        version
      },
      claimId: incoming.id,
      conflictCaseId: input.caseId,
      snapshotId: randomUUID()
    });
    return (await this.getConflictCase(input.caseId)) as ConflictCase;
  }

  async restoreContext(identityId: string): Promise<RestoredContext> {
    const identity = this.identities.get(identityId);
    if (!identity) throw new Error("Identity not found");
    const claimIds = this.snapshots.get(identityId)?.get(identity.currentVersion) ?? [];
    const claims = claimIds
      .map((id) => this.claims.get(id))
      .filter((claim): claim is StoredClaim => Boolean(claim))
      .map((claim) => publicClaim(claim));
    return {
      identity: clone(identity),
      version: identity.currentVersion,
      claims,
      compactContext: claims.map((claim) => `[${claim.memoryType.toUpperCase()}] ${claim.normalizedText}`).join("\n")
    };
  }

  async getTimeline(identityId: string): Promise<TimelineEvent[]> {
    if (!this.identities.has(identityId)) throw new Error("Identity not found");
    return clone(this.events.get(identityId) ?? []);
  }

  async buildExport(identityId: string): Promise<ExportManifest> {
    const currentContext = await this.restoreContext(identityId);
    return {
      schemaVersion: "1.0",
      exportedAt: now(),
      identity: clone(currentContext.identity),
      currentContext,
      timeline: await this.getTimeline(identityId)
    };
  }
}
