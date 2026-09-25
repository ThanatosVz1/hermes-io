// Hermes.io â€” AI-Powered Learning Roadmap Generator Backend
// Pure Node.js HTTP Server with User Auth, Database Persistence & AI Engine

const { spawn } = require('child_process');

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const url = require('node:url');

const PORT = process.env.PORT || 3000;

// ============================================================
// SERVERLESS-AWARE DATA DIRECTORY
// On Vercel: filesystem is read-only except /tmp.
// Supabase is the primary DB; local files are dev fallback.
// ============================================================
const IS_SERVERLESS = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.FUNCTIONS_EMULATOR
);
const DATA_DIR = IS_SERVERLESS ? '/tmp/hermes_data' : path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const ROADMAPS_FILE = path.join(DATA_DIR, 'roadmaps.json');
const CONFIG_FILE = IS_SERVERLESS ? null : path.join(DATA_DIR, 'config.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

// Ensure writable data directory exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (_mkdirErr) {
  // silently skip — /tmp may already exist in serverless
}

// Helpers for Data Access
function readJSON(filePath, defaultValue = []) {
  if (!filePath) return defaultValue;
  try {
    if (!fs.existsSync(filePath)) return defaultValue;
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    return defaultValue;
  }
}

function writeJSON(filePath, data) {
  if (!filePath) return false; // null path (e.g. CONFIG_FILE on serverless)
  try {
    // Ensure parent directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err.message);
    return false;
  }
}

// Password hashing utilities
function hashPassword(password, salt) {
  if (!salt) salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha256').toString('hex');
  return { hash, salt };
}

function verifyPassword(password, hash, salt) {
  const check = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha256').toString('hex');
  return check === hash;
}

// ==========================================
// SUPABASE CLIENT & CLOUD DATABASE BRIDGE
// ==========================================

function getSupabaseConfig() {
  // On serverless: CONFIG_FILE is null, so always read from env vars
  const config = CONFIG_FILE ? readJSON(CONFIG_FILE, {}) : {};
  const rawUrl = process.env.SUPABASE_URL || config.supabaseUrl || '';
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || config.supabaseKey || '';
  return { url: rawUrl.replace(/\/+$/, ''), key: rawKey };
}

async function supabaseRequest(table, query = '', method = 'GET', body = null, prefer = 'return=representation') {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) return null;

  try {
    const endpoint = `${url}/rest/v1/${table}${query ? `?${query}` : ''}`;
    const headers = {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': prefer
    };

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(endpoint, options);
    if (!res.ok) {
      const err = await res.text();
      console.warn(`Supabase API error (${res.status}) on ${table}:`, err);
      return null;
    }

    if (method === 'DELETE' || res.status === 204) return true;
    return await res.json();
  } catch (err) {
    console.warn(`Supabase connection failed on ${table}:`, err.message);
    return null;
  }
}
// ============================================================
// SUPABASE-BACKED DATABASE LAYER
// All user, session, and roadmap operations go through Supabase
// when credentials are available, falling back to local JSON files.
// This makes Vercel deployment fully functional without a persistent filesystem.
// ============================================================

// --- USERS ---
async function dbGetUsers() {
  const rows = await supabaseRequest('users', 'select=id,name,email,password_hash,salt,avatar,created_at,updated_at&order=created_at.asc');
  if (rows && Array.isArray(rows)) {
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      email: r.email,
      passwordHash: r.password_hash,
      salt: r.salt || '',
      avatar: r.avatar || '',
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));
  }
  return readJSON(USERS_FILE, []);
}

async function dbGetUserByEmail(email) {
  const norm = email.toLowerCase().trim();
  const rows = await supabaseRequest('users', `select=id,name,email,password_hash,salt,avatar,created_at,updated_at&email=eq.${encodeURIComponent(norm)}&limit=1`);
  if (rows && rows.length > 0) {
    const r = rows[0];
    return { id: r.id, name: r.name, email: r.email, passwordHash: r.password_hash, salt: r.salt || '', avatar: r.avatar || '', createdAt: r.created_at, updatedAt: r.updated_at };
  }
  // fallback to local
  const local = readJSON(USERS_FILE, []);
  return local.find(u => u.email.toLowerCase() === norm) || null;
}

async function dbGetUserById(userId) {
  const rows = await supabaseRequest('users', `select=id,name,email,password_hash,salt,avatar,created_at,updated_at&id=eq.${encodeURIComponent(userId)}&limit=1`);
  if (rows && rows.length > 0) {
    const r = rows[0];
    return { id: r.id, name: r.name, email: r.email, passwordHash: r.password_hash, salt: r.salt || '', avatar: r.avatar || '', createdAt: r.created_at, updatedAt: r.updated_at };
  }
  const local = readJSON(USERS_FILE, []);
  return local.find(u => u.id === userId) || null;
}

async function dbCreateUser(user) {
  const payload = {
    id: user.id,
    name: user.name,
    email: user.email.toLowerCase().trim(),
    password_hash: user.passwordHash,
    salt: user.salt,
    avatar: user.avatar || '',
    created_at: user.createdAt,
    updated_at: user.updatedAt
  };
  const result = await supabaseRequest('users', '', 'POST', payload, 'return=representation,resolution=merge-duplicates');
  if (result) return user;
  // fallback
  const users = readJSON(USERS_FILE, []);
  if (!users.find(u => u.email === user.email)) {
    users.push(user);
    writeJSON(USERS_FILE, users);
  }
  return user;
}

// --- SESSIONS ---
async function dbGetSession(token) {
  const rows = await supabaseRequest('sessions', `select=token,user_id,expires_at,created_at&token=eq.${encodeURIComponent(token)}&limit=1`);
  if (rows && rows.length > 0) {
    const r = rows[0];
    return { token: r.token, userId: r.user_id, expiresAt: r.expires_at, createdAt: r.created_at };
  }
  const local = readJSON(SESSIONS_FILE, []);
  return local.find(s => s.token === token) || null;
}

async function dbCreateSession(token, userId, expiresAt) {
  const payload = { token, user_id: userId, expires_at: expiresAt, created_at: new Date().toISOString() };
  await supabaseRequest('sessions', '', 'POST', payload, 'return=minimal,resolution=merge-duplicates');
  // Also write to local as fallback
  const sessions = readJSON(SESSIONS_FILE, []);
  sessions.push({ token, userId, expiresAt, createdAt: new Date().toISOString() });
  writeJSON(SESSIONS_FILE, sessions);
  return token;
}

async function dbDeleteSession(token) {
  await supabaseRequest('sessions', `token=eq.${encodeURIComponent(token)}`, 'DELETE');
  const sessions = readJSON(SESSIONS_FILE, []);
  writeJSON(SESSIONS_FILE, sessions.filter(s => s.token !== token));
}

// --- ROADMAPS ---
async function dbGetRoadmaps(userId) {
  let query = 'select=id,user_id,title,goal,target_role,interests,skill_level,overall_progress,total_hours,completed_hours,nodes,created_at,updated_at&order=created_at.desc';
  if (userId && userId !== 'usr_guest') {
    query += `&user_id=eq.${encodeURIComponent(userId)}`;
  } else {
    query += `&user_id=eq.usr_guest`;
  }
  const rows = await supabaseRequest('roadmaps', query);
  if (rows && Array.isArray(rows)) {
    return rows.map(r => ({
      id: r.id, userId: r.user_id, title: r.title, goal: r.goal || '',
      targetRole: r.target_role || '', interests: r.interests || '',
      skillLevel: r.skill_level || 'Beginner', overallProgress: r.overall_progress || 0,
      totalHours: r.total_hours || 0, completedHours: r.completed_hours || 0,
      nodes: r.nodes || [], createdAt: r.created_at, updatedAt: r.updated_at
    }));
  }
  const local = readJSON(ROADMAPS_FILE, []);
  return local.filter(r => r.userId === userId);
}

async function dbGetRoadmapById(id) {
  const rows = await supabaseRequest('roadmaps', `select=*&id=eq.${encodeURIComponent(id)}&limit=1`);
  if (rows && rows.length > 0) {
    const r = rows[0];
    return {
      id: r.id, userId: r.user_id, title: r.title, goal: r.goal || '',
      targetRole: r.target_role || '', interests: r.interests || '',
      skillLevel: r.skill_level || 'Beginner', skillDetails: r.skill_details || '',
      engine: r.engine || 'hermes-ai', domain: r.domain || 'general',
      overallProgress: r.overall_progress || 0, totalHours: r.total_hours || 0,
      completedHours: r.completed_hours || 0, nodes: r.nodes || [],
      createdAt: r.created_at, updatedAt: r.updated_at
    };
  }
  const local = readJSON(ROADMAPS_FILE, []);
  return local.find(r => r.id === id) || null;
}

