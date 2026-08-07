/*
# Add RLS policies for couples and profiles

1. Purpose
   Add row-level security policies to the couples and profiles tables so each
   partner can only access their own couple's data and their partner's profile.

2. Security
   - couples: SELECT/UPDATE for any member of the couple; INSERT for any
     authenticated user (first partner creates the couple).
   - profiles: SELECT for own profile, partner's profile, or same-couple
     members; INSERT/UPDATE only for the owner.
*/

-- Couples policies
DROP POLICY IF EXISTS "select_own_couple" ON couples;
CREATE POLICY "select_own_couple" ON couples FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.couple_id = couples.id AND p.id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "update_own_couple" ON couples;
CREATE POLICY "update_own_couple" ON couples FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.couple_id = couples.id AND p.id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.couple_id = couples.id AND p.id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "insert_couple" ON couples;
CREATE POLICY "insert_couple" ON couples FOR INSERT
  TO authenticated WITH CHECK (true);

-- Helper function to read the current user's couple_id without triggering recursive profile policies
CREATE OR REPLACE FUNCTION public.current_user_couple_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cid uuid;
BEGIN
  PERFORM set_config('row_security', 'off', true);
  SELECT couple_id INTO cid FROM public.profiles WHERE id = auth.uid();
  RETURN cid;
END;
$$;

REVOKE ALL ON FUNCTION public.current_user_couple_id() FROM public;
GRANT EXECUTE ON FUNCTION public.current_user_couple_id() TO authenticated;

-- Profiles policies
DROP POLICY IF EXISTS "select_own_and_partner_profile" ON profiles;
CREATE POLICY "select_own_and_partner_profile" ON profiles FOR SELECT
  TO authenticated USING (
    auth.uid() = id
    OR partner_id = auth.uid()
    OR (
      couple_id IS NOT NULL
      AND couple_id = public.current_user_couple_id()
    )
  );

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);