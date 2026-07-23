import type {
  AnalyzeClaimResult,
  ClaimSourceInput,
  ConflictAssessment,
  ConflictCase,
  ExportManifest,
  Identity,
  MemoryClaim,
  RestoredContext,
  ResolutionDecision,
  StructuredClaim,
  TimelineEvent
} from "./domain.js";

export interface StoreAnalysisInput {
  identityId: string;
  originalText: string;
  structuredClaim: StructuredClaim;
  embedding: number[];
  source: ClaimSourceInput;
  actor: string;
  candidates: MemoryClaim[];
  assessments: ConflictAssessment[];
  modelProvider: string;
}

export interface ResolveCaseInput {
  caseId: string;
  decision: ResolutionDecision;
  rationale: string;
  actor: string;
}

export interface MemoryRepository {
  health(): Promise<{ database: string }>;
  createIdentity(input: {
    displayName: string;
    slug?: string;
    description?: string;
    actor: string;
  }): Promise<Identity>;
  getIdentity(identityId: string): Promise<Identity | null>;
  findSimilarClaims(identityId: string, embedding: number[], limit: number): Promise<MemoryClaim[]>;
  storeAnalysis(input: StoreAnalysisInput): Promise<AnalyzeClaimResult>;
  getConflictCase(caseId: string): Promise<ConflictCase | null>;
  getOpenConflicts(identityId: string): Promise<ConflictCase[]>;
  resolveConflict(input: ResolveCaseInput): Promise<ConflictCase>;
  restoreContext(identityId: string): Promise<RestoredContext>;
  getTimeline(identityId: string): Promise<TimelineEvent[]>;
  buildExport(identityId: string): Promise<ExportManifest>;
}
