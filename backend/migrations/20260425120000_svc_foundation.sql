-- Run this migration against the Neon production database before the next backend deploy.
-- Method: Neon SQL editor (paste contents) OR psql against DATABASE_URL.
-- After migration: verify 5 svc_* tables and 4 svc_* indexes exist.

-- Startup Vibe Check (SVC) Phase 1 — tables + indexes (V1.0.1 schema)
-- Apply (local/dev example): psql $DATABASE_URL -f backend/migrations/20260425120000_svc_foundation.sql

CREATE TABLE IF NOT EXISTS svc_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id   UUID NOT NULL,
  label           TEXT NOT NULL,
  industry        TEXT,
  stage           TEXT,
  funding_status  TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS svc_people (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID REFERENCES svc_sessions(id) ON DELETE CASCADE,
  display_name    TEXT NOT NULL,
  dob             DATE NOT NULL,
  tob             TIME NOT NULL,
  pob_city        TEXT NOT NULL,
  pob_lat         NUMERIC,
  pob_lon         NUMERIC,
  pob_tz          TEXT,
  role_preference TEXT,
  chart_json      JSONB,
  position_index  INT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS svc_results (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID REFERENCES svc_sessions(id) ON DELETE CASCADE,
  rules_version   TEXT NOT NULL,
  result_json     JSONB NOT NULL,
  generated_at    TIMESTAMPTZ DEFAULT now(),
  generation_ms   INT,
  cache_hit       BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS svc_chat_threads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID REFERENCES svc_sessions(id) ON DELETE CASCADE,
  result_id       UUID REFERENCES svc_results(id) ON DELETE CASCADE,
  rules_version   TEXT NOT NULL,
  title           TEXT,
  summary         TEXT,
  message_count   INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  last_message_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS svc_chat_messages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id         UUID REFERENCES svc_chat_threads(id) ON DELETE CASCADE,
  role              TEXT NOT NULL,
  content           TEXT NOT NULL,
  scope_person_ids  UUID[],
  scope_kind        TEXT,
  hypothetical_note TEXT,
  tokens_in         INT,
  tokens_out        INT,
  cache_hit         BOOLEAN DEFAULT FALSE,
  generation_ms     INT,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_svc_people_session    ON svc_people(session_id);
CREATE INDEX IF NOT EXISTS idx_svc_results_session   ON svc_results(session_id, generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_svc_chat_threads_sess ON svc_chat_threads(session_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_svc_chat_msgs_thread  ON svc_chat_messages(thread_id, created_at);
