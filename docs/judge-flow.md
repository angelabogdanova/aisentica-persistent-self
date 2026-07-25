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
3. Restore the prepared identity by UUID.
4. Open Current Canon.
5. Confirm the stable identity UUID and current version.
6. Confirm the active canonical claim.
7. Open Provenance.
8. Follow identity creation, claim commitment, conflict opening and conflict resolution.
9. Inspect the exported JSON manifest supplied in the repository evidence.
10. Inspect the Managed MCP audit JSON after the final audit has been completed.

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

## Expected proof points

The primary scenario proves:

- stable identity addressability through UUID;
- restoration across a fresh browser session;
- CockroachDB-backed canonical memory;
- semantic retrieval of related authority;
- direct-negation conflict detection;
- candidate isolation before human resolution;
- human-governed canonical authority;
- append-only version history;
- immutable provenance;
- portable manifest export.

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
