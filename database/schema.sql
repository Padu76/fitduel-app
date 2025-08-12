-- ====================================
-- FITDUEL DATABASE SCHEMA
-- Version: 1.0.0
-- Database: PostgreSQL (Supabase)
-- ====================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================
-- ENUM TYPES
-- ====================================

-- User roles
CREATE TYPE user_role AS ENUM ('user', 'premium', 'moderator', 'admin');

-- Duel types
CREATE TYPE duel_type AS ENUM ('1v1', 'open', 'tournament', 'mission');

-- Duel status
CREATE TYPE duel_status AS ENUM ('pending', 'open', 'active', 'completed', 'expired', 'cancelled');

-- Exercise difficulty
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard', 'extreme');

-- Achievement types
CREATE TYPE achievement_type AS ENUM ('milestone', 'streak', 'perfect', 'speed', 'endurance', 'social');

-- Notification types
CREATE TYPE notification_type AS ENUM ('duel_invite', 'duel_accepted', 'duel_completed', 'achievement_unlocked', 'friend_request', 'level_up', 'reward');

-- ====================================
-- CORE TABLES
-- ====================================

-- Users table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(20) UNIQUE NOT NULL,
    display_name VARCHAR(50),
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    date_of_birth DATE,
    country VARCHAR(2),
    role user_role DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User statistics
CREATE TABLE user_stats (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    level INTEGER DEFAULT 1,
    total_xp INTEGER DEFAULT 0,
    current_xp INTEGER DEFAULT 0,
    coins INTEGER DEFAULT 0,
    gems INTEGER DEFAULT 0,
    total_duels INTEGER DEFAULT 0,
    duels_won INTEGER DEFAULT 0,
    duels_lost INTEGER DEFAULT 0,
    duels_draw INTEGER DEFAULT 0,
    win_streak INTEGER DEFAULT 0,
    max_win_streak INTEGER DEFAULT 0,
    total_exercises INTEGER DEFAULT 0,
    total_reps INTEGER DEFAULT 0,
    total_duration INTEGER DEFAULT 0, -- seconds
    total_calories INTEGER DEFAULT 0,
    average_form_score DECIMAL(5,2) DEFAULT 0,
    daily_streak INTEGER DEFAULT 0,
    max_daily_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exercises catalog
CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50), -- strength, cardio, flexibility, etc.
    muscle_groups TEXT[], -- array of muscle groups
    met_value DECIMAL(4,2), -- for calorie calculation
    icon VARCHAR(50),
    video_url TEXT,
    instructions TEXT[],
    common_mistakes TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Duels/Challenges
CREATE TABLE duels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type duel_type NOT NULL,
    status duel_status DEFAULT 'pending',
    challenger_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    challenged_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id),
    difficulty difficulty_level DEFAULT 'medium',
    wager_xp INTEGER DEFAULT 0,
    reward_xp INTEGER DEFAULT 0,
    target_reps INTEGER,
    target_time INTEGER, -- seconds
    target_form_score DECIMAL(5,2),
    rules JSONB, -- flexible rules storage
    max_participants INTEGER DEFAULT 2,
    current_participants INTEGER DEFAULT 1,
    starts_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    winner_id UUID REFERENCES profiles(id),
    is_draw BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Duel participants (for open/tournament duels)
CREATE TABLE duel_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    duel_id UUID NOT NULL REFERENCES duels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    reps_completed INTEGER DEFAULT 0,
    time_taken INTEGER DEFAULT 0, -- seconds
    form_score DECIMAL(5,2) DEFAULT 0,
    calories_burned INTEGER DEFAULT 0,
    video_url TEXT,
    is_winner BOOLEAN DEFAULT false,
    rank INTEGER,
    xp_earned INTEGER DEFAULT 0,
    UNIQUE(duel_id, user_id)
);

-- Exercise performances
CREATE TABLE performances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id),
    duel_id UUID REFERENCES duels(id) ON DELETE SET NULL,
    reps INTEGER NOT NULL,
    duration INTEGER NOT NULL, -- seconds
    form_score DECIMAL(5,2) DEFAULT 0,
    calories_burned INTEGER DEFAULT 0,
    difficulty difficulty_level,
    video_url TEXT,
    ai_feedback JSONB,
    device_data JSONB, -- sensor data if available
    performed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================
-- XP & PROGRESSION SYSTEM
-- ====================================

-- XP transactions
CREATE TABLE xp_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    reason VARCHAR(100) NOT NULL,
    reference_type VARCHAR(50), -- 'duel', 'achievement', 'daily_bonus', etc.
    reference_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Levels configuration
