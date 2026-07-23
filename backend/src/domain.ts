export const memoryTypes = [
  "episodic",
  "semantic",
  "canonical",
  "procedural",
  "provenance"
] as const;

export type MemoryType = (typeof memoryTypes)[number];

export const conflictTypes = [
  "direct_negation",
  "identity_collision",
  "status_replacement",
  "temporal_update",
  "scope_collision",
  "uncertain"
] as const;

export type ConflictType = (typeof conflictTypes)[number];

export const resolutionDecisions = [
  "accept_incoming",
  "keep_existing",
  "coexist"
] as const;

export type ResolutionDecision = (typeof resolutionDecisions)[number];

export interface Identity {
  id: string;
  slug: string;
  displayName: string;
  description: string | null;
  currentVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface StructuredClaim {
  subject: string;
  predicate: string;
  object: string;
  normalizedText: string;
  memoryType: MemoryType;
  confidence: number;
}

export interface ClaimSourceInput {
  kind: "user" | "document" | "url" | "system" | "import";
  title: string;
  uri?: string;
  author?: string;
  occurredAt?: string;
  metadata?: Record<string, unknown>;
}

export interface MemoryClaim {
  id: string;
  identityId: string;
  memoryType: MemoryType;
  subject: string;
  predicate: string;
  object: string;
  normalizedText: string;
  originalText: string;
  confidence: number;
  status: "candidate" | "active" | "superseded" | "rejected";
  sourceId: string | null;
  supersedesClaimId: string | null;
  createdBy: string;
  createdAt: string;
  similarity?: number;
}

export interface ConflictAssessment {
  existingClaimId: string;
  hasConflict: boolean;
  conflictType: ConflictType;
  explanation: string;
  recommendedResolution: ResolutionDecision;
}

export interface ConflictLink extends ConflictAssessment {
  id: string;
  similarity: number;
  existingClaim: MemoryClaim;
}

export interface ConflictCase {
  id: string;
  identityId: string;
  incomingClaim: MemoryClaim;
  links: ConflictLink[];
  status: "open" | "resolved";
  summary: string;
  createdAt: string;
  resolvedAt: string | null;
  resolution?: {
    decision: ResolutionDecision;
    rationale: string;
    actor: string;
    resultingVersion: number;
    createdAt: string;
  };
}

export interface TimelineEvent {
  id: string;
  eventType: string;
  actor: string;
  details: Record<string, unknown>;
  claimId: string | null;
  conflictCaseId: string | null;
  snapshotId: string | null;
  createdAt: string;
}

export interface RestoredContext {
  identity: Identity;
  version: number;
  claims: MemoryClaim[];
  compactContext: string;
}

export interface AnalyzeClaimInput {
  text: string;
  memoryType?: MemoryType;
  source?: ClaimSourceInput;
  actor?: string;
}

export type AnalyzeClaimResult =
  | {
      outcome: "committed";
      claim: MemoryClaim;
      version: number;
      modelProvider: string;
      candidateCount: number;
    }
  | {
      outcome: "conflict";
      claim: MemoryClaim;
      conflictCase: ConflictCase;
      modelProvider: string;
      candidateCount: number;
    };

export interface ResolveConflictInput {
  decision: ResolutionDecision;
  rationale: string;
  actor?: string;
}

export interface ExportManifest {
  schemaVersion: "1.0";
  exportedAt: string;
  identity: Identity;
  currentContext: RestoredContext;
  timeline: TimelineEvent[];
}
