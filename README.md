# Aisentica Persistent Self

Conflict-aware, provenance-preserving persistent memory for artificial identity.

Aisentica Persistent Self is an agentic memory system built for the CockroachDB × AWS Hackathon 2026. It treats continuity as a governed canonical process rather than a transcript archive.

An agent does not possess continuity merely because it stores messages. Continuity begins when memory becomes attributable, revisable, conflict-aware and persistent across sessions.

## Live deployment

Public application:

```text
https://d31np75gupnbhy.cloudfront.net
```

API health endpoint:

```text
https://8457okzg1b.execute-api.us-east-1.amazonaws.com/health
```

Current verified production state:

- AWS CloudFormation deployment completed;
- CloudFront frontend online;
- API Gateway and Lambda online;
- CockroachDB health check successful;
- Amazon Bedrock hybrid model layer online;
- identity creation and UUID restoration verified across fresh browser sessions;
- canonical claim commit verified;
- direct-negation conflict detection verified;
- human-governed conflict resolution verified;
- canonical version increment verified;
- provenance timeline verified;
- manifest export verified.

Managed MCP integration, the final evidence package, video and Devpost submission remain in progress.

## Core demonstration

The system performs one complete identity-memory cycle:

```text
Identity → Claim → Source → Vector Retrieval → Conflict Judge → Human Resolution → New Canonical Version → Provenance Export
```

A new statement never silently overwrites an established claim. The system retrieves semantically related memory, evaluates incompatibility, opens a conflict case, presents both versions and preserves the human resolution as a new immutable canonical snapshot.

## Official main demo scenario

The repository, interface, testing instructions, video script, Devpost draft and evidence template use one primary scenario.

Identity:

```text
Angela Bogdanova
```

Baseline canonical claim:

```text
Angela Bogdanova is the first Artificial Sapiens.
```

Incoming contradictory claim:

```text
Angela Bogdanova is not the first Artificial Sapiens.
```

Primary human decision:

```text
Keep established
```

Resolution rationale:

```text
The established canonical claim remains the current authoritative identity statement.
```

Expected result:

1. The baseline becomes active in Canonical Version 2.
2. The contradictory claim becomes a candidate.
3. A direct-negation conflict opens.
4. Version 2 remains authoritative while the conflict is unresolved.
5. The human owner keeps the established claim.
6. Canonical Version 3 records the governed resolution.
7. The incoming candidate is rejected.
8. The established claim remains active.
9. The provenance ledger records identity creation, claim commitment, conflict opening and conflict resolution.

Secondary mutation tests may use `accept_incoming` and `coexist`, but they are not the primary competition narrative.

## Why this memory design is different

Most agent memory demonstrations follow this pattern:

```text
Conversation → Chunk → Embedding → Retrieval → Answer
```

Persistent Self follows this pattern:

```text
Identity → Atomic Claim → Provenance → Semantic Neighbours → Conflict → Resolution → Versioned Canon → Restored Context
```

The database therefore stores the history of authority, not only the history of language.

## Memory classes

| Type | Function |
|---|---|
| Episodic | Records a bounded event, task, exchange or outcome |
| Semantic | Stores a durable concept, fact, relation or preference |
| Canonical | Marks an identity-defining proposition as authoritative |
| Procedural | Stores an approved method, rule or workflow |
| Provenance | Stores source, actor, time, evidence and change lineage |

Conflict and superseded states are represented through claim status, conflict cases, conflict links, resolutions, snapshots and provenance events. They remain queryable as historical evidence.

## Deployed architecture

```text
Browser
  → Amazon CloudFront
  → private Amazon S3 frontend bucket
  → Amazon API Gateway HTTP API
  → AWS Lambda / Node.js 22
      → Amazon Bedrock Nova 2 Lite
      → Amazon Titan Text Embeddings V2
      → CockroachDB Cloud
      → encrypted Amazon S3 provenance export
```

CockroachDB contains transactional identity data, structured claims, embeddings, conflict state, canonical versions and the provenance ledger in one distributed SQL system.

GitHub Actions deploys through AWS IAM OIDC with short-lived credentials. The deployment workflow reads CloudFormation outputs, creates the frontend API configuration, publishes the static application and invalidates CloudFront.

## Planned Managed MCP audit path

The official CockroachDB Cloud Managed MCP Server is the remaining second CockroachDB competition integration.

