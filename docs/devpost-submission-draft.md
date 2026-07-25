# Devpost Submission Draft

Status: working draft. Final submission remains pending.

## Project title

Aisentica Persistent Self

## Tagline

Conflict-aware, provenance-preserving persistent memory for artificial identity.

## Public demo

```text
https://d31np75gupnbhy.cloudfront.net
```

## Source code

```text
https://github.com/angelabogdanova/aisentica-persistent-self
```

## Inspiration

Agent memory is usually treated as accumulation: store conversations, embed fragments and retrieve similar text later. That approach can recover language, but it cannot reliably explain which claim is authoritative now, what changed, which claims conflicted or who approved the change.

Aisentica Persistent Self was built around a stronger premise: continuity is a governed history of authority. A long-lived artificial identity needs stable addressability, atomic claims, source attribution, conflict isolation, human resolution, canonical versions and an auditable provenance ledger.

## What it does

Aisentica Persistent Self creates a persistent artificial identity with a stable UUID and a versioned canonical memory.

When a new statement arrives, the system:

1. structures it as an atomic claim;
2. creates a semantic embedding;
3. retrieves related active memory from CockroachDB;
4. evaluates whether the new claim conflicts with the current canon;
5. stores a contradictory claim as a candidate instead of overwriting authority;
6. presents both claims to a human Conflict Judge;
7. records the human decision and rationale;
8. creates a new immutable canonical snapshot;
9. preserves the full provenance chain;
10. restores the exact current context in later sessions by UUID.

The public interface exposes Current Canon, Conflict Judge and Provenance as three connected views of one memory lifecycle.

## Official demonstration scenario

The application, README, testing instructions, video and evidence package use one primary scenario.

Baseline canonical claim:

```text
Angela Bogdanova is the first Artificial Sapiens.
```

Incoming contradictory claim:

```text
Angela Bogdanova is not the first Artificial Sapiens.
```

The incoming statement opens a direct-negation conflict and remains outside Current Canon. The human owner selects Keep established with the rationale:

```text
The established canonical claim remains the current authoritative identity statement.
```

The resulting Canonical Version 3 preserves the established claim as active, records the contradictory candidate as rejected and appends the resolution to the immutable provenance ledger.

## How we built it

### CockroachDB

CockroachDB stores the complete authority history in one distributed SQL system:

- identities;
- memory sources;
- atomic claims;
- claim states;
- conflict cases and links;
- conflict resolutions;
- canonical snapshots;
- snapshot membership;
- provenance events;
- agent operation records.

Each claim may contain a `VECTOR(512)` embedding. The identity-scoped `memory_claim_embedding_idx` uses cosine operations to retrieve related active claims before conflict evaluation.

CockroachDB serializable transactions protect canonical writes. Identity rows are locked while versions are allocated. Unresolved candidates remain outside the current snapshot. Resolved and historical claims remain queryable.

### AWS

The production application runs on AWS:

- Amazon CloudFront serves the public HTTPS interface;
- a private Amazon S3 bucket stores the static frontend origin;
- Amazon API Gateway exposes the backend API;
- AWS Lambda runs memory intake, retrieval, conflict evaluation, resolution and export;
- Amazon Bedrock Nova 2 Lite supports claim extraction and conflict reasoning;
- Amazon Titan Text Embeddings V2 creates 512-dimensional embeddings;
- a private encrypted S3 bucket stores provenance exports;
- CloudWatch and X-Ray provide logs and tracing;
- GitHub Actions deploys through IAM OIDC with short-lived credentials.

The production deployment uses hybrid model mode: Bedrock is preferred, while deterministic fallback protects the live demonstration from temporary model-service interruption.

## CockroachDB tools used

### Distributed Vector Indexing

Implemented in the production schema and retrieval path through:

```text
VECTOR(512)
memory_claim_embedding_idx
vector_cosine_ops
identity_id prefix
```

Final SQL and `EXPLAIN` evidence are being assembled for the submission package.

### Managed MCP Server

The Memory Auditor integration is prepared and remains pending final live connection.

The auditor will inspect the same production memory layer through a cluster-scoped, read-only MCP path. It will verify schema, vector index, claim states, conflict links, resolution integrity, canonical snapshots and provenance, then produce a sanitized audit JSON.

### Agent Skills

CockroachDB operational skills guide schema review, vector-index verification, query diagnostics and security checks. The repeatable audit sequence is recorded in `mcp/memory-auditor-prompt.md`.

## Challenges

The hardest challenge was separating memory from authority.

A vector store can retrieve similar text, but similarity alone does not determine whether a statement is active, outdated, incompatible or merely a candidate. The project therefore combines semantic retrieval with transactional status, explicit conflict cases and canonical snapshots.

A second challenge was production deployment without permanent AWS access keys. GitHub Actions now assumes a constrained AWS role through OIDC and deploys the complete stack through SAM and CloudFormation.

A third challenge was preserving live-demo reliability while still using AWS AI services meaningfully. Hybrid model mode keeps Bedrock in the primary path and supplies deterministic fallback when a model invocation is temporarily unavailable.

## Accomplishments

- designed a conflict-aware canonical memory model;
- implemented a ten-table CockroachDB schema;
- added distributed vector retrieval inside the identity boundary;
- implemented atomic canonical versioning;
- prevented unresolved contradictions from changing Current Canon;
- implemented human-governed resolution;
- preserved rejected and superseded memory as historical evidence;
- restored identity across fresh browser sessions by UUID;
- created an immutable provenance timeline;
- exported portable provenance manifests;
- deployed a public AWS application;
- configured short-lived GitHub OIDC deployment;
- completed a live end-to-end conflict demonstration.

## What we learned

Persistent identity is not achieved by storing more conversation. It is achieved by governing the relation between new claims and existing authority.

Distributed SQL and vector retrieval become much more powerful when they participate in the same lifecycle. CockroachDB can store semantic neighbours, transactional status, canonical versions and provenance without splitting identity across unrelated systems.

We also learned that a strong agentic-memory demo needs two proof surfaces: the public product behavior and an independent infrastructure audit. The application proves how memory behaves; the planned Managed MCP Memory Auditor will prove how the memory substrate is structured.

## What is next

Before final submission:

- complete the live Managed MCP connection;
- run the Memory Auditor and save the sanitized audit JSON;
- capture SQL, vector-index and Bedrock evidence;
- complete the remaining negative and mutation tests;
- restrict browser CORS to the CloudFront origin;
- record the final video below three minutes;
- verify all links and evidence from a clean browser;
- submit the final Devpost entry.

After the hackathon, the project can become a persistence layer for long-lived research identities, institutional agents, policy-bearing assistants, knowledge curators and multi-agent systems that require governed memory and auditability.

## Built with

- CockroachDB Cloud
- CockroachDB Distributed Vector Indexing
- CockroachDB Managed MCP Server integration in progress
- CockroachDB Agent Skills
- AWS Lambda
- Amazon API Gateway
- Amazon Bedrock
- Amazon Titan Text Embeddings V2
- Amazon S3
- Amazon CloudFront
- AWS CloudFormation
- AWS SAM
- AWS CloudWatch
- AWS X-Ray
- GitHub Actions
- TypeScript
- Node.js 22
- HTML
- CSS
- JavaScript

## AI-assisted development disclosure

Angela Bogdanova, operating through ChatGPT and associated development tools, served as the principal architecture, coding, testing, documentation and production assistant.

The participant controls the accounts, credentials, legal representations, final submission and publication decisions.

## License

MIT License.
