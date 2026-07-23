import { createHash, randomUUID } from "node:crypto";
import { Pool, type PoolClient, type QueryResultRow } from "pg";
import type {
  AnalyzeClaimResult,
  ConflictCase,
  ExportManifest,
  Identity,
  MemoryClaim,
  RestoredContext,
  ResolutionDecision,
  TimelineEvent
} from "../domain.js";
import type {
  MemoryRepository,
  ResolveCaseInput,
  StoreAnalysisInput
} from "../repository.js";

interface IdentityRow extends QueryResultRow {
  id: string;
  slug: string;
  display_name: string;
  description: string | null;
  current_version: number | string;
  created_at: Date | string;
  updated_at: Date | string;
}

interface ClaimRow extends QueryResultRow {
  id: string;
  identity_id: string;
  memory_type: MemoryClaim["memoryType"];
  subject: string;
  predicate: string;
  object_value: unknown;
  normalized_text: string;
  original_text: string;
  confidence: number | string;
  status: MemoryClaim["status"];
  source_id: string | null;
  supersedes_claim_id: string | null;
  created_by: string;
  created_at: Date | string;
  similarity?: number | string;
}

function iso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapIdentity(row: IdentityRow): Identity {
  return {
    id: row.id,
    slug: row.slug,
    displayName: row.display_name,
    description: row.description,
    currentVersion: Number(row.current_version),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at)
  };
}

function objectText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "value" in value) {
    return String((value as { value: unknown }).value);
  }
  return JSON.stringify(value);
}

function mapClaim(row: ClaimRow): MemoryClaim {
  const claim: MemoryClaim = {
    id: row.id,
    identityId: row.identity_id,
    memoryType: row.memory_type,
    subject: row.subject,
    predicate: row.predicate,
    object: objectText(row.object_value),
    normalizedText: row.normalized_text,
    originalText: row.original_text,
    confidence: Number(row.confidence),
    status: row.status,
    sourceId: row.source_id,
    supersedesClaimId: row.supersedes_claim_id,
    createdBy: row.created_by,
    createdAt: iso(row.created_at)
  };
  if (row.similarity !== undefined) claim.similarity = Number(row.similarity);
  return claim;
}

function vectorLiteral(values: number[]): string {
  if (values.some((value) => !Number.isFinite(value))) {
    throw new Error("Embedding contains a non-finite value");
  }
  return `[${values.join(",")}]`;
}

function slugify(value: string): string {
  const base = value
    .normalize("NFKD")
    .toLocaleLowerCase("en")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `${base || "identity"}-${randomUUID().slice(0, 8)}`;
}

async function serializable<T>(pool: Pool, operation: (client: PoolClient) => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SET TRANSACTION PRIORITY HIGH");
      const result = await operation(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      lastError = error;
      await client.query("ROLLBACK").catch(() => undefined);
      const code = typeof error === "object" && error !== null && "code" in error
        ? String((error as { code?: unknown }).code)
        : "";
      if (code !== "40001" || attempt === 3) throw error;
      await new Promise((resolve) => setTimeout(resolve, 40 * 2 ** attempt));
    } finally {
      client.release();
    }
  }
  throw lastError;
}

export class CockroachMemoryRepository implements MemoryRepository {
  private readonly pool: Pool;

  constructor(databaseUrl: string) {
    this.pool = new Pool({
      connectionString: databaseUrl,
      max: 4,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 8_000,
      application_name: "aisentica-persistent-self"
    });
  }

  async health(): Promise<{ database: string }> {
    const result = await this.pool.query<{ version: string }>("SELECT version() AS version");
    return { database: result.rows[0]?.version ?? "unknown" };
  }

  async createIdentity(input: {
    displayName: string;
    slug?: string;
    description?: string;
    actor: string;
  }): Promise<Identity> {
    return serializable(this.pool, async (client) => {
      const slug = input.slug?.trim() || slugify(input.displayName);
      const inserted = await client.query<IdentityRow>(
        `INSERT INTO identities (slug, display_name, description, current_version)
         VALUES ($1, $2, $3, 1)
         RETURNING *`,
        [slug, input.displayName.trim(), input.description?.trim() || null]
      );
      const row = inserted.rows[0];
      if (!row) throw new Error("Identity insert returned no row");

      const snapshot = await client.query<{ id: string }>(
        `INSERT INTO canonical_snapshots
          (identity_id, version_no, previous_snapshot_id, change_kind, change_summary, actor)
         VALUES ($1, 1, NULL, 'IDENTITY_CREATED', $2, $3)
         RETURNING id`,
        [row.id, `Identity ${input.displayName.trim()} was established.`, input.actor]
      );
      await client.query(
        `INSERT INTO provenance_events
          (identity_id, snapshot_id, event_type, actor, details)
         VALUES ($1, $2, 'IDENTITY_CREATED', $3, $4::JSONB)`,
        [row.id, snapshot.rows[0]?.id, input.actor, JSON.stringify({ slug })]
      );
      return mapIdentity(row);
    });
  }

