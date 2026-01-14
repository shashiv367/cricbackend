## Cricapp Backend (Node.js / Express)

This is a simple Node.js backend for the Flutter `frontend` app. It is structured using **controllers**, **routes**, and **config** so you can easily extend it.

### Structure

- `src/server.js` – Express app bootstrap and middleware
- `src/routes` – Route definitions (e.g. `healthRoutes`, `authRoutes`, `matchRoutes`)
- `src/controllers` – Request handlers (e.g. `authController`, `matchController`)
- `src/config` – Central configuration (port, Supabase keys, etc.)

### Getting started

1. Install dependencies:

```bash
cd backend
npm install
```

2. Create a `.env` file in `backend` with your Supabase project values (do NOT commit this file to git):

```bash
PORT=4000

# Supabase project settings (server-side)
SUPABASE_URL=https://prxfvwqortyeflsuahkj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_ANON_KEY=your-anon-public-key-here
SUPABASE_JWT_SECRET=your-jwt-secret-here
```

Replace the placeholders with your real keys. Keep this file private.

3. Run in development mode:

```bash
npm run dev
```

The server will start on `http://localhost:4000` (or the `PORT` you set).

### Example endpoints

- `GET /api/health` – Health check
- `POST /api/auth/signup` – Placeholder signup endpoint
- `POST /api/auth/login` – Placeholder login endpoint
- `GET /api/matches` – Placeholder list matches
- `POST /api/matches` – Placeholder create match

You can now gradually move logic from the Flutter app (which currently talks directly to Supabase) into these controllers as needed.

# Ballista Backend (Supabase)

This folder contains the Supabase schema and notes to set up the backend.

## 1) Database schema
- Apply `schema.sql` in the Supabase SQL editor (or via CLI `psql`).
- It creates:
  - Profiles linked to `auth.users`
  - Posts (image/video), likes, saves, comments
  - Teams, players, rankings
  - Matches, match_score, match_events for live scoring
  - RLS policies for public reads and authenticated writes

## 2) Storage
- Create buckets: `post-media` (images/videos), `avatars`.
- Allow authenticated uploads. Public read if desired; otherwise use signed URLs.

## 3) Auth flows
- Email/password: `supabase.auth.signInWithPassword(...)`
- Mobile OTP: `supabase.auth.signInWithOtp(phone: ...)`
- Extend profile data in `profiles`.

## 4) Flutter config
- In `main.dart`, Supabase is initialized. Pass keys via:
  ```
  flutter run --dart-define=SUPABASE_URL=... --dart-define=SUPABASE_ANON_KEY=...
  ```
  (Do not hardcode secrets; rotate if exposed.)

## 5) Wiring (high level)
- Posts: upload to `post-media`, then insert into `posts`.
- Feed: `select * from posts order by created_at desc`.
- Likes/saves/comments: insert into `post_likes` / `post_saves` / `post_comments`.
- Matches: insert into `matches` + `match_score`; update scores in `match_score`; commentary in `match_events`.
- Teams/players: seed teams/players; rankings from `teams.ranking`.

Adjust policies/roles as needed for stricter access.***

