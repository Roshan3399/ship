# RoshanBuild — $0 Stack Architecture

## Stack Overview
- **Database**: Supabase Free Tier (500MB, 50K MAU)
- **Auth**: Supabase Auth (email/password)
- **Storage**: Supabase Storage (1GB free)
- **Hosting**: Vercel (Hobby)
- **Domain**: `roshan-ship.vercel.app`

## Convention Notes
- Next.js 16 App Router — use `proxy.ts` not `middleware.ts`
- Route handler params are Promises: `const { id } = await params`
- Supabase client in `lib/supabase/*.ts`
- All colors use Tailwind's neutral scale on dark background (neutral-950 bg, neutral-100 text, neutral-400/500/600/700/800 for hierarchy)
- Inter font from Google Fonts
- Dark mode only — no light mode toggle
- "Ship" brand: minimal, geometric. No emojis, no animations, no infinite scroll, no likes/comments

## Database (Supabase)
- **Project**: `grswuuwvvwjxryurilpq`
- **Tables**: profiles, builds, logs, seasons, cohorts, endorsements
- **Key constraints**: `UNIQUE (build_id, log_date)` on logs, age CHECK (13-19) on profiles
- **RLS**: Row-level security enabled on all tables; policies for read/write based on auth.uid()
- **Migration file**: `supabase/migrations.sql` (idempotent — uses CREATE TABLE IF NOT EXISTS and DROP POLICY IF EXISTS)
- **Service role key**: stored in `.env.local` as `SUPABASE_SERVICE_ROLE_KEY`

## Pages
- `/` — Landing page: hero, how-it-works, reputation formula, FAQ, CTA
- `/login` — Email/password auth (log in + create account)
- `/dashboard` — Morning mission view: streak, active build, yesterday's log, today's goal, cohort feed
- `/builds/new` — Create a build form (title, category, description)
- `/builds/[id]` — Build detail: log history, ship button, streak
- `/profile/[username]` — Public profile: builds, streak, reputation (server component)
- `/season` — Season info and cohort builder list with streaks

## API Routes
- `GET/POST /api/builds` — List/create builds
- `GET/PATCH/DELETE /api/builds/[id]` — Read/update/delete a build
- `POST /api/logs` — Create a log
- `PATCH/DELETE /api/logs/[id]` — Update/delete a log
- `GET /auth/callback` — OAuth callback handler

## Reputation Formula (hard-coded)
- 70% completed projects ratio
- 20% peer endorsements
- 10% consistency (streaks)

## Key Rules
- One log per build per day (enforced by DB UNIQUE constraint on build_id + log_date)
- Logs cannot be edited after 24 hours (RLS policy)
- "Ship It" is irreversible — status changes to 'shipped'
- Streak resets to 0 if a day is missed
- Season auto-assigned on build creation

## Status
- Build: compiles clean (Next.js 16, Turbopack)
- Database: fully migrated with all tables, indexes, policies, and default Season 1
- Deployed at: https://roshan-ship.vercel.app
- Old aliases removed: roshanbuild.vercel.app, brief-roshan.vercel.app
