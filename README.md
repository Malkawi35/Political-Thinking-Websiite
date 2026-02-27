# ⚡ Political Analysis Engine v2

A 5-pillar political analysis tool powered by Claude AI with **Theater Detection** — analyzes whether political events are genuine crises or choreographed performances.

## New in v2

- **🎭 Theater vs. Reality Detection** — Checks if actors' words match their actions
- **📋 Plain Language Summary** — TL;DR section for quick understanding
- **📰 Sources Consulted** — Lists all sources with credibility scores
- **Deeper Analysis** — Who benefits? Is this gibberish or real? What's the hidden agenda?
- **Source Credibility Matrix** — Visual scoring bars for each news source

## Features

- **Auto-Search Mode** — Claude searches live news and applies 5-pillar analysis
- **Manual Input Mode** — Paste your own articles for analysis
- **Theater Rating** — 🎭 POLITICAL THEATER | ⚠️ MIXED | 🔴 GENUINE CRISIS
- **Save & Export** — Analyses persist in browser, exportable as `.md` files
- **Secure API** — Your Claude API key stays server-side

---

## 🚀 Deploy to Vercel

### Step 1: Push to GitHub

```bash
cd political-analysis-engine
git init
git add .
git commit -m "v2 - Theater Detection + Summary + Sources"
git remote add origin https://github.com/YOUR_USERNAME/political-analysis-engine.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo
3. Add environment variable: `ANTHROPIC_API_KEY` = your Claude API key
4. Click **Deploy**
5. Live at `https://political-analysis-engine.vercel.app`

---

## 🖥️ Run Locally

```bash
npm install
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔒 Security

- API key **never sent to browser** — all calls go through `/api/analyze`
- Vercel encrypts environment variables at rest
