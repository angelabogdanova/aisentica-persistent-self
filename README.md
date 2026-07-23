# Aisentica Persistent Self

Conflict-aware, provenance-preserving persistent memory for artificial identity.

Aisentica Persistent Self is an agentic memory system built for the CockroachDB × AWS Hackathon 2026. It treats continuity as a governed canonical process rather than a transcript archive.

An agent does not possess continuity merely because it stores messages. Continuity begins when memory becomes attributable, revisable, conflict-aware and persistent across sessions.

## Core demonstration

The system performs one complete identity-memory cycle:

`Identity → Claim → Source → Vector Retrieval → Conflict Judge → Human Resolution → New Canonical Version → Provenance Export`

A new statement never silently overwrites an established claim. The system retrieves semantically related memory, evaluates incompatibility, opens a conflict case, presents both versions and preserves the human resolution as a new immutable canonical snapshot.

## Current project state

This repository contains the complete first production baseline:

- CockroachDB relational and vector schema;
- atomic repository operations with serializable transaction retries;
- AWS Lambda API and agent orchestration;
- Amazon Bedrock claim extraction, embeddings and conflict assessment;
- deterministic local fallback for repeatable tests;
- S3 provenance export;
- static judge-facing frontend;
- AWS SAM infrastructure;
- GitHub Actions CI and OIDC deployment workflow;
- unit tests for the complete memory conflict lifecycle;
- competition, security, architecture, MCP, video and submission documentation.

Cloud credentials, CockroachDB credentials and the final public deployment are intentionally supplied through account-owned secrets rather than committed files.

## Why this memory design is different

Most agent memory demonstrations follow this pattern:

`Conversation → Chunk → Embedding → Retrieval → Answer`

Persistent Self follows this pattern:

`Identity → Atomic Claim → Provenance → Semantic Neighbours → Conflict → Resolution → Versioned Canon → Restored Context`

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

## Architecture

```text
Browser
  → Amazon CloudFront
  → private Amazon S3 website bucket
  → Amazon API Gateway HTTP API
  → AWS Lambda / Node.js 22
      → Amazon Bedrock Nova 2 Lite
      → Amazon Titan Text Embeddings V2
      → CockroachDB Cloud Basic
      → Amazon S3 provenance export
```

CockroachDB contains transactional identity data, structured claims, embeddings, conflict state, canonical versions and the provenance ledger in one distributed SQL system.

The official CockroachDB Cloud Managed MCP Server supplies a second governed path into the same memory layer for the Memory Auditor. The auditor inspects schema, conflict integrity, canonical version consistency and vector-query eligibility without mutating memory.

See `docs/architecture.md` and `docs/mcp-memory-auditor.md`.

## CockroachDB features used

The project meaningfully uses three hackathon tools:

1. Distributed Vector Indexing
   - `VECTOR(512)` embeddings live beside relational claim state.
   - `memory_claim_embedding_idx` uses `vector_cosine_ops`.
   - `identity_id` is the prefix column, so retrieval remains scoped to one artificial identity.

2. Managed MCP Server
   - The Memory Auditor connects to the official hosted MCP endpoint.
   - It inspects tables, open conflicts, resolutions, snapshots and vector query plans.
   - It runs with a cluster-scoped API key and an audit-only instruction set.

3. Agent Skills
   - CockroachDB operational skills guide schema review, query diagnostics, security review and vector-index verification.
   - The resulting audit procedure is recorded in `mcp/memory-auditor-prompt.md`.

## AWS services used

- AWS Lambda runs memory intake, retrieval, conflict assessment, resolution and export orchestration.
- Amazon API Gateway exposes the application API and throttles public requests.
- Amazon Bedrock Nova 2 Lite extracts atomic claims and evaluates conflicts.
- Amazon Titan Text Embeddings V2 creates 512-dimensional semantic embeddings.
- Amazon S3 stores the static application and encrypted provenance manifests.
- Amazon CloudFront serves the judge-facing interface through HTTPS.
- AWS X-Ray and CloudWatch provide execution traces, logs, latency and error evidence.
- AWS IAM OIDC gives GitHub Actions short-lived deployment credentials.

## Canonical invariants

The implementation maintains these rules:

1. One identity has one stable UUID and one current canonical version.
2. Every accepted memory change creates a new version.
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

Example claim request:

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

Example resolution request:

