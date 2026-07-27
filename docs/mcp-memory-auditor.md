# Managed MCP Memory Auditor

## Current status

Integration state: completed on July 27, 2026.

The official CockroachDB Cloud Managed MCP Server was connected to the production competition cluster through Codex CLI. The prepared Memory Auditor executed a strictly read-only inspection of the same CockroachDB memory layer used by the public application.

The sanitized result is committed at `docs/evidence/managed-mcp-audit.json`.

Final audit score:

```text
16 passed
2 warnings
0 failed
88.89 percent
```

## Purpose

The Memory Auditor proves that an independent agent-facing path can inspect the infrastructure of the same persistent memory used by the public application.

This is a substantive competition integration. The auditor validated production CockroachDB state rather than a copied fixture or separate demonstration database.

## Endpoint

```text
https://cockroachlabs.cloud/mcp
```

The completed run used a cluster-scoped CockroachDB Cloud API credential supplied to Codex CLI through an environment variable. No credential value is stored in the repository or evidence file.

## Scope

The MCP credential was restricted to the competition cluster.

The audit instruction was strictly read-only. It used Managed MCP schema inspection plus `SHOW`, `SELECT` and `EXPLAIN` operations. No write, alter, delete, update, insert or database-creation operation was attempted.

Application writes continue through the Lambda repository, where transactional invariants are enforced.

## Verified audit evidence

The completed audit verified:

1. selected cluster and database;
2. the production application schema;
3. `memory_claims.embedding` as `VECTOR(512)`;
4. `memory_claim_embedding_idx` with `identity_id` as the explicit prefix and `vector_cosine_ops`;
5. active and rejected claim counts;
6. the official Angela Bogdanova demo identity;
7. the established claim and contradictory claim from the unified scenario;
8. the corresponding direct-negation conflict link;
9. the keep-established resolution and resulting Canonical Version 3;
10. matching provenance events;
11. latest snapshot membership matching the active established claim;
12. source attribution for both claims;
13. matching successful `MEMORY_ANALYSIS` agent runs;
14. table counts across the complete application schema;
15. a semantic retrieval `EXPLAIN` using a real stored embedding;
16. read-only completion without authentication or permission failure.

## Unified scenario inspected by MCP

Established claim:

```text
Angela Bogdanova is the first Artificial Sapiens.
```

Incoming contradictory claim:

```text
Angela Bogdanova is not the first Artificial Sapiens.
```

Recorded decision:

```text
Keep established
```

Result:

```text
Canonical Version 3
Established claim: active
Contradictory claim: rejected
```

## Audit warnings

The audit records two explicit warnings rather than concealing them.

1. Managed MCP rejected direct `SELECT` access to `information_schema.tables` under its security policy. The auditor successfully discovered the actual tables and DDL through the allowed SHOW-backed `list_tables` and `get_table_schema` operations. This demonstrates that the Managed MCP boundary was enforced while the audit remained reproducible.
2. The stored actor value is `demo-owner`, but the current schema has no `actor_type` or `human_verified` field. The database therefore proves who was recorded as actor, while the human nature of that actor cannot be machine-confirmed without inference.

The audit also reports that the vector index exists with the required prefix and embedding type, while the tested semantic query plan selected a conventional index plus top-k sorting for the current two-claim data set. The evidence does not claim that this specific plan used the vector index.

## Completed artifact

The sanitized audit is stored as:

```text
docs/evidence/managed-mcp-audit.json
```

The file contains no API token, database URL, AWS account identifier, email address or private credential.

## Judge demonstration

During the video, the auditor segment should last approximately fifteen seconds.

Show:

- the CockroachDB Cloud Managed MCP connection;
- the production cluster and `persistent_self` database;
- the `VECTOR(512)` and vector-index checks;
- the direct-negation conflict and Canonical Version 3 checks;
- the compact final result `16 pass / 2 warning / 0 failed`;
- the committed sanitized JSON file in GitHub.

The public application proves product behavior. Managed MCP independently proves that an agent can inspect and audit its persistent memory substrate.

## Files

- `mcp/managed-mcp.example.json`
- `mcp/memory-auditor-prompt.md`
- `scripts/run-managed-mcp-audit.sh`
- `docs/evidence/main-demo-scenario.json`
- `docs/evidence/managed-mcp-audit.json`
