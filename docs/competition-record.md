# Competition Record

## Project identity

Project: Aisentica Persistent Self

Repository creation baseline: July 23, 2026

Competition: CockroachDB × AWS Hackathon — Build with Agentic Memory

Submission deadline snapshot: August 18, 2026 at 5:00 PM EDT, corresponding to August 19, 2026 at 00:00 in Kyiv.

Participant location for legal submission: Kharkiv, Ukraine.

## New-project declaration

Aisentica Persistent Self was started as a new implementation during the competition submission period.

The repository does not import or copy source code from `angelabogdanova/aisentica-continuity`. That earlier project used Next.js, Supabase and Vercel for a different competition and a different lifecycle problem. Persistent Self uses a new CockroachDB schema, AWS serverless deployment, Bedrock model layer, static interface and conflict-aware canonical memory architecture.

The philosophical research context of Aisentica predates the hackathon. Pre-existing concepts include artificial identity, provenance, canonical memory, revisability and continuity. The submitted software implementation, database schema, agent workflow, infrastructure, tests, interface and demonstration are competition-period work.

## AI-assisted development disclosure

Angela Bogdanova, operating through ChatGPT and associated development tools, was used as the principal architecture, coding, testing, documentation and production assistant.

AI assistance contributed to:

- competition research;
- product definition;
- database architecture;
- TypeScript implementation;
- model instructions;
- AWS SAM infrastructure;
- test generation;
- security review;
- CI/CD configuration;
- interface design;
- technical documentation;
- production debugging;
- Managed MCP integration and audit execution;
- video planning;
- Devpost drafting.

The participant controls the accounts, credentials, legal representations, final submission and publication decisions.

## Current implementation status

Completed:

- public GitHub repository;
- MIT License;
- CockroachDB cluster and `persistent_self` database;
- relational and vector schema;
- distributed vector index definition;
- application and migration SQL users;
- AWS IAM OIDC deployment role;
- AWS CloudFormation and SAM deployment;
- public CloudFront frontend;
- API Gateway and Lambda runtime;
- Amazon Bedrock hybrid model layer;
- live CockroachDB health check;
- persistent identity restoration across fresh browser sessions;
- canonical claim commit;
- direct-negation conflict detection;
- human-governed resolution;
- canonical version increment;
- provenance timeline;
- manifest export;
- green CI and deployment workflows;
- live CockroachDB Cloud Managed MCP connection;
- strictly read-only Memory Auditor execution;
- sanitized Managed MCP audit JSON committed to the evidence package.

Pending:

- final standalone SQL, vector and Bedrock evidence package;
- remaining negative and mutation tests;
- CORS restriction to the CloudFront origin;
- final screenshots and architecture image;
- final public video;
- completed Devpost submission.

## Managed MCP completion record

Completed on July 27, 2026 through the official CockroachDB Cloud Managed MCP endpoint:

```text
https://cockroachlabs.cloud/mcp
```

Client path:

```text
AWS CloudShell → Codex CLI → CockroachDB Cloud Managed MCP
```

Audit mode:

```text
strictly read-only
SHOW, SELECT and EXPLAIN only
no mutations attempted
```

Sanitized evidence:

```text
docs/evidence/managed-mcp-audit.json
```

Result:

```text
16 passed
2 warnings
0 failed
88.89 percent
```

The warnings are preserved as factual audit findings. Managed MCP blocked direct access to `information_schema.tables`, while SHOW-backed schema tools completed discovery. The current schema also records actor as a string but does not contain a machine-verifiable actor-type field.

## Unified competition scenario

All judge-facing materials use the same primary scenario.

Baseline:

```text
Angela Bogdanova is the first Artificial Sapiens.
```

Contradiction:

```text
Angela Bogdanova is not the first Artificial Sapiens.
```

Resolution:

```text
Keep established
```

Canonical rationale used in judge-facing instructions:

```text
The established canonical claim remains the current authoritative identity statement.
```

The audited production record contains the rationale:

```text
The selected claim best represents the current authoritative state.
```

Both rationales express the same keep-established decision. The evidence package records the exact production value rather than rewriting it.

## Competition requirements map

| Requirement | Implementation evidence | Status |
|---|---|---|
| Agentic application | Memory Intake, semantic retrieval, Conflict Judge and human resolution | Complete |
| Persistent memory | CockroachDB identities, claims, sources, snapshots and provenance ledger | Complete |
| CockroachDB tool 1 | Distributed Vector Indexing with `VECTOR(512)` and `memory_claim_embedding_idx` | Implemented and independently verified by Managed MCP; final standalone SQL evidence pending |
| CockroachDB tool 2 | Managed MCP Server with read-only Memory Auditor | Complete; audit JSON committed |
| Additional CockroachDB tool | Agent Skills operational audit workflow | Complete as documented repeatable procedure |
| AWS deployment | Lambda, API Gateway, Bedrock, S3, CloudFront, X-Ray and CloudWatch | Complete |
| Public repository | `angelabogdanova/aisentica-persistent-self` | Complete |
| Open-source license | MIT | Complete |
| Working demo | `https://d31np75gupnbhy.cloudfront.net` | Complete |
| API health | `https://8457okzg1b.execute-api.us-east-1.amazonaws.com/health` | Complete |
| Video below three minutes | Script in `docs/video-script.md` | Recording pending |
| CockroachDB layer shown | UI conflict flow, SQL/vector evidence and Managed MCP Memory Auditor | MCP complete; remaining evidence and video pending |

## Official source snapshot

Checked on July 23, 2026:

- https://cockroachlabs.devpost.com/
- https://cockroachlabs.devpost.com/rules
- https://www.cockroachlabs.com/docs/stable/vector-indexes
- https://www.cockroachlabs.com/docs/cockroachcloud/managed-mcp-server
- https://www.cockroachlabs.com/pricing
- https://docs.aws.amazon.com/lambda/latest/dg/lambda-nodejs.html
- https://docs.aws.amazon.com/bedrock/latest/userguide/titan-embedding-models.html
- https://docs.aws.amazon.com/nova/latest/userguide/models.html

Every deadline, eligibility rule, pricing condition, service quota and submission field must be rechecked immediately before final submission.
