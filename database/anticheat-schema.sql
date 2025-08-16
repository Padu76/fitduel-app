-- ====================================
-- FITDUEL ANTI-CHEAT DATABASE SCHEMA
-- Version: 1.0.0
-- ====================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================
-- DEVICE FINGERPRINTS
-- ====================================
CREATE TABLE IF NOT EXISTS device_fingerprints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  device_hash VARCHAR(64) NOT NULL,
  device_data JSONB NOT NULL DEFAULT '{}',
  device_type VARCHAR(20) CHECK (device_type IN ('mobile', 'tablet', 'desktop')),
  browser VARCHAR(100),
  os VARCHAR(100),
  screen_resolution VARCHAR(20),
  hardware_concurrency INTEGER,
  device_memory INTEGER,
  connection_type VARCHAR(50),
  webgl_vendor VARCHAR(255),
  webgl_renderer VARCHAR(255),
  canvas_fingerprint TEXT,
  audio_fingerprint TEXT,
  fonts_hash VARCHAR(64),
  timezone VARCHAR(100),
  language VARCHAR(10),
  platform VARCHAR(100),
  is_trusted BOOLEAN DEFAULT false,
  is_banned BOOLEAN DEFAULT false,
  first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_sessions INTEGER DEFAULT 1,
  suspicious_activities INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, device_hash)
);

-- Indexes for device fingerprints
CREATE INDEX idx_device_fingerprints_user_id ON device_fingerprints(user_id);
CREATE INDEX idx_device_fingerprints_device_hash ON device_fingerprints(device_hash);
CREATE INDEX idx_device_fingerprints_last_seen ON device_fingerprints(last_seen);
CREATE INDEX idx_device_fingerprints_is_banned ON device_fingerprints(is_banned) WHERE is_banned = true;

-- ====================================
-- TRUST SCORES
-- ====================================
CREATE TABLE IF NOT EXISTS trust_scores (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 100 CHECK (score >= 0 AND score <= 100),
  trust_level VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (trust_level IN ('untrusted', 'low', 'medium', 'high', 'verified')),
  factors JSONB NOT NULL DEFAULT '{
    "account_age": 0,
    "email_verified": false,
    "social_linked": false,
    "play_consistency": 0,
    "report_count": 0,
    "video_verifications": 0,
    "abnormal_patterns": 0,
    "total_validations": 0,
    "failed_validations": 0,
    "device_switches": 0,
    "vpn_usage": 0,
    "community_reports": 0
  }',
  restrictions TEXT[] DEFAULT '{}',
  shadow_banned BOOLEAN DEFAULT false,
  review_required BOOLEAN DEFAULT false,
  last_validation_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for trust scores
CREATE INDEX idx_trust_scores_score ON trust_scores(score);
CREATE INDEX idx_trust_scores_trust_level ON trust_scores(trust_level);
CREATE INDEX idx_trust_scores_shadow_banned ON trust_scores(shadow_banned) WHERE shadow_banned = true;
CREATE INDEX idx_trust_scores_review_required ON trust_scores(review_required) WHERE review_required = true;

-- ====================================
-- BIOMETRIC PROFILES
-- ====================================
CREATE TABLE IF NOT EXISTS biometric_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  avg_rhythm FLOAT,
  rhythm_variance FLOAT,
  avg_form_score FLOAT NOT NULL DEFAULT 0,
  form_score_variance FLOAT,
  avg_rest_time FLOAT,
  rest_time_variance FLOAT,
  avg_rep_duration FLOAT,
  rep_duration_variance FLOAT,
  movement_signature FLOAT[] DEFAULT '{}',
  acceleration_patterns JSONB DEFAULT '{}',
  fatigue_curve FLOAT[] DEFAULT '{}',
  consistency_score FLOAT DEFAULT 0 CHECK (consistency_score >= 0 AND consistency_score <= 100),
  samples INTEGER NOT NULL DEFAULT 0,
  anomaly_count INTEGER DEFAULT 0,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, exercise_id)
);

-- Indexes for biometric profiles
CREATE INDEX idx_biometric_profiles_user_id ON biometric_profiles(user_id);
CREATE INDEX idx_biometric_profiles_exercise_id ON biometric_profiles(exercise_id);
CREATE INDEX idx_biometric_profiles_consistency ON biometric_profiles(consistency_score);

