/*
# Create feature tables: messages, memories, calendar, moods, goals, love letters, daily questions, locations

1. Purpose
   Creates all the feature tables that store the shared couple data: chat
   messages, memory album entries, calendar events, mood check-ins,
   relationship goals, love letters, daily question answers, and live
   location updates.

2. New Tables
   - messages: chat messages between partners (text, photo, voice, sticker, gif)
   - memories: memory album entries (photo, video, note, voice message)
   - calendar_events: shared calendar events (schedules, birthdays, date plans, reminders)
   - moods: daily mood check-ins per partner
   - goals: relationship goals with completion status
   - love_letters: sealed letters with an open-on date
   - daily_answers: answers to the daily question from each partner
   - locations: live location sharing (lat, lng, battery, updated_at)

3. Security
   - All tables have RLS enabled.
   - All access is scoped to couple membership: a user can only read/write rows
     that belong to their couple (verified via profiles.couple_id).
   - Each table has 4 policies (SELECT, INSERT, UPDATE, DELETE) scoped to
     authenticated users who are members of the same couple.

4. Notes
   - `sender_id` / `author_id` columns default to auth.uid() so inserts that
     omit them still satisfy the INSERT WITH CHECK.
   - Messages support multiple types via the `type` column and a flexible
     `content` jsonb column (for sticker id, gif url, photo path, etc.).
   - Memories store file paths (Supabase Storage) in `file_url`.
   - Locations store battery_level as integer percentage.
*/

-- Helper: a reusable predicate that checks the current user is a member of
-- the couple that owns a given row. We inline this in each policy since
-- Postgres RLS does not support user-defined functions in USING by default
-- without SECURITY DEFINER, and we want the check to be explicit per table.

-- ============ messages ============
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'text', -- text | photo | voice | sticker | gif
  content text, -- text body, or sticker id, or gif url
  file_url text, -- storage path for photo/voice
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_messages_couple_created ON messages(couple_id, created_at);

DROP POLICY IF EXISTS "select_couple_messages" ON messages;
CREATE POLICY "select_couple_messages" ON messages FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.couple_id = messages.couple_id AND p.id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_couple_messages" ON messages;
CREATE POLICY "insert_couple_messages" ON messages FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.couple_id = messages.couple_id AND p.id = auth.uid())
  );

DROP POLICY IF EXISTS "update_couple_messages" ON messages;
CREATE POLICY "update_couple_messages" ON messages FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.couple_id = messages.couple_id AND p.id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.couple_id = messages.couple_id AND p.id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_couple_messages" ON messages;
CREATE POLICY "delete_couple_messages" ON messages FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.couple_id = messages.couple_id AND p.id = auth.uid())
  );

-- ============ memories ============
CREATE TABLE IF NOT EXISTS memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  author_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'photo', -- photo | video | note | voice
  title text,
  description text,
  file_url text,
  memory_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_memories_couple_date ON memories(couple_id, memory_date);

DROP POLICY IF EXISTS "select_couple_memories" ON memories;
CREATE POLICY "select_couple_memories" ON memories FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.couple_id = memories.couple_id AND p.id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_couple_memories" ON memories;
CREATE POLICY "insert_couple_memories" ON memories FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.couple_id = memories.couple_id AND p.id = auth.uid())
  );

DROP POLICY IF EXISTS "update_couple_memories" ON memories;
CREATE POLICY "update_couple_memories" ON memories FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.couple_id = memories.couple_id AND p.id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.couple_id = memories.couple_id AND p.id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_couple_memories" ON memories;
CREATE POLICY "delete_couple_memories" ON memories FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.couple_id = memories.couple_id AND p.id = auth.uid())
  );

-- ============ calendar_events ============
CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  author_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  event_time time,
  type text NOT NULL DEFAULT 'plan', -- plan | birthday | reminder | schedule
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_calendar_couple_date ON calendar_events(couple_id, event_date);

DROP POLICY IF EXISTS "select_couple_events" ON calendar_events;
CREATE POLICY "select_couple_events" ON calendar_events FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.couple_id = calendar_events.couple_id AND p.id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_couple_events" ON calendar_events;
CREATE POLICY "insert_couple_events" ON calendar_events FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.couple_id = calendar_events.couple_id AND p.id = auth.uid())
  );

DROP POLICY IF EXISTS "update_couple_events" ON calendar_events;
CREATE POLICY "update_couple_events" ON calendar_events FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.couple_id = calendar_events.couple_id AND p.id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.couple_id = calendar_events.couple_id AND p.id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_couple_events" ON calendar_events;
CREATE POLICY "delete_couple_events" ON calendar_events FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.couple_id = calendar_events.couple_id AND p.id = auth.uid())
  );

