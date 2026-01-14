# Database Setup Instructions

## Quick Setup

1. **Open Supabase Dashboard**
   - Go to your Supabase project: https://prxfvwqortyeflsuahkj.supabase.co
   - Navigate to **SQL Editor**

2. **Run the Schema**
   - Copy the entire contents of `schema.sql`
   - Paste into the SQL Editor
   - Click **Run** (or press Ctrl+Enter)

3. **Verify Tables**
   - Go to **Table Editor** in Supabase
   - You should see these tables:
     - `profiles`
     - `teams`
     - `locations`
     - `matches`
     - `match_score`
     - `match_player_stats`

## Table Descriptions

### `profiles`
- Extends Supabase `auth.users` with role and profile information
- **Columns:**
  - `id` (UUID, FK to auth.users)
  - `full_name` (TEXT)
  - `username` (TEXT, usually email)
  - `phone` (TEXT)
  - `role` (TEXT: 'user', 'player', or 'umpire')
  - `created_at`, `updated_at` (timestamps)

### `teams`
- Stores cricket teams
- **Columns:**
  - `id` (UUID, primary key)
  - `name` (TEXT, unique)
  - `created_at`, `updated_at` (timestamps)

### `locations`
- Stores match venues/locations
- **Columns:**
  - `id` (UUID, primary key)
  - `name` (TEXT)
  - `address`, `city`, `state`, `country` (TEXT, optional)
  - `created_at`, `updated_at` (timestamps)

### `matches`
- Stores cricket matches
- **Columns:**
  - `id` (UUID, primary key)
  - `team_a`, `team_b` (UUID, FK to teams)
  - `venue` (UUID, FK to locations, optional)
  - `overs` (INTEGER, default 20)
  - `status` (TEXT: 'live', 'completed', 'cancelled', 'scheduled')
  - `created_by` (UUID, FK to auth.users, umpire who created)
  - `start_date`, `end_date` (TIMESTAMP, optional)
  - `created_at`, `updated_at` (timestamps)

### `match_score`
- Stores live/current score for each match
- **Columns:**
  - `id` (UUID, primary key)
  - `match_id` (UUID, FK to matches, unique)
  - `team_a_score`, `team_a_wkts`, `team_a_overs` (INTEGER, INTEGER, DECIMAL)
  - `team_b_score`, `team_b_wkts`, `team_b_overs` (INTEGER, INTEGER, DECIMAL)
  - `target` (INTEGER, optional - for run chases)
  - `created_at`, `updated_at` (timestamps)

### `match_player_stats`
- Stores individual player statistics per match
- **Columns:**
  - `id` (UUID, primary key)
  - `match_id` (UUID, FK to matches)
  - `team_id` (UUID, FK to teams)
  - `player_id` (UUID, FK to profiles, optional - if player is registered)
  - `player_name` (TEXT, optional - for unregistered players)
  - `runs`, `balls`, `fours`, `sixes` (INTEGER, batting stats)
  - `wickets`, `overs` (INTEGER, DECIMAL, bowling stats)
  - `created_at`, `updated_at` (timestamps)

## Security (RLS Policies)

All tables have Row Level Security (RLS) enabled:

- **Profiles**: Anyone can view, users can update their own
- **Teams**: Anyone can view, authenticated users can create
- **Locations**: Anyone can view, authenticated users can create
- **Matches**: Anyone can view, only umpires can create/update
- **Match Score**: Anyone can view, only umpires can update
- **Player Stats**: Anyone can view, only umpires can manage

## Automatic Features

1. **Auto Profile Creation**: When a user signs up via Supabase Auth, a profile is automatically created via trigger
2. **Auto Timestamps**: `updated_at` columns are automatically updated on row changes
3. **Indexes**: Performance indexes are created on frequently queried columns

## Testing the Schema

After running the schema, you can test with these queries:

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public';
```

## Troubleshooting

### If tables already exist
If you get "relation already exists" errors:
1. Drop existing tables first (in reverse order of dependencies):
```sql
DROP TABLE IF EXISTS match_player_stats CASCADE;
DROP TABLE IF EXISTS match_score CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
```
2. Then run `schema.sql` again

### If policies already exist
If you get "policy already exists" errors:
- The script uses `CREATE POLICY IF NOT EXISTS` where possible
- For existing policies, you may need to drop them first or modify the script

### If triggers already exist
- Drop triggers first if needed:
```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
-- etc.
```