```json
{
  "decision": "accept_incoming",
  "rationale": "The verified lifecycle event changed the present authoritative state.",
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

Create the target database before applying the migration. The connection URL in `DATABASE_URL` must already point to that database, for example `persistent_self`.

## Model modes

`MODEL_MODE=bedrock`

Uses Amazon Bedrock for claim extraction, embeddings and conflict assessment. Model failures fail the request.

`MODEL_MODE=hybrid`

Uses Bedrock first and falls back to deterministic extraction, hashing embeddings and lexical conflict assessment. This is the recommended judge deployment because the application remains demonstrable during a temporary model-service interruption.

`MODEL_MODE=deterministic`

Uses no paid model calls. This mode makes local tests exact and reproducible.

The default Bedrock models are:

```text
Reasoning: global.amazon.nova-2-lite-v1:0
Embeddings: amazon.titan-embed-text-v2:0
Dimensions: 512
```

## Local validation

Requirements:

- Node.js 22
- npm

Install and run the complete validation suite:

```bash
npm install --no-audit --no-fund
npm run check
```

The suite runs:

```text
TypeScript strict type checking
Vitest lifecycle tests
Production ESM bundle creation
```

The deterministic repository tests demonstrate:

- first canonical commit;
- conflict opening without overwrite;
- keep-existing resolution;
- accept-incoming resolution;
- superseded-memory retention;
- immutable version increment;
- later-session context restoration.

## CockroachDB setup

1. Create one CockroachDB Cloud Basic cluster.
2. Create a database named `persistent_self`.
3. Create a SQL user for the application.
4. Copy the PostgreSQL connection string with TLS enabled.
5. Set `DATABASE_URL` locally or save it as the GitHub secret `COCKROACH_DATABASE_URL`.
6. Run:

```bash
npm run migrate
```

7. Confirm the vector index:

```sql
SHOW INDEX FROM memory_claims;
```

8. Confirm cosine retrieval:

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

## Managed MCP setup

The Managed MCP endpoint is:

```text
https://cockroachlabs.cloud/mcp
```

Create a CockroachDB Cloud service account or API key restricted to the competition cluster. Configure the MCP client using `mcp/managed-mcp.example.json`, then run the audit in `mcp/memory-auditor-prompt.md`.

The exact client configuration format should follow the currently installed MCP client because field names differ across clients. The endpoint, token scope and audit instructions remain the same.

## AWS deployment

The main infrastructure is declared in `template.yaml`.

The stack creates:

- one Lambda function with reserved concurrency 5;
- one HTTP API with rate and burst throttling;
- one encrypted S3 provenance export bucket with 30-day demo export expiry;
- one private S3 frontend bucket;
- one CloudFront distribution with Origin Access Control;
- IAM permissions for Bedrock, S3 and X-Ray.

Deployment is automated through `.github/workflows/deploy.yml`.

Required GitHub secrets:

```text
AWS_DEPLOY_ROLE_ARN
COCKROACH_DATABASE_URL
```

The OIDC role template is `infrastructure/github-oidc-role.yaml`.

After a successful workflow run, read the `WebsiteUrl` stack output. No domain is required.

See `docs/deployment.md` for the account-owner sequence.

## Security boundaries

- Database and AWS credentials remain server-side.
- The repository contains no secret values.
- Claim text is treated as untrusted data in every model instruction.
- Model outputs are validated through strict Zod schemas before persistence.
- Existing claim IDs returned by the model are allow-listed against retrieved candidates.
- Every database mutation uses parameterized SQL.
- Canonical writes run inside retried serializable transactions.
- Public API concurrency and request rates are bounded.
- The S3 website bucket remains private behind CloudFront Origin Access Control.
- Export objects use server-side encryption and automatic expiry.
- The MCP auditor is instructed to perform read-only inspection.

See `docs/security.md`.

## Repository provenance

The project was initiated on July 23, 2026 as a new submission-period repository for the CockroachDB × AWS Hackathon.

No code from the earlier `aisentica-continuity` project is included. Conceptual continuity between the two Aisentica projects is disclosed; their codebases, persistence layers, infrastructure and competition targets are separate.

AI-assisted development is disclosed in `docs/competition-record.md`.

## Judge path

The intended three-minute demonstration is:

1. Create an artificial identity.
2. Commit one canonical claim.
3. reload or open a fresh browser session and restore the same identity context from CockroachDB.
4. Submit a contradictory claim.
5. Show Distributed Vector Indexing retrieving the established claim.
6. Show the open conflict with both sources and the judge explanation.
7. Resolve the conflict.
8. Show the new canonical version and retained prior claim status.
9. Show the provenance timeline.
10. Show the MCP Memory Auditor confirming database integrity.

See `docs/judge-flow.md` and `docs/video-script.md`.

## License

MIT License. See `LICENSE`.