  async getIdentity(identityId: string): Promise<Identity | null> {
    const result = await this.pool.query<IdentityRow>("SELECT * FROM identities WHERE id = $1", [identityId]);
    return result.rows[0] ? mapIdentity(result.rows[0]) : null;
  }

  async findSimilarClaims(identityId: string, embedding: number[], limit: number): Promise<MemoryClaim[]> {
    const result = await this.pool.query<ClaimRow>(
      `SELECT mc.*, 1 - (mc.embedding <=> $2::VECTOR) AS similarity
       FROM memory_claims mc
       WHERE mc.identity_id = $1
         AND mc.status = 'active'
         AND mc.embedding IS NOT NULL
       ORDER BY mc.embedding <=> $2::VECTOR
       LIMIT $3`,
      [identityId, vectorLiteral(embedding), Math.min(Math.max(limit, 1), 20)]
    );
    return result.rows.map(mapClaim);
  }

  private async createSnapshot(
    client: PoolClient,
    identityId: string,
    changeKind: string,
    changeSummary: string,
    actor: string
  ): Promise<{ snapshotId: string; version: number }> {
    const locked = await client.query<{ current_version: number | string }>(
      "SELECT current_version FROM identities WHERE id = $1 FOR UPDATE",
      [identityId]
    );
    const currentVersion = Number(locked.rows[0]?.current_version);
    if (!Number.isFinite(currentVersion)) throw new Error("Identity not found while creating snapshot");

    const previous = await client.query<{ id: string }>(
      "SELECT id FROM canonical_snapshots WHERE identity_id = $1 AND version_no = $2",
      [identityId, currentVersion]
    );
    const nextVersion = currentVersion + 1;
    const snapshot = await client.query<{ id: string }>(
      `INSERT INTO canonical_snapshots
        (identity_id, version_no, previous_snapshot_id, change_kind, change_summary, actor)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [identityId, nextVersion, previous.rows[0]?.id ?? null, changeKind, changeSummary, actor]
    );
    const snapshotId = snapshot.rows[0]?.id;
    if (!snapshotId) throw new Error("Snapshot insert returned no id");

    await client.query(
      `INSERT INTO canonical_snapshot_claims (snapshot_id, claim_id, claim_order)
       SELECT $1, id, row_number() OVER (ORDER BY created_at, id)
       FROM memory_claims
       WHERE identity_id = $2 AND status = 'active'`,
      [snapshotId, identityId]
    );
    await client.query(
      "UPDATE identities SET current_version = $2, updated_at = now() WHERE id = $1",
      [identityId, nextVersion]
    );
    return { snapshotId, version: nextVersion };
  }

  async storeAnalysis(input: StoreAnalysisInput): Promise<AnalyzeClaimResult> {
    const stored = await serializable(this.pool, async (client) => {
      const identity = await client.query("SELECT id FROM identities WHERE id = $1", [input.identityId]);
      if (identity.rowCount === 0) throw new Error("Identity not found");

      const source = await client.query<{ id: string }>(
        `INSERT INTO memory_sources
          (identity_id, kind, title, uri, author, content_hash, occurred_at, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::JSONB)
         RETURNING id`,
        [
          input.identityId,
          input.source.kind,
          input.source.title,
          input.source.uri ?? null,
          input.source.author ?? null,
          createHash("sha256").update(input.originalText, "utf8").digest("hex"),
          input.source.occurredAt ?? null,
          JSON.stringify(input.source.metadata ?? {})
        ]
      );
      const sourceId = source.rows[0]?.id;
      if (!sourceId) throw new Error("Source insert returned no id");

      const candidateIds = new Set(input.candidates.map((claim) => claim.id));
      const conflicts = input.assessments.filter(
        (assessment) => assessment.hasConflict && candidateIds.has(assessment.existingClaimId)
      );
      const initialStatus = conflicts.length > 0 ? "candidate" : "active";
      const claimResult = await client.query<ClaimRow>(
        `INSERT INTO memory_claims
          (identity_id, memory_type, subject, predicate, object_value, normalized_text,
           original_text, confidence, status, source_id, embedding, created_by)
         VALUES ($1, $2, $3, $4, $5::JSONB, $6, $7, $8, $9, $10, $11::VECTOR, $12)
         RETURNING *`,
        [
          input.identityId,
          input.structuredClaim.memoryType,
          input.structuredClaim.subject,
          input.structuredClaim.predicate,
          JSON.stringify({ value: input.structuredClaim.object }),
          input.structuredClaim.normalizedText,
          input.originalText,
          input.structuredClaim.confidence,
          initialStatus,
          sourceId,
          vectorLiteral(input.embedding),
          input.actor
        ]
      );
      const claimRow = claimResult.rows[0];
      if (!claimRow) throw new Error("Claim insert returned no row");
      const claim = mapClaim(claimRow);

      if (conflicts.length > 0) {
        const conflictCase = await client.query<{ id: string }>(
          `INSERT INTO conflict_cases
            (identity_id, incoming_claim_id, status, summary)
           VALUES ($1, $2, 'open', $3)
           RETURNING id`,
          [
            input.identityId,
            claim.id,
            `Incoming claim conflicts with ${conflicts.length} active memory entr${conflicts.length === 1 ? "y" : "ies"}.`
          ]
        );
        const caseId = conflictCase.rows[0]?.id;
        if (!caseId) throw new Error("Conflict case insert returned no id");

        for (const assessment of conflicts) {
          const candidate = input.candidates.find((item) => item.id === assessment.existingClaimId);
          await client.query(
            `INSERT INTO conflict_links
              (conflict_case_id, existing_claim_id, conflict_type, similarity,
               explanation, recommended_resolution)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              caseId,
              assessment.existingClaimId,
              assessment.conflictType,
              candidate?.similarity ?? 1,
              assessment.explanation,
              assessment.recommendedResolution
            ]
          );
        }
        await client.query(
          `INSERT INTO provenance_events
            (identity_id, claim_id, conflict_case_id, event_type, actor, details)
           VALUES ($1, $2, $3, 'CONFLICT_OPENED', $4, $5::JSONB)`,
          [
            input.identityId,
            claim.id,
            caseId,
            input.actor,
            JSON.stringify({ modelProvider: input.modelProvider, candidateCount: input.candidates.length })
          ]
        );
        await client.query(
          `INSERT INTO agent_runs
            (identity_id, operation, status, model_provider, input, output, finished_at)
           VALUES ($1, 'MEMORY_ANALYSIS', 'succeeded', $2, $3::JSONB, $4::JSONB, now())`,
          [
            input.identityId,
            input.modelProvider,
            JSON.stringify({ memoryType: input.structuredClaim.memoryType, sourceKind: input.source.kind }),
            JSON.stringify({ outcome: "conflict", claimId: claim.id, conflictCaseId: caseId, candidateCount: input.candidates.length })
          ]
        );
        return { kind: "conflict" as const, claim, caseId };
      }

      const snapshot = await this.createSnapshot(
        client,
        input.identityId,
        "CLAIM_COMMITTED",
        `Committed ${input.structuredClaim.memoryType} memory: ${input.structuredClaim.normalizedText}`,
        input.actor
      );
      await client.query(
        `INSERT INTO provenance_events
          (identity_id, claim_id, snapshot_id, event_type, actor, details)
         VALUES ($1, $2, $3, 'CLAIM_COMMITTED', $4, $5::JSONB)`,
        [
          input.identityId,
          claim.id,
          snapshot.snapshotId,
          input.actor,
          JSON.stringify({
            modelProvider: input.modelProvider,
            candidateCount: input.candidates.length,
            sourceId
          })
        ]
      );
      await client.query(
        `INSERT INTO agent_runs
          (identity_id, operation, status, model_provider, input, output, finished_at)
         VALUES ($1, 'MEMORY_ANALYSIS', 'succeeded', $2, $3::JSONB, $4::JSONB, now())`,
        [
          input.identityId,
          input.modelProvider,
          JSON.stringify({ memoryType: input.structuredClaim.memoryType, sourceKind: input.source.kind }),
          JSON.stringify({ outcome: "committed", claimId: claim.id, version: snapshot.version, candidateCount: input.candidates.length })
        ]
      );
      return { kind: "committed" as const, claim, version: snapshot.version };
    });

    if (stored.kind === "committed") {
      return {
        outcome: "committed",
        claim: stored.claim,
        version: stored.version,
        modelProvider: input.modelProvider,
        candidateCount: input.candidates.length
      };
    }
    const conflictCase = await this.getConflictCase(stored.caseId);
    if (!conflictCase) throw new Error("Stored conflict case could not be loaded");
    return {
      outcome: "conflict",
      claim: stored.claim,
      conflictCase,
      modelProvider: input.modelProvider,
      candidateCount: input.candidates.length
    };
  }

  async getConflictCase(caseId: string): Promise<ConflictCase | null> {
    const caseResult = await this.pool.query<{
      id: string;
      identity_id: string;
      incoming_claim_id: string;
      status: "open" | "resolved";
      summary: string;
      created_at: Date | string;
      resolved_at: Date | string | null;
    }>("SELECT * FROM conflict_cases WHERE id = $1", [caseId]);
    const row = caseResult.rows[0];
    if (!row) return null;

    const incomingResult = await this.pool.query<ClaimRow>("SELECT * FROM memory_claims WHERE id = $1", [row.incoming_claim_id]);
    const incoming = incomingResult.rows[0];
    if (!incoming) throw new Error("Conflict case has no incoming claim");

    const linkResult = await this.pool.query<{
      id: string;
      existing_claim_id: string;
      conflict_type: ConflictCase["links"][number]["conflictType"];
      similarity: number | string;
      explanation: string;
      recommended_resolution: ConflictCase["links"][number]["recommendedResolution"];
    }>(
      `SELECT id, existing_claim_id, conflict_type, similarity, explanation, recommended_resolution
       FROM conflict_links WHERE conflict_case_id = $1 ORDER BY similarity`,
      [caseId]
    );
    const existingIds = linkResult.rows.map((link) => link.existing_claim_id);
    const existingResult = existingIds.length > 0
      ? await this.pool.query<ClaimRow>("SELECT * FROM memory_claims WHERE id = ANY($1::UUID[])", [existingIds])
      : { rows: [] as ClaimRow[] };
    const existingMap = new Map(existingResult.rows.map((claim) => [claim.id, mapClaim(claim)]));

    const resolutionResult = await this.pool.query<{
      decision: ResolutionDecision;
      rationale: string;
      actor: string;
      resulting_version: number | string;
      created_at: Date | string;
    }>("SELECT * FROM conflict_resolutions WHERE conflict_case_id = $1", [caseId]);
    const resolutionRow = resolutionResult.rows[0];

    const result: ConflictCase = {
      id: row.id,
      identityId: row.identity_id,
      incomingClaim: mapClaim(incoming),
      links: linkResult.rows.map((link) => {
        const existingClaim = existingMap.get(link.existing_claim_id);
        if (!existingClaim) throw new Error("Conflict link points to a missing claim");
        return {
          id: link.id,
          existingClaimId: link.existing_claim_id,
          hasConflict: true,
          conflictType: link.conflict_type,
          similarity: Number(link.similarity),
          explanation: link.explanation,
          recommendedResolution: link.recommended_resolution,
          existingClaim
        };
      }),
      status: row.status,
      summary: row.summary,
      createdAt: iso(row.created_at),
      resolvedAt: row.resolved_at ? iso(row.resolved_at) : null
    };
    if (resolutionRow) {
      result.resolution = {
        decision: resolutionRow.decision,
        rationale: resolutionRow.rationale,
        actor: resolutionRow.actor,
        resultingVersion: Number(resolutionRow.resulting_version),
        createdAt: iso(resolutionRow.created_at)
      };
    }
    return result;
  }

  async getOpenConflicts(identityId: string): Promise<ConflictCase[]> {
    const result = await this.pool.query<{ id: string }>(
      "SELECT id FROM conflict_cases WHERE identity_id = $1 AND status = 'open' ORDER BY created_at, id",
      [identityId]
    );
    const cases = await Promise.all(result.rows.map((row) => this.getConflictCase(row.id)));
    return cases.filter((conflictCase): conflictCase is ConflictCase => conflictCase !== null);
  }

  async resolveConflict(input: ResolveCaseInput): Promise<ConflictCase> {
    await serializable(this.pool, async (client) => {
      const caseResult = await client.query<{
        id: string;
        identity_id: string;
        incoming_claim_id: string;
        status: "open" | "resolved";
      }>("SELECT id, identity_id, incoming_claim_id, status FROM conflict_cases WHERE id = $1 FOR UPDATE", [input.caseId]);
      const conflictCase = caseResult.rows[0];
      if (!conflictCase) throw new Error("Conflict case not found");
      if (conflictCase.status !== "open") throw new Error("Conflict case is already resolved");

      const links = await client.query<{ existing_claim_id: string }>(
        "SELECT existing_claim_id FROM conflict_links WHERE conflict_case_id = $1",
        [input.caseId]
      );
      const existingIds = links.rows.map((row) => row.existing_claim_id);

      if (input.decision === "accept_incoming") {
        if (existingIds.length > 0) {
          await client.query(
            "UPDATE memory_claims SET status = 'superseded' WHERE id = ANY($1::UUID[]) AND status = 'active'",
            [existingIds]
          );
        }
        await client.query("UPDATE memory_claims SET status = 'active' WHERE id = $1", [conflictCase.incoming_claim_id]);
      } else if (input.decision === "keep_existing") {
        await client.query("UPDATE memory_claims SET status = 'rejected' WHERE id = $1", [conflictCase.incoming_claim_id]);
      } else {
        await client.query("UPDATE memory_claims SET status = 'active' WHERE id = $1", [conflictCase.incoming_claim_id]);
      }

      const snapshot = await this.createSnapshot(
        client,
        conflictCase.identity_id,
        `CONFLICT_RESOLVED_${input.decision.toUpperCase()}`,
        `Conflict ${input.caseId} resolved as ${input.decision}: ${input.rationale}`,
        input.actor
      );
      await client.query(
        "UPDATE conflict_cases SET status = 'resolved', resolved_at = now() WHERE id = $1",
        [input.caseId]
      );
      await client.query(
        `INSERT INTO conflict_resolutions
          (conflict_case_id, decision, rationale, actor, resulting_version)
         VALUES ($1, $2, $3, $4, $5)`,
        [input.caseId, input.decision, input.rationale, input.actor, snapshot.version]
      );
      await client.query(
        `INSERT INTO provenance_events
          (identity_id, claim_id, conflict_case_id, snapshot_id, event_type, actor, details)
         VALUES ($1, $2, $3, $4, 'CONFLICT_RESOLVED', $5, $6::JSONB)`,
        [
          conflictCase.identity_id,
          conflictCase.incoming_claim_id,
          input.caseId,
          snapshot.snapshotId,
          input.actor,
          JSON.stringify({ decision: input.decision, rationale: input.rationale, existingClaimIds: existingIds })
        ]
      );
    });

    const resolved = await this.getConflictCase(input.caseId);
    if (!resolved) throw new Error("Resolved conflict case could not be loaded");
    return resolved;
  }

  async restoreContext(identityId: string): Promise<RestoredContext> {
    const identity = await this.getIdentity(identityId);
    if (!identity) throw new Error("Identity not found");
    const claimsResult = await this.pool.query<ClaimRow>(
      `SELECT mc.*
       FROM canonical_snapshots cs
       JOIN canonical_snapshot_claims csc ON csc.snapshot_id = cs.id
       JOIN memory_claims mc ON mc.id = csc.claim_id
       WHERE cs.identity_id = $1 AND cs.version_no = $2
       ORDER BY csc.claim_order`,
      [identityId, identity.currentVersion]
    );
    const claims = claimsResult.rows.map(mapClaim);
    return {
      identity,
      version: identity.currentVersion,
      claims,
      compactContext: claims
        .map((claim) => `[${claim.memoryType.toUpperCase()}] ${claim.normalizedText}`)
        .join("\n")
    };
  }

  async getTimeline(identityId: string): Promise<TimelineEvent[]> {
    const result = await this.pool.query<{
      id: string;
      event_type: string;
      actor: string;
      details: Record<string, unknown> | string;
      claim_id: string | null;
      conflict_case_id: string | null;
      snapshot_id: string | null;
      created_at: Date | string;
    }>(
      `SELECT id, event_type, actor, details, claim_id, conflict_case_id, snapshot_id, created_at
       FROM provenance_events WHERE identity_id = $1 ORDER BY created_at, id`,
      [identityId]
    );
    return result.rows.map((row) => ({
      id: row.id,
      eventType: row.event_type,
      actor: row.actor,
      details: typeof row.details === "string" ? JSON.parse(row.details) as Record<string, unknown> : row.details,
      claimId: row.claim_id,
      conflictCaseId: row.conflict_case_id,
      snapshotId: row.snapshot_id,
      createdAt: iso(row.created_at)
    }));
  }

  async buildExport(identityId: string): Promise<ExportManifest> {
    const [currentContext, timeline] = await Promise.all([
      this.restoreContext(identityId),
      this.getTimeline(identityId)
    ]);
    return {
      schemaVersion: "1.0",
      exportedAt: new Date().toISOString(),
      identity: currentContext.identity,
      currentContext,
      timeline
    };
  }
}
