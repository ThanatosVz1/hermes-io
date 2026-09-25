# 🚀 Hermes.io — Complete Setup & Deployment Guide

> This guide takes you from zero to a fully working deployment on **Vercel** with **Supabase** as the database.  
> Estimated time: **20–30 minutes**

---

## 📋 What You'll Need

| Tool | Purpose | Link |
|---|---|---|
| **GitHub account** | Host your code | [github.com](https://github.com) |
| **Vercel account** | Deploy the app (free) | [vercel.com](https://vercel.com) |
| **Supabase account** | Cloud PostgreSQL database (free) | [supabase.com](https://supabase.com) |
| **Git** (optional) | Push code to GitHub | [git-scm.com](https://git-scm.com) |
| **Gemini API Key** (optional) | AI-powered roadmap generation | [aistudio.google.com](https://aistudio.google.com) |

---

## PART 1 — Set Up Supabase Database

### Step 1 — Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) → click **Start your project**
2. Sign in with GitHub (recommended)
3. Click **New Project**
4. Fill in the form:
   - **Project name**: `hermes-io`
   - **Database Password**: Choose a strong password and **save it somewhere safe**
   - **Region**: Choose the closest region to you (e.g., `South Asia (Mumbai)` for India)
5. Click **Create new project**
6. Wait ~2 minutes for the project to be ready (you'll see a green checkmark)

---

### Step 2 — Run the Database Schema

1. In your Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click **+ New query** (top right)
3. Open the file [`supabase_schema.sql`](file:///d:/WP mini Project/hermes-io-main/hermes-io-main/supabase_schema.sql) from your project folder
4. Copy **all** its contents and paste into the SQL Editor
5. Click **Run** (or press `Ctrl+Enter`)
6. You should see: `Success. No rows returned`

**Verify it worked:**
- Click **Table Editor** in the left sidebar
- You should see these 6 tables: `users`, `sessions`, `roadmaps`, `quiz_results`, `bookmarks`, `app_config`
- Click `users` → you should see 3 pre-seeded rows (Thanatos, Cronus, Guest)

---

### Step 3 — Copy Your Supabase Credentials

1. In Supabase, click **Project Settings** (gear icon, bottom left sidebar)
2. Click **API** in the settings menu
3. Copy these two values — you'll need them soon:

   | What to copy | Where to find it |
   |---|---|
   | **Project URL** | Under "Project URL" — looks like `https://abcxyz.supabase.co` |
   | **service_role key** | Under "Project API keys" → `service_role` → click "Reveal" then copy |

   > ⚠️ **Use `service_role` key, NOT the `anon` key.** The service role key bypasses Row Level Security so the backend can manage all data securely.

---

## PART 2 — Push Code to GitHub

### Step 4 — Initialize a Git Repository

Open **PowerShell** or **Command Prompt**, navigate to your project folder, and run:

```powershell
cd "d:\WP mini Project\hermes-io-main\hermes-io-main"
git init
git add .
git commit -m "Initial commit: Hermes.io with Supabase + Vercel support"
```

---

### Step 5 — Create a GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Fill in:
   - **Repository name**: `hermes-io`
   - **Visibility**: Public or Private (either works)
   - **Do NOT** initialize with README, .gitignore, or license
3. Click **Create repository**
4. GitHub shows you commands — copy the ones under **"…or push an existing repository"**:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/hermes-io.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

---

## PART 3 — Deploy on Vercel

### Step 6 — Connect Vercel to GitHub

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New...** → **Project**
3. Find `hermes-io` in the list → click **Import**
4. Vercel auto-detects the project. Settings should be:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (leave default)
   - **Build Command**: leave empty (no build step needed)
   - **Output Directory**: leave empty
   - **Install Command**: leave empty (no npm dependencies)

---

### Step 7 — Add Environment Variables

This is the most important step. In the Vercel project setup screen:

1. Click **Environment Variables** section
2. Add each variable below:

| Variable Name | Value | Required? |
|---|---|---|
| `SUPABASE_URL` | Your Supabase Project URL from Step 3 | ✅ Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service_role key from Step 3 | ✅ Yes |
| `AI_PROVIDER` | `offline` | ✅ Yes (set to `gemini` if you have a key) |
| `GEMINI_API_KEY` | Your Gemini API key (from Step 3b below) | Optional |

**To add each variable:**
- Type the **Name** in the left field
- Paste the **Value** in the right field
- Click **Add**

> 💡 If you skip `GEMINI_API_KEY`, roadmaps will still generate using the built-in offline engine — they just won't be AI-personalized.

---

### Step 3b (Optional) — Get a Free Gemini API Key

1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Sign in with your Google account
3. Click **Get API key** → **Create API key**
4. Copy the key → add it as `GEMINI_API_KEY` in Vercel
5. Also set `AI_PROVIDER` = `gemini`

---

### Step 8 — Deploy

1. After adding all environment variables, click **Deploy**
2. Vercel builds and deploys your app (~1–2 minutes)
3. When done, click **Visit** — your app is live! 🎉

You'll get a URL like: `https://hermes-io-yourname.vercel.app`

---

## PART 4 — Verify Everything Works

### Step 9 — Test the App

Open your Vercel URL and test each of these:

**✅ Test 1 — Home page loads**
- You should see the Hermes.io landing page with no errors in the browser console (`F12 → Console`)

**✅ Test 2 — Demo login works**
- Click **Sign In**
- Email: `thanatos@hermes.io`
- Password: `thanatos123`
- You should be logged in as "Thanatos"

**✅ Test 3 — Generate a roadmap**
- Click **Create Roadmap** or **Get Started**
- Fill in the wizard (goal, role, skill level)
- Click **Generate**
- Wait ~5 seconds — a roadmap with milestones should appear

**✅ Test 4 — Roadmap persists after refresh**
- After generating a roadmap, press `F5` (refresh the page)
- Navigate back to your roadmap
- It should still be there (stored in Supabase)

**✅ Test 5 — Sign up a new account**
- Click **Sign Up**
- Enter a new email and password
- You should be logged in with your new account

---

## PART 5 — Local Development (Optional)

### Step 10 — Run Locally

If you want to test locally before deploying:

1. Install **Node.js 18+** from [nodejs.org](https://nodejs.org) (if not already installed)

2. Create a `.env` file in the project root:

   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key...
   GEMINI_API_KEY=AIza...your-key... (optional)
   AI_PROVIDER=offline
   PORT=3000
   ```

3. Start the server:

   ```powershell
   cd "d:\WP mini Project\hermes-io-main\hermes-io-main"
   node server.js
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

> ⚠️ **Note:** The `.env` file is not loaded automatically. The server reads from `process.env`. Use a tool like `dotenv` or manually set variables in PowerShell:
> ```powershell
> $env:SUPABASE_URL="https://..."
> $env:SUPABASE_SERVICE_ROLE_KEY="eyJ..."
> node server.js
> ```

---

## PART 6 — Future Updates

### Step 11 — Updating the App

Whenever you make changes to the code:

```powershell
cd "d:\WP mini Project\hermes-io-main\hermes-io-main"
git add .
git commit -m "describe your change here"
git push
```

Vercel automatically detects the push and **re-deploys within 1–2 minutes**.

---

## 🔧 Troubleshooting

### ❌ "Roadmap not found" after page refresh
- **Cause:** Supabase credentials not set correctly
- **Fix:** Check Vercel Dashboard → Project → Settings → Environment Variables. Make sure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are both set. Redeploy after fixing.

### ❌ Login fails with "Invalid email or password"
- **Cause:** Demo users not seeded in Supabase
- **Fix:** Re-run the SQL schema from Step 2 in Supabase SQL Editor. Check that the `users` table has 3 rows.

### ❌ App shows blank page or 500 error
- **Cause:** Missing environment variables or Node.js version mismatch
- **Fix:** In Vercel → Project → Deployments → click your deployment → View Function Logs. Look for the error message. Common fix: ensure `SUPABASE_URL` doesn't have a trailing slash.

### ❌ Roadmap generation produces no result
- **Cause:** Generation is timing out (Python ML engine fails on Vercel — expected; falls back to offline engine)
- **Fix:** This should work automatically with the offline engine. If it still fails, check the Function Logs in Vercel for the error and ensure the request doesn't time out (default Vercel timeout: 10s for Hobby plan).

### ❌ "Function timeout" on Vercel Hobby plan
- **Cause:** Vercel Hobby has 10s max execution time; AI generation can take longer
- **Fix:** Set `AI_PROVIDER=offline` in Vercel env vars. The offline engine responds in <1s. Or upgrade to Vercel Pro (60s timeout).

---

## 📁 Project File Overview

```
hermes-io/
├── server.js              ← Main backend (Node.js HTTP server)
├── package.json           ← Node.js config (engines: >=18)
├── vercel.json            ← Vercel deployment routing
├── supabase_schema.sql    ← Run this in Supabase SQL Editor
├── working.md             ← Implementation plan & progress tracker
├── data/                  ← Local dev fallback (JSON files)
│   ├── users.json
│   ├── sessions.json
│   └── roadmaps.json
└── public/                ← Frontend (HTML, CSS, JS)
    ├── index.html
    ├── css/
    └── js/
        ├── app.js         ← Main frontend application
        └── ai-service.js  ← API client
```

---

## 🔑 Summary of Credentials Needed

| Credential | Where to Get | Where to Set |
|---|---|---|
| Supabase URL | Supabase → Settings → API → Project URL | Vercel env var: `SUPABASE_URL` |
| Supabase service_role key | Supabase → Settings → API → service_role | Vercel env var: `SUPABASE_SERVICE_ROLE_KEY` |
| Gemini API key (optional) | [aistudio.google.com](https://aistudio.google.com) | Vercel env var: `GEMINI_API_KEY` |

---

## ✅ Quick Checklist

- [ ] Supabase project created
- [ ] SQL schema run in Supabase SQL Editor (6 tables visible)
- [ ] Supabase URL + service_role key copied
- [ ] Code pushed to GitHub
- [ ] Vercel project imported from GitHub
- [ ] All 3 env vars added in Vercel
- [ ] Deployed successfully (green checkmark in Vercel)
- [ ] Demo login works (`thanatos@hermes.io` / `thanatos123`)
- [ ] Roadmap generates and persists after page refresh