-- ====================================
-- CHEAT INCIDENTS
-- ====================================
CREATE TABLE IF NOT EXISTS cheat_incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_id VARCHAR(100) NOT NULL,
  exercise_id UUID REFERENCES exercises(id),
  duel_id UUID REFERENCES duels(id),
  mission_id UUID REFERENCES missions(id),
  tournament_id UUID REFERENCES tournaments(id),
  incident_type VARCHAR(50) NOT NULL CHECK (incident_type IN (
    'abnormal_movement', 'impossible_speed', 'pattern_mismatch', 
    'device_anomaly', 'video_manipulation', 'multiple_devices',
    'vpn_detected', 'emulator_detected', 'macro_detected',
    'biometric_mismatch', 'timestamp_manipulation', 'api_abuse'
  )),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  confidence FLOAT NOT NULL DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 100),
  violations JSONB NOT NULL DEFAULT '[]',
  evidence JSONB DEFAULT '{}',
  action_taken VARCHAR(50) CHECK (action_taken IN (
    'none', 'warning', 'score_reduction', 'performance_invalidated',
    'temp_ban', 'perm_ban', 'shadow_ban', 'manual_review'
  )),
  action_reason TEXT,
  reviewed BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  is_false_positive BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for cheat incidents
CREATE INDEX idx_cheat_incidents_user_id ON cheat_incidents(user_id);
CREATE INDEX idx_cheat_incidents_session_id ON cheat_incidents(session_id);
CREATE INDEX idx_cheat_incidents_severity ON cheat_incidents(severity);
CREATE INDEX idx_cheat_incidents_created_at ON cheat_incidents(created_at DESC);
CREATE INDEX idx_cheat_incidents_reviewed ON cheat_incidents(reviewed) WHERE reviewed = false;

-- ====================================
-- VALIDATION RESULTS
-- ====================================
CREATE TABLE IF NOT EXISTS validation_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id VARCHAR(100) NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id),
  duel_id UUID REFERENCES duels(id),
  mission_id UUID REFERENCES missions(id),
  tournament_id UUID REFERENCES tournaments(id),
  is_valid BOOLEAN NOT NULL DEFAULT true,
  confidence FLOAT NOT NULL DEFAULT 100 CHECK (confidence >= 0 AND confidence <= 100),
  trust_score INTEGER NOT NULL CHECK (trust_score >= 0 AND trust_score <= 100),
  violations JSONB DEFAULT '[]',
  validation_layers JSONB DEFAULT '{
    "ai_validation": null,
    "motion_tracking": null,
    "video_verification": null,
    "device_fingerprinting": null,
    "behavioral_biometrics": null,
    "pattern_analysis": null,
    "challenge_system": null
  }',
  performance_metrics JSONB DEFAULT '{}',
  requires_manual_review BOOLEAN DEFAULT false,
  manual_review_reason TEXT,
  evidence_hashes TEXT[] DEFAULT '{}',
  video_chunks_urls TEXT[] DEFAULT '{}',
  screenshots_urls TEXT[] DEFAULT '{}',
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for validation results
CREATE INDEX idx_validation_results_session_id ON validation_results(session_id);
CREATE INDEX idx_validation_results_user_id ON validation_results(user_id);
CREATE INDEX idx_validation_results_is_valid ON validation_results(is_valid);
CREATE INDEX idx_validation_results_requires_review ON validation_results(requires_manual_review) WHERE requires_manual_review = true;
CREATE INDEX idx_validation_results_created_at ON validation_results(created_at DESC);

-- ====================================
-- DEVICE SWITCHES LOG
-- ====================================
CREATE TABLE IF NOT EXISTS device_switches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  from_device_hash VARCHAR(64),
  to_device_hash VARCHAR(64) NOT NULL,
  from_device_data JSONB,
  to_device_data JSONB,
  switch_reason VARCHAR(100),
  is_suspicious BOOLEAN DEFAULT false,
  location_change BOOLEAN DEFAULT false,
  time_since_last_switch INTERVAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for device switches
CREATE INDEX idx_device_switches_user_id ON device_switches(user_id);
CREATE INDEX idx_device_switches_created_at ON device_switches(created_at DESC);
CREATE INDEX idx_device_switches_suspicious ON device_switches(is_suspicious) WHERE is_suspicious = true;