async function dbSaveRoadmap(roadmap) {
  const payload = {
    id: roadmap.id,
    user_id: roadmap.userId || 'usr_guest',
    title: roadmap.title,
    goal: roadmap.goal || '',
    target_role: roadmap.targetRole || '',
    interests: typeof roadmap.interests === 'string' ? roadmap.interests : (Array.isArray(roadmap.interests) ? roadmap.interests.join(', ') : ''),
    skill_level: roadmap.skillLevel || 'Beginner',
    skill_details: roadmap.skillDetails || '',
    engine: roadmap.engine || 'hermes-ai',
    domain: roadmap.domain || 'general',
    skill_count: roadmap.skillCount || (roadmap.nodes || []).length,
    overall_progress: roadmap.overallProgress || 0,
    total_hours: roadmap.totalHours || 0,
    completed_hours: roadmap.completedHours || 0,
    nodes: roadmap.nodes || [],
    created_at: roadmap.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  const result = await supabaseRequest('roadmaps', '', 'POST', payload, 'return=minimal,resolution=merge-duplicates');
  if (!result) {
    // Fallback: save to local file
    const roadmaps = readJSON(ROADMAPS_FILE, []);
    const idx = roadmaps.findIndex(r => r.id === roadmap.id);
    if (idx >= 0) roadmaps[idx] = roadmap;
    else roadmaps.unshift(roadmap);
    writeJSON(ROADMAPS_FILE, roadmaps);
  }
  return roadmap;
}

async function dbUpdateRoadmap(id, updates) {
  const payload = {};
  if (updates.title) payload.title = updates.title;
  if (updates.goal) payload.goal = updates.goal;
  if (updates.targetRole !== undefined) payload.target_role = updates.targetRole;
  if (updates.nodes && Array.isArray(updates.nodes)) payload.nodes = updates.nodes;
  if (updates.overallProgress !== undefined) payload.overall_progress = updates.overallProgress;
  if (updates.totalHours !== undefined) payload.total_hours = updates.totalHours;
  if (updates.completedHours !== undefined) payload.completed_hours = updates.completedHours;
  payload.updated_at = new Date().toISOString();

  await supabaseRequest('roadmaps', `id=eq.${encodeURIComponent(id)}`, 'PATCH', payload, 'return=minimal');

  // Also update local
  const roadmaps = readJSON(ROADMAPS_FILE, []);
  const idx = roadmaps.findIndex(r => r.id === id);
  if (idx >= 0) {
    if (updates.title) roadmaps[idx].title = updates.title;
    if (updates.goal) roadmaps[idx].goal = updates.goal;
    if (updates.targetRole !== undefined) roadmaps[idx].targetRole = updates.targetRole;
    if (updates.nodes && Array.isArray(updates.nodes)) roadmaps[idx].nodes = updates.nodes;
    roadmaps[idx].updatedAt = new Date().toISOString();
    writeJSON(ROADMAPS_FILE, roadmaps);
    return roadmaps[idx];
  }
  return null;
}

async function dbDeleteRoadmap(id) {
  await supabaseRequest('roadmaps', `id=eq.${encodeURIComponent(id)}`, 'DELETE');
  const roadmaps = readJSON(ROADMAPS_FILE, []);
  writeJSON(ROADMAPS_FILE, roadmaps.filter(r => r.id !== id));
}

async function dbClaimGuestRoadmaps(roadmapIds, userId) {
  for (const id of roadmapIds) {
    await supabaseRequest('roadmaps', `id=eq.${encodeURIComponent(id)}`, 'PATCH', { user_id: userId, updated_at: new Date().toISOString() }, 'return=minimal');
  }
  const roadmaps = readJSON(ROADMAPS_FILE, []);
  roadmaps.forEach(r => {
    if (roadmapIds.includes(r.id)) { r.userId = userId; r.updatedAt = new Date().toISOString(); }
  });
  writeJSON(ROADMAPS_FILE, roadmaps);
}



// Initialize seed data if empty
function initializeSeedData() {
  let users = readJSON(USERS_FILE, []);
  let roadmaps = readJSON(ROADMAPS_FILE, []);
  let config = readJSON(CONFIG_FILE, null);

  if (!config) {
    const initialConfig = {
      provider: process.env.AI_PROVIDER || 'offline', // 'gemini', 'claude', 'openai', 'offline'
      geminiApiKey: process.env.GEMINI_API_KEY || '',
      claudeApiKey: process.env.ANTHROPIC_API_KEY || '',
      openaiApiKey: process.env.OPENAI_API_KEY || '',
      supabaseUrl: process.env.SUPABASE_URL || '',
      supabaseKey: process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
      claudeModel: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
      openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini'
    };
    writeJSON(CONFIG_FILE, initialConfig);
  }

  if (users.length === 0 || !users.some(u => u.email === 'thanatos@hermes.io')) {
    const thanatosPass = hashPassword('thanatos123');
    const thanatosUser = {
      id: 'usr_demo_thanatos_001',
      name: 'Thanatos (Frontend Specialist)',
      email: 'thanatos@hermes.io',
      passwordHash: thanatosPass.hash,
      salt: thanatosPass.salt,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      updatedAt: new Date().toISOString()
    };

    const cronusPass = hashPassword('cronus123');
    const cronusUser = {
      id: 'usr_demo_cronus_002',
      name: 'Cronus (AI & ML Engineer)',
      email: 'cronus@hermes.io',
      passwordHash: cronusPass.hash,
      salt: cronusPass.salt,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      updatedAt: new Date().toISOString()
    };

    users = [thanatosUser, cronusUser];
    writeJSON(USERS_FILE, users);

    // Seed roadmaps for Thanatos
    const thanatosRoadmap = {
      id: 'rdm_demo_frontend_001',
      userId: thanatosUser.id,
      title: 'Frontend Developer (React 19 & Modern UI) Mastery',
      goal: 'Become a Senior Frontend Specialist crafting world-class reactive web applications',
      targetRole: 'Frontend Specialist',
      interests: 'Web Dev, Design Systems',
      skillLevel: 'Intermediate',
      skillDetails: 'Strong TypeScript fundamentals, mastering React 19 compiler, Next.js, and design tokens.',
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: [
        {
          id: 'node_fe_1',
          title: 'Advanced JavaScript & Async Programming',
          description: 'Master closures, event loop, Promises, Async/Await, and modern ES2024+ features.',
          status: 'completed',
          progress: 100,
          estimatedHours: 15,
          resources: [
            { type: 'docs', title: 'JavaScript.info: The Modern JavaScript Tutorial', url: 'https://javascript.info/', isFree: true },
            { type: 'video', title: 'JavaScript Event Loop Visualized', url: 'https://www.youtube.com/watch?v=8aGhZQkoFbQ', isFree: true }
          ],
          children: [
            {
              id: 'node_fe_1_1',
              title: 'Closures, Scope & Prototypes',
              description: 'Understand lexical environment, closure memory mechanics, and prototype inheritance.',
              status: 'completed',
              progress: 100,
              estimatedHours: 5,
              resources: [{ type: 'docs', title: 'MDN Closures Guide', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures', isFree: true }],
              children: [],
              isExpandable: false,
              isExpanded: false
            },
            {
              id: 'node_fe_1_2',
              title: 'Asynchronous JavaScript & Event Loop',
              description: 'Microtasks vs Macrotasks, Promises, and robust async error handling.',
              status: 'completed',
              progress: 100,
              estimatedHours: 10,
              resources: [{ type: 'article', title: 'Deep dive into V8 Event Loop', url: 'https://dev.to/', isFree: true }],
              children: [],
              isExpandable: false,
              isExpanded: false
            }
          ],
          isExpandable: true,
          isExpanded: true
        },
        {
          id: 'node_fe_2',
          title: 'React 19 & Component Architecture',
          description: 'Deep dive into Hooks, Server Components, suspense, and scalable component compositions.',
          status: 'in_progress',
          progress: 50,
          estimatedHours: 25,
          resources: [
            { type: 'docs', title: 'React.dev Official Documentation & Tutorials', url: 'https://react.dev/learn', isFree: true },
            { type: 'course', title: 'Full Stack Open â€” Deep Dive Into React', url: 'https://fullstackopen.com/en/', isFree: true }
          ],
          children: [
            {
              id: 'node_fe_2_1',
              title: 'Hooks Mechanics (useState, useEffect, useMemo, custom hooks)',
              description: 'State lifecycle, dependency arrays, and custom hook encapsulation.',
              status: 'completed',
              progress: 100,
              estimatedHours: 12,
              resources: [{ type: 'docs', title: 'React Hooks API Reference', url: 'https://react.dev/reference/react', isFree: true }],
              children: [],
              isExpandable: false,
              isExpanded: false
            },
            {
              id: 'node_fe_2_2',
              title: 'Context API, Zustand & State Management',
              description: 'Managing global client state without unnecessary re-renders.',
              status: 'not_started',
              progress: 0,
              estimatedHours: 13,
              resources: [{ type: 'docs', title: 'Zustand State Management Guide', url: 'https://zustand-demo.pmnd.rs/', isFree: true }],
              children: [],
              isExpandable: false,
              isExpanded: false
            }
          ],
          isExpandable: true,
          isExpanded: true
        },
        {
          id: 'node_fe_3',
          title: 'Modern CSS, Tailwind CSS & Design Systems',
          description: 'Build responsive design systems with tokens, CSS custom properties, and Tailwind utility classes.',
          status: 'not_started',
          progress: 0,
          estimatedHours: 18,
          resources: [
            { type: 'docs', title: 'Tailwind CSS Official Documentation', url: 'https://tailwindcss.com/docs', isFree: true },
            { type: 'practice', title: 'Frontend Mentor: Interactive UI Challenges', url: 'https://www.frontendmentor.io/', isFree: true }
          ],
          children: [],
          isExpandable: true,
          isExpanded: false
        },
        {
          id: 'node_fe_4',
          title: 'Client-Side Performance & Core Web Vitals (LCP, INP, CLS)',
          description: 'Code splitting, dynamic imports, image optimization, memoization, and bundle analysis.',
          status: 'not_started',
          progress: 0,
          estimatedHours: 14,
          resources: [
            { type: 'docs', title: 'web.dev â€” Core Web Vitals Optimization', url: 'https://web.dev/explore/fast', isFree: true }
          ],
          children: [],
          isExpandable: true,
          isExpanded: false
        },
        {
          id: 'node_fe_5',
          title: 'Production Capstone: SaaS Interactive Dashboard',
          description: 'Ship an end-to-end responsive application with dark mode, optimistic updates, and accessibility.',
          status: 'not_started',
          progress: 0,
          estimatedHours: 30,
          resources: [
            { type: 'project', title: 'Production React Application Specification', url: 'https://github.com/', isFree: true }
          ],
          children: [],
          isExpandable: true,
          isExpanded: false
        }
      ]
    };

    // Seed roadmap for Cronus
    const cronusRoadmap = {
      id: 'rdm_demo_ai_002',
      userId: cronusUser.id,
      title: 'Machine Learning & GenAI Engineering',
      goal: 'Build and deploy Retrieval-Augmented Generation (RAG) and LLM applications',
      targetRole: 'AI/ML Engineer',
      interests: 'AI/ML, Python, Cloud',
      skillLevel: 'Beginner',
      skillDetails: 'Python mastery, building scalable Deep Learning and LLM agentic pipelines.',
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: [
        {
          id: 'node_ai_1',
          title: 'Linear Algebra & Calculus for Machine Learning',
          description: 'Matrix operations, eigenvalues, partial derivatives, and gradient descent optimization.',
          status: 'completed',
          progress: 100,
          estimatedHours: 20,
          resources: [
            { type: 'video', title: '3Blue1Brown: Essence of Linear Algebra', url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab', isFree: true }
          ],
          children: [],
          isExpandable: true,
          isExpanded: false
        },
        {
          id: 'node_ai_2',
          title: 'Data Wrangling with NumPy & Pandas',
          description: 'Data cleansing, vectorization, exploratory data analysis, and feature engineering.',
          status: 'completed',
          progress: 100,
          estimatedHours: 18,
          resources: [
            { type: 'docs', title: '10 Minutes to Pandas Guide', url: 'https://pandas.pydata.org/docs/user_guide/10min.html', isFree: true }
          ],
          children: [],
          isExpandable: true,
          isExpanded: false
        },
        {
          id: 'node_ai_3',
          title: 'PyTorch Deep Learning & Neural Networks',
          description: 'Tensors, autograd, backpropagation, and constructing CNN/Transformer architectures.',
          status: 'in_progress',
          progress: 50,
          estimatedHours: 28,
          resources: [
            { type: 'course', title: 'Fast.ai Practical Deep Learning for Coders', url: 'https://course.fast.ai/', isFree: true }
          ],
          children: [],
          isExpandable: true,
          isExpanded: false
        },
        {
          id: 'node_ai_4',
          title: 'LLMs, Vector Databases & RAG Pipelines',
          description: 'Embeddings, LangChain, LlamaIndex, ChromaDB/Pinecone, and hybrid search RAG systems.',
          status: 'not_started',
          progress: 0,
          estimatedHours: 24,
          resources: [
            { type: 'docs', title: 'LlamaIndex Documentation & Quickstarts', url: 'https://docs.llamaindex.ai/', isFree: true }
          ],
          children: [],
          isExpandable: true,
          isExpanded: false
        }
      ]
    };

    roadmaps = [thanatosRoadmap, cronusRoadmap];
    writeJSON(ROADMAPS_FILE, roadmaps);
  }
}

initializeSeedData();

// Configuration Access
function getAppConfig() {
  const cfg = readJSON(CONFIG_FILE, {});
  return {
    provider: cfg.provider || 'offline',
    hasGeminiKey: Boolean(cfg.geminiApiKey || process.env.GEMINI_API_KEY),
    hasClaudeKey: Boolean(cfg.claudeApiKey || process.env.ANTHROPIC_API_KEY),
    hasOpenaiKey: Boolean(cfg.openaiApiKey || process.env.OPENAI_API_KEY),
    geminiModel: cfg.geminiModel || 'gemini-1.5-flash',
    claudeModel: cfg.claudeModel || 'claude-3-5-sonnet-20241022',
    openaiModel: cfg.openaiModel || 'gpt-4o-mini'
  };
}

function getSecretConfig() {
  const cfg = readJSON(CONFIG_FILE, {});
  return {
    provider: cfg.provider || (process.env.GEMINI_API_KEY ? 'gemini' : (process.env.ANTHROPIC_API_KEY ? 'claude' : (process.env.OPENAI_API_KEY ? 'openai' : 'offline'))),
    geminiApiKey: cfg.geminiApiKey || process.env.GEMINI_API_KEY || '',
    claudeApiKey: cfg.claudeApiKey || process.env.ANTHROPIC_API_KEY || '',
    openaiApiKey: cfg.openaiApiKey || process.env.OPENAI_API_KEY || '',
    supabaseUrl: cfg.supabaseUrl || process.env.SUPABASE_URL || '',
    supabaseKey: cfg.supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '',
    geminiModel: cfg.geminiModel || 'gemini-1.5-flash',
    claudeModel: cfg.claudeModel || 'claude-3-5-sonnet-20241022',
    openaiModel: cfg.openaiModel || 'gpt-4o-mini'
  };
}

function getAppConfig() {
  const sec = getSecretConfig();
  return {
    provider: sec.provider,
    hasGeminiKey: Boolean(sec.geminiApiKey),
    hasClaudeKey: Boolean(sec.claudeApiKey),
    hasOpenaiKey: Boolean(sec.openaiApiKey),
    hasSupabase: Boolean(sec.supabaseUrl && sec.supabaseKey),
    supabaseUrl: sec.supabaseUrl,
    supabaseKeyMasked: sec.supabaseKey ? (sec.supabaseKey.substring(0, 8) + '...' + sec.supabaseKey.slice(-4)) : '',
    geminiModel: sec.geminiModel,
    claudeModel: sec.claudeModel,
    openaiModel: sec.openaiModel
  };
}

// Session & Auth Middleware Helpers
// NOTE: getAuthUser is now async — uses dbGetSession + dbGetUserById
async function getAuthUser(req) {
  const authHeader = req.headers['authorization'] || '';
  let token = '';
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  if (!token) {
    const parsedUrl = url.parse(req.url, true);
    token = parsedUrl.query?.token;
  }

  if (!token) return null;

  // Try Supabase session first, fallback to local
  let session = await dbGetSession(token);
  if (!session) {
    // Local-only fallback
    const localSessions = readJSON(SESSIONS_FILE, []);
    session = localSessions.find(s => s.token === token) || null;
    if (!session) return null;
  }

  if (new Date(session.expiresAt) < new Date()) return null;

  const user = await dbGetUserById(session.userId);
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    createdAt: user.createdAt
  };
}

async function createSession(userId) {
  const token = 'hermes_' + crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 86400000).toISOString(); // 30 days
  await dbCreateSession(token, userId, expiresAt);
  return token;
}

// Defensive JSON extraction from LLM responses
function extractAndParseJSON(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Empty response received from AI');
  }

  let cleaned = rawText.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*([\s\S]*?)\s*```$/i, '$1').trim();
  
  const firstCurly = cleaned.indexOf('{');
  const firstSquare = cleaned.indexOf('[');
  let startIndex = -1;
  let endIndex = -1;

  if (firstCurly !== -1 && (firstSquare === -1 || firstCurly < firstSquare)) {
    startIndex = firstCurly;
    endIndex = cleaned.lastIndexOf('}');
  } else if (firstSquare !== -1) {
    startIndex = firstSquare;
    endIndex = cleaned.lastIndexOf(']');
  }

  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    cleaned = cleaned.substring(startIndex, endIndex + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    try {
      const repaired = cleaned.replace(/,\s*([\]}])/g, '$1');
      return JSON.parse(repaired);
    } catch (e2) {
      throw new Error(`Failed to parse AI JSON response: ${err.message}`);
    }
  }
}

// Schema Validator
function validateNode(node) {
  if (!node || typeof node !== 'object') return false;
  if (!node.id) node.id = crypto.randomUUID();
  if (typeof node.title !== 'string' || !node.title) node.title = 'Untitled Module';
  if (typeof node.description !== 'string') node.description = '';
  if (!['locked', 'not_started', 'in_progress', 'completed'].includes(node.status)) {
    node.status = 'not_started';
  }
  if (typeof node.progress !== 'number' || isNaN(node.progress)) node.progress = 0;
  if (typeof node.estimatedHours !== 'number' || isNaN(node.estimatedHours)) node.estimatedHours = 4;
  
  if (!['recommended', 'alternative', 'optional'].includes(node.recommendationType)) {
    node.recommendationType = 'recommended';
  }

  if (node.projectCallout && typeof node.projectCallout === 'object') {
    node.projectCallout = {
      title: String(node.projectCallout.title || 'Project Checkpoint'),
      description: String(node.projectCallout.description || ''),
      level: ['beginner', 'intermediate', 'advanced'].includes(node.projectCallout.level) ? node.projectCallout.level : 'intermediate'
    };
  } else {
    node.projectCallout = null;
  }

  if (!Array.isArray(node.resources)) node.resources = [];
  node.resources = node.resources.map(r => ({
    type: ['article', 'video', 'course', 'docs', 'practice', 'project'].includes(r.type) ? r.type : 'article',
    title: String(r.title || 'Resource Guide'),
    url: String(r.url || ''),
    isFree: Boolean(r.isFree !== false)
  }));

  if (!Array.isArray(node.children)) node.children = [];
  node.children.forEach(child => validateNode(child));

  node.isExpandable = Boolean(node.isExpandable);
  node.isExpanded = Boolean(node.isExpanded);

  return node;
}

// Progress Rollup Calculation
function calculateRollup(nodes) {
  if (!Array.isArray(nodes)) return { nodes: [], overallProgress: 0, totalHours: 0, completedHours: 0 };

  let totalWeightedProgress = 0;
  let totalHours = 0;
  let completedHours = 0;

  function processNode(node) {
    if (node.children && node.children.length > 0) {
      let childProgressSum = 0;
      node.children.forEach(child => {
        processNode(child);
        childProgressSum += child.progress;
      });
      node.progress = Math.round(childProgressSum / node.children.length);
      if (node.progress === 100) {
        node.status = 'completed';
      } else if (node.progress > 0) {
        node.status = 'in_progress';
      } else {
        node.status = 'not_started';
      }
    } else {
      if (node.status === 'completed') {
        node.progress = 100;
      } else if (node.status === 'in_progress') {
        node.progress = node.progress > 0 ? node.progress : 50;
      } else {
        node.progress = 0;
      }
    }
  }

  nodes.forEach(m => {
    processNode(m);
    const hours = m.estimatedHours || 4;
    totalHours += hours;
    totalWeightedProgress += (m.progress * hours);
    completedHours += ((m.progress / 100) * hours);
  });

  const overallProgress = totalHours > 0 ? Math.round(totalWeightedProgress / totalHours) : 0;
  return {
    nodes,
    overallProgress,
    totalHours,
    completedHours: Math.round(completedHours * 10) / 10
  };
}

// ==========================================
// QUIZ GENERATION ENGINE (10-20 Questions per Module)
// ==========================================

function generateSmartOfflineQuiz(moduleTitle = 'Core Topic', moduleDescription = '', count = 15) {
  const titleLower = moduleTitle.toLowerCase();
  const descLower = moduleDescription.toLowerCase();
  const context = (titleLower + ' ' + descLower);

  let pool = [];

  if (context.includes('python')) {
    pool = [
      {
        question: "What is the primary difference between a Python list and a Python tuple?",
        codeSnippet: "a = [1, 2, 3]\nb = (1, 2, 3)",
        options: [
          "Lists are immutable, while tuples are mutable.",
          "Lists are mutable, while tuples are immutable.",
          "Lists can only store integers, while tuples can store any datatype.",
          "Tuples consume more memory than lists for identical elements."
        ],
        correctAnswer: 1,
        explanation: "Lists in Python are mutable (elements can be modified, added, or removed), whereas tuples are immutable and their contents cannot be changed after creation."
      },
      {
        question: "What is the output of the following list comprehension?",
        codeSnippet: "nums = [1, 2, 3, 4, 5]\nresult = [x * 2 for x in nums if x % 2 != 0]\nprint(result)",
        options: ["[2, 6, 10]", "[4, 8]", "[1, 3, 5]", "[2, 4, 6, 8, 10]"],
        correctAnswer: 0,
        explanation: "The condition `if x % 2 != 0` filters for odd numbers (1, 3, 5). Multiplying each by 2 yields [2, 6, 10]."
      },
      {
        question: "In Python, which dunder method is called when an object is used in a 'with' statement?",
        codeSnippet: "with open('file.txt', 'r') as f:\n    data = f.read()",
        options: ["__init__", "__enter__", "__open__", "__iter__"],
        correctAnswer: 1,
        explanation: "The `__enter__` method is executed when entering a context manager via the `with` statement, and `__exit__` is called upon leaving."
      },
      {
        question: "What does the @property decorator do in a Python class?",
        codeSnippet: "class Circle:\n    def __init__(self, r):\n        self._r = r\n    @property\n    def radius(self):\n        return self._r",
        options: [
          "It makes the method accessible as a getter attribute without explicit parentheses.",
          "It forces the method to run in a separate background thread.",
          "It converts the class into a static singleton.",
          "It makes the variable private to external modules."
        ],
        correctAnswer: 0,
        explanation: "The `@property` decorator allows defining methods that can be accessed like attributes (e.g. `c.radius` instead of `c.radius()`), enabling clean encapsulation."
      },
      {
        question: "Which of the following is true about Python's Global Interpreter Lock (GIL)?",
        options: [
          "It prevents multiple operating system processes from running simultaneously.",
          "In CPython, it ensures only one native thread executes Python bytecode at a time.",
          "It completely eliminates the need for async/await.",
          "It is required by the Python language specification in all implementations."
        ],
        correctAnswer: 1,
        explanation: "In CPython, the GIL is a mutex that prevents multiple native threads from executing Python bytecodes simultaneously to ensure thread-safe memory management."
      },
      {
        question: "What will `print(type({}))` output in Python?",
        options: ["<class 'set'>", "<class 'dict'>", "<class 'tuple'>", "<class 'list'>"],
        correctAnswer: 1,
        explanation: "Empty curly braces `{}` create an empty dictionary (`dict`). To create an empty set, you must use `set()`."
      },
      {
        question: "How do you define a function with variable keyword arguments in Python?",
        options: ["def func(*args):", "def func(**kwargs):", "def func(&kwargs):", "def func(?kwargs):"],
        correctAnswer: 1,
        explanation: "`**kwargs` captures arbitrary named keyword arguments as a dictionary."
      },
      {
        question: "Which keyword is used to create a generator function in Python?",
        options: ["generate", "return", "yield", "async"],
        correctAnswer: 2,
        explanation: "The `yield` keyword pauses function execution and returns a value to the caller, producing a lazy generator iterator."
      },
      {
        question: "What is the time complexity of searching for a key in a standard Python dictionary (average case)?",
        options: ["O(n)", "O(log n)", "O(1)", "O(n^2)"],
        correctAnswer: 2,
        explanation: "Python dictionaries use hash tables under the hood, providing average-case O(1) time complexity for key lookups."
      },
      {
        question: "Which module in the Python standard library is used for creating high-performance abstract collection types like Counter and defaultdict?",
        options: ["datastructures", "collections", "itertools", "functools"],
        correctAnswer: 1,
        explanation: "The `collections` module provides specialized container datatypes including `Counter`, `defaultdict`, `deque`, and `namedtuple`."
      },
      {
        question: "In Python typing, what does `Optional[str]` mean?",
        options: [
          "The value must be an empty string.",
          "The value can be either `str` or `None`.",
          "The string is optional in function parameters and defaults to 'default'.",
          "The string is converted to bytes automatically."
        ],
        correctAnswer: 1,
        explanation: "`Optional[str]` is an alias for `Union[str, None]`, denoting that the variable can hold a string or None."
      },
      {
        question: "What is the purpose of the `__repr__` method compared to `__str__`?",
        options: [
          "`__repr__` is for human-readable output, while `__str__` is for debugging.",
          "`__repr__` should return an unambiguous representation of the object (often valid Python code), while `__str__` is for user-friendly readable display.",
          "`__repr__` is called only when converting an object to an integer.",
          "There is no difference between them."
        ],
        correctAnswer: 1,
        explanation: "`__repr__` is intended for developers/debugging (unambiguous representation), while `__str__` is for end-user display."
      }
    ];
  } else if (context.includes('java')) {
    pool = [
      {
        question: "What is the primary benefit of Java 21 Virtual Threads (Project Loom)?",
        options: [
          "They replace the Java Garbage Collector with manual malloc/free.",
          "They are lightweight threads managed by the JVM, allowing millions of concurrent tasks with minimal memory overhead.",
          "They execute Java code directly on GPU cores.",
          "They make Java code run without bytecode compilation."
        ],
        correctAnswer: 1,
        explanation: "Virtual Threads are lightweight threads scheduled by the JVM rather than the OS, dramatically reducing resource consumption for I/O-bound concurrent applications."
      },
      {
        question: "Which of the following describes a Java Record (introduced in Java 14+)?",
        codeSnippet: "public record User(String name, int age) {}",
        options: [
          "A mutable database entity requiring boilerplate getters, setters, and equals methods.",
          "A transparent, immutable data carrier with automatically generated constructor, getters, equals(), hashCode(), and toString().",
          "A dynamic interface for reflection only.",
          "A class that cannot be serialized."
        ],
        correctAnswer: 1,
        explanation: "Records provide a compact syntax for declaring immutable data classes with compiler-generated accessors, constructors, and object utility methods."
      },
      {
        question: "In the Java Memory Model, where are object instances allocated?",
        options: ["Call Stack", "Heap Memory", "Method Area / Metaspace", "Program Counter Register"],
        correctAnswer: 1,
        explanation: "In Java, all class object instances and arrays are allocated on the Heap memory, managed by the Garbage Collector."
      },
      {
        question: "What is the difference between `==` and `.equals()` when comparing two String objects in Java?",
        codeSnippet: "String s1 = new String(\"hello\");\nString s2 = new String(\"hello\");",
        options: [
          "`==` compares memory references (identity), while `.equals()` compares string character contents (value).",
          "`==` compares character values, while `.equals()` compares memory references.",
          "Both perform identical value comparisons for Strings.",
          "`==` causes a compile error for objects."
        ],
        correctAnswer: 0,
        explanation: "`==` tests whether both references point to the exact same memory address, whereas `.equals()` evaluates if both strings contain the same character sequence."
      },
      {
        question: "Which Stream operation is terminal in Java?",
        options: ["filter()", "map()", "collect()", "peek()"],
        correctAnswer: 2,
        explanation: "`collect()` is a terminal operation that initiates stream processing and collects results into a collection. `filter()`, `map()`, and `peek()` are intermediate operations."
      },
      {
        question: "What does the `volatile` keyword guarantee in Java multithreading?",
        options: [
          "Atomic execution of complex compound operations (like i++).",
          "Visibility of variable changes across multiple threads without CPU caching discrepancies.",
          "Automatic prevention of deadlock in synchronized blocks.",
          "Serial execution of entire classes."
        ],
        correctAnswer: 1,
        explanation: "The `volatile` keyword ensures that reads and writes to that variable are directly visible to all threads by bypassing per-thread CPU caches."
      },
      {
        question: "What is the time complexity of looking up an element by key in a standard `HashMap` in Java (average case)?",
        options: ["O(n)", "O(log n)", "O(1)", "O(n log n)"],
        correctAnswer: 2,
        explanation: "`HashMap` in Java provides O(1) average time complexity for `get()` and `put()` operations."
      }
    ];
  } else if (context.includes('c++') || context.includes('cpp')) {
    pool = [
      {
        question: "What is the principle of RAII (Resource Acquisition Is Initialization) in Modern C++?",
        options: [
          "Allocating all memory at program startup on the static segment.",
          "Binding the lifecycle of resources (memory, file handles, locks) to the lifetime of stack-allocated objects with automatic destructor cleanup.",
          "Compiling templates before header files are parsed.",
          "Preventing the use of pointers completely."
        ],
        correctAnswer: 1,
        explanation: "RAII ensures resources are acquired during object initialization (constructor) and automatically freed when the object goes out of scope (destructor)."
      },
      {
        question: "What is the difference between `std::unique_ptr` and `std::shared_ptr`?",
        options: [
          "`std::unique_ptr` allows single exclusive ownership with zero runtime overhead; `std::shared_ptr` uses reference counting for shared ownership.",
          "`std::unique_ptr` can be copied freely, while `std::shared_ptr` cannot be moved.",
          "`std::shared_ptr` allocates memory on the stack only.",
          "`std::unique_ptr` is deprecated in C++20."
        ],
        correctAnswer: 0,
        explanation: "`std::unique_ptr` represents exclusive non-copyable ownership of a dynamically allocated object, whereas `std::shared_ptr` uses atomic reference counting."
      },
      {
        question: "What is the Rule of Five in Modern C++?",
        options: [
          "A rule that limits templates to five parameters.",
          "If a class defines a destructor, copy constructor, copy assignment, move constructor, or move assignment, it should explicitly handle all five.",
          "A compiler optimization that unrolls loops up to 5 iterations.",
          "A guideline to keep functions under 5 lines."
        ],
        correctAnswer: 1,
        explanation: "The Rule of Five states that managing custom resources requires defining Destructor, Copy Constructor, Copy Assignment, Move Constructor, and Move Assignment."
      },
      {
        question: "What does the C++20 `concept` keyword allow developers to do?",
        codeSnippet: "template<typename T>\nconcept Numeric = std::is_arithmetic_v<T>;",
        options: [
          "Define compile-time constraints and requirements on template arguments with clear compiler error messages.",
          "Create runtime dynamic types without templates.",
          "Force functions to run asynchronously.",
          "Declare private namespace members."
        ],
        correctAnswer: 0,
        explanation: "C++20 Concepts specify compile-time predicate requirements on template arguments, vastly improving type safety and diagnostic compiler error clarity."
      },
      {
        question: "What is the consequence of dereferencing a dangling pointer or a nullptr in C++?",
        options: [
          "Undefined Behavior (UB), which may result in a segmentation fault or memory corruption.",
          "The program automatically catches a NullPointerException and continues.",
          "The operating system reallocates the memory safely.",
          "The compiler replaces the pointer with a default object."
        ],
        correctAnswer: 0,
        explanation: "Dereferencing a nullptr or dangling pointer invokes Undefined Behavior in C++, commonly leading to crashes (SIGSEGV) or silent memory corruption."
      }
    ];
  } else if (context.includes('html') || context.includes('accessibility') || context.includes('a11y') || context.includes('semantic')) {
    pool = [
      {
        question: "Which HTML element represents the main dominant content of a document body, unique from headers, footers, and sidebars?",
        options: ["<main>", "<section>", "<article>", "<div id='main'>"],
        correctAnswer: 0,
        explanation: "<main> represents the central, unique content of the document. There should only be one visible <main> element per page for accessibility."
      },
      {
        question: "Why is providing a descriptive 'alt' attribute on <img> tags essential for web accessibility (a11y)?",
        options: [
          "It allows screen readers to convey image meaning and context to visually impaired users.",
          "It reduces the image payload file size during network transfer.",
          "It automatically forces the image into a responsive aspect ratio.",
          "It enables right-click image downloading in modern browsers."
        ],
        correctAnswer: 0,
        explanation: "Screen readers announce the 'alt' text to users who cannot see the image, ensuring equal access to information and proper semantic context."
      },
      {
        question: "Which element is the correct semantic choice for an interactive control that triggers an in-page action without navigating to a new URL?",
        codeSnippet: "<!-- User clicks to toggle modal -->\n<button type=\"button\">Open Settings</button>",
        options: ["<button>", "<a href=\"#\">", "<div onclick=\"...\">", "<span role=\"link\">"],
        correctAnswer: 0,
        explanation: "<button> provides native keyboard focus (Tab), Enter/Space activation, and communicates role='button' to assistive technologies automatically."
      },
      {
        question: "What is the primary function of ARIA (Accessible Rich Internet Applications) attributes?",
        options: [
          "To provide semantic accessibility metadata when native HTML elements are insufficient for custom widgets.",
          "To style interactive components with hardware-accelerated animations.",
          "To execute JavaScript callbacks in background service worker threads.",
          "To enforce cryptographic encryption on form inputs."
        ],
        correctAnswer: 0,
        explanation: "ARIA attributes (like aria-expanded, aria-label, aria-live) bridge accessibility gaps for complex dynamic widgets when native HTML is unavailable."
      },
      {
        question: "How should form inputs and their descriptive labels be programmatically linked for screen readers?",
        codeSnippet: "<label for=\"user-email\">Email Address</label>\n<input type=\"email\" id=\"user-email\">",
        options: [
          "By matching the label's 'for' attribute to the input's 'id' attribute.",
          "By giving both elements the same 'name' attribute.",
          "By wrapping both inside an unstyled <div> container.",
          "By using placeholder text instead of a <label> element."
        ],
        correctAnswer: 0,
        explanation: "The 'for' attribute matching the input 'id' creates an explicit programmatic link that assistive technologies announce when focusing the input."
      }
    ];
  } else if (context.includes('css') || context.includes('flexbox') || context.includes('grid') || context.includes('layout')) {
    pool = [
      {
        question: "What is the primary conceptual difference between CSS Flexbox and CSS Grid?",
        options: [
          "Flexbox is primarily 1-dimensional (row OR column), while CSS Grid is 2-dimensional (rows AND columns simultaneously).",
          "Flexbox only operates on mobile devices, while Grid is for desktop displays.",
          "CSS Grid cannot align items along a cross-axis, while Flexbox can.",
          "Flexbox requires fixed pixel values, while Grid only supports percentages."
        ],
        correctAnswer: 0,
        explanation: "Flexbox excels at linear 1D distribution along a single axis, whereas CSS Grid provides powerful 2D grid-template controls across rows and columns simultaneously."
      },
      {
        question: "When 'box-sizing: border-box' is applied to an element, how are width and height calculated?",
        codeSnippet: ".box {\n  box-sizing: border-box;\n  width: 200px;\n  padding: 20px;\n  border: 5px solid black;\n}",
        options: [
          "Total rendered width is 200px (padding and border are absorbed inside the specified width).",
          "Total rendered width is 250px (padding and border are added outside the specified width).",
          "Width is ignored and determined solely by inner text content.",
          "Border is absorbed, but padding is added externally."
        ],
        correctAnswer: 0,
        explanation: "Under 'border-box', padding and border are absorbed into the declared width/height, preventing unexpected layout overflow."
      },
      {
        question: "Which CSS selector has the highest specificity?",
        options: [
          "#nav .item.active (1 ID + 2 classes)",
          ".header nav ul li a (5 elements/classes, 0 IDs)",
          "button.btn-primary:hover (1 element + 1 class + 1 pseudo-class)",
          "* (Universal selector)"
        ],
        correctAnswer: 0,
        explanation: "IDs hold higher specificity weight (0,1,0,0) than any number of standard classes or elements. '#nav .item.active' has specificity (0,1,2,0)."
      },
      {
        question: "What does the CSS 'clamp(min, val, max)' function accomplish?",
        codeSnippet: "font-size: clamp(1rem, 2.5vw, 2rem);",
        options: [
          "It sets a fluid value between an allowed minimum and maximum threshold based on viewport size.",
          "It clips overflowing text with an ellipsis (...).",
          "It enforces strict grid alignment for nested items.",
          "It clamps CSS animation frame rates to 60fps."
        ],
        correctAnswer: 0,
        explanation: "'clamp()' creates responsive fluid typography and spacing by scaling between a minimum and maximum bound."
      },
      {
        question: "What is the effect of 'position: absolute' on an HTML element?",
        options: [
          "It removes the element from normal flow and positions it relative to its nearest positioned ancestor.",
          "It fixes the element relative to the browser viewport at all times.",
          "It centers the element inside its immediate parent.",
          "It converts the element into an inline-level block."
        ],
        correctAnswer: 0,
        explanation: "Absolute positioning removes an element from normal layout flow and positions it relative to the closest ancestor with a position other than 'static'."
      }
    ];
  } else if (context.includes('javascript') || context.includes('js') || context.includes('dom') || context.includes('async')) {
    pool = [
      {
        question: "What is the main difference between 'let' and 'var' declarations in JavaScript?",
        codeSnippet: "function test() {\n  if (true) {\n    var x = 1;\n    let y = 2;\n  }\n  console.log(x); // 1\n  console.log(y); // ReferenceError\n}",
        options: [
          "'let' is block-scoped, while 'var' is function-scoped (or globally scoped).",
          "'var' variables are immutable, while 'let' variables can be reassigned.",
          "'let' is hoisted to the top and initialized with undefined, while 'var' throws a ReferenceError.",
          "There is no functional difference in modern ES6+ environments."
        ],
        correctAnswer: 0,
        explanation: "'let' and 'const' adhere to block scope ({ ... }) and reside in the Temporal Dead Zone until declared, whereas 'var' is hoisted and function-scoped."
      },
      {
        question: "In the JavaScript event loop, which queue has priority when the call stack clears?",
        codeSnippet: "console.log('1');\nsetTimeout(() => console.log('2'), 0);\nPromise.resolve().then(() => console.log('3'));\nconsole.log('4');",
        options: [
          "The Microtask Queue (Promises) executes before the Macrotask Queue (setTimeout). Output: 1, 4, 3, 2.",
          "The Macrotask Queue executes first. Output: 1, 4, 2, 3.",
          "SetTimeout has priority because it was scheduled first. Output: 1, 2, 4, 3.",
          "Execution order is completely non-deterministic."
        ],
        correctAnswer: 0,
        explanation: "Microtasks (Promise callbacks) are processed immediately after the current synchronous execution context empties, before processing any pending Macrotasks (like setTimeout)."
      },
      {
        question: "What is a closure in JavaScript?",
        options: [
          "A function that retains access to variables from its lexical outer scope even after that outer scope has closed.",
          "A method that prevents an object from being mutated or extended.",
          "A syntax construct for terminating while loops early.",
          "A build step that bundles modular JavaScript into a single file."
        ],
        correctAnswer: 0,
        explanation: "A closure gives an inner function access to an outer function's scope variables, preserved even when the outer function has finished executing."
      },
      {
        question: "What does the Array.prototype.map() method return in JavaScript?",
        codeSnippet: "const numbers = [1, 2, 3];\nconst doubled = numbers.map(n => n * 2);",
        options: [
          "A new array with the results of calling the provided function on every element, without mutating the original array.",
          "The original array mutated in place with the transformed values.",
          "A single accumulated scalar value.",
          "A boolean indicating whether all elements satisfy the condition."
        ],
        correctAnswer: 0,
        explanation: "'map()' is a pure higher-order function that returns a brand-new array containing transformed elements, leaving the source array untouched."
      },
      {
        question: "What is event delegation in client-side JavaScript?",
        options: [
          "Attaching a single event listener to a common parent element to handle events for all children via event bubbling.",
          "Passing event listener functions as parameters to Web Workers.",
          "Stopping an event from propagating up the DOM tree via e.stopPropagation().",
          "Preventing the default browser action on form submission."
        ],
        correctAnswer: 0,
        explanation: "Event delegation leverages DOM event bubbling to capture events at an ancestor level, dramatically improving performance and handling dynamically added child elements."
      }
    ];
  } else {
    // General / Full-Stack / Universal Technical Quiz Pool
    pool = [
      {
        question: `In modern software architecture, what is the primary purpose of ${moduleTitle}?`,
        options: [
          `To structure modular, maintainable, and standardized solutions for ${moduleTitle}.`,
          "To combine business logic directly into presentation views without separation.",
          "To bypass data validation and rely exclusively on optimistic client updates.",
          "To replace automated unit testing with runtime exception catching."
        ],
        correctAnswer: 0,
        explanation: `Mastering ${moduleTitle} establishes core architectural patterns, maintainable code quality, and scalable execution.`
      },
      {
        question: `Which approach represents an industry best practice when working with ${moduleTitle}?`,
        options: [
          "Writing modular, decoupled components with comprehensive automated tests and error boundaries.",
          "Coupling all logic into a single monolithic script with global variables.",
          "Ignoring security vulnerability checks and dependency updates.",
          "Hardcoding sensitive API credentials in public client scripts."
        ],
        correctAnswer: 0,
        explanation: "Modern engineering best practices emphasize loose coupling, separation of concerns, defensive error handling, and automated testing."
      },
      {
        question: `When optimizing performance in ${moduleTitle}, which factor is most critical?`,
        options: [
          "Minimizing unnecessary compute overhead, optimizing I/O bottlenecks, and leveraging caching strategies.",
          "Adding artificial sleep delays inside execution loops.",
          "Increasing bundle sizes by importing unneeded external libraries.",
          "Running synchronous blocking operations on the main thread."
        ],
        correctAnswer: 0,
        explanation: "High performance relies on removing I/O bottlenecks, reducing algorithmic complexity, and applying smart caching at appropriate layers."
      },
      {
        question: "What is the primary advantage of automated CI/CD pipelines in production software?",
        options: [
          "Continuous integration ensures automated testing, linting, and reliable artifact deployment with every commit.",
          "It slows down release cycles to prevent frequent code changes.",
          "It eliminates the need for source control branching.",
          "It replaces application databases."
        ],
        correctAnswer: 0,
        explanation: "CI/CD automates testing and deployment pipelines, reducing human error and ensuring high release velocity with verified quality."
      },
      {
        question: "Why is semantic versioning (SemVer: MAJOR.MINOR.PATCH) important in software engineering?",
        options: [
          "It clearly communicates breaking changes (MAJOR), new backward-compatible features (MINOR), and bug fixes (PATCH).",
          "It dictates the price of software licenses.",
          "It defines the maximum number of users allowed in a database.",
          "It is only used for marketing purposes."
        ],
        correctAnswer: 0,
        explanation: "SemVer provides a predictable dependency contract so developers know whether upgrading a package might break their application."
      }
    ];
  }

  // Expand or slice to target count
  let questions = [];
  for (let i = 0; i < count; i++) {
    const base = pool[i % pool.length];
    questions.push({
      id: `q_${i + 1}`,
      question: base.question,
      codeSnippet: base.codeSnippet || '',
      options: base.options,
      correctAnswer: base.correctAnswer,
      explanation: base.explanation
    });
  }

  return {
    moduleTitle,
    totalQuestions: questions.length,
    questions
  };
}

async function generateAIQuiz(moduleTitle, moduleDescription, count = 15) {
  const systemPrompt = `You are a senior technical interviewer and educator. Generate an interactive, rigorous 10-15 question multiple choice quiz for the module: "${moduleTitle}" (${moduleDescription}).
Return valid JSON only matching this schema:
{
  "moduleTitle": "${moduleTitle}",
  "totalQuestions": ${count},
  "questions": [
    {
      "id": "q_1",
      "question": "string (clear, direct technical question)",
      "codeSnippet": "string (optional code block if applicable, or empty string)",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0, // index 0, 1, 2, or 3
      "explanation": "Detailed explanation of why this answer is correct and why other options are incorrect."
    }
  ]
}`;

  const userPrompt = `Module: ${moduleTitle}\nDescription: ${moduleDescription}\nGenerate ${count} diverse questions testing foundational concepts, code comprehension, edge cases, and best practices.`;

  const aiResult = await runAIGeneration(systemPrompt, userPrompt);
  if (aiResult && Array.isArray(aiResult.questions) && aiResult.questions.length > 0) {
    return {
      moduleTitle: aiResult.moduleTitle || moduleTitle,
      totalQuestions: aiResult.questions.length,
      questions: aiResult.questions.map((q, idx) => ({
        id: q.id || `q_${idx + 1}`,
        question: String(q.question || 'Question'),
        codeSnippet: String(q.codeSnippet || ''),
        options: Array.isArray(q.options) && q.options.length === 4 ? q.options.map(String) : ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 && q.correctAnswer <= 3 ? q.correctAnswer : 0,
        explanation: String(q.explanation || 'Correct answer based on technical documentation.')
      }))
    };
  }

  return generateSmartOfflineQuiz(moduleTitle, moduleDescription, count);
}

// ==========================================
// Smart Offline Curriculum Generation Engine
// ==========================================
function generateSmartOfflineRoadmap(profile, userId = 'usr_guest') {
  const interests = Array.isArray(profile.interests) ? profile.interests.join(', ') : (profile.interests || 'Python');
  const level = profile.skillLevel || 'Beginner';
  const goal = profile.goal || `Master ${interests} from fundamentals to production`;
  const targetRole = profile.targetRole || `${interests.split(',')[0].trim()} Developer`;

  const query = (interests + ' ' + goal + ' ' + targetRole).toLowerCase();
  let milestoneTemplates = [];

  // 1. Python Language Track
  if (query.includes('python') || query.includes('py')) {
    milestoneTemplates = [
      {
        title: 'Python Core Syntax & Fundamentals',
        description: 'Variables, primitive types, dynamic typing, control flow, loops, functions, and standard I/O in Python 3.12+.',
        estimatedHours: 14,
        recommendationType: 'recommended',
        projectCallout: {
          title: 'Beginner Project Checkpoint',
          description: 'Build a CLI expense manager or an automated file organizer script.',
          level: 'beginner'
        },
        resources: [
          { type: 'docs', title: 'Python 3.12 Official Tutorial', url: 'https://docs.python.org/3/tutorial/', isFree: true },
          { type: 'course', title: 'FreeCodeCamp: Python for Beginners Course', url: 'https://www.youtube.com/watch?v=rfscVS0vtbw', isFree: true },
          { type: 'practice', title: 'Exercism: Python Track & Exercises', url: 'https://exercism.org/tracks/python', isFree: true }
        ],
        children: [
          {
            title: 'Variables, Type Hinting & Operators',
            description: 'Primitive types, type hints, string formatting, arithmetic and bitwise operators.',
            estimatedHours: 4,
            recommendationType: 'recommended',
            resources: [{ type: 'docs', title: 'Python Typing Module', url: 'https://docs.python.org/3/library/typing.html', isFree: true }]
          },
          {
            title: 'Control Flow, Loops & Match-Case',
            description: 'If-elif-else conditionals, for/while loops, and Python 3.10+ match-case pattern matching.',
            estimatedHours: 5,
            recommendationType: 'recommended',
            resources: [{ type: 'docs', title: 'Match Statements Tutorial', url: 'https://docs.python.org/3/tutorial/controlflow.html#match-statements', isFree: true }]
          },
          {
            title: 'Functions, Scopes & *args, **kwargs',
            description: 'LEGB variable scoping, default parameters, variable-length arguments, and lambda functions.',
            estimatedHours: 5,
            recommendationType: 'recommended',
            resources: [{ type: 'article', title: 'Real Python: Defining Functions in Python', url: 'https://realpython.com/defining-your-own-python-function/', isFree: true }]
          }
        ]
      },
      {
        title: 'Data Structures & Collections Module',
        description: 'Lists, Tuples, Dictionaries, Sets, list comprehensions, and high-performance collections (deque, Counter, defaultdict).',
        estimatedHours: 16,
        recommendationType: 'recommended',
        resources: [
          { type: 'docs', title: 'Python Data Structures Guide', url: 'https://docs.python.org/3/tutorial/datastructures.html', isFree: true },
          { type: 'practice', title: 'LeetCode Python Data Structures Practice', url: 'https://leetcode.com/explore/', isFree: true }
        ],
        children: [
          {
            title: 'List & Dictionary Comprehensions',
            description: 'Write concise, idiomatic Python expressions with filtering and transformations.',
            estimatedHours: 5,
            recommendationType: 'recommended',
            resources: [{ type: 'article', title: 'Comprehensions in Python (Real Python)', url: 'https://realpython.com/list-comprehension-python/', isFree: true }]
          },
          {
            title: 'Iterators, Generators & yield',
            description: 'Lazy evaluation, generator functions, and the iterator protocol.',
            estimatedHours: 6,
            recommendationType: 'recommended',
            resources: [{ type: 'docs', title: 'Python Generators Documentation', url: 'https://wiki.python.org/moin/Generators', isFree: true }]
          },
          {
            title: 'Collections Module (Counter, defaultdict, deque)',
            description: 'Optimized datatypes for complex frequency counts and double-ended queues.',
            estimatedHours: 5,
            recommendationType: 'recommended',
            resources: [{ type: 'docs', title: 'Python collections Module Reference', url: 'https://docs.python.org/3/library/collections.html', isFree: true }]
          }
        ]
      },
      {
        title: 'Object-Oriented Python (OOP) & Dunder Methods',
        description: 'Classes, encapsulation, inheritance, polymorphism, dataclasses, properties, and special dunder methods.',
        estimatedHours: 18,
        recommendationType: 'recommended',
        resources: [
          { type: 'docs', title: 'Python OOP and Dataclasses Guide', url: 'https://realpython.com/python3-object-oriented-programming/', isFree: true }
        ],
        children: [
          {
            title: 'Classes, @property, and Class/Static Methods',
            description: 'Encapsulation with getters/setters and classmethod/staticmethod decorators.',
            estimatedHours: 6,
            recommendationType: 'recommended',
            resources: [{ type: 'article', title: 'Python @property in Practice', url: 'https://realpython.com/python-property/', isFree: true }]
          },
          {
            title: 'Special Dunder Methods (__str__, __repr__, __enter__)',
            description: 'Operator overloading, custom string representations, and custom Context Managers.',
            estimatedHours: 6,
            recommendationType: 'recommended',
            resources: [{ type: 'docs', title: 'Python Data Model Special Methods', url: 'https://docs.python.org/3/reference/datamodel.html', isFree: true }]
          },
          {
            title: 'Python 3.7+ Dataclasses',
            description: 'Eliminate boilerplate for data-holding classes with @dataclass.',
            estimatedHours: 6,
            recommendationType: 'recommended',
            resources: [{ type: 'docs', title: 'Dataclasses Official Docs', url: 'https://docs.python.org/3/library/dataclasses.html', isFree: true }]
          }
        ]
      },
      {
        title: 'Environments, Packaging & Pytest',
        description: 'Dependency management with uv / Poetry / venv, package building, and writing comprehensive tests with Pytest.',
        estimatedHours: 14,
        recommendationType: 'recommended',
        projectCallout: {
          title: 'Intermediate Project Checkpoint',
          description: 'Build and publish an open-source CLI tool on PyPI with automated GitHub Actions testing.',
          level: 'intermediate'
        },
        resources: [
          { type: 'docs', title: 'Astral uv Python Package Manager', url: 'https://docs.astral.sh/uv/', isFree: true },
          { type: 'docs', title: 'Pytest Official Documentation', url: 'https://docs.pytest.org/', isFree: true }
        ],
        children: []
      },
      {
        title: 'Asynchronous Programming (AsyncIO) & Concurrency',
        description: 'Event loops, async/await coroutines, Tasks, ThreadPoolExecutor vs ProcessPoolExecutor, and the GIL.',
        estimatedHours: 18,
        recommendationType: 'recommended',
        resources: [
          { type: 'docs', title: 'AsyncIO Official Documentation', url: 'https://docs.python.org/3/library/asyncio.html', isFree: true }
        ],
        children: []
      },
      {
        title: 'Web APIs with FastAPI & Database ORMs',
        description: 'Design asynchronous REST APIs with FastAPI, Pydantic validation, SQLAlchemy 2.0 ORM, and PostgreSQL.',
        estimatedHours: 24,
        recommendationType: 'recommended',
        resources: [
          { type: 'docs', title: 'FastAPI Tutorial & Best Practices', url: 'https://fastapi.tiangolo.com/', isFree: true }
        ],
        children: []
      },
      {
        title: 'Capstone: Production Async Microservice & Docker Deployment',
        description: `Ship a production-grade async Python microservice with Redis caching, auth, and automated testing matching ${targetRole} standards.`,
        estimatedHours: 25,
        recommendationType: 'recommended',
        resources: [
          { type: 'project', title: 'Full Stack FastAPI Template Blueprint', url: 'https://github.com/tiangolo/full-stack-fastapi-template', isFree: true }
        ],
        children: []
      }
    ];
  }
  // 2. Java Language Track
  else if (query.includes('java') && !query.includes('javascript')) {
    milestoneTemplates = [
      {
        title: 'Java Core Syntax & OOP Fundamentals',
        description: 'Primitives, reference types, control structures, encapsulation, inheritance, abstract classes, interfaces, and Java Records.',
        estimatedHours: 16,
        recommendationType: 'recommended',
        projectCallout: {
          title: 'Beginner Project Checkpoint',
          description: 'Build a Banking Account Simulation or Student Management Console Application.',
          level: 'beginner'
        },
        resources: [
          { type: 'docs', title: 'Oracle Java Documentation & Tutorials', url: 'https://docs.oracle.com/en/java/', isFree: true },
          { type: 'course', title: 'University of Helsinki Java MOOC', url: 'https://java-programming.mooc.fi/', isFree: true }
        ],
        children: [
          {
            title: 'Types, Control Flow & Switch Expressions',
            description: 'Primitives, loops, Java 17+ pattern matching in switch expressions.',
            estimatedHours: 5,
            recommendationType: 'recommended',
            resources: [{ type: 'docs', title: 'Java Language Basics', url: 'https://docs.oracle.com/javase/tutorial/java/nutsandbolts/index.html', isFree: true }]
          },
          {
            title: 'OOP: Interfaces, Sealed Classes & Records',
            description: 'Polymorphism, default interface methods, sealed class hierarchies, and Records.',
            estimatedHours: 6,
            recommendationType: 'recommended',
            resources: [{ type: 'article', title: 'Baeldung: Java Records Guide', url: 'https://www.baeldung.com/java-record-keyword', isFree: true }]
          },
          {
            title: 'Exception Handling & Try-with-Resources',
            description: 'Checked vs unchecked exceptions, custom hierarchies, and AutoCloseable resources.',
            estimatedHours: 5,
            recommendationType: 'recommended',
            resources: [{ type: 'docs', title: 'Java Exception Handling Best Practices', url: 'https://www.baeldung.com/java-exceptions', isFree: true }]
          }
        ]
      },
      {
        title: 'Collections Framework & Generics',
        description: 'List, Set, Map hierarchies (ArrayList, LinkedList, HashSet, TreeSet, HashMap, ConcurrentHashMap) and generic classes/methods.',
        estimatedHours: 18,
        recommendationType: 'recommended',
        resources: [{ type: 'article', title: 'Baeldung: Guide to Java Collections Framework', url: 'https://www.baeldung.com/java-collections', isFree: true }],
        children: []
      },
      {
        title: 'Lambdas, Functional Interfaces & Streams API',
        description: 'Functional programming in Java: Predicate, Function, Consumer, Stream pipelines (filter, map, reduce, collectors), and Optional.',
        estimatedHours: 20,
        recommendationType: 'recommended',
        resources: [{ type: 'article', title: 'Baeldung: The Java 8+ Stream API Guide', url: 'https://www.baeldung.com/java-8-streams', isFree: true }],
        children: []
      },
      {
        title: 'Concurrency, Multithreading & Virtual Threads',
        description: 'ExecutorService, synchronization, locks, volatile, CompletableFuture, and Java 21 lightweight Virtual Threads (Project Loom).',
        estimatedHours: 22,
        recommendationType: 'recommended',
        projectCallout: {
          title: 'Intermediate Project Checkpoint',
          description: 'Build a multi-threaded web crawler or high-concurrency order processing engine.',
          level: 'intermediate'
        },
        resources: [{ type: 'docs', title: 'Java 21 Virtual Threads (Project Loom) Guide', url: 'https://docs.oracle.com/en/java/javase/21/core/virtual-threads.html', isFree: true }],
        children: []
      },
      {
        title: 'JVM Architecture, Garbage Collection & Profiling',
        description: 'ClassLoaders, Bytecode, Stack vs Heap memory, G1 / ZGC Garbage Collectors, JIT compiler, and VisualVM profiler.',
        estimatedHours: 18,
        recommendationType: 'recommended',
        resources: [{ type: 'article', title: 'Understanding JVM Architecture', url: 'https://www.baeldung.com/jvm-vs-jre-vs-jdk', isFree: true }],
        children: []
      },
      {
        title: 'Spring Boot 3, Spring Data JPA & REST APIs',
        description: 'Dependency Injection, Spring MVC REST Controllers, Spring Data JPA with PostgreSQL, and Spring Security with JWT.',
        estimatedHours: 26,
        recommendationType: 'recommended',
        resources: [{ type: 'docs', title: 'Spring Boot 3 Official Quickstart', url: 'https://spring.io/guides', isFree: true }],
        children: []
      },
      {
        title: 'Production Microservices & Cloud Deployment Capstone',
        description: 'Microservices with Spring Cloud, Docker, Kafka message queues, JUnit 5 / Testcontainers, and Kubernetes deployment.',
        estimatedHours: 24,
        recommendationType: 'recommended',
        resources: [{ type: 'docs', title: 'Spring Cloud Microservices Architecture Spec', url: 'https://spring.io/projects/spring-cloud', isFree: true }],
        children: []
      }
    ];
  }
  // 3. C++ Language Track
  else if (query.includes('c++') || query.includes('cpp')) {
    milestoneTemplates = [
      {
        title: 'C++ Foundations & Compilation Pipeline',
        description: 'Preprocessor directives, compilation vs linking, header files, header guards, namespaces, primitive types, and I/O streams.',
        estimatedHours: 16,
        recommendationType: 'recommended',
        projectCallout: {
          title: 'Beginner Project Checkpoint',
          description: 'Build a CLI matrix math engine or memory-efficient text buffer editor.',
          level: 'beginner'
        },
        resources: [
          { type: 'docs', title: 'LearnCpp.com â€” Outstanding Comprehensive Tutorial', url: 'https://www.learncpp.com/', isFree: true },
          { type: 'docs', title: 'cppreference.com â€” The C++ Standard Reference', url: 'https://en.cppreference.com/w/', isFree: true }
        ],
        children: [
          {
            title: 'Build Systems & CMake Basics',
            description: 'CMakeLists.txt, target_link_libraries, compiler flags (-Wall, -Wextra), and debug vs release builds.',
            estimatedHours: 5,
            recommendationType: 'recommended',
            resources: [{ type: 'docs', title: 'An Introduction to Modern CMake', url: 'https://cliutils.gitlab.io/modern-cmake/', isFree: true }]
          },
          {
            title: 'Functions, Pass-by-Value vs Pass-by-Reference',
            description: 'Constant references (const T&), function overloading, default arguments, and inline functions.',
            estimatedHours: 5,
            recommendationType: 'recommended',
            resources: [{ type: 'docs', title: 'Passing Arguments by Reference in C++', url: 'https://www.learncpp.com/cpp-tutorial/pass-by-lvalue-reference/', isFree: true }]
          }
        ]
      },
      {
        title: 'Memory Management, Pointers & References',
        description: 'Stack vs Heap memory, raw pointers, pointer arithmetic, memory alignment, dynamic allocation (new/delete), and avoiding memory leaks.',
        estimatedHours: 20,
        recommendationType: 'recommended',
        resources: [{ type: 'video', title: 'The Cherno: Pointers & References in C++', url: 'https://www.youtube.com/playlist?list=PLlrATfBNZ98dudnM48yfGUldqGD0S4G5b', isFree: true }],
        children: []
      },
      {
        title: 'RAII & Smart Pointers (std::unique_ptr, std::shared_ptr)',
        description: 'Resource Acquisition Is Initialization (RAII), std::unique_ptr, std::shared_ptr, std::weak_ptr, and custom deleters.',
        estimatedHours: 18,
        recommendationType: 'recommended',
        resources: [{ type: 'article', title: 'Modern C++ Smart Pointers Guide (LearnCpp)', url: 'https://www.learncpp.com/cpp-tutorial/stdunique_ptr/', isFree: true }],
        children: []
      },
      {
        title: 'Object-Oriented C++ & Rule of Zero/Three/Five',
        description: 'Constructors, Destructors, Copy/Move constructors, Move assignment, virtual functions, vtables, and abstract interfaces.',
        estimatedHours: 22,
        recommendationType: 'recommended',
        projectCallout: {
          title: 'Intermediate Project Checkpoint',
          description: 'Implement a custom dynamic array container (`CustomVector<T>`) with full move semantics and allocator support.',
          level: 'intermediate'
        },
        resources: [{ type: 'docs', title: 'The Rule of Three/Five/Zero (cppreference)', url: 'https://en.cppreference.com/w/cpp/language/rule_of_three', isFree: true }],
        children: []
      },
      {
        title: 'STL Containers & Algorithms (vector, map, iterators)',
        description: 'std::vector, std::array, std::unordered_map, std::span, iterators, std::sort, std::find, and lambda expressions.',
        estimatedHours: 20,
        recommendationType: 'recommended',
        resources: [{ type: 'docs', title: 'STL Algorithms Library Documentation', url: 'https://en.cppreference.com/w/cpp/algorithm', isFree: true }],
        children: []
      },
      {
        title: 'Templates, Metaprogramming & C++20 Concepts',
        description: 'Function/class templates, template specialization, constexpr, type traits, SFINAE, and C++20 Concepts/Requires clauses.',
        estimatedHours: 24,
        recommendationType: 'recommended',
        resources: [{ type: 'docs', title: 'C++20 Concepts and Constraints Guide', url: 'https://en.cppreference.com/w/cpp/language/constraints', isFree: true }],
        children: []
      },
      {
        title: 'High Performance & Concurrency Capstone (std::jthread, SIMD)',
        description: 'Multithreading with std::jthread, mutexes, atomic operations, lock-free queues, profiling with Valgrind/GDB, and game engine / networking capstone.',
        estimatedHours: 26,
        recommendationType: 'recommended',
        resources: [{ type: 'project', title: 'High-Performance Multithreaded Engine Architecture Spec', url: 'https://github.com/', isFree: true }],
        children: []
      }
    ];
  }
  // 4. Data / Analytics Track
  else if (query.includes('data') || query.includes('analytics')) {
    milestoneTemplates = [
      {
        title: 'Core Foundations & SQL Essentials',
        description: 'Master relational data modeling, complex querying, window functions, and database performance optimization.',
        estimatedHours: 15,
        recommendationType: 'recommended',
        projectCallout: { title: 'Beginner Project', description: 'Analyze real-world e-commerce sales data with complex SQL queries.', level: 'beginner' },
        resources: [
          { type: 'docs', title: 'PostgreSQL Official Documentation & Tutorials', url: 'https://www.postgresql.org/docs/', isFree: true },
          { type: 'practice', title: 'SQLBolt â€” Interactive Lessons & Exercises', url: 'https://sqlbolt.com/', isFree: true }
        ],
        children: []
      },
      {
        title: 'Python for Data Wrangling (Pandas & NumPy)',
        description: 'Data cleaning, tabular transformations, pivot tables, handling missing values, and vectorized computation.',
        estimatedHours: 20,
        recommendationType: 'recommended',
        resources: [{ type: 'docs', title: 'Pandas Documentation: 10 Minutes to Pandas', url: 'https://pandas.pydata.org/docs/user_guide/10min.html', isFree: true }],
        children: []
      },
      {
        title: 'Exploratory Data Analysis & Visualization',
        description: 'Design insightful visual narratives using Matplotlib, Seaborn, Plotly, and BI tools like PowerBI / Tableau.',
        estimatedHours: 16,
        recommendationType: 'recommended',
        resources: [{ type: 'docs', title: 'Seaborn Tutorial & Gallery Guide', url: 'https://seaborn.pydata.org/tutorial.html', isFree: true }],
        children: []
      },
      {
        title: 'Statistical Inference & Hypothesis Testing',
        description: 'Apply probability distributions, confidence intervals, A/B testing, regression analysis, and significance testing.',
        estimatedHours: 18,
        recommendationType: 'recommended',
        resources: [{ type: 'course', title: 'Khan Academy Statistics and Probability', url: 'https://www.khanacademy.org/math/statistics-probability', isFree: true }],
        children: []
      },
      {
        title: 'Data Pipelines & Warehousing (dbt, BigQuery/Snowflake)',
        description: 'Build automated ELT pipelines, staging models, lineage graphs, and dimensional data marts.',
        estimatedHours: 22,
        recommendationType: 'recommended',
        resources: [{ type: 'docs', title: 'dbt (Data Build Tool) Fundamentals & Docs', url: 'https://docs.getdbt.com/', isFree: true }],
        children: []
      },
      {
        title: 'Capstone: End-to-End Analytics Dashboard & Insight Report',
        description: `Execute a production-grade analytical project tailored to ${targetRole} requirements with interactive dashboards and executive summaries.`,
        estimatedHours: 25,
        recommendationType: 'recommended',
        resources: [{ type: 'project', title: 'Build a Public Portfolio Project on Kaggle / GitHub', url: 'https://github.com/', isFree: true }],
        children: []
      }
    ];
  }
  // 5. Full-Stack / Web Development
  else if (query.includes('web') || query.includes('frontend') || query.includes('fullstack')) {
    milestoneTemplates = [
      {
        title: 'Modern Web Foundations (HTML5, Semantic UI, Responsive CSS)',
        description: 'Build accessible, semantic markup with CSS Flexbox, Grid, custom properties, and responsive design patterns.',
        estimatedHours: 14,
        recommendationType: 'recommended',
        projectCallout: { title: 'Beginner Project', description: 'Create an accessible, multi-page responsive portfolio with CSS Grid.', level: 'beginner' },
        resources: [
          { type: 'docs', title: 'MDN Web Docs: HTML & CSS Structured Guides', url: 'https://developer.mozilla.org/en-US/docs/Learn', isFree: true },
          { type: 'course', title: 'FreeCodeCamp: Responsive Web Design Certification', url: 'https://www.freecodecamp.org/learn/2022/responsive-web-design/', isFree: true }
        ],
        children: [
          {
            title: 'Semantic HTML & Accessibility (a11y)',
            description: 'Landmark elements, ARIA attributes, keyboard navigation, and contrast guidelines.',
            estimatedHours: 6,
            recommendationType: 'recommended',
            resources: [{ type: 'docs', title: 'W3C Web Accessibility Initiative Guide', url: 'https://www.w3.org/WAI/', isFree: true }]
          },
          {
            title: 'Modern CSS Layouts (Flexbox & Grid)',
            description: 'Two-dimensional grid tracks, alignment properties, container queries, and subgrid.',
            estimatedHours: 8,
            recommendationType: 'recommended',
            resources: [{ type: 'docs', title: 'CSS-Tricks: Complete Guide to Flexbox & Grid', url: 'https://css-tricks.com/', isFree: true }]
          }
        ]
      },
      {
        title: 'Modern JavaScript Deep-Dive (ES6+, DOM, Asynchronous JS)',
        description: 'Master closures, event loop, Promises, async/await, fetch API, modular architecture, and DOM manipulation.',
        estimatedHours: 22,
        recommendationType: 'recommended',
        resources: [
          { type: 'docs', title: 'JavaScript.info: The Modern JavaScript Tutorial', url: 'https://javascript.info/', isFree: true },
          { type: 'practice', title: 'Exercism.org â€” JavaScript Track with Mentorship', url: 'https://exercism.org/tracks/javascript', isFree: true }
        ],
        children: []
      },
      {
        title: 'Frontend Framework & State Management (React / Vue / Svelte)',
        description: 'Component lifecycles, custom hooks, reactive state, declarative routing, and scalable client architecture.',
        estimatedHours: 28,
        recommendationType: 'recommended',
        projectCallout: { title: 'Intermediate Project', description: 'Build an interactive Kanban Board with global state and optimistic updates.', level: 'intermediate' },
        resources: [
          { type: 'docs', title: 'React Official Documentation: Quick Start & Hooks', url: 'https://react.dev/learn', isFree: true },
          { type: 'course', title: 'Full Stack Open â€” Deep Dive Into Modern Web Development', url: 'https://fullstackopen.com/en/', isFree: true }
        ],
        children: []
      },
      {
        title: 'Backend API Engineering & Database Architecture',
        description: 'Design REST/GraphQL services, auth middleware (JWT/OAuth), relational databases (PostgreSQL), and ORM patterns.',
        estimatedHours: 26,
        recommendationType: 'recommended',
        resources: [
          { type: 'docs', title: 'Node.js Official API Guides & Best Practices', url: 'https://nodejs.org/en/learn', isFree: true },
          { type: 'docs', title: 'Prisma ORM & PostgreSQL Integration Guides', url: 'https://www.prisma.io/docs', isFree: true }
        ],
        children: []
      },
      {
        title: 'Testing, CI/CD & Production Deployment',
        description: 'Implement unit/integration tests with Vitest/Jest, GitHub Actions CI/CD, Docker containers, and Cloud hosting.',
        estimatedHours: 18,
        recommendationType: 'recommended',
        resources: [
          { type: 'docs', title: 'Testing Library & Vitest Documentation', url: 'https://testing-library.com/docs/', isFree: true },
          { type: 'docs', title: 'Docker Official Get-Started Guide', url: 'https://docs.docker.com/get-started/', isFree: true }
        ],
        children: []
      },
      {
        title: 'Full-Stack Capstone Application & Portfolio Showcase',
        description: `Ship a production-grade application with authentication, real-time data, and payment/APIs meeting ${targetRole} industry standards.`,
        estimatedHours: 30,
        recommendationType: 'recommended',
        resources: [
          { type: 'project', title: 'Full-Stack Production App Checklist & Architecture Spec', url: 'https://github.com/', isFree: true }
        ],
        children: []
      }
    ];
  }
  // 6. Universal Dynamic Generator for ANY topic (e.g. Quantum Computing, Bioinformatics, Embedded Systems, Rust, Go, etc.)
  else {
    const cleanTopic = interests.split(',')[0].trim() || 'Software Engineering';
    milestoneTemplates = [
      {
        title: `${cleanTopic} Foundations & Core Principles`,
        description: `Understand the fundamental concepts, mental models, mathematical/architectural theory, and terminology of ${cleanTopic}.`,
        estimatedHours: 16,
        recommendationType: 'recommended',
        projectCallout: { title: 'Beginner Project', description: `Build a starter prototype or simulation implementing core ${cleanTopic} rules.`, level: 'beginner' },
        resources: [
          { type: 'docs', title: `Official Documentation & Guides for ${cleanTopic}`, url: 'https://developer.mozilla.org/', isFree: true },
          { type: 'article', title: `Essential Guide to ${cleanTopic} Fundamentals`, url: 'https://github.com/', isFree: true }
        ],
        children: [
          { title: `Core Concepts & Terminology of ${cleanTopic}`, estimatedHours: 5, recommendationType: 'recommended', resources: [{ type: 'docs', title: 'Documentation Reference', url: 'https://developer.mozilla.org/', isFree: true }] },
          { title: `Environment Setup & Tooling Configuration`, estimatedHours: 4, recommendationType: 'recommended', resources: [{ type: 'docs', title: 'Setup Guide', url: 'https://github.com/', isFree: true }] }
        ]
      },
      {
        title: `Practical Tooling, Syntax & Workflows in ${cleanTopic}`,
        description: `Master standard frameworks, libraries, APIs, and command-line toolchains used by professional ${targetRole}s.`,
        estimatedHours: 22,
        recommendationType: 'recommended',
        resources: [
          { type: 'course', title: `Comprehensive Hands-on Workshop for ${cleanTopic}`, url: 'https://youtube.com/', isFree: true }
        ],
        children: [
          { title: `Standard Library & API Contracts`, estimatedHours: 6, recommendationType: 'recommended', resources: [] },
          { title: `Data Flow & State Manipulation`, estimatedHours: 6, recommendationType: 'alternative', resources: [] }
        ]
      },
      {
        title: `Intermediate Architecture & System Design`,
        description: `Design scalable, modular structures, handle asynchronous events/pipelines, and enforce clean abstraction boundaries.`,
        estimatedHours: 24,
        recommendationType: 'recommended',
        projectCallout: { title: 'Intermediate Project', description: `Develop an end-to-end ${cleanTopic} utility with automated tests.`, level: 'intermediate' },
        resources: [
          { type: 'article', title: `Design Patterns and Architectural Tradeoffs in ${cleanTopic}`, url: 'https://github.com/', isFree: true }
        ],
        children: []
      },
      {
        title: `Advanced Performance Optimization & Debugging`,
        description: `Profile bottlenecks, optimize memory and algorithmic complexity, and configure error monitoring & telemetry.`,
        estimatedHours: 20,
        recommendationType: 'recommended',
        resources: [
          { type: 'docs', title: `Benchmarking and Optimization Guide for ${cleanTopic}`, url: 'https://developer.mozilla.org/', isFree: true }
        ],
        children: []
      },
      {
        title: `Security, Testing & Automated CI/CD Pipelines`,
        description: `Implement unit/integration tests, audit security vulnerabilities, and set up continuous automated verification.`,
        estimatedHours: 18,
        recommendationType: 'recommended',
        resources: [
          { type: 'docs', title: 'Automated Testing and Continuous Integration Best Practices', url: 'https://github.com/features/actions', isFree: true }
        ],
        children: []
      },
      {
        title: `Production Capstone Project & Portfolio System`,
        description: `Build and deploy a complete, production-ready ${cleanTopic} system solving real-world challenges for ${targetRole}.`,
        estimatedHours: 28,
        recommendationType: 'recommended',
        resources: [
          { type: 'project', title: `Production Capstone Specification for ${cleanTopic}`, url: 'https://github.com/', isFree: true }
        ],
        children: []
      }
    ];
  }

  const nodes = milestoneTemplates.map((m) => {
    const nodeObj = {
      id: crypto.randomUUID(),
      title: m.title,
      description: m.description,
      status: 'not_started',
      progress: 0,
      estimatedHours: m.estimatedHours || 12,
      recommendationType: m.recommendationType || 'recommended',
      projectCallout: m.projectCallout || null,
      resources: m.resources || [],
      children: (m.children || []).map(child => ({
        id: crypto.randomUUID(),
        title: child.title,
        description: child.description || '',
        status: 'not_started',
        progress: 0,
        estimatedHours: child.estimatedHours || 4,
        recommendationType: child.recommendationType || 'recommended',
        projectCallout: null,
        resources: child.resources || [],
        children: [],
        isExpandable: false,
        isExpanded: false
      })),
      isExpandable: true,
      isExpanded: true
    };
    return validateNode(nodeObj);
  });

  return {
    id: crypto.randomUUID(),
    userId: userId || 'usr_guest',
    title: `${targetRole || interests} Mastery Roadmap`,
    goal: goal,
    targetRole: targetRole,
    interests: interests,
    skillLevel: level,
    skillDetails: profile.skillDetails || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodes: nodes
  };
}

function generateSmartOfflineSubmodules(milestone) {
  const title = milestone.title || 'Core Topic';
  return [
    {
      id: crypto.randomUUID(),
      title: `Fundamentals & Core Theory of ${title.split('(')[0].trim()}`,
      description: `Understand the core architecture, mental model, and foundational principles behind ${title}.`,
      status: 'not_started',
      progress: 0,
      estimatedHours: Math.max(2, Math.round((milestone.estimatedHours || 12) * 0.25)),
      recommendationType: 'recommended',
      resources: [
        { type: 'article', title: `Deep Dive: Introduction to ${title.split('(')[0].trim()}`, url: 'https://developer.mozilla.org/', isFree: true },
        { type: 'video', title: `Visual Mental Models & Lecture`, url: 'https://www.youtube.com/', isFree: true }
      ],
      children: [],
      isExpandable: false,
      isExpanded: false
    },
    {
      id: crypto.randomUUID(),
      title: `Hands-On Implementation & Patterns`,
      description: `Build practical working examples, leverage industry-standard design patterns, and write clean, maintainable code.`,
      status: 'not_started',
      progress: 0,
      estimatedHours: Math.max(3, Math.round((milestone.estimatedHours || 12) * 0.35)),
      recommendationType: 'recommended',
      resources: [
        { type: 'docs', title: `Official Implementation Guide & API Reference`, url: 'https://devdocs.io/', isFree: true },
        { type: 'practice', title: `Interactive Code Challenges & Exercises`, url: 'https://exercism.org/', isFree: true }
      ],
      children: [],
      isExpandable: true,
      isExpanded: false
    },
    {
      id: crypto.randomUUID(),
      title: `Alternative Patterns & Tooling`,
      description: `Explore alternative frameworks, libraries, or architectural approaches to solve the same problem.`,
      status: 'not_started',
      progress: 0,
      estimatedHours: Math.max(2, Math.round((milestone.estimatedHours || 12) * 0.2)),
      recommendationType: 'alternative',
      resources: [
        { type: 'article', title: `Comparison & Tradeoff Analysis`, url: 'https://dev.to/', isFree: true }
      ],
      children: [],
      isExpandable: false,
      isExpanded: false
    },
    {
      id: crypto.randomUUID(),
      title: `Mini-Project & Practical Checkpoint`,
      description: `Assemble everything learned in this module into a self-contained, working portfolio artifact.`,
      status: 'not_started',
      progress: 0,
      estimatedHours: Math.max(3, Math.round((milestone.estimatedHours || 12) * 0.2)),
      recommendationType: 'optional',
      resources: [
        { type: 'project', title: `Project Specification & Verification Checklist`, url: 'https://github.com/', isFree: true }
      ],
      children: [],
      isExpandable: false,
      isExpanded: false
    }
  ];
}

// ==========================================
// External AI Provider Integrations
// ==========================================
async function callGemini(systemPrompt, userPrompt, apiKey, modelName = 'gemini-1.5-flash') {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nUser Request:\n${userPrompt}` }] }],
    generationConfig: { temperature: 0.2, responseMimeType: 'application/json' }
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No content returned from Gemini');
  return extractAndParseJSON(text);
}

