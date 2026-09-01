# Hermes.io — AI-Powered Learning Roadmap Generator

Hermes.io is a modern full-stack web application that generates personalized, interactive learning roadmaps with AI, enables on-demand submodule exploration, tracks weighted curriculum progress, and features automated module quizzes with Supabase database persistence.

---

## ✨ Key Features

- 🗺️ **Visual Connected Flowchart Graph (`roadmap.sh` Style)**: Central spine with pre-expanded submodules, recommendation badges (🟣 Recommended, 🟢 Alternative, ⚪ Optional), and project checkpoints.
- ⚡ **Interactive Checkboxes & Real-Time Rollups**: 1-click submodule completion with checkmark bounce animations and live progress calculation.
- 📚 **Curated Roadmap Gallery**: 15 ready-made roadmaps across Programming Languages (Python, Java, C++, Rust, Go, TypeScript), Engineering, Data Science, AI/ML, Cloud & DevOps, and Cybersecurity.
- 🧠 **10–20 Question Module Quizzes**: Dynamic multiple-choice questions with code snippets, instant green/red feedback, explanations, and mastery badges ($\ge 80\%$).
- 🔐 **Authentication & Multi-User Isolation**: Salted PBKDF2/SHA-256 password hashing with 1-click demo logins for **Thanatos** (Frontend) and **Cronus** (AI/ML).
- ☁️ **Supabase Cloud Database**: Hybrid cloud persistence with PostgreSQL tables and offline local JSON fallback.
- 📱 **Cross-Platform Responsive**: Responsive layout optimized for desktop, tablet, and mobile (iPhone / Android) screens.

---

## 🚀 Quick Start (Local)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/<your-username>/hermes-io.git
   cd hermes-io
   ```

2. **Start the server:**
   ```bash
   node server.js
   ```

3. **Open in your browser:**
   Navigate to `http://localhost:3000`.

---

## 📄 License
MIT