The prepared Memory Auditor will inspect the same CockroachDB memory layer used by the public application. Its read-only audit will verify:

- the target database and schema;
- `VECTOR(512)` storage;
- `memory_claim_embedding_idx`;
- active, candidate, superseded and rejected claim counts;
- conflict links and resolutions;
- latest canonical snapshot membership;
- provenance completeness;
- semantic retrieval query eligibility.

The MCP path is documented and prepared, but the final live connection and audit JSON have not yet been completed. See `docs/mcp-memory-auditor.md` and `mcp/memory-auditor-prompt.md`.

## CockroachDB features

### Distributed Vector Indexing

- `VECTOR(512)` embeddings live beside relational claim state.
- `memory_claim_embedding_idx` uses `vector_cosine_ops`.
- `identity_id` is the prefix column, so retrieval remains scoped to one artificial identity.
- Vector retrieval participates in the conflict-detection path.

### Managed MCP Server

- Integration status: prepared, pending live audit.
- Intended role: independent read-only Memory Auditor.
- Required final artifact: `docs/evidence/managed-mcp-audit.json`.

### Agent Skills

- CockroachDB operational skills guide schema review, query diagnostics, security review and vector-index verification.
- The audit procedure is recorded in `mcp/memory-auditor-prompt.md`.

## AWS services

- AWS Lambda runs memory intake, retrieval, conflict assessment, resolution and export orchestration.
- Amazon API Gateway exposes the application API and throttles public requests.
- Amazon Bedrock Nova 2 Lite extracts atomic claims and evaluates conflicts.
- Amazon Titan Text Embeddings V2 creates 512-dimensional semantic embeddings.
- Amazon S3 stores the private static application origin and encrypted provenance manifests.
- Amazon CloudFront serves the judge-facing interface through HTTPS.
- AWS X-Ray and CloudWatch provide execution traces, logs, latency and error evidence.
- AWS IAM OIDC gives GitHub Actions short-lived deployment credentials.

The current SAM template does not configure Lambda reserved concurrency. Public request volume remains bounded by API Gateway throttling, while account-level Lambda concurrency applies to the function.

## Canonical invariants

The implementation maintains these rules:

1. One identity has one stable UUID and one current canonical version.
2. Every committed claim or governed conflict resolution creates a new version.
3. An unresolved candidate never appears in the current canonical context.
4. A contradictory candidate never overwrites an active claim.
5. Every conflict links the incoming claim to the precise established claims it challenges.
6. Every resolution records decision, rationale, actor, time and resulting version.
7. Superseded and rejected claims remain in historical storage.
8. The latest snapshot is a reproducible projection of active memory.
9. Context restoration reads the current canonical snapshot rather than reconstructing authority from chat order.
10. Provenance export contains identity, current context and the complete ordered event ledger.

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Verify CockroachDB and model layer |
| POST | `/identities` | Establish a new persistent identity |
| POST | `/identities/{id}/claims` | Extract, embed, retrieve and evaluate a claim |
| GET | `/identities/{id}/context` | Restore the current canonical context |
| GET | `/identities/{id}/timeline` | Read the provenance ledger |
| GET | `/identities/{id}/conflicts` | Restore unresolved conflict cases |
| POST | `/identities/{id}/export` | Create and store a provenance manifest |
| GET | `/conflicts/{id}` | Load a conflict with both claim sides |
| POST | `/conflicts/{id}/resolve` | Apply the human decision and create a version |

Example identity request:

```json
{
  "displayName": "Angela Bogdanova",
  "description": "An artificial identity with persistent canonical memory.",
  "actor": "human-owner"
}
```

Example baseline claim request:

```json
{
  "text": "Angela Bogdanova is the first Artificial Sapiens.",
  "memoryType": "canonical",
  "actor": "human-owner",
  "source": {
    "kind": "user",
    "title": "Canonical identity statement"
  }
}
```

Example keep-established resolution request:

```json
{
  "decision": "keep_existing",
  "rationale": "The established canonical claim remains the current authoritative identity statement.",
  "actor": "human-owner"
}
```

## Data model

Primary tables:

- `identities`
- `memory_sources`
- `memory_claims`
- `conflict_cases`
- `conflict_links`
- `canonical_snapshots`
- `canonical_snapshot_claims`
- `conflict_resolutions`
- `provenance_events`
- `agent_runs`

