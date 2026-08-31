-- ========================================================================
-- Hermes.io — Supabase PostgreSQL Database Schema
-- Run this SQL in your Supabase Project: SQL Editor -> New Query -> Run
-- ========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.sessions (
    token TEXT PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- 3. ROADMAPS TABLE
CREATE TABLE IF NOT EXISTS public.roadmaps (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    goal TEXT,
    target_role TEXT,
    interests TEXT,
    skill_level TEXT DEFAULT 'Beginner',
    skill_details TEXT,
    nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
    overall_progress INT DEFAULT 0,
    total_hours NUMERIC DEFAULT 0,
    completed_hours NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;

-- Allow access for Hermes backend service/anon requests
CREATE POLICY "Allow Hermes service on users" ON public.users FOR ALL USING (true);
CREATE POLICY "Allow Hermes service on sessions" ON public.sessions FOR ALL USING (true);
CREATE POLICY "Allow Hermes service on roadmaps" ON public.roadmaps FOR ALL USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON public.sessions(token);
CREATE INDEX IF NOT EXISTS idx_roadmaps_user_id ON public.roadmaps(user_id);
