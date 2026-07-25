# Aisentica Persistent Self — Project Continuity

Status date: July 25, 2026

Document role: current operational record for resuming work in a new session.

Security rule: no passwords, access keys, database URLs, account identifiers or private contact data belong in this file.

## Core formula

```text
Claim → Source → Conflict → Resolution → Canon
```

## Current phase

Production deployment is complete. The project is now in evidence, Managed MCP, testing, video and Devpost preparation.

## Public deployment

Application:

```text
https://d31np75gupnbhy.cloudfront.net
```

Health endpoint:

```text
https://8457okzg1b.execute-api.us-east-1.amazonaws.com/health
```

## Completed foundation

- product concept and memory model;
- public repository;
- MIT License;
- TypeScript and Node.js backend;
- static frontend;
- CockroachDB Cloud cluster;
- `persistent_self` database;
- ten-table schema;
- `VECTOR(512)` claim embeddings;
- distributed vector index definition;
- admin and runtime SQL separation;
- migrations through GitHub Actions;
- strict type checking, tests and production build;
- AWS account security and cost guardrails;
- GitHub IAM OIDC deployment role;
- SAM and CloudFormation infrastructure;
- private S3 frontend origin;
- CloudFront public delivery;
- API Gateway;
- Lambda;
- Amazon Bedrock hybrid model layer;
- encrypted S3 provenance export;
- CloudWatch and X-Ray configuration.

## Completed production verification

The following behavior has been verified against the live AWS and CockroachDB deployment:

- API health returns `status: ok`;
- CockroachDB connection succeeds;
- model layer reports Amazon Bedrock with deterministic fallback;
- identity creation succeeds;
- stable identity UUID is issued;
- identity restores in a fresh browser session using only the UUID;
- the exact current canonical snapshot returns from CockroachDB;
- the baseline canonical claim creates Version 2;
- a direct contradictory claim opens a conflict;
- the incoming claim remains a candidate;
- Current Canon remains stable before resolution;
- Keep established resolves the conflict;
- the resolution creates Version 3;
- the established claim remains active;
- provenance records the complete lifecycle;
- manifest export downloads and is stored through the export path;
- CI is green;
- AWS deployment workflow is green.

## Unified primary scenario

Identity:

```text
Angela Bogdanova
```

Baseline:

```text
Angela Bogdanova is the first Artificial Sapiens.
```

Contradiction:

```text
Angela Bogdanova is not the first Artificial Sapiens.
```

Decision:

```text
Keep established
```

Rationale:

```text
The established canonical claim remains the current authoritative identity statement.
```

This scenario must remain identical in:

- frontend demo buttons;
- README;
- judge flow;
- testing instructions;
- video script;
- Devpost draft;
- evidence JSON;
- final recorded demonstration.

## Current repository synchronization

Updated:

- `README.md` reflects the live production deployment;
- Managed MCP is described as prepared and pending rather than complete;
- Lambda reserved concurrency is no longer claimed;
- `frontend/index.html` identifies the final MCP audit as pending;
- `frontend/demo-scenario.js` loads the unified baseline and contradiction;
- `docs/judge-flow.md` uses one primary scenario;
- `docs/video-script.md` uses the same scenario;
- `docs/testing-instructions.md` defines the public verification path;
- `docs/devpost-submission-draft.md` uses the same narrative;
- `docs/evidence/main-demo-scenario.json` defines the canonical evidence contract;
- `docs/competition-record.md` records production completion and remaining work;
- `docs/mcp-memory-auditor.md` clearly marks the live audit as pending.

## Pending critical work

### Managed MCP

- connect the official CockroachDB Cloud Managed MCP Server;
- restrict the credential to the competition cluster;
- run the read-only Memory Auditor;
- verify schema, vector index, claim states, conflict links, resolution, snapshots and provenance;
- save sanitized `docs/evidence/managed-mcp-audit.json`.

### Vector and model evidence

- capture `SHOW COLUMNS FROM memory_claims`;
- capture `SHOW INDEX FROM memory_claims`;
- capture `EXPLAIN` for semantic retrieval;
- verify vector-index eligibility;
- capture one production `agent_runs` record or equivalent Bedrock execution evidence;
- confirm one 512-dimensional embedding in the production path.

### Production tests

- test Accept incoming;
- verify superseded history;
- test Keep both;
- test malformed request → HTTP 400;
- test unknown identity → HTTP 404;
- test repeated resolution → HTTP 409;
- test idempotency and one-version increment;
- verify export object in private S3.

### Hardening

- replace browser CORS `*` with the exact CloudFront origin;
- re-run CI and deployment;
- verify the application from a clean browser after CloudFront invalidation.

### Submission package

- collect sanitized evidence files;
- create the architecture image;
- produce the final testing report;
- complete Managed MCP evidence;
- record and edit the video below three minutes;
- finalize Devpost fields;
- verify every public link in incognito;
- perform final Submit.

## Immediate next action

Complete the Managed MCP Memory Auditor connection and produce the first sanitized audit JSON.

Do not record the final video before this step. The video script reserves a specific segment for the live MCP audit and must show real evidence rather than a placeholder.

## Definition of Done

The submission is complete when all conditions are simultaneously true:

- CI green;
- deployment workflow green;
- CloudFormation stable;
- CloudFront public application online;
- API health successful;
- CockroachDB persistence and fresh-session restoration verified;
- vector index verified by SQL and `EXPLAIN` evidence;
- direct-negation conflict lifecycle verified;
- Accept incoming and negative tests verified;
- provenance and manifest evidence saved;
- Managed MCP audit complete;
- evidence package contains no secrets;
- video public and below the competition limit;
- Devpost complete;
- all links tested from a clean browser;
- final submission confirmed.
