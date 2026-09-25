-- ========================================================================
-- Hermes.io — Complete Supabase PostgreSQL Production Schema
-- Run this SQL in your Supabase Project: SQL Editor -> New Query -> Run
-- ========================================================================

-- Enable necessary PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================================================
-- 1. UTILITY FUNCTIONS & TRIGGERS
-- ========================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================================================
-- 2. USERS TABLE
-- Stores user credentials, hashed passwords, PBKDF2 salts, and profiles.
-- Supports standard UUIDs, custom demo IDs (usr_demo_thanatos_001), and usr_guest.
-- ========================================================================

CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY DEFAULT ('usr_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16)),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL DEFAULT '',
    avatar TEXT,
    role TEXT DEFAULT 'Learner',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS tr_users_updated_at ON public.users;
CREATE TRIGGER tr_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================================================
-- 3. SESSIONS TABLE
-- Fast server-side session management for authenticated user sessions.
-- ========================================================================

CREATE TABLE IF NOT EXISTS public.sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- ========================================================================
-- 4. ROADMAPS TABLE
-- Stores unique user-generated learning roadmaps and curated templates.
-- Includes full recursive nodes graph, time rollups, and recommendation tags.
-- ========================================================================

CREATE TABLE IF NOT EXISTS public.roadmaps (
    id TEXT PRIMARY KEY DEFAULT ('rdm_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16)),
    user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    goal TEXT DEFAULT '',
    target_role TEXT DEFAULT '',
    interests TEXT DEFAULT '',
    skill_level TEXT DEFAULT 'Beginner',
    skill_details TEXT DEFAULT '',
    engine TEXT DEFAULT 'hermes-ai',
    domain TEXT DEFAULT 'general',
    skill_count INT DEFAULT 0,
    overall_progress INT DEFAULT 0,
    total_hours NUMERIC DEFAULT 0,
    completed_hours NUMERIC DEFAULT 0,
    nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS tr_roadmaps_updated_at ON public.roadmaps;
CREATE TRIGGER tr_roadmaps_updated_at
    BEFORE UPDATE ON public.roadmaps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================================================
-- 5. QUIZ RESULTS TABLE
-- Tracks quizzes taken by users, question answers, scores, and mastery badges.
-- ========================================================================

CREATE TABLE IF NOT EXISTS public.quiz_results (
    id TEXT PRIMARY KEY DEFAULT ('qz_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16)),
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    roadmap_id TEXT REFERENCES public.roadmaps(id) ON DELETE CASCADE,
    module_title TEXT NOT NULL,
    score INT NOT NULL DEFAULT 0,
    total_questions INT NOT NULL DEFAULT 0,
    percentage INT NOT NULL DEFAULT 0,
    passed BOOLEAN DEFAULT FALSE,
    answers JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================================================
-- 6. BOOKMARKS & FAVORITES TABLE
-- Allows users to bookmark/star user-generated or curated roadmaps.
-- ========================================================================

CREATE TABLE IF NOT EXISTS public.bookmarks (
    id TEXT PRIMARY KEY DEFAULT ('bmk_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16)),
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    roadmap_id TEXT NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_roadmap_bookmark UNIQUE (user_id, roadmap_id)
);

-- ========================================================================
-- 7. APPLICATION CONFIGURATION & SETTINGS
-- Stores dynamic runtime AI configuration and environment overrides.
-- ========================================================================

CREATE TABLE IF NOT EXISTS public.app_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS tr_app_config_updated_at ON public.app_config;
CREATE TRIGGER tr_app_config_updated_at
    BEFORE UPDATE ON public.app_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================================================
-- 8. PERFORMANCE INDEXES
-- ========================================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON public.sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_roadmaps_user_id ON public.roadmaps(user_id);
CREATE INDEX IF NOT EXISTS idx_roadmaps_created_at ON public.roadmaps(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_user_id ON public.quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_roadmap_id ON public.quiz_results(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);

-- ========================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- Enables Row Level Security and grants required access for Hermes backend.
-- ========================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Allow Hermes backend service/anon requests full operational access
DROP POLICY IF EXISTS "Hermes service access on users" ON public.users;
CREATE POLICY "Hermes service access on users" ON public.users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Hermes service access on sessions" ON public.sessions;
CREATE POLICY "Hermes service access on sessions" ON public.sessions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Hermes service access on roadmaps" ON public.roadmaps;
CREATE POLICY "Hermes service access on roadmaps" ON public.roadmaps FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Hermes service access on quiz_results" ON public.quiz_results;
CREATE POLICY "Hermes service access on quiz_results" ON public.quiz_results FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Hermes service access on bookmarks" ON public.bookmarks;
CREATE POLICY "Hermes service access on bookmarks" ON public.bookmarks FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Hermes service access on app_config" ON public.app_config;
CREATE POLICY "Hermes service access on app_config" ON public.app_config FOR ALL USING (true) WITH CHECK (true);

-- ========================================================================
-- 10. PRE-SEEDED DEMO USERS & GUEST IDENTITY
-- ========================================================================

-- Guest user entry to preserve foreign key constraints for unauthenticated roadmaps
INSERT INTO public.users (id, name, email, password_hash, salt, avatar, role)
VALUES (
    'usr_guest',
    'Guest Learner',
    'guest@hermes.io',
    'guest_no_direct_login',
    'guest_salt',
    'https://api.dicebear.com/7.x/bottts/svg?seed=guest',
    'Guest'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    avatar = EXCLUDED.avatar;

-- Demo User 1: Thanatos (Frontend Specialist)
-- Password: thanatos123
INSERT INTO public.users (id, name, email, password_hash, salt, avatar, role)
VALUES (
    'usr_demo_thanatos_001',
    'Thanatos (Frontend Specialist)',
    'thanatos@hermes.io',
    'd50e2dec9a5a93679ce57bc106667709db800e5c17597bc13a1b54c2a403bfccca84e441fc0c55dac81500dce49549da6a45f5c1b00c5d8160a0f39c2fe7c683',
    '2d5f24f9688b3560c973827b959d1ab5',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'Frontend Specialist'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash,
    salt = EXCLUDED.salt,
    avatar = EXCLUDED.avatar;

-- Demo User 2: Cronus (AI & ML Engineer)
-- Password: cronus123
INSERT INTO public.users (id, name, email, password_hash, salt, avatar, role)
VALUES (
    'usr_demo_cronus_002',
    'Cronus (AI & ML Engineer)',
    'cronus@hermes.io',
    '9401b5545e431010c3e8322a9d946ad7985056ef08751e8cf7e84218ef14eed546a0855a1ce36fca7960e3d0282bdfb764307759327f9440073e11420c7b8efc',
    'eb28e182232e43111f0dbdbbfa0ea854',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'AI & ML Engineer'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash,
    salt = EXCLUDED.salt,
    avatar = EXCLUDED.avatar;
