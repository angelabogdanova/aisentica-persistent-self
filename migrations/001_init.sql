CREATE TABLE IF NOT EXISTS identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug STRING NOT NULL UNIQUE,
  display_name STRING NOT NULL,
  description STRING NULL,
  current_version INT8 NOT NULL DEFAULT 1 CHECK (current_version >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS memory_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id UUID NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
  kind STRING NOT NULL CHECK (kind IN ('user', 'document', 'url', 'system', 'import')),
  title STRING NOT NULL,
  uri STRING NULL,
  author STRING NULL,
  content_hash STRING NULL,
  occurred_at TIMESTAMPTZ NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  INDEX memory_sources_identity_created_idx (identity_id, created_at DESC)
);

CREATE TABLE IF NOT EXISTS memory_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id UUID NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
  memory_type STRING NOT NULL CHECK (memory_type IN ('episodic', 'semantic', 'canonical', 'procedural', 'provenance')),
  subject STRING NOT NULL,
  predicate STRING NOT NULL,
  object_value JSONB NOT NULL,
  normalized_text STRING NOT NULL,
  original_text STRING NOT NULL,
  confidence DECIMAL(5,4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  status STRING NOT NULL CHECK (status IN ('candidate', 'active', 'superseded', 'rejected')),
  source_id UUID NULL REFERENCES memory_sources(id) ON DELETE SET NULL,
  supersedes_claim_id UUID NULL REFERENCES memory_claims(id) ON DELETE SET NULL,
  embedding VECTOR(512) NULL,
  created_by STRING NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  INDEX memory_claims_identity_status_created_idx (identity_id, status, created_at DESC),
  INDEX memory_claims_subject_predicate_idx (identity_id, subject, predicate)
);

CREATE VECTOR INDEX IF NOT EXISTS memory_claim_embedding_idx
  ON memory_claims (identity_id, embedding vector_cosine_ops);

CREATE TABLE IF NOT EXISTS conflict_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id UUID NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
  incoming_claim_id UUID NOT NULL REFERENCES memory_claims(id) ON DELETE CASCADE,
  status STRING NOT NULL CHECK (status IN ('open', 'resolved')),
  summary STRING NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ NULL,
  INDEX conflict_cases_identity_status_idx (identity_id, status, created_at DESC)
);

CREATE TABLE IF NOT EXISTS conflict_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conflict_case_id UUID NOT NULL REFERENCES conflict_cases(id) ON DELETE CASCADE,
  existing_claim_id UUID NOT NULL REFERENCES memory_claims(id) ON DELETE CASCADE,
  conflict_type STRING NOT NULL CHECK (conflict_type IN ('direct_negation', 'identity_collision', 'status_replacement', 'temporal_update', 'scope_collision', 'uncertain')),
  similarity FLOAT8 NOT NULL,
  explanation STRING NOT NULL,
  recommended_resolution STRING NOT NULL CHECK (recommended_resolution IN ('accept_incoming', 'keep_existing', 'coexist')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (conflict_case_id, existing_claim_id)
);

CREATE TABLE IF NOT EXISTS canonical_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id UUID NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
  version_no INT8 NOT NULL CHECK (version_no >= 1),
  previous_snapshot_id UUID NULL REFERENCES canonical_snapshots(id) ON DELETE SET NULL,
  change_kind STRING NOT NULL,
  change_summary STRING NOT NULL,
  actor STRING NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (identity_id, version_no)
);

CREATE TABLE IF NOT EXISTS canonical_snapshot_claims (
  snapshot_id UUID NOT NULL REFERENCES canonical_snapshots(id) ON DELETE CASCADE,
  claim_id UUID NOT NULL REFERENCES memory_claims(id) ON DELETE CASCADE,
  claim_order INT8 NOT NULL,
  PRIMARY KEY (snapshot_id, claim_id),
  UNIQUE (snapshot_id, claim_order)
);

CREATE TABLE IF NOT EXISTS conflict_resolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conflict_case_id UUID NOT NULL UNIQUE REFERENCES conflict_cases(id) ON DELETE CASCADE,
  decision STRING NOT NULL CHECK (decision IN ('accept_incoming', 'keep_existing', 'coexist')),
  rationale STRING NOT NULL,
  actor STRING NOT NULL,
  resulting_version INT8 NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS provenance_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id UUID NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
  claim_id UUID NULL REFERENCES memory_claims(id) ON DELETE SET NULL,
  conflict_case_id UUID NULL REFERENCES conflict_cases(id) ON DELETE SET NULL,
  snapshot_id UUID NULL REFERENCES canonical_snapshots(id) ON DELETE SET NULL,
  event_type STRING NOT NULL,
  actor STRING NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  INDEX provenance_events_identity_created_idx (identity_id, created_at, id)
);

CREATE TABLE IF NOT EXISTS agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id UUID NULL REFERENCES identities(id) ON DELETE SET NULL,
  operation STRING NOT NULL,
  status STRING NOT NULL CHECK (status IN ('started', 'succeeded', 'failed')),
  model_provider STRING NULL,
  input JSONB NOT NULL DEFAULT '{}'::JSONB,
  output JSONB NOT NULL DEFAULT '{}'::JSONB,
  error_code STRING NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ NULL,
  INDEX agent_runs_identity_started_idx (identity_id, started_at DESC)
);