-- ====================================
-- CHALLENGE RESPONSES
-- ====================================
CREATE TABLE IF NOT EXISTS challenge_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_id VARCHAR(100) NOT NULL,
  challenge_type VARCHAR(50) NOT NULL CHECK (challenge_type IN (
    'gesture', 'position', 'audio', 'timing', 'captcha', 'biometric'
  )),
  challenge_data JSONB NOT NULL,
  response_data JSONB,
  is_correct BOOLEAN,
  response_time_ms INTEGER,
  attempts INTEGER DEFAULT 1,
  max_attempts INTEGER DEFAULT 3,
  passed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

-- Indexes for challenge responses
CREATE INDEX idx_challenge_responses_user_id ON challenge_responses(user_id);
CREATE INDEX idx_challenge_responses_session_id ON challenge_responses(session_id);
CREATE INDEX idx_challenge_responses_passed ON challenge_responses(passed);

-- ====================================
-- COMMUNITY REPORTS
-- ====================================
CREATE TABLE IF NOT EXISTS community_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  performance_id UUID REFERENCES performances(id),
  duel_id UUID REFERENCES duels(id),
  report_type VARCHAR(50) NOT NULL CHECK (report_type IN (
    'cheating', 'macro', 'bot', 'video_fake', 'impossible_performance',
    'account_sharing', 'boosting', 'other'
  )),
  description TEXT NOT NULL,
  evidence_urls TEXT[] DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'reviewing', 'confirmed', 'rejected', 'insufficient_evidence'
  )),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  action_taken VARCHAR(50),
  reporter_trust_impact INTEGER DEFAULT 0,
  reported_trust_impact INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT no_self_report CHECK (reporter_id != reported_user_id)
);

-- Indexes for community reports
CREATE INDEX idx_community_reports_reporter_id ON community_reports(reporter_id);
CREATE INDEX idx_community_reports_reported_user_id ON community_reports(reported_user_id);
CREATE INDEX idx_community_reports_status ON community_reports(status);
CREATE INDEX idx_community_reports_created_at ON community_reports(created_at DESC);

-- ====================================
-- ANTI-CHEAT LOGS (for debugging)
-- ====================================
CREATE TABLE IF NOT EXISTS anticheat_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id VARCHAR(100),
  log_type VARCHAR(50) NOT NULL,
  log_level VARCHAR(20) NOT NULL CHECK (log_level IN ('debug', 'info', 'warning', 'error', 'critical')),
  component VARCHAR(100),
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  stack_trace TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for logs
CREATE INDEX idx_anticheat_logs_user_id ON anticheat_logs(user_id);
CREATE INDEX idx_anticheat_logs_session_id ON anticheat_logs(session_id);
CREATE INDEX idx_anticheat_logs_log_level ON anticheat_logs(log_level);
CREATE INDEX idx_anticheat_logs_created_at ON anticheat_logs(created_at DESC);

-- Partition by month for performance
-- CREATE TABLE anticheat_logs_2025_01 PARTITION OF anticheat_logs
-- FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- ====================================
-- FUNCTIONS & TRIGGERS
-- ====================================

-- Function to update trust score
CREATE OR REPLACE FUNCTION update_trust_score(
  p_user_id UUID,
  p_adjustment INTEGER,
  p_reason TEXT
) RETURNS INTEGER AS $$
DECLARE
  v_new_score INTEGER;
  v_new_level VARCHAR(20);
BEGIN
  -- Update score
  UPDATE trust_scores
  SET 
    score = GREATEST(0, LEAST(100, score + p_adjustment)),
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING score INTO v_new_score;
  
  -- Update trust level based on new score
  v_new_level := CASE
    WHEN v_new_score >= 90 THEN 'verified'
    WHEN v_new_score >= 70 THEN 'high'
    WHEN v_new_score >= 50 THEN 'medium'
    WHEN v_new_score >= 30 THEN 'low'
    ELSE 'untrusted'
  END;
  
  UPDATE trust_scores
  SET trust_level = v_new_level
  WHERE user_id = p_user_id;
  
  -- Log the change
  INSERT INTO anticheat_logs (user_id, log_type, log_level, message, data)
  VALUES (
    p_user_id,
    'trust_score_change',
    'info',
    'Trust score updated',
    jsonb_build_object(
      'new_score', v_new_score,
      'adjustment', p_adjustment,
      'reason', p_reason,
      'new_level', v_new_level
    )
  );
  
  RETURN v_new_score;
END;
$$ LANGUAGE plpgsql;

