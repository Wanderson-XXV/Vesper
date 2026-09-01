CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('student', 'mentor', 'admin')) DEFAULT 'student',
  must_change_password boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS team_members (
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  member_role text NOT NULL CHECK (member_role IN ('student', 'mentor')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, user_id)
);

CREATE TABLE IF NOT EXISTS investigator_profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  preferred_language text NOT NULL DEFAULT 'java',
  xp integer NOT NULL DEFAULT 0 CHECK (xp >= 0),
  level integer NOT NULL DEFAULT 1 CHECK (level >= 1),
  field_marks integer NOT NULL DEFAULT 0 CHECK (field_marks >= 0),
  appearance jsonb NOT NULL DEFAULT '{"portraitFrame":"portrait_frame_default"}'::jsonb,
  relationships jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS case_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  case_id text NOT NULL,
  content_version text NOT NULL,
  route_id text NOT NULL,
  language_id text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  ending_id text,
  started_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  archived_at timestamptz,
  attempt_number integer NOT NULL DEFAULT 1 CHECK (attempt_number >= 1),
  revision bigint NOT NULL DEFAULT 0 CHECK (revision >= 0),
  UNIQUE (user_id, case_id, route_id, attempt_number)
);

CREATE TABLE IF NOT EXISTS story_events (
  id bigserial PRIMARY KEY,
  run_id uuid NOT NULL REFERENCES case_runs(id) ON DELETE CASCADE,
  client_event_id text NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (run_id, client_event_id)
);

CREATE TABLE IF NOT EXISTS ritual_attempts (
  id bigserial PRIMARY KEY,
  run_id uuid NOT NULL REFERENCES case_runs(id) ON DELETE CASCADE,
  challenge_id text NOT NULL,
  input jsonb NOT NULL,
  submitted text NOT NULL,
  correct boolean NOT NULL,
  hint_level integer NOT NULL DEFAULT 0,
  attempt_no integer NOT NULL,
  client_attempt_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Migrações idempotentes para bancos criados antes do histórico de execuções.
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;
ALTER TABLE case_runs ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TABLE case_runs ADD COLUMN IF NOT EXISTS attempt_number integer NOT NULL DEFAULT 1;
ALTER TABLE case_runs ADD COLUMN IF NOT EXISTS revision bigint NOT NULL DEFAULT 0;
ALTER TABLE ritual_attempts ADD COLUMN IF NOT EXISTS client_attempt_id text;
ALTER TABLE case_runs DROP CONSTRAINT IF EXISTS case_runs_user_id_case_id_route_id_key;

CREATE TABLE IF NOT EXISTS reward_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_key text NOT NULL,
  xp integer NOT NULL DEFAULT 0,
  field_marks integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, source_key)
);

CREATE TABLE IF NOT EXISTS cosmetic_unlocks (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cosmetic_id text NOT NULL,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, cosmetic_id)
);

CREATE INDEX IF NOT EXISTS case_runs_user_status_idx ON case_runs(user_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS case_runs_attempt_unique_idx ON case_runs(user_id,case_id,route_id,attempt_number);
CREATE UNIQUE INDEX IF NOT EXISTS case_runs_one_active_idx ON case_runs(user_id,case_id,route_id) WHERE status='active';
CREATE INDEX IF NOT EXISTS ritual_attempts_run_challenge_idx ON ritual_attempts(run_id, challenge_id);
CREATE UNIQUE INDEX IF NOT EXISTS ritual_attempts_client_unique_idx ON ritual_attempts(run_id,client_attempt_id) WHERE client_attempt_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS team_members_user_idx ON team_members(user_id);

ALTER TABLE investigator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ritual_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE investigator_profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE case_runs FORCE ROW LEVEL SECURITY;
ALTER TABLE story_events FORCE ROW LEVEL SECURITY;
ALTER TABLE ritual_attempts FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profile_scope ON investigator_profiles;
CREATE POLICY profile_scope ON investigator_profiles
USING (
  user_id = nullif(current_setting('app.user_id', true), '')::uuid
  OR EXISTS (
    SELECT 1 FROM team_members mentor_membership
    JOIN team_members student_membership ON student_membership.team_id = mentor_membership.team_id
    WHERE mentor_membership.user_id = nullif(current_setting('app.user_id', true), '')::uuid
      AND mentor_membership.member_role = 'mentor'
      AND student_membership.user_id = investigator_profiles.user_id
  )
);

DROP POLICY IF EXISTS run_scope ON case_runs;
CREATE POLICY run_scope ON case_runs USING (
  user_id = nullif(current_setting('app.user_id', true), '')::uuid
  OR EXISTS (
    SELECT 1 FROM team_members mentor_membership
    JOIN team_members student_membership ON student_membership.team_id = mentor_membership.team_id
    WHERE mentor_membership.user_id = nullif(current_setting('app.user_id', true), '')::uuid
      AND mentor_membership.member_role = 'mentor'
      AND student_membership.user_id = case_runs.user_id
  )
);

DROP POLICY IF EXISTS event_scope ON story_events;
CREATE POLICY event_scope ON story_events USING (
  EXISTS (SELECT 1 FROM case_runs WHERE case_runs.id = story_events.run_id)
);

DROP POLICY IF EXISTS attempt_scope ON ritual_attempts;
CREATE POLICY attempt_scope ON ritual_attempts USING (
  EXISTS (SELECT 1 FROM case_runs WHERE case_runs.id = ritual_attempts.run_id)
);
