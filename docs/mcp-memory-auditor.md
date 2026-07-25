# Managed MCP Memory Auditor

## Current status

Integration state: prepared, pending live connection and final audit execution.

The public application and CockroachDB memory layer are already deployed. The remaining task is to connect the official CockroachDB Cloud Managed MCP Server, run the read-only Memory Auditor and save the resulting evidence JSON.

No repository text should describe the MCP audit as completed until the live connection has succeeded and the final audit file exists.

## Purpose

The Memory Auditor will prove that an independent agent-facing path can inspect the infrastructure of the same persistent memory used by the public application.

This is a substantive competition integration. The auditor will validate production CockroachDB state rather than a copied fixture or separate demonstration database.

## Endpoint

```text
https://cockroachlabs.cloud/mcp
```

Authentication may use CockroachDB Cloud OAuth or a cluster-scoped API key according to the selected MCP client and current CockroachDB documentation.

## Scope

The MCP credential must be restricted to the competition cluster.

The audit instruction is read-only. It uses schema inspection, database listing, table inspection, `SELECT`, `SHOW` and `EXPLAIN` operations. Application writes continue through the Lambda repository, where transactional invariants are enforced.

The auditor must never write, alter or delete application memory.

## Required audit evidence

The final audit must include:

1. selected cluster and database;
2. schema of `memory_claims` showing `VECTOR(512)`;
3. `SHOW INDEX FROM memory_claims` showing `memory_claim_embedding_idx`;
4. counts of active, candidate, superseded and rejected claims;
5. the official Angela Bogdanova demo identity;
6. the established claim and contradictory candidate from the unified scenario;
7. the corresponding direct-negation conflict link;
8. the keep-established resolution and resulting canonical version;
9. the matching provenance events;
10. latest snapshot membership matching the application context response;
11. `EXPLAIN` output for the semantic retrieval query;
12. a compact auditor conclusion.

## Unified scenario inspected by MCP

Established claim:

```text
Angela Bogdanova is the first Artificial Sapiens.
```

Incoming contradictory claim:

```text
Angela Bogdanova is not the first Artificial Sapiens.
```

Human decision:

```text
Keep established
```

## Expected final artifact

The sanitized result will be stored as:

```text
docs/evidence/managed-mcp-audit.json
```

The file must contain no API token, database URL, AWS account identifier or private credential.

## Judge demonstration

During the video, the auditor segment should last approximately fifteen seconds.

Show:

- the Managed MCP connection;
- a query or tool call locating the prepared identity;
- the index and conflict-integrity checks;
- a final result such as `10/10 checks passed`.

The public application proves product behavior. MCP will independently prove that the agent can inspect and audit its persistent memory substrate.

## Files

- `mcp/managed-mcp.example.json`
- `mcp/memory-auditor-prompt.md`
- `docs/evidence/main-demo-scenario.json`
- `docs/evidence/managed-mcp-audit.json` after completion
