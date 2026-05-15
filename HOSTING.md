# Yatra360 — Complete Hosting Guide

End-to-end walkthrough to take Yatra360 from local dev to fully working production. By the end of this guide you'll have:

- ✅ Frontend running on **Vercel** (already done)
- ✅ Backend running on **Render** (free tier)
- ✅ Database on **MongoDB Atlas** (free M0 cluster)
- ✅ AI engine running on **Hugging Face Spaces** (free Docker space)
- ✅ All features working: sessions, annotations, classroom, co-tour, AI guide

**Total time: ~45 minutes. Total cost: $0/month at free tier.**

---

## Table of contents

1. [Prerequisites](#prerequisites)
2. [Step 1 — Push code to GitHub](#step-1--push-code-to-github)
3. [Step 2 — MongoDB Atlas (database)](#step-2--mongodb-atlas)
4. [Step 3 — Render (Express backend)](#step-3--render-express-backend)
5. [Step 4 — Hugging Face Spaces (AI engine)](#step-4--hugging-face-spaces-ai-engine)
6. [Step 5 — Vercel env vars (frontend)](#step-5--vercel-env-vars)
7. [Step 6 — End-to-end smoke test](#step-6--end-to-end-smoke-test)
8. [Optional — LLM-powered guide answers](#optional--llm-powered-guide-answers)
9. [Troubleshooting](#troubleshooting)
10. [Cost summary](#cost-summary)

---

## Prerequisites

Create free accounts at these services (you can sign in with your GitHub account on all of them):

| Service | URL | Purpose |
|---|---|---|
| GitHub | https://github.com | Source code repo (already done) |
| Vercel | https://vercel.com | Frontend hosting (already done) |
| MongoDB Atlas | https://cloud.mongodb.com | Database |
| Render | https://render.com | Backend hosting |
| Hugging Face | https://huggingface.co | AI engine hosting |

Have these tabs open in your browser before you start.

---

## Step 1 — Push code to GitHub

You've already pushed the repo to:
```
https://github.com/mpdhanveer05-prakash/Yatra360-Full-Stack-VR-tourism-platform
```

If you make any later edits while following this guide, push them with:
```bash
git add .
git commit -m "your message"
git push
```

Both Render and Hugging Face auto-redeploy when you push to `main`.

---

## Step 2 — MongoDB Atlas

**Time: 5–7 minutes**

This is your database. Stores user sessions, engagement events, AI guide conversations, community annotations, and classroom data.

### 2.1 Create a free cluster

1. Go to **https://cloud.mongodb.com/** and sign in (sign up with GitHub or email).
2. On first login it asks "What's your goal?" — choose anything (e.g. **Learn MongoDB**).
3. Click **Build a Database** → choose **M0 (Free)**.
4. **Provider & Region**: pick **AWS** + the region closest to you (e.g. `Mumbai (ap-south-1)` for India).
5. **Cluster Name**: `yatra360` (or leave default `Cluster0`).
6. Click **Create Deployment**. Wait ~3 min while the cluster provisions.

### 2.2 Create a database user

After cluster creation, a "Connect to Cluster" wizard pops up:

1. Under **Username**: type `yatraadmin`.
2. Under **Password**: click **Autogenerate Secure Password** → **Copy** → save it somewhere safe (e.g. Notepad).  
   ⚠️ You'll need this exact password in Step 3.
3. Click **Create Database User**.

### 2.3 Allow network access

The wizard then asks where you'll connect from:

1. Click **Add My Current IP Address** (works for local testing).
2. Then click **Add a Different IP Address** → enter `0.0.0.0/0` → description: `Allow all (for Render)` → **Add Entry**.
   - ⚠️ `0.0.0.0/0` allows any IP to reach the database. For a student project this is fine. For production you'd whitelist only Render's IPs.
3. Click **Finish and Close**.

### 2.4 Get your connection string

1. From the Atlas dashboard, click **Connect** next to your cluster.
2. Choose **Drivers** as the connection method.
3. Driver: `Node.js`, Version: `6.7 or later`.
4. **Copy the connection string** — it looks like:
   ```
   mongodb+srv://yatraadmin:<db_password>@yatra360.abcde.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<db_password>` with the password from step 2.2.
6. Append `/yatra360` before the `?` so it points to a specific database:
   ```
   mongodb+srv://yatraadmin:YOUR_PASSWORD@yatra360.abcde.mongodb.net/yatra360?retryWrites=true&w=majority
   ```
7. **Save this full string** — you'll paste it into Render in step 3.

✅ Step 2 done.

---

## Step 3 — Render (Express backend)

**Time: 10 minutes**

This runs the Express server (REST API + Socket.IO) that the frontend calls for sessions, annotations, classrooms, and co-tour.

### 3.1 Sign in to Render

1. Go to **https://render.com/** → **Get Started for Free**.
2. Sign in with **GitHub** — authorize the Render OAuth app.

### 3.2 Create a Web Service

1. From the dashboard, click **+ New** (top-right) → **Web Service**.
2. **Connect a repository** → find `Yatra360-Full-Stack-VR-tourism-platform` → **Connect**.
   - If you don't see it, click **Configure GitHub App** and grant Render access to that repo.

### 3.3 Configure the service

Fill these settings exactly:

| Field | Value |
|---|---|
| **Name** | `yatra360-backend` |
| **Region** | `Singapore` (closest free region to India) |
| **Branch** | `main` |
| **Root Directory** | *(leave blank)* |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npx tsx backend/server.ts` |
| **Instance Type** | **Free** |

### 3.4 Add environment variables

Scroll down to **Environment Variables** → **Add Environment Variable** → add each of these:

| Key | Value |
|---|---|
| `MONGODB_URI` | *(paste the connection string from step 2.4)* |
| `PORT` | `10000` |
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | *(your Vercel URL, e.g.* `https://yatra360.vercel.app` *)* |

You'll add `AI_ENGINE_URL` later (Step 4).

### 3.5 Deploy

1. Scroll to the bottom → click **Create Web Service**.
2. Render starts the build. Watch the logs — first deploy takes ~3–5 min.
3. When the log shows `Server listening on port 10000` and the status badge turns **🟢 Live**, copy the public URL at the top:
   ```
   https://yatra360-backend.onrender.com
   ```
4. **Test it**: open that URL in a new tab. You should see your API responding. If you visit `https://yatra360-backend.onrender.com/api/locations` you should see JSON data.

### 3.6 Render free-tier caveat

The free instance **sleeps after 15 min of inactivity**. First request after sleep takes ~30 seconds to wake the container. For demo days, hit the URL once 1 minute before showing to wake it up. If you need always-on, upgrade to the $7/month Starter plan.

✅ Step 3 done.

---

## Step 4 — Hugging Face Spaces (AI engine)

**Time: 10 minutes**

This runs the Python FastAPI AI engine — TF-IDF semantic guide, RL navigator, recommender. Hugging Face Spaces gives you free Docker-based hosting that doesn't sleep.

### 4.1 Add a Dockerfile to ai_engine

The repo doesn't have a Dockerfile yet. Create one in the `ai_engine/` folder of the repo:

**File: `ai_engine/Dockerfile`**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# System deps for scikit-learn
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Hugging Face Spaces injects PORT=7860
ENV PORT=7860
EXPOSE 7860

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
```

Commit and push:
```bash
git add ai_engine/Dockerfile
git commit -m "chore: add Dockerfile for AI engine deployment"
git push
```

### 4.2 Create a Space on Hugging Face

1. Go to **https://huggingface.co/** → sign up (use GitHub login).
2. Click your profile avatar (top-right) → **+ New Space**.
3. Fill in:
   - **Owner**: your username
   - **Space name**: `yatra360-ai`
   - **License**: `mit`
   - **Select the Space SDK**: **Docker** → choose **Blank**
   - **Space hardware**: `CPU basic · 2 vCPU · 16 GB · FREE`
   - **Visibility**: **Public**
4. Click **Create Space**.

### 4.3 Push the AI engine code to the Space

Hugging Face Spaces are git repositories. Push the `ai_engine/` contents to it:

```bash
# In a separate folder (NOT inside yatra360)
cd C:\Users\dhanveerp\Documents
git clone https://huggingface.co/spaces/YOUR_HF_USERNAME/yatra360-ai
cd yatra360-ai

# Copy ai_engine contents
xcopy "C:\Users\dhanveerp\Documents\VR Tourism\yatra360\ai_engine\*" . /E /I /Y

git add .
git commit -m "Initial AI engine deployment"
git push
```

When prompted for password, use a **Hugging Face access token**:
- Profile → **Settings** → **Access Tokens** → **+ New token** → name `yatra360`, role `write` → copy the token.
- Use this token as the password.

### 4.4 Watch the build

1. Go back to your Space URL: `https://huggingface.co/spaces/YOUR_HF_USERNAME/yatra360-ai`.
2. Click the **Logs** tab — watch Docker build the image (~5–8 min on first build).
3. When build completes, the Space status turns **🟢 Running** and the app appears in an embedded frame.
4. The public URL for the AI engine is:
   ```
   https://YOUR_HF_USERNAME-yatra360-ai.hf.space
   ```
5. **Test it**: visit `https://YOUR_HF_USERNAME-yatra360-ai.hf.space/docs` — you should see the FastAPI Swagger UI.

### 4.5 Wire the AI engine into the backend

Go back to **Render** → your backend service → **Environment** tab → add:

| Key | Value |
|---|---|
| `AI_ENGINE_URL` | `https://YOUR_HF_USERNAME-yatra360-ai.hf.space` |

Click **Save Changes** — Render auto-redeploys with the new env var (~2 min).

✅ Step 4 done.

---

## Step 5 — Vercel env vars

**Time: 3 minutes**

Tell the frontend where the backend and AI engine live.

### 5.1 Add env vars

1. Go to **https://vercel.com/dashboard** → click your `yatra360` project.
2. **Settings** → **Environment Variables**.
3. Add these three (or update existing):

| Key | Value | Environments |
|---|---|---|
| `VITE_API_BASE_URL` | `https://yatra360-backend.onrender.com` | Production, Preview, Development |
| `VITE_AI_ENGINE_URL` | `https://YOUR_HF_USERNAME-yatra360-ai.hf.space` | Production, Preview, Development |
| `VITE_GOOGLE_MAPS_KEY` | `AIzaSyDPXvm6TDEN8SzUgqleNWbTHEc_SdlXNMc` | Production, Preview, Development |

Click **Save** after each.

### 5.2 Redeploy

Env vars don't apply to existing deployments — you must redeploy:

1. Go to **Deployments** tab.
2. Click the **⋯ menu** on the latest deployment → **Redeploy**.
3. Untick "**Use existing build cache**" → click **Redeploy**.
4. Wait ~1 minute for the build.

✅ Step 5 done.

---

## Step 6 — End-to-end smoke test

Open your deployed Vercel site and verify each tier works:

### 6.1 Backend connectivity
- Open the site → navigate to a tour → wait ~10 seconds.
- Open browser DevTools → **Network** tab → filter `onrender.com`.
- You should see successful `POST /api/sessions/events` calls (status 200, not network errors).

### 6.2 MongoDB write
- After clicking around in a tour, go to MongoDB Atlas → your cluster → **Browse Collections**.
- You should see a `yatra360` database with `sessions`, `users`, `locationStats` collections populated with documents.

### 6.3 AI engine — Guide
- In a tour, open the **Guide Chat** panel (💬 bottom-right) → type "Who built this?"
- You should get a real AI-generated answer (not the Wikipedia fallback). The answer cites a Wikipedia section.

### 6.4 Voice agent
- Click the mic button → say "Take me to Hampi".
- Voice should reply "Taking you to Hampi" and navigate.
- Try: "Who built the Taj Mahal?" → real AI guide answer is spoken back.

### 6.5 Annotations (notes)
- In a tour, open the **📝 Notes** panel → write a note → **Post**.
- Refresh the page → the note is still there (persisted in MongoDB).

### 6.6 Classroom
- Go to `/classroom` → choose **Teacher** → create a class → note the 6-char code.
- Open in a different browser (or incognito) → **Student** → enter the code → join.
- Visit some locations as the student → teacher dashboard updates.

### 6.7 Co-tour
- In a tour, open the **👥 Watch Together** panel → **Start a watch party** → copy invite link.
- Paste invite link in another browser → both browsers should connect and follow each other's camera.

If all 7 work, you're done. 🎉

---

## Optional — LLM-powered guide answers

The AI guide currently uses TF-IDF retrieval over Wikipedia. For natural-language synthesized answers (like ChatGPT-style responses), add an LLM key.

### Anthropic (Claude) — recommended for India use case

1. Go to **https://console.anthropic.com/** → sign up → buy $5 of credit.
2. **API Keys** → **Create Key** → name `yatra360` → copy the key (starts with `sk-ant-...`).
3. On **Hugging Face Space** → **Settings** → **Variables and secrets** → **New secret**:
   - Name: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-...`
4. **Restart** the Space (Settings → "Factory reboot" or "Restart this Space").

The AI guide will auto-detect the key and start using Claude Haiku 4.5 for synthesis. Without the key it falls back to TF-IDF extractive answers.

### OpenAI (alternative)
Same flow, but use `OPENAI_API_KEY` as the secret name and an `sk-...` key.

---

## Troubleshooting

### "Could not reach guide" error on Vercel
**Cause:** `VITE_API_BASE_URL` not set on Vercel, or backend is sleeping.  
**Fix:** Check Vercel env vars (step 5.1). If sleeping, visit the Render URL directly to wake it up.

### Render build fails: "Cannot find module 'tsx'"
**Cause:** `tsx` not in dependencies (it's a devDependency).  
**Fix:** Either change the start command to `npm run dev:backend` or move tsx to dependencies in `package.json`:
```bash
npm install tsx --save
git commit -am "fix: tsx as production dep"
git push
```

### Render shows "Application failed to respond"
**Cause:** App listening on wrong port.  
**Fix:** Confirm `backend/server.ts` uses `process.env.PORT`, not a hardcoded port:
```ts
const port = process.env.PORT || 3001;
app.listen(port, '0.0.0.0', ...);
```

### MongoDB connection: "Server selection timed out"
**Cause:** Network access not whitelisted, or wrong password in connection string.  
**Fix:** Atlas → **Network Access** → verify `0.0.0.0/0` is in the list. Re-paste the connection string carefully and URL-encode special characters in the password (`@` becomes `%40`, etc.).

### Hugging Face Space build fails
**Cause:** Missing system deps or wrong Python version.  
**Fix:** Check the build log. Common fix: add `gcc` and `g++` to the apt-get line in the Dockerfile.

### CORS errors in browser console
**Cause:** Backend `CORS_ORIGIN` doesn't match the Vercel URL.  
**Fix:** Render → env vars → set `CORS_ORIGIN` to your exact Vercel URL (e.g. `https://yatra360.vercel.app`). Multiple origins: comma-separate them.

### Socket.IO won't connect
**Cause:** Free Render WebSocket support requires the right transport.  
**Fix:** Ensure your `useCoTour.ts` initialises Socket.IO with `transports: ['websocket', 'polling']` (default).

---

## Cost summary

| Service | Plan | Cost | Limit |
|---|---|---|---|
| Vercel | Hobby | **$0/mo** | 100 GB bandwidth/month |
| Render | Free | **$0/mo** | 750 hrs/month; sleeps after 15 min idle |
| Hugging Face Spaces | CPU basic | **$0/mo** | Doesn't sleep; rate-limited if abused |
| MongoDB Atlas | M0 | **$0/mo** | 512 MB storage, shared cluster |
| Anthropic API | pay-as-you-go | optional | ~$0.25 per 1M input tokens (Haiku 4.5) |

**Total: $0/month** for the full stack at student-project scale.

For production scale (10k+ monthly users), expect ~$50/month (Render Starter + Atlas M10 + HF Pro).

---

## Architecture reference

```
        Browser  ←————→  Vercel (Frontend SPA)
                              │
                              │  REST + Socket.IO
                              ▼
                    Render (Express Backend)
                       │            │
              Mongoose │            │ HTTP
                       ▼            ▼
            MongoDB Atlas   Hugging Face Space
              (database)    (FastAPI AI engine)
                                    │
                                    │  HTTPS (1-hour cache)
                                    ▼
                            Wikipedia REST API
```

---

**Questions?** Open an issue on the GitHub repo or ping the project mentor.

*Last updated: 2026-05-15*
