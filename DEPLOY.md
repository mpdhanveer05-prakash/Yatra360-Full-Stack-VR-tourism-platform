# Yatra360 — Deployment Guide

Three-tier app, each tier deploys independently.

| Tier | Code | Recommended host | Free? |
|---|---|---|---|
| Frontend (Vite SPA) | `src/`, `dist/` | **Vercel** or **Netlify** | ✓ |
| Backend (Express + Socket.IO + Mongo) | `backend/` | **Render**, **Railway**, or **Fly.io** | ✓ tier |
| AI engine (FastAPI) | `ai_engine/` | **Hugging Face Spaces** or **Render** | ✓ |
| Database | — | **MongoDB Atlas** (M0 free) | ✓ |

---

## 1. MongoDB Atlas (5 min)

1. Sign up at https://www.mongodb.com/atlas → create an **M0 (free)** cluster.
2. **Database Access** → add user with password — save it.
3. **Network Access** → "Allow access from anywhere" (0.0.0.0/0) for dev. Lock down per deployment IP later.
4. **Connect → Drivers** → copy the connection string. Looks like:
   ```
   mongodb+srv://yatra:<PASSWORD>@cluster0.xxxxx.mongodb.net/yatra360?retryWrites=true&w=majority
   ```
5. Set this as `MONGODB_URI` in backend env vars.

---

## 2. Backend (Express + Socket.IO) → Render

### Render Web Service

1. Push the repo to GitHub.
2. https://dashboard.render.com → **New Web Service** → connect your repo.
3. Configure:
   - **Build command**: `npm install`
   - **Start command**: `npx tsx backend/server.ts`
   - **Health check path**: `/health`
4. Add environment variables:
   ```
   MONGODB_URI = mongodb+srv://...
   PORT        = 10000
   ANTHROPIC_API_KEY = (optional, for guide synthesis)
   VITE_AI_ENGINE_URL = https://your-ai-engine.hf.space   (or wherever AI engine is)
   ```
5. Deploy. Note the public URL — e.g. `https://yatra360-api.onrender.com`.

> Render's free tier sleeps after 15 min idle. First request after sleep takes ~30s to wake.

### Socket.IO note
The free Render plan supports WebSockets. Make sure your `CORS_ORIGIN` allows your frontend domain.

---

## 3. AI engine (FastAPI) → Hugging Face Spaces

1. https://huggingface.co/new-space → choose **Docker** SDK.
2. Add a `Dockerfile` in `ai_engine/`:
   ```dockerfile
   FROM python:3.12-slim
   WORKDIR /app
   COPY requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt
   COPY . .
   EXPOSE 7860
   CMD ["uvicorn", "ai_engine.main:app", "--host", "0.0.0.0", "--port", "7860"]
   ```
3. Push the `ai_engine/` directory.
4. Add Space secrets:
   ```
   ANTHROPIC_API_KEY = sk-ant-...   (or OPENAI_API_KEY)
   ```
5. Note the URL — e.g. `https://yourname-yatra360-ai.hf.space`.

> Spaces sleep after 48hr idle. CPU "Free" tier is fine for TF-IDF retrieval.

---

## 4. Frontend (Vite SPA) → Vercel

1. https://vercel.com/new → import your GitHub repo.
2. Configure:
   - **Framework Preset**: Vite
   - **Build command**: `npm run build`
   - **Output directory**: `dist`
3. Environment variables (all prefixed `VITE_`):
   ```
   VITE_API_BASE_URL    = https://yatra360-api.onrender.com
   VITE_AI_ENGINE_URL   = https://yourname-yatra360-ai.hf.space
   VITE_GOOGLE_MAPS_KEY = AIzaSy...
   ```
4. Deploy. You'll get a `https://yatra360.vercel.app` URL.

### SPA routing fix
Add `vercel.json` at repo root if direct deep links 404:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

---

## 5. CI (GitHub Actions)

Create `.github/workflows/ci.yml`:

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:

jobs:
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run type-check
      - run: npm test
      - run: npm run build

  ai-engine:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.12' }
      - run: pip install -r ai_engine/requirements.txt
      - run: python -m pytest ai_engine -q || echo "no pytest tests yet"
```

---

## 6. Lock down the Google Maps key

The key in your `.env` should be restricted before going public:

1. https://console.cloud.google.com/google/maps-apis/credentials
2. Click your key → **Application restrictions** → **Websites**:
   - `https://yatra360.vercel.app/*`
   - `https://*.vercel.app/*` (if using preview deploys)
   - `http://localhost:5173/*`
3. **API restrictions** → **Restrict key** → enable only **Maps Embed API**.

---

## 7. Production env-var checklist

### Frontend (Vercel)
- [ ] `VITE_API_BASE_URL`
- [ ] `VITE_AI_ENGINE_URL`
- [ ] `VITE_GOOGLE_MAPS_KEY`

### Backend (Render)
- [ ] `MONGODB_URI`
- [ ] `PORT`
- [ ] `ANTHROPIC_API_KEY` *(optional)*
- [ ] `VITE_AI_ENGINE_URL` (yes, backend reads this name too)
- [ ] `CORS_ORIGIN` if you locked down [backend/middleware/cors.ts](backend/middleware/cors.ts)

### AI engine (Hugging Face Spaces)
- [ ] `ANTHROPIC_API_KEY` *(or `OPENAI_API_KEY`)*

---

## 8. Post-deploy smoke test

After all three services are up:

```bash
# Backend health
curl https://yatra360-api.onrender.com/health
# → {"ok":true,"ts":...}

# AI engine health
curl https://yourname-yatra360-ai.hf.space/health
# → {"ok":true,"service":"yatra360-ai"}

# End-to-end guide test
curl -X POST https://yatra360-api.onrender.com/api/guide \
  -H "Content-Type: application/json" \
  -d '{"question":"Who built the Taj Mahal?","locationSlug":"Taj_Mahal","nodeLabel":"Main Dome","lang":"en"}'
# → {"answer":"...","sourceSection":"...","confidence":0.x,"synth":"anthropic|extractive"}
```

Visit the frontend URL → /tour/taj-mahal-agra → confirm:
- Street View loads (no map fallback)
- "Save offline" button works
- Passport stamps in
- Guide panel returns a real answer

If any of those fail, check the corresponding service logs.