CREATE TABLE levels (
    level INTEGER PRIMARY KEY,
    required_xp INTEGER NOT NULL,
    title VARCHAR(50) NOT NULL,
    title_it VARCHAR(50) NOT NULL,
    rewards JSONB, -- coins, gems, unlocks, etc.
    perks JSONB -- special abilities or bonuses
);

-- ====================================
-- ACHIEVEMENTS & BADGES
-- ====================================

-- Achievements catalog
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    type achievement_type NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_it VARCHAR(100) NOT NULL,
    description TEXT,
    description_it TEXT,
    icon VARCHAR(50),
    target_value INTEGER, -- e.g., 100 pushups, 7 day streak
    xp_reward INTEGER DEFAULT 0,
    coin_reward INTEGER DEFAULT 0,
    gem_reward INTEGER DEFAULT 0,
    badge_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User achievements
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id),
    progress INTEGER DEFAULT 0,
    unlocked_at TIMESTAMPTZ,
    claimed_at TIMESTAMPTZ,
    UNIQUE(user_id, achievement_id)
);

-- Badges catalog
CREATE TABLE badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_it VARCHAR(100) NOT NULL,
    description TEXT,
    description_it TEXT,
    icon VARCHAR(50),
    rarity VARCHAR(20), -- common, rare, epic, legendary
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User badges
CREATE TABLE user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badges(id),
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    is_equipped BOOLEAN DEFAULT false,
    UNIQUE(user_id, badge_id)
);

-- ====================================
-- LEADERBOARD & RANKINGS
-- ====================================

-- Global leaderboard (materialized view for performance)
CREATE TABLE leaderboard_global (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    period VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'all_time'
    exercise_id UUID REFERENCES exercises(id),
    score INTEGER NOT NULL,
    rank INTEGER,
    data JSONB, -- additional stats
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, period, exercise_id, period_start)
);

-- ====================================
-- SOCIAL FEATURES
-- ====================================

-- Friendships
CREATE TABLE friendships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, blocked
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    UNIQUE(user_id, friend_id),
    CHECK (user_id != friend_id)
);

-- Teams/Groups
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    avatar_url TEXT,
    leader_id UUID NOT NULL REFERENCES profiles(id),
    max_members INTEGER DEFAULT 50,
    current_members INTEGER DEFAULT 1,
    total_xp INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team members
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member', -- leader, officer, member
    contribution_xp INTEGER DEFAULT 0,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- ====================================
-- NOTIFICATIONS
-- ====================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    data JSONB, -- additional data based on type
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================
-- INDEXES
-- ====================================

-- Performance indexes
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_user_stats_level ON user_stats(level DESC);
CREATE INDEX idx_user_stats_total_xp ON user_stats(total_xp DESC);

CREATE INDEX idx_duels_status ON duels(status);
CREATE INDEX idx_duels_challenger ON duels(challenger_id);
CREATE INDEX idx_duels_challenged ON duels(challenged_id);
CREATE INDEX idx_duels_created ON duels(created_at DESC);

CREATE INDEX idx_performances_user ON performances(user_id);
CREATE INDEX idx_performances_exercise ON performances(exercise_id);
CREATE INDEX idx_performances_date ON performances(performed_at DESC);

CREATE INDEX idx_xp_transactions_user ON xp_transactions(user_id);
CREATE INDEX idx_xp_transactions_created ON xp_transactions(created_at DESC);

CREATE INDEX idx_leaderboard_period ON leaderboard_global(period, period_start);
CREATE INDEX idx_leaderboard_rank ON leaderboard_global(rank);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- ====================================
-- FUNCTIONS & TRIGGERS
-- ====================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update timestamp to tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_stats_updated_at BEFORE UPDATE ON user_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_duels_updated_at BEFORE UPDATE ON duels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Calculate level from XP
CREATE OR REPLACE FUNCTION calculate_level(xp INTEGER)
RETURNS INTEGER AS $$
DECLARE
    calculated_level INTEGER;
BEGIN
    -- Level formula: level = floor(sqrt(xp / 100))
    calculated_level := FLOOR(SQRT(xp::DECIMAL / 100));
    IF calculated_level < 1 THEN
        calculated_level := 1;
    END IF;
    RETURN calculated_level;
END;
$$ LANGUAGE plpgsql;

