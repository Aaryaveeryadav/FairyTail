/*
# Create couples and profiles tables (schema only)

1. Purpose
   Establishes the foundation for a private two-person relationship space.
   Each "couple" represents a linked pair of users. Each user has a profile
   that links them to a couple and stores their display name and avatar.

2. New Tables
   - `couples`: represents a linked pair. Stores the relationship start date,
     anniversary, invite code, and shared theme settings.
   - `profiles`: one row per authenticated user. Stores display name, avatar URL,
     couple membership, and partner reference.

3. Notes
   - Tables are created first without policies to resolve the circular reference
     (profiles FK -> couples, couples policies -> profiles subquery).
   - RLS is enabled immediately; policies are added in the next migration.
*/

CREATE TABLE IF NOT EXISTS couples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  anniversary_date date,
  invite_code text UNIQUE NOT NULL,
  theme jsonb NOT NULL DEFAULT '{"primary": "#e11d48", "accent": "#fb7185"}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  avatar_url text,
  couple_id uuid REFERENCES couples(id) ON DELETE SET NULL,
  partner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_profiles_couple_id ON profiles(couple_id);