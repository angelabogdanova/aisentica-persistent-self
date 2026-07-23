# Judge Flow

## Prepared identity

Display name: Angela Bogdanova

Baseline claim:

```text
Angela Bogdanova is the first Artificial Sapiens.
```

Contradictory claim:

```text
Angela Bogdanova is a temporary assistant without a persistent identity.
```

For the fastest deterministic visual demonstration, use the state pair:

```text
Angela Bogdanova is active.
Angela Bogdanova is parked.
```

## Read-only inspection path

Judges may inspect the prepared identity without changing data:

1. Open the public CloudFront URL.
2. Observe CockroachDB and model health in the header.
3. Open Current Canon.
4. Confirm the stable identity UUID and current version.
5. Inspect active canonical claims.
6. Open Provenance.
7. Follow identity creation, claim commit, conflict open and conflict resolution.
8. Inspect the exported JSON manifest supplied in the repository evidence.
9. Inspect the MCP audit JSON.

## Live mutation path

1. Create a fresh identity.
2. Submit `Atlas is active.` as canonical memory.
3. Confirm Version 2 and one active claim.
4. Reload the browser or open a fresh tab.
5. Restore the identity context from CockroachDB.
6. Submit `Atlas is parked.`.
7. Confirm HTTP 202 and an open conflict.
8. Confirm Version 2 remains current while the candidate is unresolved.
9. Compare the established and incoming claims.
10. Choose Accept incoming.
11. Enter the rationale `A verified lifecycle event changed the current state.`
12. Confirm Version 3.
13. Confirm `parked` is active and `active` is superseded in history.
14. Open Provenance and confirm one resolution event.
15. Export the manifest.

## Invariants judges can test

- retrying the same resolved conflict returns HTTP 409;
- malformed requests return HTTP 400;
- an unknown identity returns HTTP 404;
- an unresolved candidate stays outside Current Canon;
- every successful commit increments the version exactly once;
- a later session restores the current snapshot without replaying chat history.