-- ============ moods ============
CREATE TABLE IF NOT EXISTS moods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  mood text NOT NULL, -- happy | loved | sad | anxious | angry | excited | tired | neutral
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE moods ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_moods_couple_created ON moods(couple_id, created_at);

DROP POLICY IF EXISTS "select_couple_moods" ON moods;
CREATE POLICY "select_couple_moods" ON moods FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.couple_id = moods.couple_id AND p.id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_couple_moods" ON moods;
CREATE POLICY "insert_couple_moods" ON moods FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.couple_id = moods.couple_id AND p.id = auth.uid())
  );

DROP POLICY IF EXISTS "update_couple_moods" ON moods;
CREATE POLICY "update_couple_moods" ON moods FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.couple_id = moods.couple_id AND p.id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.couple_id = moods.couple_id AND p.id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_couple_moods" ON moods;
CREATE POLICY "delete_couple_moods" ON moods FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.couple_id = moods.couple_id AND p.id = auth.uid())
  );

-- ============ goals ============
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  author_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  completed boolean NOT NULL DEFAULT false,
  target_date date,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_goals_couple ON goals(couple_id);

DROP POLICY IF EXISTS "select_couple_goals" ON goals;
CREATE POLICY "select_couple_goals" ON goals FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.couple_id = goals.couple_id AND p.id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_couple_goals" ON goals;
CREATE POLICY "insert_couple_goals" ON goals FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.couple_id = goals.couple_id AND p.id = auth.uid())
  );

DROP POLICY IF EXISTS "update_couple_goals" ON goals;
CREATE POLICY "update_couple_goals" ON goals FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.couple_id = goals.couple_id AND p.id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.couple_id = goals.couple_id AND p.id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_couple_goals" ON goals;
CREATE POLICY "delete_couple_goals" ON goals FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.couple_id = goals.couple_id AND p.id = auth.uid())
  );

-- ============ love_letters ============
CREATE TABLE IF NOT EXISTS love_letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  author_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  open_on date NOT NULL,
  opened_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE love_letters ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_letters_couple ON love_letters(couple_id, open_on);

DROP POLICY IF EXISTS "select_couple_letters" ON love_letters;
CREATE POLICY "select_couple_letters" ON love_letters FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.couple_id = love_letters.couple_id AND p.id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_couple_letters" ON love_letters;
CREATE POLICY "insert_couple_letters" ON love_letters FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.couple_id = love_letters.couple_id AND p.id = auth.uid())
  );

DROP POLICY IF EXISTS "update_couple_letters" ON love_letters;
CREATE POLICY "update_couple_letters" ON love_letters FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.couple_id = love_letters.couple_id AND p.id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.couple_id = love_letters.couple_id AND p.id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_couple_letters" ON love_letters;
CREATE POLICY "delete_couple_letters" ON love_letters FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.couple_id = love_letters.couple_id AND p.id = auth.uid())
  );

-- ============ daily_answers ============
CREATE TABLE IF NOT EXISTS daily_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  question_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE daily_answers ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_answers_couple_date ON daily_answers(couple_id, question_date);

DROP POLICY IF EXISTS "select_couple_answers" ON daily_answers;
CREATE POLICY "select_couple_answers" ON daily_answers FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.couple_id = daily_answers.couple_id AND p.id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_couple_answers" ON daily_answers;
CREATE POLICY "insert_couple_answers" ON daily_answers FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.couple_id = daily_answers.couple_id AND p.id = auth.uid())
  );

DROP POLICY IF EXISTS "update_couple_answers" ON daily_answers;
CREATE POLICY "update_couple_answers" ON daily_answers FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.couple_id = daily_answers.couple_id AND p.id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.couple_id = daily_answers.couple_id AND p.id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_couple_answers" ON daily_answers;
CREATE POLICY "delete_couple_answers" ON daily_answers FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.couple_id = daily_answers.couple_id AND p.id = auth.uid())
  );

-- ============ locations ============
CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  battery_level integer,
  sharing_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_locations_couple ON locations(couple_id, user_id);

DROP POLICY IF EXISTS "select_couple_locations" ON locations;
CREATE POLICY "select_couple_locations" ON locations FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.couple_id = locations.couple_id AND p.id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_couple_locations" ON locations;
CREATE POLICY "insert_couple_locations" ON locations FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.couple_id = locations.couple_id AND p.id = auth.uid())
  );

DROP POLICY IF EXISTS "update_couple_locations" ON locations;
CREATE POLICY "update_couple_locations" ON locations FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.couple_id = locations.couple_id AND p.id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.couple_id = locations.couple_id AND p.id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_couple_locations" ON locations;
CREATE POLICY "delete_couple_locations" ON locations FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.couple_id = locations.couple_id AND p.id = auth.uid())
  );