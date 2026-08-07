-- Ensure required extensions and tables exist (creates minimal schema used by the app)
-- WARNING: Only run this if you are happy for these tables to be created in your database.

create extension if not exists pgcrypto;

-- Minimal couples table used by the app
create table if not exists public.couples (
  id uuid primary key default gen_random_uuid(),
  invite_code text unique not null,
  start_date date,
  anniversary_date date,
  invite_active boolean default true,
  theme jsonb,
  created_at timestamptz default now()
);

-- Minimal profiles table used by the app
create table if not exists public.profiles (
  id uuid primary key,
  display_name text,
  avatar_url text,
  couple_id uuid references public.couples(id) on delete set null,
  partner_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RPC to join a couple by invite code and safely update partner links
-- Run this in Supabase SQL editor or psql. Adjust schema/table names if different.

create or replace function public.rpc_join_couple(invite_code_text text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
  c record;
  other_id uuid;
  normalized_code text := upper(trim(invite_code_text));
begin
  perform set_config('row_security', 'off', true);
  if caller_id is null then
    return jsonb_build_object('status','error','message','not_authenticated');
  end if;

  if normalized_code = '' then
    return jsonb_build_object('status','error','message','invalid_code');
  end if;

  -- find the couple by invite code
  select * into c
  from couples
  where invite_code = normalized_code
  limit 1;

  if not found then
    return jsonb_build_object('status','error','message','no_couple_found');
  end if;

  -- find any other profile already attached to this couple
  select id into other_id
  from profiles
  where couple_id = c.id
    and id <> caller_id
  limit 1;

  -- update the caller's profile to join the couple and set partner_id if partner exists
  update profiles
  set couple_id = c.id,
      partner_id = case when other_id is not null then other_id else partner_id end,
      updated_at = now()
  where id = caller_id;

  -- if a partner already existed, update their partner_id to point to the caller
  if other_id is not null then
    update profiles
    set partner_id = caller_id,
        updated_at = now()
    where id = other_id;
    return jsonb_build_object(
      'status','ok',
      'message','paired',
      'invite_code', normalized_code,
      'partner_id', other_id::text
    );
  else
    -- no other partner yet — caller joined the couple; partner will be discovered later
    return jsonb_build_object(
      'status','ok',
      'message','joined_space',
      'invite_code', normalized_code
    );
  end if;

exception when others then
  return jsonb_build_object('status','error','message', sqlerrm);
end;
$$;

-- Restrict execute and grant to authenticated role
revoke all on function public.rpc_join_couple(text) from public;
grant execute on function public.rpc_join_couple(text) to authenticated;

-- Minimal recommended RLS policies for profiles (run these only if your existing policies differ — adapt names as needed)

-- enable RLS if not already enabled
alter table if exists public.profiles enable row level security;

-- helper function to read the current user's couple_id without causing recursive policy evaluation
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

-- Allow selecting own profile
DROP POLICY IF EXISTS profiles_select_self ON public.profiles;
CREATE POLICY profiles_select_self ON public.profiles
  FOR SELECT
  USING ( auth.uid() = id );

-- Allow selecting other profiles in the same couple
DROP POLICY IF EXISTS profiles_select_same_couple ON public.profiles;
CREATE POLICY profiles_select_same_couple ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = id
    OR partner_id = auth.uid()
    OR (
      couple_id IS NOT NULL
      AND couple_id = public.current_user_couple_id()
    )
  );

-- Allow users to update only their own row
DROP POLICY IF EXISTS profiles_update_self ON public.profiles;
CREATE POLICY profiles_update_self ON public.profiles
  FOR UPDATE
  USING ( auth.uid() = id )
  WITH CHECK ( auth.uid() = id );

-- Allow users to insert their own profile rows
DROP POLICY IF EXISTS profiles_insert_self ON public.profiles;
CREATE POLICY profiles_insert_self ON public.profiles
  FOR INSERT
  WITH CHECK ( auth.uid() = id );

-- OPTIONAL: change function owner for extra hardening (uncomment if you control DB owner role)
-- alter function public.rpc_join_couple(text) owner to postgres;

-- RPC to create a couple and attach the calling user to it atomically
create or replace function public.rpc_create_couple(invite_code_text text, start_date_text text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
  normalized_code text := upper(trim(invite_code_text));
  sid date := null;
  inserted record;
begin
  if caller_id is null then
    return jsonb_build_object('status','error','message','not_authenticated');
  end if;

  if normalized_code = '' then
    return jsonb_build_object('status','error','message','invalid_code');
  end if;

  -- normalize start_date if provided (expect YYYY-MM-DD or null)
  if start_date_text is not null and start_date_text <> '' then
    -- simple validation: try cast to date
    begin
      sid := start_date_text::date;
    exception when others then
      return jsonb_build_object('status','error','message','invalid_start_date');
    end;
  end if;

  -- insert couple
  insert into couples (invite_code, start_date, created_at)
  values (normalized_code, sid, now())
  returning * into inserted;

  if not found then
    return jsonb_build_object('status','error','message','failed_create');
  end if;

  -- attach caller's profile to the couple
  update profiles
  set couple_id = inserted.id,
      updated_at = now()
  where id = caller_id;

  return jsonb_build_object('status','ok','message','created','invite_code', normalized_code, 'couple_id', inserted.id::text);

exception when others then
  return jsonb_build_object('status','error','message', sqlerrm);
end;
$$;

revoke all on function public.rpc_create_couple(text, text) from public;
grant execute on function public.rpc_create_couple(text, text) to authenticated;