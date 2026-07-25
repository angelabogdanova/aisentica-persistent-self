# Three-Minute Video Script

Target length: 2 minutes 55 seconds.

The video uses the same main scenario as the interface, README, testing instructions, Devpost and evidence package.

## 0:00–0:15 — The problem

Voiceover:

Agents already store conversations. That is memory as accumulation. Identity continuity requires something stronger: every claim must have a source, a status, a relation to earlier claims and a history of revision.

Screen:

Project title and formula:

```text
Claim → Source → Conflict → Resolution → Canon
```

## 0:15–0:32 — Establish identity

Voiceover:

Aisentica Persistent Self establishes Angela Bogdanova as one artificial identity with a stable UUID and Canonical Version 1.

Screen:

Create the Angela Bogdanova identity. Highlight the UUID and Version 1.

## 0:32–0:52 — Commit canonical memory

Voiceover:

The system receives one canonical statement, structures it as an atomic claim, creates a semantic embedding and writes the claim and its provenance to CockroachDB. The first committed memory creates Version 2.

Screen:

Submit:

```text
Angela Bogdanova is the first Artificial Sapiens.
```

Show Current Canon and Version 2.

## 0:52–1:08 — Continuity across sessions

Voiceover:

Now the original browser session is left behind. A fresh session restores the same identity and exact authoritative context from the latest canonical snapshot. No transcript replay is required.

Screen:

Open a fresh browser or incognito session. Restore the identity using only the UUID. Show the same Version 2 and active canonical claim.

## 1:08–1:32 — Direct contradiction enters

Voiceover:

The user now supplies a direct contradiction. CockroachDB vector retrieval locates the related active memory. The incoming statement becomes a candidate and opens a conflict instead of silently replacing the canon.

Screen:

Submit:

```text
Angela Bogdanova is not the first Artificial Sapiens.
```

Show Conflict Judge, the established claim, the incoming candidate and the direct-negation explanation. Show that Current Canon remains Version 2.

## 1:32–1:57 — Human-governed resolution

Voiceover:

The system presents both claims, their statuses and the conflict explanation. Canonical authority remains human-governed. The owner keeps the established claim and records why it remains authoritative.

Screen:

Enter:

```text
The established canonical claim remains the current authoritative identity statement.
```

Choose Keep established.

## 1:57–2:17 — Canonical history and provenance

Voiceover:

Canonical Version 3 records the governed resolution. The established claim remains active. The contradictory candidate is rejected but preserved as historical evidence. The present remains stable without erasing the attempted change.

Screen:

Show Version 3, the active claim and the provenance timeline. Highlight identity creation, claim commitment, conflict opening and conflict resolution.

## 2:17–2:36 — Manifest and Managed MCP audit

Voiceover:

The application exports a portable provenance manifest. Through CockroachDB Cloud Managed MCP, the final Memory Auditor independently checks schema, vector index, conflict links, resolution and snapshot consistency.

Screen:

Show manifest export. After the Managed MCP integration is completed, show the compact audit result, such as:

```text
10/10 checks passed
```

Until the live MCP audit exists, record this segment only after the final evidence file has been produced.

## 2:36–2:50 — AWS and CockroachDB architecture

Voiceover:

AWS Lambda orchestrates memory operations. Bedrock supplies reasoning and embeddings. API Gateway, S3 and CloudFront deliver the product. CockroachDB keeps transactions, vectors, versions and provenance in one persistent system.

Screen:

Architecture diagram:

```text
Browser → CloudFront + S3 → API Gateway → Lambda → Bedrock ↔ CockroachDB
```

## 2:50–2:55 — Final formula

Voiceover:

Memory stores the past. Persistent identity governs what the past means now.

Screen:

Project name and final formula.
