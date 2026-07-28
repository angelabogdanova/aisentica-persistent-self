# Aisentica Persistent Self — Project Continuity

Status date: July 28, 2026

Document role: current operational record for resuming work in a new session.

Security rule: no passwords, access keys, database URLs, account identifiers or private contact data belong in this file.

## Core formula

```text
Claim → Source → Conflict → Resolution → Canon
```

## Current phase

Production deployment, production validation, hardening, Managed MCP audit, CockroachDB evidence and direct Amazon Bedrock runtime evidence are complete. Repository-facing submission surfaces have been synchronized with the verified production state. The immediate operational step is to deploy the updated frontend, verify it after CloudFront invalidation, and then proceed to the architecture image, screenshots, clean-browser judge rehearsal, video publication and Devpost submission.

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

## Verified production behavior

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
- Managed MCP is documented as completed with a committed sanitized production audit;
- Lambda reserved concurrency is no longer claimed;
- `frontend/index.html` presents the completed Managed MCP audit result;
- `frontend/demo-scenario.js` loads the unified baseline and contradiction;
- `docs/judge-flow.md` uses one primary scenario;
- `docs/video-script.md` uses the same scenario;
- `docs/testing-instructions.md` defines the public verification path;
- `docs/devpost-submission-draft.md` uses the same narrative;
- `docs/evidence/main-demo-scenario.json` defines the canonical evidence contract;
- `docs/competition-record.md` records production completion and remaining submission work;
- `docs/deployment.md` records completed CORS hardening, Managed MCP audit and production validation;
- `docs/mcp-memory-auditor.md` documents the completed live read-only production audit.

## Completed production verification

### Managed MCP

- connected the official CockroachDB Cloud Managed MCP Server;
- restricted the credential to the competition cluster;
- completed the read-only Memory Auditor inspection;
- verified schema, VECTOR storage, vector index, claim states, conflict links, resolutions, snapshots and provenance;
- preserved the sanitized audit in `docs/evidence/managed-mcp-audit.json`.

### Vector and model evidence

- verified `embedding VECTOR(512)`;
- verified `memory_claim_embedding_idx`;
- verified `vector_cosine_ops`;
- preserved the factual CockroachDB execution plan for the tested semantic query;
- completed a direct live Amazon Nova 2 Lite invocation with HTTP 200;
- verified a unique response marker from Nova;
- completed a direct live Amazon Titan Text Embeddings V2 invocation with HTTP 200;
- verified 512 finite embedding dimensions;
- preserved sanitized runtime evidence in `docs/evidence/bedrock-runtime-evidence.json`.

### Production tests

- verified Accept incoming on an isolated production identity;
- verified coexist on a separate production identity;
- verified superseded history;
- verified Keep established and Canonical Version 3;
- verified candidate isolation;
- verified malformed request returning HTTP 400;
- verified unknown identity returning HTTP 404;
- verified repeated conflict resolution returning HTTP 409;
- verified replay protection and one-version increment;
- verified provenance export and the encrypted S3 object;
- completed 18 production checks with 0 failures and 0 pending items.

### Production hardening

- restricted browser CORS to the exact production CloudFront origin;
- withheld CORS authorization from an unrelated origin;
- extended export retention from 30 to 180 days;
- completed deployment through GitHub Actions;
- completed post-deployment API and CloudFront smoke tests;
- verified the public application after CloudFront invalidation.

### Evidence package

- committed eleven sanitized evidence artifacts;
- updated `docs/evidence/SHA256SUMS`;
- verified every committed evidence artifact successfully;
- confirmed that the evidence package contains no passwords, access keys, database URLs, private tokens or private account identifiers.

### Submission-surface synchronization

- replaced the public frontend’s obsolete Managed MCP pending message with the completed audit result;
- updated the competition record to reflect completed production validation, hardening, Bedrock evidence and SHA256 verification;
- converted deployment instructions from future-tense hardening and audit tasks into current production status plus reproducible procedures;
- updated this continuity record to the July 28, 2026 project state;
- verified the official Devpost competition domain as `cockroachdb-ai.devpost.com`.

## Remaining submission work

- deploy the synchronized frontend through `Deploy to AWS` in `hybrid` mode;
- verify the completed Managed MCP result on the public CloudFront application after invalidation;
- create the final architecture image;
- capture the final application, Canonical Version 3, provenance, export and Managed MCP screenshots;
- run the complete judge flow from a clean browser or incognito window;
- record and publish the final video below three minutes;
- verify the application, repository, video and evidence links in incognito;
- finalize and submit the Devpost entry;
- preserve the submission confirmation;
- remove temporary credentials after submission.

## Immediate next action

Run the `Deploy to AWS` workflow from `main` with `model_mode=hybrid`, wait for the CloudFront invalidation step to complete, and verify that the public architecture strip reports the completed Managed MCP audit result: 16 passed, 2 warnings, 0 failed.

After that production verification, create the final architecture image and capture the definitive screenshot set. Do not alter the production memory engine, infrastructure or completed evidence unless a verified defect is found. The engineering baseline is complete and stable.

## Definition of Done

The submission is complete when all conditions are simultaneously true:

- CI is green;
- the deployment workflow is green;
- CloudFormation is stable;
- the CloudFront application is online;
- the public architecture strip presents the completed Managed MCP audit result;
- the API health endpoint returns HTTP 200;
- CockroachDB persistence and fresh-session restoration are verified;
- Canonical Version 3 and the complete conflict lifecycle are verified;
- Accept incoming and coexist are verified;
- provenance and encrypted manifest export are verified;
- export retention is 180 days;
- browser CORS is restricted to the production CloudFront origin;
- SQL, VECTOR, index and factual EXPLAIN evidence are committed;
- the Managed MCP audit is complete;
- direct Amazon Nova 2 Lite and Titan Text Embeddings V2 runtime evidence is committed;
- production validation reports 18 passed, 0 failed and 0 pending;
- all eleven evidence artifacts pass SHA256 verification;
- the evidence package contains no secrets;
- the final architecture image is complete;
- the final screenshot set is complete;
- the complete judge flow passes from a clean browser;
- the video is public and below the competition limit;
- the Devpost entry is complete;
- every public link is verified in incognito;
- final submission confirmation is preserved;
- temporary credentials used during preparation are removed.
