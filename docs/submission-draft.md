# Devpost Submission Draft

## Project name

Aisentica Persistent Self

## Tagline

Conflict-aware persistent memory that turns agent history into an attributable, revisable and versioned identity.

## Inspiration

Agents can retrieve old messages yet still lose the continuity of who they are. A transcript tells us what was said. It does not tell us which claim is authoritative now, where that authority came from, which earlier claim it replaced or why the change was accepted.

Aisentica Persistent Self begins from one principle:

An agent does not possess continuity merely because it stores messages. Continuity begins when memory becomes attributable, revisable, conflict-aware and persistent across sessions.

## What it does

Persistent Self stores artificial identity as a structured history of claims, sources, conflicts, resolutions and canonical versions.

When a new statement arrives, the system:

1. extracts one atomic claim;
2. classifies its memory type;
3. generates a semantic embedding;
4. searches the identity’s active memory through CockroachDB Distributed Vector Indexing;
5. asks the Conflict Judge whether the claims can remain authoritative together;
6. commits compatible memory into a new canonical version or opens a conflict case;
7. preserves the human resolution with rationale, actor and resulting version;
8. restores the exact current identity context in later sessions;
9. exports a complete provenance manifest;
10. audits database integrity through CockroachDB Cloud Managed MCP.

## How we built it

The application uses TypeScript on AWS Lambda with an HTTP API through Amazon API Gateway.

Amazon Bedrock Nova 2 Lite extracts claims and assesses conflicts. Amazon Titan Text Embeddings V2 produces 512-dimensional embeddings.

CockroachDB Cloud stores:

- stable artificial identities;
- structured memory claims;
- source metadata;
- vector embeddings;
- open conflict cases;
- links between incoming and established claims;
- human resolutions;
- immutable canonical snapshots;
- snapshot claim membership;
- ordered provenance events.

The cosine-optimized distributed vector index is prefixed by `identity_id`, which keeps semantic retrieval inside one artificial identity.

The public interface is hosted through private Amazon S3 and CloudFront. Provenance exports are encrypted in a separate S3 bucket. CloudWatch and X-Ray provide operational evidence. GitHub Actions deploys through AWS OIDC without permanent AWS keys.

## CockroachDB tools

Distributed Vector Indexing powers semantic retrieval of related active claims.

Managed MCP powers the Memory Auditor, which inspects schema, vector-index eligibility, unresolved conflicts, resolution integrity and agreement between the latest snapshot and the application context.

CockroachDB Agent Skills support operational review, schema diagnostics, secure SQL practice and vector-index verification.

## Challenges

The central challenge was separating semantic similarity from contradiction. Related claims are often compatible, and different wording is not automatically a conflict. The system therefore uses vector retrieval only to select candidates. A separate Conflict Judge evaluates scope, time and authority.

The second challenge was preserving canonical consistency under concurrent writes. CockroachDB serializable transactions, row locks, unique identity-version constraints and retry handling make each accepted change create exactly one new version.

The third challenge was keeping the demonstration resilient. The model layer supports Bedrock, hybrid and deterministic modes. Hybrid mode preserves a functional judge path during a temporary Bedrock interruption while production memory remains in CockroachDB.

## Accomplishments

- one persistent identity UUID across sessions;
- semantic retrieval and conflict detection without overwrite;
- human-governed canonical revision;
- immutable version and provenance history;
- CockroachDB transactions and distributed vector index in one memory layer;
- Managed MCP infrastructure audit;
- complete AWS serverless deployment;
- deterministic tests for the full conflict lifecycle;
- public judge interface and provenance export.

## What we learned

Persistent memory is not a larger context window. It is a governance system over claims.

The decisive technical object is the canonical snapshot: a reproducible statement of what the identity currently treats as authoritative, connected to every source and every change that produced it.

## What is next

The next stage adds multi-claim document ingestion, explicit temporal scopes, source trust policies, signed provenance manifests, identity-to-identity memory transfer and cryptographic verification of canonical exports.

## Built with

CockroachDB Cloud Basic, Distributed Vector Indexing, CockroachDB Cloud Managed MCP, CockroachDB Agent Skills, AWS Lambda, Amazon API Gateway, Amazon Bedrock, Amazon Nova 2 Lite, Amazon Titan Text Embeddings V2, Amazon S3, Amazon CloudFront, AWS X-Ray, AWS CloudWatch, AWS IAM OIDC, TypeScript, Node.js 22, Zod, Vitest, GitHub Actions and AWS SAM.

## Final formula

Memory stores the past. Persistent identity governs what the past means now.