-- Update user level when XP changes
CREATE OR REPLACE FUNCTION update_user_level()
RETURNS TRIGGER AS $$
BEGIN
    NEW.level := calculate_level(NEW.total_xp);
    NEW.current_xp := NEW.total_xp - (POWER(NEW.level, 2) * 100)::INTEGER;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_level_on_xp_change
    BEFORE INSERT OR UPDATE OF total_xp ON user_stats
    FOR EACH ROW EXECUTE FUNCTION update_user_level();

-- Add XP transaction and update user stats
CREATE OR REPLACE FUNCTION add_xp(
    p_user_id UUID,
    p_amount INTEGER,
    p_reason VARCHAR,
    p_ref_type VARCHAR DEFAULT NULL,
    p_ref_id UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    new_total_xp INTEGER;
BEGIN
    -- Insert XP transaction
    INSERT INTO xp_transactions (user_id, amount, reason, reference_type, reference_id)
    VALUES (p_user_id, p_amount, p_reason, p_ref_type, p_ref_id);
    
    -- Update user stats
    UPDATE user_stats 
    SET total_xp = total_xp + p_amount
    WHERE user_id = p_user_id
    RETURNING total_xp INTO new_total_xp;
    
    RETURN new_total_xp;
END;
$$ LANGUAGE plpgsql;

-- ====================================
-- ROW LEVEL SECURITY (RLS)
-- ====================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE duels ENABLE ROW LEVEL SECURITY;
ALTER TABLE duel_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE performances ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- User stats policies
CREATE POLICY "User stats are viewable by everyone" ON user_stats
    FOR SELECT USING (true);

CREATE POLICY "Users can update own stats" ON user_stats
    FOR UPDATE USING (auth.uid() = user_id);

-- Duels policies
CREATE POLICY "Duels are viewable by everyone" ON duels
    FOR SELECT USING (true);

CREATE POLICY "Users can create duels" ON duels
    FOR INSERT WITH CHECK (auth.uid() = challenger_id);

CREATE POLICY "Users can update own duels" ON duels
    FOR UPDATE USING (auth.uid() = challenger_id OR auth.uid() = challenged_id);

-- Performances policies
CREATE POLICY "Performances are viewable by everyone" ON performances
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own performances" ON performances
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- XP transactions policies
CREATE POLICY "Users can view own XP transactions" ON xp_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Achievements policies
CREATE POLICY "Users can view own achievements" ON user_achievements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own achievements" ON user_achievements
    FOR UPDATE USING (auth.uid() = user_id);

-- Badges policies
CREATE POLICY "Users can view own badges" ON user_badges
    FOR SELECT USING (auth.uid() = user_id);

-- Friendships policies
CREATE POLICY "Users can view own friendships" ON friendships
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friendships" ON friendships
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update friendships" ON friendships
    FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Team members policies
CREATE POLICY "Team members are viewable by everyone" ON team_members
    FOR SELECT USING (true);

CREATE POLICY "Users can leave teams" ON team_members
    FOR DELETE USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- ====================================
-- INITIAL DATA (REQUIRED)
-- ====================================

-- Insert default exercises
INSERT INTO exercises (code, name, category, met_value, icon) VALUES
    ('push_up', 'Push-Up', 'strength', 8.0, '💪'),
    ('squat', 'Squat', 'strength', 5.0, '🦵'),
    ('plank', 'Plank', 'core', 3.0, '📏'),
    ('burpee', 'Burpee', 'cardio', 10.0, '🔥'),
    ('jumping_jack', 'Jumping Jack', 'cardio', 8.0, '⭐'),
    ('mountain_climber', 'Mountain Climber', 'cardio', 8.0, '⛰️')
ON CONFLICT (code) DO NOTHING;

-- Insert level configuration (first 50 levels)
INSERT INTO levels (level, required_xp, title, title_it) 
SELECT 
    level,
    POWER(level, 2) * 100 as required_xp,
    CASE 
        WHEN level <= 5 THEN 'Rookie'
        WHEN level <= 10 THEN 'Beginner'
        WHEN level <= 20 THEN 'Athlete'
        WHEN level <= 30 THEN 'Warrior'
        WHEN level <= 40 THEN 'Champion'
        ELSE 'Legend'
    END as title,
    CASE 
        WHEN level <= 5 THEN 'Principiante'
        WHEN level <= 10 THEN 'Novizio'
        WHEN level <= 20 THEN 'Atleta'
        WHEN level <= 30 THEN 'Guerriero'
        WHEN level <= 40 THEN 'Campione'
        ELSE 'Leggenda'
    END as title_it
FROM generate_series(1, 50) as level
ON CONFLICT DO NOTHING;

-- ====================================
-- GRANT PERMISSIONS (for Supabase)
-- ====================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;