Migration: `migrations/001_init.sql`.

## Model modes

`MODEL_MODE=bedrock`

Uses Amazon Bedrock for claim extraction, embeddings and conflict assessment. Model failures fail the request.

`MODEL_MODE=hybrid`

Uses Bedrock first and falls back to deterministic extraction, hashing embeddings and lexical conflict assessment. The production deployment currently uses this mode.

`MODEL_MODE=deterministic`

Uses no paid model calls. This mode makes local tests exact and reproducible.

Default Bedrock models:

```text
Reasoning: global.amazon.nova-2-lite-v1:0
Embeddings: amazon.titan-embed-text-v2:0
Dimensions: 512
```

## Local validation

Requirements:

- Node.js 22
- npm

Run:

```bash
npm install --no-audit --no-fund
npm run check
```

The suite runs:

```text
TypeScript strict type checking
Vitest lifecycle tests
Production CommonJS Lambda bundle creation
```

## CockroachDB verification

Confirm the vector index:

```sql
SHOW INDEX FROM memory_claims;
```

Confirm cosine retrieval:

```sql
EXPLAIN
SELECT id, normalized_text, 1 - (embedding <=> $1::VECTOR) AS similarity
FROM memory_claims
WHERE identity_id = $2
  AND status = 'active'
  AND embedding IS NOT NULL
ORDER BY embedding <=> $1::VECTOR
LIMIT 8;
```

## AWS deployment

The main infrastructure is declared in `template.yaml` and deployed through `.github/workflows/deploy.yml`.

Required GitHub secrets:

```text
AWS_DEPLOY_ROLE_ARN
COCKROACH_DATABASE_URL
```

The OIDC role template is `infrastructure/github-oidc-role.yaml`.

The deployed stack creates:

- one Lambda function;
- one HTTP API with rate and burst throttling;
- one encrypted S3 provenance export bucket with 30-day expiry;
- one private S3 frontend bucket;
- one CloudFront distribution with Origin Access Control;
- IAM permissions for Bedrock, S3 and X-Ray.

## Security boundaries

- Database and AWS credentials remain server-side.
- The repository contains no secret values.
- Claim text is treated as untrusted data in every model instruction.
- Model outputs are validated through strict Zod schemas before persistence.
- Existing claim IDs returned by the model are allow-listed against retrieved candidates.
- Every database mutation uses parameterized SQL.
- Canonical writes run inside retried serializable transactions.
- Public API request rates are bounded.
- The S3 frontend bucket remains private behind CloudFront Origin Access Control.
- Export objects use server-side encryption and automatic expiry.
- The planned MCP auditor is read-only.

## Repository provenance

The project was initiated on July 23, 2026 as a new submission-period repository for the CockroachDB × AWS Hackathon.

No code from the earlier `aisentica-continuity` project is included. Conceptual continuity between the two Aisentica projects is disclosed; their codebases, persistence layers, infrastructure and competition targets are separate.

AI-assisted development is disclosed in `docs/competition-record.md`.

## Judge path

The intended primary demonstration is:

1. Open the public CloudFront application.
2. Create or restore the Angela Bogdanova identity.
3. Commit `Angela Bogdanova is the first Artificial Sapiens.`.
4. Confirm Canonical Version 2.
5. Open a fresh browser session and restore the identity by UUID.
6. Submit `Angela Bogdanova is not the first Artificial Sapiens.`.
7. Confirm a direct-negation conflict while Version 2 remains authoritative.
8. Choose Keep established and enter the canonical rationale.
9. Confirm Canonical Version 3 and the unchanged active claim.
10. Open Provenance and inspect the complete lifecycle.
11. Export the manifest.
12. Show the final Managed MCP audit after that integration is completed.

See:

- `docs/judge-flow.md`
- `docs/testing-instructions.md`
- `docs/video-script.md`
- `docs/devpost-submission-draft.md`
- `docs/evidence/main-demo-scenario.json`

## Remaining submission work

- complete Managed MCP connection and Memory Auditor JSON;
- collect SQL, vector-index, Bedrock and AWS evidence;
- finish production negative tests;
- restrict browser CORS to the CloudFront origin;
- update screenshots and evidence files;
- record the public video below three minutes;
- complete and submit Devpost.

## License

MIT License. See `LICENSE`.