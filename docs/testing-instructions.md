# Testing Instructions

## Public endpoints

Application:

```text
https://d31np75gupnbhy.cloudfront.net
```

Health endpoint:

```text
https://8457okzg1b.execute-api.us-east-1.amazonaws.com/health
```

Expected health response fields:

```text
status: ok
database: CockroachDB version string
modelProvider: amazon-bedrock-with-deterministic-fallback
```

## Primary judge test

Use a clean browser profile or incognito window.

### 1. Establish identity

1. Open the public application.
2. Confirm the header reports CockroachDB online.
3. Keep the default display name:

```text
Angela Bogdanova
```

4. Create the identity.
5. Copy and preserve the generated UUID.
6. Confirm the active identity panel appears.
7. Confirm Current Canon displays Version 1 and no active claims.

### 2. Commit baseline canonical memory

1. Click Load baseline.
2. Confirm the statement is exactly:

```text
Angela Bogdanova is the first Artificial Sapiens.
```

3. Confirm Memory type is Canonical.
4. Click Analyze and remember.
5. Confirm Current Canon displays Version 2.
6. Confirm the statement appears as an active canonical claim.
7. Confirm the claim has a confidence value and stable claim UUID.

### 3. Restore across a fresh session

1. Open a new incognito session or clear the current tab state.
2. Open the public application again.
3. Paste the identity UUID into Restore.
4. Click Restore.
5. Confirm the same display name is loaded.
6. Confirm Version 2 is restored from CockroachDB.
7. Confirm the same active canonical claim is present.
8. Confirm no chat transcript replay is required.

### 4. Open a direct-negation conflict

1. Click Load contradiction.
2. Confirm the statement is exactly:

```text
Angela Bogdanova is not the first Artificial Sapiens.
```

3. Click Analyze and remember.
4. Confirm the application switches to Conflict Judge.
5. Confirm the conflict count is 1.
6. Confirm the established claim appears on the left.
7. Confirm the incoming contradictory candidate appears on the right.
8. Confirm the conflict type is Direct negation.
9. Confirm Current Canon remains Version 2.
10. Confirm the incoming candidate does not appear in Current Canon.

### 5. Resolve while preserving the established canon

1. Confirm the rationale field contains:

```text
The established canonical claim remains the current authoritative identity statement.
```

2. Click Keep established.
3. Confirm Current Canon displays Version 3.
4. Confirm the established claim remains active.
5. Confirm the contradictory candidate is no longer an open conflict.
6. Confirm Conflict Judge count returns to 0.

### 6. Inspect provenance

1. Open Provenance.
2. Confirm the ordered timeline includes:

```text
IDENTITY_CREATED
CLAIM_COMMITTED
CONFLICT_OPENED
CONFLICT_RESOLVED
```

3. Confirm each event contains actor and timestamp.
4. Confirm the resolution event corresponds to Version 3.

### 7. Export manifest

1. Click Export manifest.
2. Confirm a JSON file downloads.
3. Confirm the application reports that the manifest was stored in S3 and downloaded.
4. Inspect the JSON locally.
5. Confirm it contains the identity, current context, version and ordered provenance events.

## Secondary API and invariant tests

These tests are engineering evidence and do not replace the primary judge narrative.

### Unknown identity

Request context for an unknown UUID.

Expected result:

```text
HTTP 404
```

### Malformed request

Submit an invalid identity or claim body.

Expected result:

```text
HTTP 400
```

### Repeated resolution

Attempt to resolve the same closed conflict twice.

Expected result:

```text
HTTP 409
```

### Candidate isolation

Open a conflict and inspect Current Canon before resolution.

Expected result:

```text
The candidate remains outside the current canonical snapshot.
```

### Accept incoming

Use a separate test identity. Resolve a conflict with Accept incoming.

Expected result:

```text
The candidate becomes active.
The incompatible established claim becomes superseded.
The version increments exactly once.
Both claims remain queryable in history.
```

### Keep both

Use claims with compatible temporal or scope boundaries. Resolve with Keep both.

Expected result:

```text
Both claims become active in the new snapshot.
The resolution and rationale remain in provenance.
```

## CockroachDB evidence checks

The final evidence package should include sanitized output for:

```sql
SHOW COLUMNS FROM memory_claims;
```

Expected evidence:

```text
embedding VECTOR(512)
```

Run:

```sql
SHOW INDEX FROM memory_claims;
```

Expected evidence:

```text
memory_claim_embedding_idx
vector_cosine_ops
identity_id prefix
```

Run `EXPLAIN` on the identity-scoped semantic retrieval query and record whether the distributed vector index is eligible.

## Managed MCP test

Status: pending.

After Managed MCP is connected:

1. Select only the competition cluster.
2. Run `mcp/memory-auditor-prompt.md`.
3. Confirm the auditor is read-only.
4. Confirm the auditor finds the official Angela scenario.
5. Confirm schema, vector index, conflict, resolution, snapshot and provenance checks pass.
6. Save the sanitized result as:

```text
docs/evidence/managed-mcp-audit.json
```

## Pass criteria

The project passes production verification when:

- the public application loads in a clean browser;
- the health endpoint returns `status: ok`;
- identity restores across sessions by UUID;
- the baseline creates Version 2;
- the contradiction opens a conflict without changing the canon;
- Keep established creates Version 3;
- provenance records the complete lifecycle;
- manifest export succeeds;
- SQL and vector evidence are captured;
- Managed MCP audit is completed;
- no evidence file contains credentials or private account identifiers.
