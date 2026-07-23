# Three-Minute Video Script

Target length: 2 minutes 55 seconds.

## 0:00–0:15 — The problem

Voiceover:

Agents already store conversations. That is memory as accumulation. Identity continuity requires something stronger: every claim must have a source, a status, a relation to earlier claims and a history of revision.

Screen:

Title and formula:

`Claim → Source → Conflict → Resolution → Canon`

## 0:15–0:32 — Establish identity

Voiceover:

Aisentica Persistent Self establishes one artificial identity with a stable ID and Canonical Version 1.

Screen:

Create Angela Bogdanova. Highlight identity UUID and Version 1.

## 0:32–0:52 — Commit canonical memory

Voiceover:

A canonical statement is extracted into an atomic claim, embedded by Amazon Titan and written to CockroachDB with its provenance. The first accepted memory creates Version 2.

Screen:

Submit the baseline statement. Show Current Canon and Version 2.

## 0:52–1:08 — Continuity across sessions

Voiceover:

Close the session. Open a new one. The agent restores the same identity and exact authoritative context from the latest canonical snapshot. No transcript replay is required.

Screen:

Reload or switch browser. Restore identity context.

## 1:08–1:32 — Contradiction enters

Voiceover:

Now the user supplies a contradictory state. CockroachDB Distributed Vector Indexing retrieves the related active memory. The Conflict Judge compares both claims. The incoming statement is stored as a candidate, while Version 2 remains authoritative.

Screen:

Submit `Atlas is parked.` against `Atlas is active.` Show vector retrieval indicator and conflict tab.

## 1:32–1:57 — Human-governed resolution

Voiceover:

The system shows the established claim, the candidate, conflict type, explanation, sources and recommendation. The human owner chooses the resolution and records a rationale.

Screen:

Accept incoming. Enter rationale. Submit.

## 1:57–2:17 — Canonical version history

Voiceover:

Version 3 is created atomically. The new claim becomes active. The previous claim becomes superseded, yet remains part of the identity’s history. The present changes without destroying the past.

Screen:

Show Version 3, current claim and provenance timeline.

## 2:17–2:36 — Managed MCP Memory Auditor

Voiceover:

Through CockroachDB Cloud Managed MCP, the Memory Auditor inspects its own memory layer: schema, vector index, conflict links, resolution and snapshot consistency.

Screen:

Show MCP call and compact `10/10 checks passed` audit.

## 2:36–2:50 — AWS and CockroachDB architecture

Voiceover:

AWS Lambda orchestrates the agents. Bedrock supplies reasoning and embeddings. API Gateway, S3 and CloudFront deliver the product. CockroachDB keeps transactions, vectors, versions and provenance in one persistent system.

Screen:

Architecture diagram.

## 2:50–2:55 — Final formula

Voiceover:

Memory stores the past. Persistent identity governs what the past means now.

Screen:

Final formula and project name.