-- Function to check device limit
CREATE OR REPLACE FUNCTION check_device_limit(
  p_user_id UUID,
  p_device_hash VARCHAR(64)
) RETURNS BOOLEAN AS $$
DECLARE
  v_device_count INTEGER;
  v_max_devices INTEGER := 3;
BEGIN
  -- Count unique devices for user
  SELECT COUNT(DISTINCT device_hash) INTO v_device_count
  FROM device_fingerprints
  WHERE user_id = p_user_id
    AND is_banned = false
    AND last_seen > NOW() - INTERVAL '30 days';
  
  -- Check if this is a new device
  IF NOT EXISTS (
    SELECT 1 FROM device_fingerprints 
    WHERE user_id = p_user_id AND device_hash = p_device_hash
  ) THEN
    -- Would this exceed the limit?
    IF v_device_count >= v_max_devices THEN
      -- Log violation
      INSERT INTO cheat_incidents (
        user_id,
        session_id,
        incident_type,
        severity,
        violations,
        action_taken
      ) VALUES (
        p_user_id,
        'device_check_' || p_device_hash,
        'multiple_devices',
        'medium',
        jsonb_build_array(jsonb_build_object(
          'type', 'device_limit_exceeded',
          'count', v_device_count + 1,
          'limit', v_max_devices
        )),
        'warning'
      );
      
      RETURN false;
    END IF;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_device_fingerprints_updated_at
  BEFORE UPDATE ON device_fingerprints
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_trust_scores_updated_at
  BEFORE UPDATE ON trust_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_community_reports_updated_at
  BEFORE UPDATE ON community_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ====================================
-- INITIAL DATA & POLICIES
-- ====================================

-- Initialize trust scores for existing users
INSERT INTO trust_scores (user_id, score, trust_level)
SELECT 
  id,
  CASE 
    WHEN created_at < NOW() - INTERVAL '30 days' THEN 75
    WHEN created_at < NOW() - INTERVAL '7 days' THEN 60
    ELSE 50
  END as score,
  CASE 
    WHEN created_at < NOW() - INTERVAL '30 days' THEN 'high'
    WHEN created_at < NOW() - INTERVAL '7 days' THEN 'medium'
    ELSE 'medium'
  END as trust_level
FROM profiles
WHERE NOT EXISTS (
  SELECT 1 FROM trust_scores WHERE trust_scores.user_id = profiles.id
);

-- ====================================
-- ROW LEVEL SECURITY
-- ====================================

-- Enable RLS on all tables
ALTER TABLE device_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometric_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cheat_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_switches ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE anticheat_logs ENABLE ROW LEVEL SECURITY;

-- Policies for device_fingerprints
CREATE POLICY "Users can view own device fingerprints"
  ON device_fingerprints FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert device fingerprints"
  ON device_fingerprints FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies for trust_scores
CREATE POLICY "Users can view own trust score"
  ON trust_scores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view trust levels"
  ON trust_scores FOR SELECT
  USING (true)
  WITH CHECK (false);

-- Policies for validation_results
CREATE POLICY "Users can view own validation results"
  ON validation_results FOR SELECT
  USING (auth.uid() = user_id);

-- Policies for community_reports
CREATE POLICY "Users can create reports"
  ON community_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view own reports"
  ON community_reports FOR SELECT
  USING (auth.uid() = reporter_id OR auth.uid() = reported_user_id);

-- ====================================
-- INDEXES FOR PERFORMANCE
-- ====================================

-- Composite indexes for common queries
CREATE INDEX idx_validation_results_user_exercise 
  ON validation_results(user_id, exercise_id) 
  WHERE is_valid = true;

CREATE INDEX idx_cheat_incidents_user_severity 
  ON cheat_incidents(user_id, severity, created_at DESC);

CREATE INDEX idx_biometric_profiles_user_consistency 
  ON biometric_profiles(user_id, consistency_score DESC);

-- ====================================
-- MAINTENANCE
-- ====================================

-- Clean up old logs (run periodically)
-- DELETE FROM anticheat_logs WHERE created_at < NOW() - INTERVAL '30 days';

-- Archive old incidents (run monthly)
-- CREATE TABLE cheat_incidents_archive AS 
-- SELECT * FROM cheat_incidents WHERE created_at < NOW() - INTERVAL '90 days';

COMMENT ON SCHEMA public IS 'FitDuel Anti-Cheat System Database Schema v1.0.0';