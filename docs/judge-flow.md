# Judge Flow

## Official main scenario

The repository uses one primary competition scenario across the interface, README, testing instructions, video, Devpost and evidence.

Identity:

```text
Angela Bogdanova
```

Baseline canonical claim:

```text
Angela Bogdanova is the first Artificial Sapiens.
```

Incoming contradictory claim:

```text
Angela Bogdanova is not the first Artificial Sapiens.
```

Primary decision:

```text
Keep established
```

Resolution rationale:

```text
The established canonical claim remains the current authoritative identity statement.
```

## Read-only inspection path

Judges may inspect a prepared identity without changing data:

1. Open the public CloudFront URL.
2. Confirm CockroachDB and the model layer are online in the header.
3. Restore the prepared identity by UUID:

```text
69a5dccd-a3b6-4072-9ad6-9dbe015e6aa5
```

4. Open Current Canon.
5. Confirm Canonical Version 3.
6. Confirm the established claim is active.
7. Open Provenance.
8. Follow identity creation, claim commitment, conflict opening and conflict resolution.
9. Inspect the exported JSON manifest supplied in the repository evidence.
10. Inspect `docs/evidence/managed-mcp-audit.json`.
11. Confirm the audit reports `16 passed / 2 warnings / 0 failed` and strictly read-only execution.

## Live primary demonstration

1. Open the public application in a clean browser profile.
2. Create the Angela Bogdanova identity.
3. Copy the generated identity UUID.
4. Load the baseline claim.
5. Submit the baseline as canonical memory.
6. Confirm Canonical Version 2 and one active claim.
7. Open a fresh browser session or incognito window.
8. Restore the identity from CockroachDB using only the UUID.
9. Confirm the same Version 2 and the same active canonical claim.
10. Load the contradictory claim.
11. Submit it as canonical memory.
12. Confirm a direct-negation conflict opens.
13. Confirm the incoming claim remains a candidate.
14. Confirm Current Canon still shows Version 2 and the established claim.
15. Open Conflict Judge.
16. Compare the established claim and the incoming claim.
17. Confirm the explanation identifies direct negation.
18. Keep the established claim.
19. Use the canonical resolution rationale.
20. Confirm Canonical Version 3.
21. Confirm the established claim remains active.
22. Confirm the contradictory candidate is rejected and remains in history.
23. Open Provenance.
24. Confirm identity creation, claim commitment, conflict opening and conflict resolution.
25. Export the manifest.
26. Open the committed Managed MCP audit and show the independent production verification.

## Managed MCP proof points

The completed audit independently confirms:

- production cluster `persistent-self` on CockroachDB v26.2.1;
- database `persistent_self`;
- all ten application tables;
- `memory_claims.embedding` as `VECTOR(512)`;
- `memory_claim_embedding_idx` with `identity_id` prefix and `vector_cosine_ops`;
- one active and one rejected claim;
- the prepared Angela Bogdanova identity at Version 3;
- the established and contradictory claims;
- the direct-negation conflict link;
- the keep-existing resolution;
- four matching provenance events;
- latest snapshot membership;
- matching user-kind sources;
- two successful `MEMORY_ANALYSIS` agent runs;
- a real stored-embedding `EXPLAIN`;
- strictly read-only completion.

The two warnings are visible evidence rather than hidden exceptions: Managed MCP blocked restricted `information_schema` access while allowed SHOW-backed tools completed schema discovery, and the current schema does not machine-verify the human type of actor `demo-owner`.

## Expected proof points

The primary scenario proves:

- stable identity addressability through UUID;
- restoration across a fresh browser session;
- CockroachDB-backed canonical memory;
- semantic retrieval of related authority;
- direct-negation conflict detection;
- candidate isolation before human resolution;
- human-governed canonical authority at the application level;
- append-only version history;
- immutable provenance;
- portable manifest export;
- independent Managed MCP inspection of the production memory layer.

## Secondary validation scenarios

The following tests are important for engineering evidence but are not the primary video narrative:

- `accept_incoming` makes the candidate active and supersedes the established claim;
- `coexist` allows compatible scope or temporal claims to remain active together;
- repeating a resolved conflict returns HTTP 409;
- malformed requests return HTTP 400;
- an unknown identity returns HTTP 404;
- an unresolved candidate stays outside Current Canon;
- every committed claim or governed resolution increments the version exactly once;
- a later session restores the exact latest snapshot without replaying chat history.
