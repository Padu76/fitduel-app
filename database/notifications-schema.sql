-- ================================================
-- FITDUEL NOTIFICATIONS & REALTIME SCHEMA
-- Safe version - checks if tables/indexes exist
-- ================================================

-- ================================================
-- 1. NOTIFICATIONS TABLE (if not exists)
-- ================================================
-- Drop existing indexes if they exist
DROP INDEX IF EXISTS idx_notifications_user_id;
DROP INDEX IF EXISTS idx_notifications_created_at;
DROP INDEX IF EXISTS idx_notifications_is_read;
DROP INDEX IF EXISTS idx_notifications_type;
DROP INDEX IF EXISTS idx_notifications_expires_at;

-- Alter existing notifications table or create new
DO $$ 
BEGIN
  -- Check if notifications table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    CREATE TABLE public.notifications (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      
      -- Notification Content
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(50) NOT NULL CHECK (type IN (
        'duel_challenge',
        'duel_accepted', 
        'duel_completed',
        'duel_reminder',
        'mission_available',
        'mission_completed',
        'achievement_unlocked',
        'friend_request',
        'team_invite',
        'streak_warning',
        'level_up',
        'leaderboard_update',
        'system'
      )),
      
      -- Metadata
      action_url TEXT,
      icon VARCHAR(50),
      priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
      
      -- Related entities
      related_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      duel_id UUID,
      mission_id UUID,
      team_id UUID,
      
      -- Status
      is_read BOOLEAN DEFAULT FALSE,
      read_at TIMESTAMPTZ,
      is_clicked BOOLEAN DEFAULT FALSE,
      clicked_at TIMESTAMPTZ,
      
      -- Push notification status
      push_sent BOOLEAN DEFAULT FALSE,
      push_sent_at TIMESTAMPTZ,
      push_error TEXT,
      
      -- Timestamps
      created_at TIMESTAMPTZ DEFAULT NOW(),
      expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
      
      -- Metadata JSON for extra data
      metadata JSONB DEFAULT '{}'::jsonb
    );
  ELSE
    -- Add missing columns if table exists
    ALTER TABLE public.notifications 
      ADD COLUMN IF NOT EXISTS action_url TEXT,
      ADD COLUMN IF NOT EXISTS icon VARCHAR(50),
      ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal',
      ADD COLUMN IF NOT EXISTS related_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS duel_id UUID,
      ADD COLUMN IF NOT EXISTS mission_id UUID,
      ADD COLUMN IF NOT EXISTS team_id UUID,
      ADD COLUMN IF NOT EXISTS is_clicked BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS push_sent BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS push_sent_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS push_error TEXT,
      ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
      ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON public.notifications(expires_at);

-- ================================================
-- 2. FCM TOKENS TABLE (for Push Notifications)
-- ================================================
CREATE TABLE IF NOT EXISTS public.fcm_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Token info
  token TEXT NOT NULL UNIQUE,
  device_type VARCHAR(50) CHECK (device_type IN ('web', 'ios', 'android')),
  device_info JSONB DEFAULT '{}'::jsonb,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user_id ON public.fcm_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_token ON public.fcm_tokens(token);

-- ================================================
-- 3. DUEL LIVE UPDATES TABLE (for Realtime)
-- ================================================
CREATE TABLE IF NOT EXISTS public.duel_live_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  duel_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Live progress data
  exercise_type VARCHAR(50) NOT NULL,
  current_reps INTEGER DEFAULT 0,
  current_set INTEGER DEFAULT 1,
  form_score DECIMAL(5,2) DEFAULT 0,
  calories_burned INTEGER DEFAULT 0,
  
  -- Status
  status VARCHAR(50) DEFAULT 'waiting' CHECK (status IN (
    'waiting',
    'ready',
    'in_progress',
    'resting',
    'completed',
    'abandoned'
  )),
  
  -- Timing
  started_at TIMESTAMPTZ,
  last_update_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Performance metrics
  avg_rep_time DECIMAL(5,2),
  total_time INTEGER,
  heart_rate INTEGER,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_duel_live_duel_id ON public.duel_live_updates(duel_id);
CREATE INDEX IF NOT EXISTS idx_duel_live_user_id ON public.duel_live_updates(user_id);
CREATE INDEX IF NOT EXISTS idx_duel_live_status ON public.duel_live_updates(status);

-- ================================================
-- 4. NOTIFICATION PREFERENCES TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Push notification preferences
  push_enabled BOOLEAN DEFAULT TRUE,
  push_duels BOOLEAN DEFAULT TRUE,
  push_missions BOOLEAN DEFAULT TRUE,
  push_achievements BOOLEAN DEFAULT TRUE,
  push_social BOOLEAN DEFAULT TRUE,
  push_streaks BOOLEAN DEFAULT TRUE,
  
  -- Email preferences (future)
  email_enabled BOOLEAN DEFAULT FALSE,
  email_weekly_summary BOOLEAN DEFAULT FALSE,
  
  -- In-app preferences
  sound_enabled BOOLEAN DEFAULT TRUE,
  vibration_enabled BOOLEAN DEFAULT TRUE,
  
  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- 5. DUEL SPECTATORS TABLE (for live viewing)
