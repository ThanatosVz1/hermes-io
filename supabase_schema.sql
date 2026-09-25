-- ========================================================================
-- Hermes.io — Complete Supabase PostgreSQL Production Schema (v4.5)
-- Run this SQL in your Supabase Dashboard: SQL Editor -> New Query -> Run
-- ========================================================================

-- Enable essential cryptographic and UUID extensions
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
-- Supports authentication via Email or Username, avatar seeds, PBKDF2 salts,
-- and Overseer terminal identities.
-- ========================================================================

CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY DEFAULT ('usr_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16)),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL DEFAULT '',
    avatar TEXT DEFAULT '',
    role TEXT DEFAULT 'Learner',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Idempotent column additions for existing installations
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar TEXT DEFAULT '';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'Learner';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

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
-- Stores personalized learning roadmaps, curricula milestones, AI trees,
-- hour tracking, and progress metrics.
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

-- Idempotent column additions for existing installations
ALTER TABLE public.roadmaps ADD COLUMN IF NOT EXISTS goal TEXT DEFAULT '';
ALTER TABLE public.roadmaps ADD COLUMN IF NOT EXISTS target_role TEXT DEFAULT '';
ALTER TABLE public.roadmaps ADD COLUMN IF NOT EXISTS interests TEXT DEFAULT '';
ALTER TABLE public.roadmaps ADD COLUMN IF NOT EXISTS skill_level TEXT DEFAULT 'Beginner';
ALTER TABLE public.roadmaps ADD COLUMN IF NOT EXISTS skill_details TEXT DEFAULT '';
ALTER TABLE public.roadmaps ADD COLUMN IF NOT EXISTS engine TEXT DEFAULT 'hermes-ai';
ALTER TABLE public.roadmaps ADD COLUMN IF NOT EXISTS domain TEXT DEFAULT 'general';
ALTER TABLE public.roadmaps ADD COLUMN IF NOT EXISTS skill_count INT DEFAULT 0;
ALTER TABLE public.roadmaps ADD COLUMN IF NOT EXISTS overall_progress INT DEFAULT 0;
ALTER TABLE public.roadmaps ADD COLUMN IF NOT EXISTS total_hours NUMERIC DEFAULT 0;
ALTER TABLE public.roadmaps ADD COLUMN IF NOT EXISTS completed_hours NUMERIC DEFAULT 0;
ALTER TABLE public.roadmaps ADD COLUMN IF NOT EXISTS nodes JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.roadmaps ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;

DROP TRIGGER IF EXISTS tr_roadmaps_updated_at ON public.roadmaps;
CREATE TRIGGER tr_roadmaps_updated_at
    BEFORE UPDATE ON public.roadmaps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================================================
-- 5. QUIZ RESULTS TABLE
-- Tracks module exams, assessments, question answers, and mastery rates.
-- ========================================================================

CREATE TABLE IF NOT EXISTS public.quiz_results (
    id TEXT PRIMARY KEY DEFAULT ('qz_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16)),
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    roadmap_id TEXT REFERENCES public.roadmaps(id) ON DELETE SET NULL,
    module_title TEXT NOT NULL,
    score INT NOT NULL DEFAULT 0,
    total_questions INT NOT NULL DEFAULT 0,
    percentage INT NOT NULL DEFAULT 0,
    passed BOOLEAN DEFAULT FALSE,
    answers JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================================================
-- 6. BOOKMARKS TABLE
-- Saved or starred learning curricula.
-- ========================================================================

CREATE TABLE IF NOT EXISTS public.bookmarks (
    id TEXT PRIMARY KEY DEFAULT ('bmk_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16)),
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    roadmap_id TEXT NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_roadmap_bookmark UNIQUE (user_id, roadmap_id)
);

-- ========================================================================
-- 7. APPLICATION CONFIG & TELEMETRY
-- Runtime configurations and feature flags.
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
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_name ON public.users(name);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON public.sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_roadmaps_user_id ON public.roadmaps(user_id);
CREATE INDEX IF NOT EXISTS idx_roadmaps_created_at ON public.roadmaps(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_user_id ON public.quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_roadmap_id ON public.quiz_results(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);

-- ========================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- Hermes server uses backend service & anon APIs for client requests.
-- ========================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Idempotent full-access operational policies for backend service keys
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
-- 10. PRE-SEEDED SEED DATA (ACCOUNTS & DEMO TELEMETRY)
-- ========================================================================

-- Guest User (placeholder for non-authenticated actions)
INSERT INTO public.users (id, name, email, username, password_hash, salt, avatar, role)
VALUES (
    'usr_guest',
    'Guest Learner',
    'guest@hermes.io',
    'guest',
    'guest_no_direct_login',
    'guest_salt',
    'https://api.dicebear.com/7.x/bottts/svg?seed=guest',
    'Guest'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    username = EXCLUDED.username,
    avatar = EXCLUDED.avatar;

-- Demo User 1: Thanatos (Password: thanatos123)
INSERT INTO public.users (id, name, email, username, password_hash, salt, avatar, role)
VALUES (
    'usr_demo_thanatos_001',
    'Thanatos',
    'thanatos@hermes.io',
    'thanatos',
    'd50e2dec9a5a93679ce57bc106667709db800e5c17597bc13a1b54c2a403bfccca84e441fc0c55dac81500dce49549da6a45f5c1b00c5d8160a0f39c2fe7c683',
    '2d5f24f9688b3560c973827b959d1ab5',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'Frontend Specialist'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    username = EXCLUDED.username,
    password_hash = EXCLUDED.password_hash,
    salt = EXCLUDED.salt,
    avatar = EXCLUDED.avatar;

-- Demo User 2: Cronus (Password: cronus123)
INSERT INTO public.users (id, name, email, username, password_hash, salt, avatar, role)
VALUES (
    'usr_demo_cronus_002',
    'Cronus',
    'cronus@hermes.io',
    'cronus_dev',
    '9401b5545e431010c3e8322a9d946ad7985056ef08751e8cf7e84218ef14eed546a0855a1ce36fca7960e3d0282bdfb764307759327f9440073e11420c7b8efc',
    'eb28e182232e43111f0dbdbbfa0ea854',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'AI & ML Engineer'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    username = EXCLUDED.username,
    password_hash = EXCLUDED.password_hash,
    salt = EXCLUDED.salt,
    avatar = EXCLUDED.avatar;

-- Secret Terminal Overseer Account (Login: cronus / cronus.xz / cronus.xz@void.vz | Pass: Thanatos.Vz)
INSERT INTO public.users (id, name, email, username, password_hash, salt, avatar, role)
VALUES (
    'usr_overseer_cronus_000',
    'Cronus (Overseer)',
    'cronus.xz@void.vz',
    'cronus',
    '15ff89c8a937a0e69ff81e1948ceca6ea3a479ffce35c91cf9fbf51ec4380f2d48074d2aa0ea23872bb0067cbff54f2a71f08cb4310f8fa56ca52f36f9872e41',
    '7a4c2810be5508a38f36c507c80081d3',
    '',
    'Overseer / Platform Administrator'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    username = EXCLUDED.username,
    role = EXCLUDED.role;

-- Pre-seeded Sample Roadmap for Thanatos
INSERT INTO public.roadmaps (
    id, user_id, title, goal, target_role, interests, skill_level,
    overall_progress, total_hours, completed_hours, nodes
)
VALUES (
    'rdm_fullstack_mastery_001',
    'usr_demo_thanatos_001',
    'Full Stack Web Engineering & Architecture',
    'Become a production-ready senior full stack developer',
    'Full Stack Developer',
    'JavaScript, React, Node.js, PostgreSQL',
    'Intermediate',
    45,
    120,
    54,
    '[
      {
        "id": "node_web_foundations",
        "title": "Modern Web Foundations & Semantic HTML",
        "status": "completed",
        "estimatedHours": 14,
        "progress": 100
      },
      {
        "id": "node_css_mastery",
        "title": "CSS3, Flexbox, Grid & Responsive Design Patterns",
        "status": "completed",
        "estimatedHours": 18,
        "progress": 100
      },
      {
        "id": "node_js_deep_dive",
        "title": "Modern JavaScript ESNext, Asynchronous Programming & DOM",
        "status": "completed",
        "estimatedHours": 22,
        "progress": 100
      },
      {
        "id": "node_react_architecture",
        "title": "React 19 Components, State Hooks & Custom Hooks",
        "status": "in_progress",
        "estimatedHours": 32,
        "progress": 40
      },
      {
        "id": "node_node_backend",
        "title": "Node.js Serverless APIs, Express & REST Principles",
        "status": "not_started",
        "estimatedHours": 20,
        "progress": 0
      },
      {
        "id": "node_postgres_db",
        "title": "PostgreSQL Relational Schema Design & Query Optimization",
        "status": "not_started",
        "estimatedHours": 14,
        "progress": 0
      }
    ]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Pre-seeded Exam Results for Thanatos
INSERT INTO public.quiz_results (
    id, user_id, roadmap_id, module_title, score, total_questions, percentage, passed
)
VALUES 
(
    'qz_demo_seed_001',
    'usr_demo_thanatos_001',
    'rdm_fullstack_mastery_001',
    'Modern Web Foundations & Semantic HTML',
    5,
    5,
    100,
    TRUE
),
(
    'qz_demo_seed_002',
    'usr_demo_thanatos_001',
    'rdm_fullstack_mastery_001',
    'CSS3, Grid & Responsive UI Layouts',
    5,
    5,
    100,
    TRUE
),
(
    'qz_demo_seed_003',
    'usr_demo_thanatos_001',
    'rdm_fullstack_mastery_001',
    'React 19 State & Lifecycle Concepts',
    4,
    5,
    80,
    TRUE
)
ON CONFLICT (id) DO NOTHING;

-- ========================================================================
-- SUCCESS CONFIRMATION
-- ========================================================================
SELECT 
    'Hermes.io PostgreSQL Schema successfully created and verified!' AS status,
    NOW() AS deployed_at;
