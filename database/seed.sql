-- ====================================
-- FITDUEL SEED DATA
-- Version: 1.0.0
-- Database: PostgreSQL (Supabase)
-- ====================================

-- ====================================
-- CLEAN EXISTING TEST DATA
-- ====================================

-- Delete in reverse order of dependencies
DELETE FROM notifications WHERE user_id IN (
    SELECT id FROM auth.users WHERE email LIKE '%@demo.fitduel%'
);
DELETE FROM team_members WHERE user_id IN (
    SELECT id FROM auth.users WHERE email LIKE '%@demo.fitduel%'
);
DELETE FROM teams WHERE leader_id IN (
    SELECT id FROM auth.users WHERE email LIKE '%@demo.fitduel%'
);
DELETE FROM friendships WHERE user_id IN (
    SELECT id FROM auth.users WHERE email LIKE '%@demo.fitduel%'
);
DELETE FROM leaderboard_global WHERE user_id IN (
    SELECT id FROM auth.users WHERE email LIKE '%@demo.fitduel%'
);
DELETE FROM user_badges WHERE user_id IN (
    SELECT id FROM auth.users WHERE email LIKE '%@demo.fitduel%'
);
DELETE FROM user_achievements WHERE user_id IN (
    SELECT id FROM auth.users WHERE email LIKE '%@demo.fitduel%'
);
DELETE FROM xp_transactions WHERE user_id IN (
    SELECT id FROM auth.users WHERE email LIKE '%@demo.fitduel%'
);
DELETE FROM performances WHERE user_id IN (
    SELECT id FROM auth.users WHERE email LIKE '%@demo.fitduel%'
);
DELETE FROM duel_participants WHERE user_id IN (
    SELECT id FROM auth.users WHERE email LIKE '%@demo.fitduel%'
);
DELETE FROM duels WHERE challenger_id IN (
    SELECT id FROM auth.users WHERE email LIKE '%@demo.fitduel%'
);
DELETE FROM user_stats WHERE user_id IN (
    SELECT id FROM auth.users WHERE email LIKE '%@demo.fitduel%'
);
DELETE FROM profiles WHERE email LIKE '%@demo.fitduel%';

-- ====================================
-- CREATE TEST USERS
-- ====================================

-- Note: In production, users are created via Supabase Auth
-- For testing, we'll insert directly into auth.users (requires service role key)

-- User 1: Mario Rossi (High level player)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'mario@demo.fitduel',
    crypt('Demo123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, username, display_name, email, bio, country, role, is_verified)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'SuperMario',
    'Mario Rossi',
    'mario@demo.fitduel',
    '💪 Fitness enthusiast | Level 25 Warrior | Push-up King',
    'IT',
    'premium',
    true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO user_stats (
    user_id, level, total_xp, current_xp, coins, gems,
    total_duels, duels_won, duels_lost, win_streak, max_win_streak,
    total_exercises, total_reps, total_duration, total_calories,
    average_form_score, daily_streak, max_daily_streak, last_activity_date
) VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    25, 62500, 2500, 5000, 150,
    120, 78, 42, 5, 12,
    450, 12500, 54000, 35000,
    88.5, 15, 30, CURRENT_DATE
) ON CONFLICT (user_id) DO NOTHING;