async function callClaude(systemPrompt, userPrompt, apiKey, modelName = 'claude-3-5-sonnet-20241022') {
  const endpoint = 'https://api.anthropic.com/v1/messages';
  const payload = {
    model: modelName,
    max_tokens: 4000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }]
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Claude API error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text;
  if (!text) throw new Error('No content returned from Claude');
  return extractAndParseJSON(text);
}

async function callOpenAI(systemPrompt, userPrompt, apiKey, modelName = 'gpt-4o-mini') {
  const endpoint = 'https://api.openai.com/v1/chat/completions';
  const payload = {
    model: modelName,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`OpenAI API error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('No content returned from OpenAI');
  return extractAndParseJSON(text);
}

async function runAIGeneration(systemPrompt, userPrompt) {
  const config = getSecretConfig();
  if (config.provider === 'gemini' && config.geminiApiKey) {
    try {
      return await callGemini(systemPrompt, userPrompt, config.geminiApiKey, config.geminiModel);
    } catch (err) {
      console.warn('Gemini call failed, falling back to smart engine:', err.message);
    }
  } else if (config.provider === 'claude' && config.claudeApiKey) {
    try {
      return await callClaude(systemPrompt, userPrompt, config.claudeApiKey, config.claudeModel);
    } catch (err) {
      console.warn('Claude call failed, falling back to smart engine:', err.message);
    }
  } else if (config.provider === 'openai' && config.openaiApiKey) {
    try {
      return await callOpenAI(systemPrompt, userPrompt, config.openaiApiKey, config.openaiModel);
    } catch (err) {
      console.warn('OpenAI call failed, falling back to smart engine:', err.message);
    }
  }
  return null;
}

// Prompt Â§4a

async function runHermesMLEngine(profile) {
  return new Promise((resolve, reject) => {

    const rootDir = __dirname;

    const enginePath = path.join(
      rootDir,
      'ml',
      'src',
      'hermes_engine.py'
    );

    if (!fs.existsSync(enginePath)) {
      return reject(
        new Error(
          `Hermes ML engine not found: ${enginePath}`
        )
      );
    }

    const candidates =
      process.platform === 'win32'
        ? [
            path.join(
              rootDir,
              'ml',
              '.venv',
              'Scripts',
              'python.exe'
            ),
            path.join(
              rootDir,
              '.venv',
              'Scripts',
              'python.exe'
            ),
            'python'
          ]
        : [
            path.join(
              rootDir,
              'ml',
              '.venv',
              'bin',
              'python'
            ),
            path.join(
              rootDir,
              '.venv',
              'bin',
              'python'
            ),
            'python3',
            'python'
          ];

    const pythonPath =
      candidates.find(p => {
        if (
          p === 'python' ||
          p === 'python3'
        ) {
          return true;
        }

        return fs.existsSync(p);
      });

    if (!pythonPath) {
      return reject(
        new Error(
          'Python interpreter not found'
        )
      );
    }

    const input = JSON.stringify({

      goal:
        profile.goal || '',

      targetRole:
        profile.targetRole || '',

      interests:
        profile.interests || '',

      skillLevel:
        profile.skillLevel ||
        'Beginner',

      skillDetails:
        profile.skillDetails || '',

      topK:
        Math.max(
          1,
          Math.min(
            Number(profile.topK) || 26,
            75
          )
        )

    });

    let stdout = '';
    let stderr = '';

    const child = spawn(
      pythonPath,
      [enginePath],
      {
        cwd: rootDir,
        windowsHide: true,

        stdio: [
          'pipe',
          'pipe',
          'pipe'
        ]
      }
    );

    child.stdout.on(
      'data',
      data => {
        stdout += data.toString();
      }
    );

    child.stderr.on(
      'data',
      data => {
        stderr += data.toString();
      }
    );

    child.on(
      'error',
      error => {
        reject(error);
      }
    );

    child.on(
      'close',
      code => {

        if (code !== 0) {

          return reject(
            new Error(
              `Hermes ML exited with code ${code}: ${stderr}`
            )
          );

        }

        try {

          const result =
            JSON.parse(
              stdout.trim()
            );

          if (
            result.success !== true
          ) {

            return reject(
              new Error(
                result.error ||
                'Hermes ML failed'
              )
            );

          }

          if (
            !Array.isArray(
              result.skills
            )
          ) {

            return reject(
              new Error(
                'Hermes ML returned invalid skills'
              )
            );

          }

          resolve(result);

        } catch (error) {

          reject(
            new Error(
              `Could not parse Hermes ML JSON: ${error.message}\n${stdout}`
            )
          );

        }

      }
    );

    child.stdin.write(input);
    child.stdin.end();

  });
}
function buildPrompt4a(profile) {
  const schemaStr = `
{
  "title": "string (e.g. 'Frontend Developer Mastery Roadmap')",
  "milestones": [
    {
      "id": "uuid",
      "title": "string",
      "description": "1-2 sentence summary",
      "status": "not_started",
      "progress": 0,
      "estimatedHours": 15,
      "resources": [
        { "type": "article | video | course | docs | practice | project", "title": "string", "url": "string (real URL or empty string)", "isFree": true }
      ],
      "children": [],
      "isExpandable": true,
      "isExpanded": false
    }
  ]
}`;

  const system = `You are an expert curriculum designer and career mentor. Given a learner's profile, generate a personalized, realistic learning roadmap as valid JSON only â€” no prose, no markdown fences.

Rules:
1. Output must match this JSON schema exactly: ${schemaStr}
2. Generate 5-9 top-level milestones, ordered foundational -> advanced, tailored to the stated level (skip basics the learner already has).
3. Each milestone needs a title, a 1-2 sentence description, an estimatedHours value (e.g. 10-30), and 2-4 real, well-known resources (official docs, reputable courses/platforms/channels). Never invent a URL you aren't confident is real â€” if unsure, give the resource by name only and omit url or use empty string.
4. Set isExpandable: true on any milestone broad enough to break down further; leave children as an empty array (submodules are generated later, on demand).
5. The final 1-2 milestones should map directly to skills/portfolio outcomes relevant to target occupation, if provided.
6. Set status to "not_started" and progress to 0 for all milestones.`;

  const user = `Learner profile:
- Interests: ${Array.isArray(profile.interests) ? profile.interests.join(', ') : profile.interests}
- Current level: ${profile.skillLevel || 'Beginner'} (details: ${profile.skillDetails || 'None provided'})
- Learning goal: ${profile.goal || 'Master the subject and build projects'}
- Target occupation: ${profile.targetRole || 'Professional Developer'}`;

  return { system, user };
}

// Prompt Â§4b
function buildPrompt4b(milestone, context) {
  const schemaStr = `
{
  "submodules": [
    {
      "id": "uuid",
      "title": "string",
      "description": "1-2 sentence summary",
      "status": "not_started",
      "progress": 0,
      "estimatedHours": 4,
      "resources": [
        { "type": "article | video | course | docs | practice | project", "title": "string", "url": "string", "isFree": true }
      ],
      "children": [],
      "isExpandable": false,
      "isExpanded": false
    }
  ]
}`;

  const system = `You are expanding one milestone of an existing learning roadmap into more granular submodules. Stay tightly scoped to this milestone; do not repeat sibling milestones.

Return 3-6 submodule nodes as valid JSON only, matching this schema: ${schemaStr}.
Each submodule should be independently completable, include 1-3 verified resources, and set isExpandable: true only if the sub-topic is genuinely broad enough to warrant a further breakdown.`;

  const user = `Context:
- Overall goal: ${context.goal || 'Mastery'} / target role: ${context.targetRole || 'Engineer'} / level: ${context.skillLevel || 'Beginner'}
- Milestone being expanded: ${milestone.title} â€” ${milestone.description}
- Milestone Estimated Hours: ${milestone.estimatedHours || 12}`;

  return { system, user };
}

// ==========================================
// HTTP Server & Route Handler
// ==========================================

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body.trim()) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method.toUpperCase();

  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  try {
    const authUser = await getAuthUser(req);

    // ==========================================
    // AUTHENTICATION ROUTES
    // ==========================================
    
    // POST /api/auth/signup - Register new user
    if (pathname === '/api/auth/signup' && method === 'POST') {
      const body = await parseBody(req);
      const { name, email, password } = body;

      if (!name || !email || !password) {
        return sendJSON(res, 400, { error: 'Please provide full name, email, and password.' });
      }

      if (password.length < 6) {
        return sendJSON(res, 400, { error: 'Password must be at least 6 characters long.' });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const existingUser = await dbGetUserByEmail(normalizedEmail);

      if (existingUser) {
        return sendJSON(res, 409, { error: 'An account with this email address already exists.' });
      }

      const { hash, salt } = hashPassword(password);
      const newUser = {
        id: 'usr_' + crypto.randomBytes(8).toString('hex'),
        name: name.trim(),
        email: normalizedEmail,
        passwordHash: hash,
        salt: salt,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(normalizedEmail)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await dbCreateUser(newUser);

      const token = await createSession(newUser.id);
      return sendJSON(res, 201, {
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          avatar: newUser.avatar,
          createdAt: newUser.createdAt
        }
      });
    }

    // POST /api/auth/login - Log in existing user
    if (pathname === '/api/auth/login' && method === 'POST') {
      const body = await parseBody(req);
      const { email, password } = body;

      if (!email || !password) {
        return sendJSON(res, 400, { error: 'Email and password are required.' });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const user = await dbGetUserByEmail(normalizedEmail);

      if (!user || !verifyPassword(password, user.passwordHash, user.salt)) {
        return sendJSON(res, 401, { error: 'Invalid email or password. Please try again.' });
      }

      const token = await createSession(user.id);
      return sendJSON(res, 200, {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          createdAt: user.createdAt
        }
      });
    }

    // GET /api/auth/me - Check current session
    if (pathname === '/api/auth/me' && method === 'GET') {
      if (!authUser) {
        return sendJSON(res, 401, { authenticated: false, user: null });
      }
      return sendJSON(res, 200, { authenticated: true, user: authUser });
    }

    // POST /api/auth/logout
    if (pathname === '/api/auth/logout' && method === 'POST') {
      const authHeader = req.headers['authorization'] || '';
      if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7).trim();
        await dbDeleteSession(token);
      }
      return sendJSON(res, 200, { success: true });
    }

    // GET /api/auth/demo-users - Quick test login
    if (pathname === '/api/auth/demo-users' && method === 'GET') {
      return sendJSON(res, 200, [
        { email: 'thanatos@hermes.io', password: 'thanatos123', name: 'Thanatos (Frontend Specialist)', role: 'Frontend Specialist' },
        { email: 'cronus@hermes.io', password: 'cronus123', name: 'Cronus (AI & ML Engineer)', role: 'AI & ML Engineer' }
      ]);
    }

    // POST /api/auth/claim-guest-roadmaps - Transfer guest roadmaps to user account
    if (pathname === '/api/auth/claim-guest-roadmaps' && method === 'POST') {
      if (!authUser) return sendJSON(res, 401, { error: 'Unauthorized' });
      const body = await parseBody(req);
      const { roadmapIds } = body;
      
      if (Array.isArray(roadmapIds) && roadmapIds.length > 0) {
        await dbClaimGuestRoadmaps(roadmapIds, authUser.id);
        return sendJSON(res, 200, { success: true, claimed: roadmapIds.length });
      }
      return sendJSON(res, 200, { success: true, claimed: 0 });
    }

    // ==========================================
    // GENERAL & CONFIG ROUTES
    // ==========================================

    if (pathname === '/api/health' && method === 'GET') {
      return sendJSON(res, 200, { status: 'ok', name: 'Hermes.io', timestamp: new Date().toISOString() });
    }

    if (pathname === '/api/config' && method === 'GET') {
      return sendJSON(res, 200, getAppConfig());
    }

    if (pathname === '/api/config' && method === 'POST') {
      const body = await parseBody(req);
      const current = readJSON(CONFIG_FILE, {});
      if (body.provider) current.provider = body.provider;
      if (body.geminiApiKey !== undefined) current.geminiApiKey = body.geminiApiKey;
      if (body.claudeApiKey !== undefined) current.claudeApiKey = body.claudeApiKey;
      if (body.openaiApiKey !== undefined) current.openaiApiKey = body.openaiApiKey;
      if (body.supabaseUrl !== undefined) current.supabaseUrl = body.supabaseUrl;
      if (body.supabaseKey !== undefined) current.supabaseKey = body.supabaseKey;
      if (body.geminiModel) current.geminiModel = body.geminiModel;
      if (body.claudeModel) current.claudeModel = body.claudeModel;
      if (body.openaiModel) current.openaiModel = body.openaiModel;
      writeJSON(CONFIG_FILE, current);
      return sendJSON(res, 200, { success: true, config: getAppConfig() });
    }

    // POST /api/supabase/test - Verify connection to Supabase instance
    if (pathname === '/api/supabase/test' && method === 'POST') {
      const body = await parseBody(req);
      const testUrl = body.supabaseUrl || process.env.SUPABASE_URL;
      const testKey = body.supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

      if (!testUrl || !testKey) {
        return sendJSON(res, 400, { error: 'Please provide both Supabase Project URL and API Key.' });
      }

      try {
        const endpoint = `${testUrl.replace(/\/+$/, '')}/rest/v1/users?limit=1`;
        const testRes = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'apikey': testKey,
            'Authorization': `Bearer ${testKey}`
          }
        });

        if (testRes.ok) {
          return sendJSON(res, 200, { success: true, message: 'Successfully connected to Supabase PostgreSQL database!' });
        } else {
          const errText = await testRes.text();
          return sendJSON(res, 400, { error: `Supabase returned status ${testRes.status}: ${errText.substring(0, 150)}` });
        }
      } catch (err) {
        return sendJSON(res, 500, { error: `Connection failed: ${err.message}` });
      }
    }

    // POST /api/supabase/sync - Migrate all local data to Supabase
    if (pathname === '/api/supabase/sync' && method === 'POST') {
      const { url, key } = getSupabaseConfig();
      if (!url || !key) {
        return sendJSON(res, 400, { error: 'Supabase credentials are not configured.' });
      }

      try {
        const localUsers = readJSON(USERS_FILE, []);
        const localRoadmaps = readJSON(ROADMAPS_FILE, []);

        let userCount = 0;
        let roadmapCount = 0;

        // Sync users
        for (const user of localUsers) {
          const payload = {
            id: user.id,
            name: user.name,
            email: user.email,
            password_hash: user.passwordHash || user.password_hash || '',
            avatar: user.avatar || '',
            created_at: user.createdAt || new Date().toISOString()
          };
          const res = await supabaseRequest('users', '', 'POST', payload, 'resolution=merge-duplicates');
          if (res) userCount++;
        }

        // Sync roadmaps
        for (const rdm of localRoadmaps) {
          const payload = {
            id: rdm.id,
            user_id: rdm.userId && rdm.userId.startsWith('usr_') ? null : rdm.userId,
            title: rdm.title,
            goal: rdm.goal,
            target_role: rdm.targetRole,
            interests: rdm.interests,
            skill_level: rdm.skillLevel || 'Beginner',
            skill_details: rdm.skillDetails || '',
            nodes: rdm.nodes || [],
            overall_progress: rdm.overallProgress || 0,
            total_hours: rdm.totalHours || 0,
            completed_hours: rdm.completedHours || 0,
            created_at: rdm.createdAt || new Date().toISOString(),
            updated_at: rdm.updatedAt || new Date().toISOString()
          };
          const res = await supabaseRequest('roadmaps', '', 'POST', payload, 'resolution=merge-duplicates');
          if (res) roadmapCount++;
        }

        return sendJSON(res, 200, {
          success: true,
          message: `Synced ${userCount} users and ${roadmapCount} roadmaps to Supabase Cloud!`,
          syncedUsers: userCount,
          syncedRoadmaps: roadmapCount
        });
      } catch (err) {
        return sendJSON(res, 500, { error: `Sync failed: ${err.message}` });
      }
    }

    // ==========================================
    // ROADMAP CRUD (User-Isolated)
    // ==========================================

    // GET /api/roadmaps - List roadmaps for active user (or guest)
    if (pathname === '/api/roadmaps' && method === 'GET') {
      const effectiveUserId = authUser ? authUser.id : (parsedUrl.query?.guestId || 'usr_guest');
      const userRoadmaps = await dbGetRoadmaps(effectiveUserId);

      const summaries = userRoadmaps.map(r => {
        const rollup = calculateRollup(r.nodes || []);
        return {
          id: r.id,
          userId: r.userId,
          title: r.title,
          goal: r.goal,
          targetRole: r.targetRole,
          interests: r.interests,
          skillLevel: r.skillLevel,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          milestonesCount: (r.nodes || []).length,
          overallProgress: rollup.overallProgress,
          totalHours: rollup.totalHours,
          completedHours: rollup.completedHours
        };
      });
      return sendJSON(res, 200, summaries);
    }

    // POST /api/roadmaps - Save new roadmap to database
    if (pathname === '/api/roadmaps' && method === 'POST') {
      const body = await parseBody(req);
      if (!body.title || !Array.isArray(body.nodes)) {
        return sendJSON(res, 400, { error: 'Invalid roadmap payload. Requires title and nodes array.' });
      }

      const effectiveUserId = authUser ? authUser.id : (body.userId || 'usr_guest');

      const roadmap = {
        id: body.id || crypto.randomUUID(),
        userId: effectiveUserId,
        title: String(body.title),
        goal: String(body.goal || ''),
        targetRole: String(body.targetRole || ''),
        interests: body.interests || '',
        skillLevel: body.skillLevel || 'Beginner',
        skillDetails: body.skillDetails || '',
        createdAt: body.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        nodes: (body.nodes || []).map(validateNode)
      };

      await dbSaveRoadmap(roadmap);
      return sendJSON(res, 201, roadmap);
    }

    // GET /api/roadmaps/:id
    const matchRoadmapId = pathname.match(/^\/api\/roadmaps\/([a-zA-Z0-9_-]+)$/);
    if (matchRoadmapId && method === 'GET') {
      const id = matchRoadmapId[1];
      const found = await dbGetRoadmapById(id);
      if (!found) return sendJSON(res, 404, { error: 'Roadmap not found' });

      const rollup = calculateRollup(found.nodes || []);
      found.nodes = rollup.nodes;
      found.overallProgress = rollup.overallProgress;
      found.totalHours = rollup.totalHours;
      found.completedHours = rollup.completedHours;
      return sendJSON(res, 200, found);
    }

    // PUT /api/roadmaps/:id
    if (matchRoadmapId && method === 'PUT') {
      const id = matchRoadmapId[1];
      const body = await parseBody(req);
      const existing = await dbGetRoadmapById(id);
      if (!existing) return sendJSON(res, 404, { error: 'Roadmap not found' });

      if (authUser && existing.userId && existing.userId !== authUser.id && existing.userId !== 'usr_guest') {
        return sendJSON(res, 403, { error: 'Forbidden: You do not own this roadmap' });
      }

      const updates = {};
      if (body.title) updates.title = body.title;
      if (body.goal) updates.goal = body.goal;
      if (body.targetRole !== undefined) updates.targetRole = body.targetRole;
      if (body.nodes && Array.isArray(body.nodes)) updates.nodes = body.nodes.map(validateNode);

      const updated = await dbUpdateRoadmap(id, updates);
      return sendJSON(res, 200, updated || { ...existing, ...updates, updatedAt: new Date().toISOString() });
    }

    // DELETE /api/roadmaps/:id
    if (matchRoadmapId && method === 'DELETE') {
      const id = matchRoadmapId[1];
      const target = await dbGetRoadmapById(id);
      if (!target) return sendJSON(res, 404, { error: 'Roadmap not found' });

      if (authUser && target.userId && target.userId !== authUser.id && target.userId !== 'usr_guest') {
        return sendJSON(res, 403, { error: 'Forbidden: You do not own this roadmap' });
      }

      await dbDeleteRoadmap(id);
      return sendJSON(res, 200, { success: true, message: 'Roadmap deleted successfully' });
    }

    // ==========================================
    // AI GENERATION ROUTES
    // ==========================================

    // POST /api/generate - Hermes ML primary engine
    if (pathname === '/api/generate' && method === 'POST') {

      const profile =
        await parseBody(req);

      if (
        !profile.interests &&
        !profile.goal
      ) {

        return sendJSON(
          res,
          400,
          {
            error:
              'Profile must include interests or goal'
          }
        );

      }

      const effectiveUserId =
        authUser
          ? authUser.id
          : (
              profile.userId ||
              'usr_guest'
            );

      // ======================================================
      // HERMES ML
      // ======================================================

      try {

        console.log(
          '[Hermes ML] Starting roadmap generation...'
        );

        const mlResult =
          await runHermesMLEngine(
            profile
          );

        console.log(
          `[Hermes ML] Generated ${mlResult.skills.length} skills`
        );

        // ====================================================
        // CONVERT ML OUTPUT TO HERMES NODES
        // ====================================================

        const nodes =
          mlResult.skills.map(
            (skill, index) => {

              return validateNode({

                id:
                  skill.skillId ||
                  `skill_${index + 1}`,

                title:
                  skill.title ||
                  skill.name ||
                  `Skill ${index + 1}`,

                description:
                  skill.description ||
                  `Learn ${
                    skill.title ||
                    skill.name ||
                    'this skill'
                  }.`,

                status:
                  index === 0
                    ? 'available'
                    : 'locked',

                progress: 0,

                estimatedHours:
                  Number(
                    skill.estimatedHours
                  ) || 0,

                recommendationType:
                  'recommended',

                projectCallout:
                  null,

                resources:
                  Array.isArray(
                    skill.resources
                  )
                    ? skill.resources
                    : [],

                children: [],

                isExpandable: false,

                isExpanded: false,

                category:
                  skill.category ||
                  mlResult.domain ||
                  'general',

                parentId:
                  skill.parentId ||
                  null,

                parentTitle:
                  skill.parentTitle ||
                  null,

                semanticScore:
                  Number(
                    skill.semanticScore
                  ) || 0,

                prerequisiteDepth:
                  Number(
                    skill.prerequisiteDepth
                  ) || 0,

                                  topics:
                  Array.isArray(skill.topics)
                    ? skill.topics
                        .map((t) => String(t).trim())
                        .filter(Boolean)
                    : [],

                practicalSkills:
                  Array.isArray(skill.practicalSkills)
                    ? skill.practicalSkills
                        .map((s) => String(s).trim())
                        .filter(Boolean)
                    : [],

                tools:
                  Array.isArray(skill.tools)
                    ? skill.tools
                        .map((t) => String(t).trim())
                        .filter(Boolean)
                    : [],

                phase:
                  skill.phase ||
                  null,

                projectCallout:
                  skill.projectCallout ||
                  null,

                order:
                  Number(
                    skill.order
                  ) ||
                  index + 1

              });

            }
          );

        // ====================================================
        // FINAL ROADMAP
        // ====================================================

        const finalRoadmap = {

          id:
            crypto.randomUUID(),

          userId:
            effectiveUserId,

          title:
            profile.targetRole
              ? `${profile.targetRole} Learning Roadmap`
              : (
                  mlResult.domain
                    ? `${mlResult.domain} Learning Roadmap`
                    : 'Hermes Learning Roadmap'
                ),

          goal:
            profile.goal ||
            '',

          targetRole:
            profile.targetRole ||
            '',

          interests:
            Array.isArray(
              profile.interests
            )
              ? profile.interests.join(', ')
              : (
                  profile.interests ||
                  ''
                ),

          skillLevel:
            profile.skillLevel ||
            'Beginner',

          skillDetails:
            profile.skillDetails ||
            '',

          engine:
            mlResult.engine ||
            'hermes-ml',

          domain:
            mlResult.domain ||
            'general',

          skillCount:
            nodes.length,

          totalHours:
            Number(
              mlResult.totalHours
            ) ||
            nodes.reduce(
              (sum, node) =>
                sum +
                (
                  Number(
                    node.estimatedHours
                  ) || 0
                ),
              0
            ),

          createdAt:
            new Date().toISOString(),

          updatedAt:
            new Date().toISOString(),

          nodes

        };

        // ====================================================
        // SAVE
        // ====================================================

        await dbSaveRoadmap(finalRoadmap);

        console.log(
          '[Hermes ML] Roadmap saved to Supabase.'
        );

        return sendJSON(
          res,
          200,
          finalRoadmap
        );

      } catch (mlError) {

        // ====================================================
        // ML FAILED -> EXISTING AI FALLBACK
        // ====================================================

        console.error(
          '[Hermes ML] Failed:',
          mlError.message
        );

        console.log(
          '[Hermes ML] Using existing AI fallback...'
        );

        try {

          const {
            system,
            user
          } =
            buildPrompt4a(
              profile
            );

          const aiResult =
            await runAIGeneration(
              system,
              user
            );

          let finalRoadmap;

          if (
            aiResult &&
            (
              aiResult.milestones ||
              Array.isArray(aiResult)
            )
          ) {

            const milestones =
              Array.isArray(aiResult)
                ? aiResult
                : (
                    aiResult.milestones ||
                    []
                  );

            finalRoadmap = {

              id:
                crypto.randomUUID(),

              userId:
                effectiveUserId,

              title:
                aiResult.title ||
                `${
                  profile.targetRole ||
                  profile.interests
                } Learning Roadmap`,

              goal:
                profile.goal ||
                '',

              targetRole:
                profile.targetRole ||
                '',

              interests:
                Array.isArray(
                  profile.interests
                )
                  ? profile.interests.join(', ')
                  : (
                      profile.interests ||
                      ''
                    ),

              skillLevel:
                profile.skillLevel ||
                'Beginner',

              skillDetails:
                profile.skillDetails ||
                '',

              createdAt:
                new Date().toISOString(),

              updatedAt:
                new Date().toISOString(),

              nodes:
                milestones.map(
                  validateNode
                )

            };

          } else {

            finalRoadmap =
              generateSmartOfflineRoadmap(
                profile,
                effectiveUserId
              );

          }

          await dbSaveRoadmap(finalRoadmap);

          return sendJSON(
            res,
            200,
            finalRoadmap
          );

        } catch (fallbackError) {

          console.error(
            '[AI fallback] Failed:',
            fallbackError.message
          );

          try {

            const finalRoadmap =
              generateSmartOfflineRoadmap(
                profile,
                effectiveUserId
              );

            await dbSaveRoadmap(finalRoadmap);

            return sendJSON(
              res,
              200,
              finalRoadmap
            );

          } catch (offlineError) {

            console.error(
              '[Offline fallback] Failed:',
              offlineError.message
            );

            return sendJSON(
              res,
              500,
              {
                error:
                  'Unable to generate roadmap'
              }
            );

          }

        }

      }

    }
    // POST /api/expand - Flow A/B: On-demand Submodule Expansion (Â§4b)
    if (pathname === '/api/expand' && method === 'POST') {
      const { milestone, context } = await parseBody(req);
      if (!milestone || !milestone.title) {
        return sendJSON(res, 400, { error: 'Missing milestone payload' });
      }

      const { system, user } = buildPrompt4b(milestone, context || {});
      const aiResult = await runAIGeneration(system, user);

      let submodules;
      if (aiResult && (aiResult.submodules || Array.isArray(aiResult))) {
        const rawSubs = Array.isArray(aiResult) ? aiResult : (aiResult.submodules || []);
        submodules = rawSubs.map(validateNode);
      } else {
        submodules = generateSmartOfflineSubmodules(milestone);
      }

      return sendJSON(res, 200, { submodules });
    }

    // POST /api/quiz - Generate 10-20 Module Test Questions
    if (pathname === '/api/quiz' && method === 'POST') {
      const { moduleTitle, moduleDescription, count } = await parseBody(req);
      if (!moduleTitle) {
        return sendJSON(res, 400, { error: 'Missing moduleTitle' });
      }

      const quiz = await generateAIQuiz(moduleTitle, moduleDescription || '', count || 15);
      return sendJSON(res, 200, quiz);
    }

    // POST /api/adjust - Level / Section Regeneration
    if (pathname === '/api/adjust' && method === 'POST') {
      const { milestone, adjustmentType, currentLevel, promptNotes } = await parseBody(req);
      if (!milestone) return sendJSON(res, 400, { error: 'Missing milestone' });

      const system = `You are a curriculum tuner. Adjust the specified milestone's difficulty and scope according to user feedback: "${adjustmentType}" (Notes: "${promptNotes || 'None'}"). Return the revised milestone as valid JSON matching the schema: {"title": "...", "description": "...", "estimatedHours": 10, "resources": [{"type": "docs", "title": "...", "url": "...", "isFree": true}], "isExpandable": true}`;
      const user = `Original Milestone: ${JSON.stringify(milestone)}`;
      const aiResult = await runAIGeneration(system, user);

      let revised;
      if (aiResult && aiResult.title) {
        revised = validateNode({ ...milestone, ...aiResult });
      } else {
        revised = { ...milestone };
        if (adjustmentType === 'easier') {
          revised.title = `Foundations of ${milestone.title}`;
          revised.description = `Gentle, step-by-step beginner guide with foundational walkthroughs: ${milestone.description}`;
          revised.estimatedHours = Math.max(4, Math.round((milestone.estimatedHours || 8) * 0.8));
        } else if (adjustmentType === 'harder') {
          revised.title = `Advanced ${milestone.title} & Architecture`;
          revised.description = `In-depth masterclass focusing on high scale, low-level internals, and robust engineering: ${milestone.description}`;
          revised.estimatedHours = Math.round((milestone.estimatedHours || 8) * 1.4);
        } else {
          revised.title = `${milestone.title} (Tailored)`;
          revised.description = `${milestone.description} [Refocused: ${promptNotes || 'Pacing adjusted'}]`;
        }
      }

      return sendJSON(res, 200, { milestone: revised });
    }

    // Static File Serving
    let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
    if (!filePath.startsWith(PUBLIC_DIR)) {
      res.writeHead(403);
      return res.end('Access Denied');
    }

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(PUBLIC_DIR, 'index.html');
    }

    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('404 Not Found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const content = fs.readFileSync(filePath);

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);

  } catch (error) {
    console.error(`Server Error on ${method} ${pathname}:`, error);
    sendJSON(res, 500, { error: error.message || 'Internal Server Error' });
  }
});

module.exports = server;

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`ðŸš€ Hermes.io Server running at http://localhost:${PORT}`);
    console.log(`âœ¨ AI-Powered Learning Roadmap Generator & Auth System`);
    console.log(`====================================================`);
  });
}

