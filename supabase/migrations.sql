-- Ship Database Schema

-- Users (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT NOT NULL,
  username TEXT UNIQUE,
  age INTEGER NOT NULL CHECK (age >= 13 AND age <= 19),
  bio TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  email_digest BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seasons
CREATE TABLE IF NOT EXISTS seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cohorts (users in a season)
CREATE TABLE IF NOT EXISTS cohorts (
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (season_id, user_id)
);

-- Builds
CREATE TABLE IF NOT EXISTS builds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL CHECK (category IN ('code', 'design', 'writing', 'hardware', 'ai', 'other')),
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'building', 'testing', 'shipped')),
  season_id UUID REFERENCES seasons(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  shipped_at TIMESTAMPTZ
);

-- Daily logs (one per build per day)
CREATE TABLE IF NOT EXISTS logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  build_id UUID NOT NULL REFERENCES builds(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (build_id, log_date)
);

-- Endorsements (manual, added by founder)
CREATE TABLE IF NOT EXISTS endorsements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  build_id UUID NOT NULL REFERENCES builds(id) ON DELETE CASCADE,
  endorser_name TEXT NOT NULL,
  comment TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_builds_user_id ON builds(user_id);
CREATE INDEX IF NOT EXISTS idx_builds_season_id ON builds(season_id);
CREATE INDEX IF NOT EXISTS idx_builds_status ON builds(status);
CREATE INDEX IF NOT EXISTS idx_logs_build_id ON logs(build_id);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at);
CREATE INDEX IF NOT EXISTS idx_cohorts_season_id ON cohorts(season_id);


-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE builds ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE endorsements ENABLE ROW LEVEL SECURITY;

-- Profiles
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Builds
DROP POLICY IF EXISTS "Anyone can view shipped builds" ON builds;
CREATE POLICY "Anyone can view shipped builds"
  ON builds FOR SELECT
  USING (status = 'shipped' OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create builds" ON builds;
CREATE POLICY "Users can create builds"
  ON builds FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own builds" ON builds;
CREATE POLICY "Users can update own builds"
  ON builds FOR UPDATE
  USING (auth.uid() = user_id AND status != 'shipped');

DROP POLICY IF EXISTS "Users can delete own builds" ON builds;
CREATE POLICY "Users can delete own builds"
  ON builds FOR DELETE
  USING (auth.uid() = user_id);

-- Logs
DROP POLICY IF EXISTS "Anyone can view logs of shipped builds" ON logs;
CREATE POLICY "Anyone can view logs of shipped builds"
  ON logs FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM builds WHERE builds.id = logs.build_id AND (builds.status = 'shipped' OR builds.user_id = auth.uid()))
  );

DROP POLICY IF EXISTS "Users can create logs on own builds" ON logs;
CREATE POLICY "Users can create logs on own builds"
  ON logs FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM builds WHERE builds.id = logs.build_id AND builds.user_id = auth.uid() AND builds.status != 'shipped')
  );

DROP POLICY IF EXISTS "Users can update own logs within 24h" ON logs;
CREATE POLICY "Users can update own logs within 24h"
  ON logs FOR UPDATE
  USING (
    auth.uid() IN (SELECT user_id FROM builds WHERE builds.id = logs.build_id)
    AND created_at > NOW() - INTERVAL '24 hours'
  );

-- Seasons
DROP POLICY IF EXISTS "Anyone can view seasons" ON seasons;
CREATE POLICY "Anyone can view seasons"
  ON seasons FOR SELECT
  USING (true);

-- Cohorts
DROP POLICY IF EXISTS "Anyone can view cohorts" ON cohorts;
CREATE POLICY "Anyone can view cohorts"
  ON cohorts FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can join cohorts" ON cohorts;
CREATE POLICY "Users can join cohorts"
  ON cohorts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Endorsements
DROP POLICY IF EXISTS "Anyone can view endorsements" ON endorsements;
CREATE POLICY "Anyone can view endorsements"
  ON endorsements FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Only founder can add endorsements" ON endorsements;
CREATE POLICY "Only founder can add endorsements"
  ON endorsements FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT user_id FROM builds WHERE builds.id = build_id));

-- Insert default season
INSERT INTO seasons (name, start_date, end_date, is_active)
VALUES ('Season 1', CURRENT_DATE, CURRENT_DATE + INTERVAL '12 weeks', true)
ON CONFLICT DO NOTHING;
