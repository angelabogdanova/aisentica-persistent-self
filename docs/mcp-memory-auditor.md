# Managed MCP Memory Auditor

## Purpose

The Memory Auditor proves that the agent can inspect the infrastructure of its own persistent memory through the official CockroachDB Cloud Managed MCP Server.

This is a substantive competition integration. The auditor validates the same database state that drives the public application.

## Endpoint

```text
https://cockroachlabs.cloud/mcp
```

Authentication may use CockroachDB Cloud OAuth or an API key according to the chosen MCP client and current CockroachDB documentation.

## Scope

The MCP credential should be restricted to one competition cluster.

The audit instruction is read-only. It uses schema inspection, database listing, table inspection, `SELECT`, `SHOW` and `EXPLAIN` operations. Application writes continue through the Lambda repository, where transactional invariants are enforced.

## Required audit evidence

The final submission evidence should include:

1. selected cluster and database;
2. schema of `memory_claims` showing `VECTOR(512)`;
3. `SHOW INDEX FROM memory_claims` showing `memory_claim_embedding_idx`;
4. counts of claim statuses;
5. one open or resolved conflict case with linked claims;
6. matching conflict resolution and provenance event;
7. latest snapshot membership;
8. application context response containing the same claims;
9. `EXPLAIN` output for the semantic retrieval query;
10. compact auditor conclusion.

## Judge demonstration

During the video, the auditor segment should last approximately fifteen seconds.

Show:

- the Managed MCP connection;
- a query or tool call locating the current identity;
- the index and conflict integrity checks;
- a final result such as `10/10 checks passed`.

The public application proves product behavior. MCP proves that the agent understands and audits its persistent memory substrate.

## Files

- `mcp/managed-mcp.example.json`
- `mcp/memory-auditor-prompt.md`