-- User 2: Giulia Bianchi (Mid level player)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
    'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    'giulia@demo.fitduel',
    crypt('Demo123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, username, display_name, email, bio, country, role, is_verified)
VALUES (
    'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    'GiuliaFit',
    'Giulia Bianchi',
    'giulia@demo.fitduel',
    '🏃‍♀️ Runner | Plank Master | Never Give Up!',
    'IT',
    'user',
    true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO user_stats (
    user_id, level, total_xp, current_xp, coins, gems,
    total_duels, duels_won, duels_lost, win_streak, max_win_streak,
    total_exercises, total_reps, total_duration, total_calories,
    average_form_score, daily_streak, max_daily_streak, last_activity_date
) VALUES (
    'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    12, 14400, 400, 2200, 45,
    56, 32, 24, 2, 7,
    220, 5600, 28000, 18000,
    85.2, 8, 15, CURRENT_DATE - INTERVAL '1 day'
) ON CONFLICT (user_id) DO NOTHING;

-- User 3: Luca Verdi (Beginner)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
    'c3d4e5f6-a7b8-9012-cdef-345678901234',
    'luca@demo.fitduel',
    crypt('Demo123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, username, display_name, email, bio, country, role)
VALUES (
    'c3d4e5f6-a7b8-9012-cdef-345678901234',
    'LucaNewbie',
    'Luca Verdi',
    'luca@demo.fitduel',
    '🌟 Just started my fitness journey!',
    'IT',
    'user'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO user_stats (
    user_id, level, total_xp, current_xp, coins, gems,
    total_duels, duels_won, duels_lost, win_streak,
    total_exercises, total_reps, total_duration, total_calories,
    average_form_score, daily_streak, last_activity_date
) VALUES (
    'c3d4e5f6-a7b8-9012-cdef-345678901234',
    3, 900, 0, 300, 5,
    8, 3, 5, 1,
    25, 450, 3200, 2100,
    78.5, 3, CURRENT_DATE
) ON CONFLICT (user_id) DO NOTHING;

-- ====================================
-- CREATE FRIENDSHIPS
-- ====================================

-- Mario and Giulia are friends
INSERT INTO friendships (user_id, friend_id, status, accepted_at)
VALUES 
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2c3d4e5-f6a7-8901-bcde-f23456789012', 'accepted', NOW()),
    ('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'accepted', NOW())
ON CONFLICT DO NOTHING;

-- Luca sent friend request to Mario (pending)
INSERT INTO friendships (user_id, friend_id, status)
VALUES 
    ('c3d4e5f6-a7b8-9012-cdef-345678901234', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'pending')
ON CONFLICT DO NOTHING;

-- ====================================
-- CREATE DUELS
-- ====================================

-- Get exercise IDs
DO $$
DECLARE
    push_up_id UUID;
    squat_id UUID;
    plank_id UUID;
    burpee_id UUID;
BEGIN
    SELECT id INTO push_up_id FROM exercises WHERE code = 'push_up';
    SELECT id INTO squat_id FROM exercises WHERE code = 'squat';
    SELECT id INTO plank_id FROM exercises WHERE code = 'plank';
    SELECT id INTO burpee_id FROM exercises WHERE code = 'burpee';

    -- Duel 1: Active 1v1 (Mario vs Giulia - Push-ups)
    INSERT INTO duels (
        type, status, challenger_id, challenged_id, exercise_id,
        difficulty, wager_xp, reward_xp, target_reps,
        starts_at, expires_at
    ) VALUES (
        '1v1', 'active',
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        'b2c3d4e5-f6a7-8901-bcde-f23456789012',
        push_up_id,
        'medium', 100, 150, 50,
        NOW() - INTERVAL '1 hour',
        NOW() + INTERVAL '23 hours'
    );

    -- Duel 2: Pending 1v1 (Giulia challenges Luca - Squats)
    INSERT INTO duels (
        type, status, challenger_id, challenged_id, exercise_id,
        difficulty, wager_xp, reward_xp, target_reps,
        expires_at
    ) VALUES (
        '1v1', 'pending',
        'b2c3d4e5-f6a7-8901-bcde-f23456789012',
        'c3d4e5f6-a7b8-9012-cdef-345678901234',
        squat_id,
        'easy', 50, 75, 30,
        NOW() + INTERVAL '48 hours'
    );

    -- Duel 3: Open challenge (Mario - Plank)
    INSERT INTO duels (
        type, status, challenger_id, exercise_id,
        difficulty, wager_xp, reward_xp, target_time,
        max_participants, current_participants,
        expires_at
    ) VALUES (
        'open', 'open',
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        plank_id,
        'hard', 200, 300, 120,
        5, 1,
        NOW() + INTERVAL '72 hours'
    );

    -- Duel 4: Completed 1v1 (Mario won against Giulia - Burpees)
    INSERT INTO duels (
        type, status, challenger_id, challenged_id, exercise_id,
        difficulty, wager_xp, reward_xp, target_reps,
        winner_id, completed_at
    ) VALUES (
        '1v1', 'completed',
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        'b2c3d4e5-f6a7-8901-bcde-f23456789012',
        burpee_id,
        'extreme', 150, 225, 20,
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        NOW() - INTERVAL '2 days'
    );

    -- Duel 5: Tournament (Open)
    INSERT INTO duels (
        type, status, challenger_id, exercise_id,
        difficulty, wager_xp, reward_xp, target_reps,
        max_participants, current_participants,
        expires_at
    ) VALUES (
        'tournament', 'open',
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        push_up_id,
        'medium', 100, 500, 100,
        16, 3,
        NOW() + INTERVAL '7 days'
    );
END $$;

-- ====================================
-- CREATE PERFORMANCES
-- ====================================

-- Add some performance history
DO $$
DECLARE
    push_up_id UUID;
    squat_id UUID;
    plank_id UUID;
BEGIN
    SELECT id INTO push_up_id FROM exercises WHERE code = 'push_up';
    SELECT id INTO squat_id FROM exercises WHERE code = 'squat';
    SELECT id INTO plank_id FROM exercises WHERE code = 'plank';

    -- Mario's performances
    INSERT INTO performances (user_id, exercise_id, reps, duration, form_score, calories_burned, difficulty, performed_at)
    VALUES 
        ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', push_up_id, 75, 120, 92.5, 120, 'hard', NOW() - INTERVAL '1 day'),
        ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', squat_id, 100, 180, 88.0, 150, 'medium', NOW() - INTERVAL '2 days'),
        ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', plank_id, 1, 180, 95.0, 45, 'extreme', NOW() - INTERVAL '3 days');

    -- Giulia's performances
    INSERT INTO performances (user_id, exercise_id, reps, duration, form_score, calories_burned, difficulty, performed_at)
    VALUES 
        ('b2c3d4e5-f6a7-8901-bcde-f23456789012', push_up_id, 45, 90, 85.5, 80, 'medium', NOW() - INTERVAL '1 day'),
        ('b2c3d4e5-f6a7-8901-bcde-f23456789012', plank_id, 1, 120, 90.0, 30, 'hard', NOW() - INTERVAL '2 days');

    -- Luca's performances
    INSERT INTO performances (user_id, exercise_id, reps, duration, form_score, calories_burned, difficulty, performed_at)
    VALUES 
        ('c3d4e5f6-a7b8-9012-cdef-345678901234', push_up_id, 20, 60, 78.0, 40, 'easy', NOW() - INTERVAL '1 day'),
        ('c3d4e5f6-a7b8-9012-cdef-345678901234', squat_id, 30, 90, 80.5, 60, 'easy', NOW() - INTERVAL '2 days');
END $$;

-- ====================================
-- CREATE ACHIEVEMENTS & BADGES
-- ====================================

-- Insert achievements if not exists
INSERT INTO achievements (code, type, name, name_it, description, description_it, icon, target_value, xp_reward, coin_reward)
VALUES 
    ('first_duel', 'milestone', 'First Duel', 'Primo Duello', 'Complete your first duel', 'Completa il tuo primo duello', '⚔️', 1, 50, 100),
    ('win_streak_5', 'streak', 'Hot Streak', 'Serie Vincente', 'Win 5 duels in a row', 'Vinci 5 duelli di fila', '🔥', 5, 200, 500),
    ('perfect_form', 'perfect', 'Perfect Form', 'Forma Perfetta', 'Score 95+ form score', 'Ottieni 95+ nel punteggio forma', '✨', 95, 100, 200),
    ('century_club', 'milestone', 'Century Club', 'Club del Secolo', 'Complete 100 exercises', 'Completa 100 esercizi', '💯', 100, 500, 1000),
    ('early_bird', 'milestone', 'Early Bird', 'Mattiniero', 'Exercise before 7 AM', 'Allenati prima delle 7', '🌅', 1, 50, 100),
    ('week_warrior', 'streak', 'Week Warrior', 'Guerriero Settimanale', '7 day streak', 'Serie di 7 giorni', '📅', 7, 300, 600)
ON CONFLICT (code) DO NOTHING;

-- Insert badges if not exists
INSERT INTO badges (code, name, name_it, description, description_it, icon, rarity)
VALUES 
    ('rookie', 'Rookie', 'Principiante', 'Welcome to FitDuel!', 'Benvenuto in FitDuel!', '🌟', 'common'),
    ('pushup_master', 'Push-up Master', 'Maestro dei Push-up', '1000 push-ups completed', '1000 push-up completati', '💪', 'rare'),
    ('plank_king', 'Plank King', 'Re del Plank', '10 minutes total plank', '10 minuti totali di plank', '👑', 'epic'),
    ('social_butterfly', 'Social Butterfly', 'Social Butterfly', 'Have 10 friends', 'Hai 10 amici', '🦋', 'rare'),
    ('champion', 'Champion', 'Campione', 'Win a tournament', 'Vinci un torneo', '🏆', 'legendary')
ON CONFLICT (code) DO NOTHING;

-- Assign some achievements to users
DO $$
DECLARE
    first_duel_id UUID;
    perfect_form_id UUID;
    week_warrior_id UUID;
BEGIN
    SELECT id INTO first_duel_id FROM achievements WHERE code = 'first_duel';
    SELECT id INTO perfect_form_id FROM achievements WHERE code = 'perfect_form';
    SELECT id INTO week_warrior_id FROM achievements WHERE code = 'week_warrior';

    -- Mario's achievements
    INSERT INTO user_achievements (user_id, achievement_id, progress, unlocked_at, claimed_at)
    VALUES 
        ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', first_duel_id, 1, NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
        ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', perfect_form_id, 95, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
        ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', week_warrior_id, 15, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

    -- Giulia's achievements
    INSERT INTO user_achievements (user_id, achievement_id, progress, unlocked_at, claimed_at)
    VALUES 
        ('b2c3d4e5-f6a7-8901-bcde-f23456789012', first_duel_id, 1, NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
        ('b2c3d4e5-f6a7-8901-bcde-f23456789012', week_warrior_id, 8, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days');

    -- Luca's achievements
    INSERT INTO user_achievements (user_id, achievement_id, progress, unlocked_at, claimed_at)
    VALUES 
        ('c3d4e5f6-a7b8-9012-cdef-345678901234', first_duel_id, 1, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days');
END $$;

-- Assign badges
DO $$
DECLARE
    rookie_badge_id UUID;
    pushup_master_id UUID;
BEGIN
    SELECT id INTO rookie_badge_id FROM badges WHERE code = 'rookie';
    SELECT id INTO pushup_master_id FROM badges WHERE code = 'pushup_master';

    -- Everyone gets rookie badge
    INSERT INTO user_badges (user_id, badge_id, is_equipped)
    VALUES 
        ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', rookie_badge_id, false),
        ('b2c3d4e5-f6a7-8901-bcde-f23456789012', rookie_badge_id, true),
        ('c3d4e5f6-a7b8-9012-cdef-345678901234', rookie_badge_id, true);

    -- Mario gets push-up master
    INSERT INTO user_badges (user_id, badge_id, is_equipped)
    VALUES 
        ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', pushup_master_id, true);
END $$;

-- ====================================
-- CREATE XP TRANSACTIONS
-- ====================================

-- Add some XP history
INSERT INTO xp_transactions (user_id, amount, reason, reference_type, created_at)
VALUES 
    -- Mario
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 100, 'Daily login bonus', 'daily_bonus', NOW()),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 225, 'Duel victory', 'duel', NOW() - INTERVAL '2 days'),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 300, 'Week streak achieved', 'achievement', NOW() - INTERVAL '1 day'),
    
    -- Giulia
    ('b2c3d4e5-f6a7-8901-bcde-f23456789012', 100, 'Daily login bonus', 'daily_bonus', NOW() - INTERVAL '1 day'),
    ('b2c3d4e5-f6a7-8901-bcde-f23456789012', 50, 'Exercise completed', 'exercise', NOW() - INTERVAL '1 day'),
    
    -- Luca
    ('c3d4e5f6-a7b8-9012-cdef-345678901234', 100, 'Welcome bonus', 'welcome', NOW() - INTERVAL '7 days'),
    ('c3d4e5f6-a7b8-9012-cdef-345678901234', 50, 'First duel completed', 'achievement', NOW() - INTERVAL '3 days');

-- ====================================
-- CREATE NOTIFICATIONS
-- ====================================

INSERT INTO notifications (user_id, type, title, message, data, created_at)
VALUES 
    -- Mario's notifications
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'friend_request', 'Nuova richiesta di amicizia', 'Luca Verdi vuole essere tuo amico!', '{"from_user_id": "c3d4e5f6-a7b8-9012-cdef-345678901234"}', NOW() - INTERVAL '2 hours'),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'level_up', 'Level Up! 🎉', 'Congratulazioni! Hai raggiunto il livello 25!', '{"new_level": 25}', NOW() - INTERVAL '1 day'),
    
    -- Giulia's notifications
    ('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'duel_invite', 'Sfida in arrivo!', 'Mario ti ha sfidato a Push-ups!', '{"duel_id": "pending"}', NOW() - INTERVAL '1 hour'),
    
    -- Luca's notifications
    ('c3d4e5f6-a7b8-9012-cdef-345678901234', 'duel_invite', 'Nuova sfida!', 'Giulia ti ha sfidato a Squats!', '{"duel_id": "pending"}', NOW() - INTERVAL '30 minutes'),
    ('c3d4e5f6-a7b8-9012-cdef-345678901234', 'achievement_unlocked', 'Achievement sbloccato!', 'Hai completato il tuo primo duello!', '{"achievement": "first_duel"}', NOW() - INTERVAL '3 days');

-- ====================================
-- CREATE TEAM
-- ====================================

INSERT INTO teams (name, description, leader_id, max_members, current_members, total_xp)
VALUES 
    ('FitDuel Warriors', 'Il team ufficiale dei guerrieri di FitDuel! 💪', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 50, 3, 77800);

-- Add team members
DO $$
DECLARE
    team_id UUID;
BEGIN
    SELECT id INTO team_id FROM teams WHERE name = 'FitDuel Warriors';
    
    INSERT INTO team_members (team_id, user_id, role, contribution_xp)
    VALUES 
        (team_id, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'leader', 62500),
        (team_id, 'b2c3d4e5-f6a7-8901-bcde-f23456789012', 'officer', 14400),
        (team_id, 'c3d4e5f6-a7b8-9012-cdef-345678901234', 'member', 900);
END $$;

-- ====================================
-- CREATE LEADERBOARD ENTRIES
-- ====================================

DO $$
DECLARE
    push_up_id UUID;
BEGIN
    SELECT id INTO push_up_id FROM exercises WHERE code = 'push_up';
    
    -- Weekly leaderboard
    INSERT INTO leaderboard_global (user_id, period, exercise_id, score, rank, period_start, period_end, data)
    VALUES 
        ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'weekly', push_up_id, 750, 1, CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE, '{"total_reps": 750, "best_session": 125}'),
        ('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'weekly', push_up_id, 450, 2, CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE, '{"total_reps": 450, "best_session": 75}'),
        ('c3d4e5f6-a7b8-9012-cdef-345678901234', 'weekly', push_up_id, 140, 3, CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE, '{"total_reps": 140, "best_session": 25}');
    
    -- All-time leaderboard
    INSERT INTO leaderboard_global (user_id, period, score, rank, period_start, period_end, data)
    VALUES 
        ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'all_time', 62500, 1, '2024-01-01', '2099-12-31', '{"total_xp": 62500, "level": 25}'),
        ('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'all_time', 14400, 2, '2024-01-01', '2099-12-31', '{"total_xp": 14400, "level": 12}'),
        ('c3d4e5f6-a7b8-9012-cdef-345678901234', 'all_time', 900, 3, '2024-01-01', '2099-12-31', '{"total_xp": 900, "level": 3}');
END $$;

-- ====================================
-- OUTPUT SUMMARY
-- ====================================

DO $$
BEGIN
    RAISE NOTICE '====================================';
    RAISE NOTICE 'SEED DATA LOADED SUCCESSFULLY!';
    RAISE NOTICE '====================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Test Users Created:';
    RAISE NOTICE '  • mario@demo.fitduel (password: Demo123!)';
    RAISE NOTICE '  • giulia@demo.fitduel (password: Demo123!)';
    RAISE NOTICE '  • luca@demo.fitduel (password: Demo123!)';
    RAISE NOTICE '';
    RAISE NOTICE 'Data Created:';
    RAISE NOTICE '  • 3 User profiles with stats';
    RAISE NOTICE '  • 5 Duels (various types and states)';
    RAISE NOTICE '  • 7 Performance records';
    RAISE NOTICE '  • 6 Achievements assigned';
    RAISE NOTICE '  • 4 Badges assigned';
    RAISE NOTICE '  • 7 XP transactions';
    RAISE NOTICE '  • 5 Notifications';
    RAISE NOTICE '  • 1 Team with 3 members';
    RAISE NOTICE '  • 6 Leaderboard entries';
    RAISE NOTICE '  • 2 Friendships';
    RAISE NOTICE '';
    RAISE NOTICE 'You can now login with the test accounts!';
    RAISE NOTICE '====================================';
END $$;