-- ================================================
CREATE TABLE IF NOT EXISTS public.duel_spectators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  duel_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Spectator actions
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  
  -- Reactions
  reactions JSONB DEFAULT '[]'::jsonb,
  
  UNIQUE(duel_id, user_id)
);

-- ================================================
-- 6. ENABLE REALTIME (safe version)
-- ================================================

-- Check and enable realtime for notifications
DO $$
BEGIN
  -- Enable realtime if not already enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
  
  -- Enable for duel_live_updates
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'duel_live_updates'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.duel_live_updates;
  END IF;
  
  -- Enable for duel_spectators
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'duel_spectators'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.duel_spectators;
  END IF;
END $$;

-- ================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ================================================

-- Notifications RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- FCM Tokens RLS
ALTER TABLE public.fcm_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own FCM tokens" ON public.fcm_tokens;

CREATE POLICY "Users can manage their own FCM tokens"
  ON public.fcm_tokens FOR ALL
  USING (auth.uid() = user_id);

-- Duel Live Updates RLS
ALTER TABLE public.duel_live_updates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view duel updates" ON public.duel_live_updates;
DROP POLICY IF EXISTS "Users can update their own duel progress" ON public.duel_live_updates;

CREATE POLICY "Users can view duel updates"
  ON public.duel_live_updates FOR SELECT
  USING (true); -- Anyone can view for now

CREATE POLICY "Users can update their own duel progress"
  ON public.duel_live_updates FOR ALL
  USING (auth.uid() = user_id);

-- Notification Preferences RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own preferences" ON public.notification_preferences;

CREATE POLICY "Users can manage their own preferences"
  ON public.notification_preferences FOR ALL
  USING (auth.uid() = user_id);

-- Duel Spectators RLS
ALTER TABLE public.duel_spectators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view spectators" ON public.duel_spectators;
DROP POLICY IF EXISTS "Users can join/leave as spectators" ON public.duel_spectators;

CREATE POLICY "Anyone can view spectators"
  ON public.duel_spectators FOR SELECT
  USING (true);

CREATE POLICY "Users can join/leave as spectators"
  ON public.duel_spectators FOR ALL
  USING (auth.uid() = user_id);

-- ================================================
-- 8. FUNCTIONS & TRIGGERS
-- ================================================

-- Function to auto-delete expired notifications
CREATE OR REPLACE FUNCTION delete_expired_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM public.notifications
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to send notification (to be called from app)
CREATE OR REPLACE FUNCTION send_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    metadata
  ) VALUES (
    p_user_id,
    p_title,
    p_message,
    p_type,
    p_metadata
  ) RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.notifications
    WHERE user_id = p_user_id
      AND is_read = FALSE
      AND expires_at > NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- Function to create default notification preferences
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_user_created ON auth.users;

-- Trigger to create default preferences for new users
CREATE TRIGGER on_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();

-- ================================================
-- 9. COMPOSITE INDEXES FOR PERFORMANCE
-- ================================================

-- Drop existing composite indexes if they exist
DROP INDEX IF EXISTS idx_notifications_user_unread;
DROP INDEX IF EXISTS idx_duel_live_active;

-- Recreate composite indexes
CREATE INDEX idx_notifications_user_unread 
  ON public.notifications(user_id, is_read) 
  WHERE is_read = FALSE;

CREATE INDEX idx_duel_live_active 
  ON public.duel_live_updates(duel_id, status) 
  WHERE status IN ('in_progress', 'ready');

-- ================================================
-- 10. SAMPLE TEST DATA (Optional - Remove in production)
-- ================================================

-- Insert a test notification (uncomment to test)
/*
INSERT INTO public.notifications (
  user_id,
  title,
  message,
  type,
  icon,
  action_url
) VALUES (
  (SELECT id FROM auth.users LIMIT 1), -- First user
  'Benvenuto in FitDuel!',
  'Inizia il tuo percorso fitness con la prima missione',
  'system',
  '🎯',
  '/missions'
);
*/

-- ================================================
-- 11. VERIFICATION QUERY
-- ================================================
-- Run this to check if everything is created:
SELECT 
  'Tables Created:' as info,
  COUNT(*) as count 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'notifications',
  'fcm_tokens', 
  'duel_live_updates',
  'notification_preferences',
  'duel_spectators'
);

-- ================================================
-- END OF SCHEMA - SAFE VERSION
-- ================================================