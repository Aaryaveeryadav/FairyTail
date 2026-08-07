# Virtual Couple Space Web App

This repository is a Vite React web application with a Supabase backend. It is designed as a private shared space for long-distance couples.

## What this project includes

- Authentication and profile linking
- Partner linking via invite code
- Shared dashboard with relationship timer and greetings
- Chat with text, stickers, photo uploads, and voice note uploads
- Memory album for photos, videos, and notes
- Shared calendar and event planner
- Live location sharing with battery and map preview
- Couple features like mood tracker, love letters, and daily questions
- YouTube watch together support

## How to run locally

1. Install dependencies:

```bash
npm install
```

2. Create a `.env.local` file in the project root with your Supabase values:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

This repo already includes a `.env.local` file with the current Supabase project settings.

3. Start the development server:

```bash
npm run dev
```

4. Open the URL shown by Vite in your browser.

## Supabase setup

This app expects the Supabase database schema and security policies to be configured for the `profiles`, `couples`, `locations`, `messages`, `memories`, `calendar_events`, and other feature tables.

The following SQL files are included:

- `supabase/migrations/20260731152334_create_couples_and_profiles_schema.sql`
- `supabase/migrations/20260731152436_create_feature_tables.sql`
- `supabase/migrations/20260731153030_create_storage_buckets.sql`
- `supabase/migrations/20260731152348_add_couples_profiles_policies.sql`
- `create_rpc.sql`

Run those SQL scripts in your Supabase SQL editor to create the required tables, storage buckets, RPC functions, and row-level security policies.

> If you see Supabase errors like `infinite recursion detected in policy for relation "profiles"` or SQL syntax errors when running migration functions, make sure you have applied the latest `create_rpc.sql` and `supabase/migrations/20260731152348_add_couples_profiles_policies.sql` scripts exactly as provided.

## Important note

The current app is a web-based Vite React project, not a full React Native mobile app or a full multi-service platform. It already contains many of the shared couple features, but it does not yet include advanced integrations such as Netflix sync, Spotify syncing, full video calling, or a separate mobile frontend.

If you want, I can continue building the next functionality from this current web app, such as improving real-time partner linking, handling Supabase join failures, or adding more of the long-distance relationship features listed in your product plan.
