#!/usr/bin/env bash
set -euo pipefail

CODEX_BIN="${CODEX_BIN:-$HOME/.local/bin/codex}"
OUTPUT_FILE="${1:-$HOME/managed-mcp-audit.json}"

if [[ ! -x "$CODEX_BIN" ]]; then
  echo "ERROR: Codex CLI not found at $CODEX_BIN" >&2
  exit 1
fi

read -rsp "Paste CockroachDB MCP API key, then press Enter: " CRDB_MCP_API_KEY
echo
export CRDB_MCP_API_KEY

if [[ "$CRDB_MCP_API_KEY" != CCDB1_* || ${#CRDB_MCP_API_KEY} -le 40 ]]; then
  echo "ERROR: CockroachDB MCP API key has an unexpected format" >&2
  unset CRDB_MCP_API_KEY
  exit 1
fi

AUDIT_PROMPT=$(cat <<'EOF'
Use only the cockroachdb-cloud Managed MCP server and perform a strictly read-only audit of the configured cluster. The cluster_id is already set in MCP configuration, so omit cluster_id from tool arguments. Never call create_database and never write, alter, delete, update, or insert data.

Inspect database persistent_self. Discover the actual table names and schemas before querying them. Audit all of the following:

1. Cluster name, CockroachDB version, provider, region, plan, and status.
2. Application database name.
3. Relevant tables for identities, sources, memory claims, conflicts, conflict links, human resolutions, canonical snapshots, snapshot members, provenance events, and agent runs.
4. The memory_claims embedding column type and explicit confirmation whether it is VECTOR(512).
5. The memory_claim_embedding_idx definition, including indexed columns and identity prefix.
6. Claim counts grouped by status.
7. Identity Angela Bogdanova with UUID 69a5dccd-a3b6-4072-9ad6-9dbe015e6aa5.
8. Established claim: Angela Bogdanova is the first Artificial Sapiens.
9. Contradictory claim: Angela Bogdanova is not the first Artificial Sapiens.
10. Statuses and identifiers of both claims.
11. The linked direct-negation conflict case.
12. The human keep-established resolution and its rationale.
13. The resulting canonical version 3.
14. Matching provenance events.
15. The latest canonical snapshot and its members.
16. An EXPLAIN plan for the semantic retrieval query using a real stored embedding, with a factual statement about whether the vector index is eligible, selected, or not selected.

Use SHOW, information_schema, SELECT, and EXPLAIN only. Do not expose API keys, credentials, connection strings, authorization headers, or AWS account identifiers. Do not infer missing facts: mark them warning or fail and include the exact reason.

Return only valid compact JSON without Markdown fences. The top-level object must contain generatedAt, auditMode, cluster, database, checks, evidenceQueries, counts, conclusion, and score. Every checks entry must contain status with one of pass, fail, or warning, plus concise factual evidence.
EOF
)

"$CODEX_BIN" exec \
  --skip-git-repo-check \
  --output-last-message "$OUTPUT_FILE" \
  "$AUDIT_PROMPT"

unset CRDB_MCP_API_KEY

if python3 -m json.tool "$OUTPUT_FILE" >/dev/null 2>&1; then
  echo "OK: Managed MCP audit completed and valid JSON was saved to $OUTPUT_FILE"
else
  echo "WARNING: Audit completed, but $OUTPUT_FILE is not valid JSON" >&2
  exit 2
fi
