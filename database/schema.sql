-- Cricapp Database Schema
-- Run this SQL in your Supabase SQL Editor

-- ============================================
-- PROFILES TABLE


CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  username TEXT,
  phone TEXT,
  role TEXT CHECK (role IN ('user', 'player', 'umpire')) DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TEAMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- LOCATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- MATCHES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_a UUID REFERENCES teams(id) ON DELETE SET NULL,
  team_b UUID REFERENCES teams(id) ON DELETE SET NULL,
  venue UUID REFERENCES locations(id) ON DELETE SET NULL,
  overs INTEGER DEFAULT 20,
  status TEXT DEFAULT 'live' CHECK (status IN ('live', 'completed', 'cancelled', 'scheduled')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- MATCH SCORE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS match_score (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  team_a_score INTEGER DEFAULT 0,
  team_a_wkts INTEGER DEFAULT 0,
  team_a_overs DECIMAL(5,1) DEFAULT 0,
  team_b_score INTEGER DEFAULT 0,
  team_b_wkts INTEGER DEFAULT 0,
  team_b_overs DECIMAL(5,1) DEFAULT 0,
  target INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(match_id)
);

-- ============================================
-- MATCH PLAYER STATS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS match_player_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  player_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  player_name TEXT,
  runs INTEGER DEFAULT 0,
  balls INTEGER DEFAULT 0,
  fours INTEGER DEFAULT 0,
  sixes INTEGER DEFAULT 0,
  wickets INTEGER DEFAULT 0,
  overs DECIMAL(5,1) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_created_by ON matches(created_by);
CREATE INDEX IF NOT EXISTS idx_matches_team_a ON matches(team_a);
CREATE INDEX IF NOT EXISTS idx_matches_team_b ON matches(team_b);
CREATE INDEX IF NOT EXISTS idx_match_score_match_id ON match_score(match_id);
CREATE INDEX IF NOT EXISTS idx_match_player_stats_match_id ON match_player_stats(match_id);
CREATE INDEX IF NOT EXISTS idx_match_player_stats_player_id ON match_player_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_match_player_stats_team_id ON match_player_stats(team_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_score ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_player_stats ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - PROFILES
-- ============================================
-- Anyone can view profiles
CREATE POLICY "Anyone can view profiles" ON profiles
  FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- RLS POLICIES - TEAMS
-- ============================================
-- Anyone can view teams
CREATE POLICY "Anyone can view teams" ON teams
  FOR SELECT USING (true);

-- Authenticated users can create teams
CREATE POLICY "Authenticated users can create teams" ON teams
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- RLS POLICIES - LOCATIONS
-- ============================================
-- Anyone can view locations
CREATE POLICY "Anyone can view locations" ON locations
  FOR SELECT USING (true);

-- Authenticated users can create locations
CREATE POLICY "Authenticated users can create locations" ON locations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- RLS POLICIES - MATCHES
-- ============================================
-- Anyone can view matches
CREATE POLICY "Anyone can view matches" ON matches
  FOR SELECT USING (true);

-- Umpires can create matches
CREATE POLICY "Umpires can create matches" ON matches
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'umpire'
    )
  );

-- Umpires can update their own matches
CREATE POLICY "Umpires can update own matches" ON matches
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'umpire'
    ) AND created_by = auth.uid()
  );

-- ============================================
-- RLS POLICIES - MATCH SCORE
-- ============================================
-- Anyone can view match scores
CREATE POLICY "Anyone can view match scores" ON match_score
  FOR SELECT USING (true);

-- Umpires can insert match scores
CREATE POLICY "Umpires can insert match scores" ON match_score
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'umpire'
    )
  );

-- Umpires can update match scores
CREATE POLICY "Umpires can update match scores" ON match_score
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'umpire'
    )
  );

-- ============================================
-- RLS POLICIES - MATCH PLAYER STATS
-- ============================================
-- Anyone can view player stats
CREATE POLICY "Anyone can view player stats" ON match_player_stats
  FOR SELECT USING (true);

-- Umpires can manage player stats
CREATE POLICY "Umpires can insert player stats" ON match_player_stats
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'umpire'
    )
  );

CREATE POLICY "Umpires can update player stats" ON match_player_stats
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'umpire'
    )
  );

CREATE POLICY "Umpires can delete player stats" ON match_player_stats
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'umpire'
    )
  );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_match_score_updated_at
  BEFORE UPDATE ON match_score
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_match_player_stats_updated_at
  BEFORE UPDATE ON match_player_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
-- Allow service role to bypass RLS (for backend operations)
ALTER TABLE profiles OWNER TO postgres;
ALTER TABLE teams OWNER TO postgres;
ALTER TABLE locations OWNER TO postgres;
ALTER TABLE matches OWNER TO postgres;
ALTER TABLE match_score OWNER TO postgres;
ALTER TABLE match_player_stats OWNER TO postgres;







