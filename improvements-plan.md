# Yatra360 — Improvements Plan (v2)

> Phased roadmap of enhancements on top of the completed Phase 1–8 build.
> Each phase is independently shippable. Tick boxes as we go.

---

## Phase A — Immersion Layer
*Goal: Make tours feel alive without requiring a headset.*

### A1. Audio narration per node
- [ ] `src/lib/tts.ts` — Web Speech API wrapper (`speechSynthesis`), voice/lang/rate config, cancel/queue handling
- [ ] `src/hooks/useNarration.ts` — narrate current node's `wikiContext` or Wikipedia extract; pause on scene change
- [ ] `src/components/ui/NarrationControls.tsx` — play/pause/skip + language picker, mounted in TourPage header
- [ ] `src/store/uiStore.ts` — add `narrationEnabled`, `narrationLang`, `narrationRate`

**Checkpoint:** Toggle narration → hear node description spoken; auto-stops on scene change.

### A2. Ambient soundscapes
- [ ] `public/audio/` — 6 looped ambient tracks (temple, fort, forest, market, ocean, desert) — CC0 from freesound.org
- [ ] `src/lib/ambientAudio.ts` — fade in/out, crossfade between scenes, master volume
- [ ] Map `LocationCategory` → ambient track in a constants file
- [ ] Volume slider + mute toggle in NarrationControls panel

**Checkpoint:** Walking into Mehrangarh plays subtle wind+crow ambience; switching to Munnar fades to forest.

### A3. Accessibility pass
- [ ] Keyboard hotspot cycling (Tab through hotspots, Enter to activate) in `NavigationHotspot.tsx`
- [ ] `prefers-reduced-motion` honored: disable Pannellum `autoRotate`, particle canvas, stupa rotation
- [ ] ARIA labels on all interactive overlays; visible focus rings using `--gold`
- [ ] High-contrast theme toggle in Navbar (stores in `uiStore`, persisted)
- [ ] Screen-reader-only `<h1>` per page

**Checkpoint:** Lighthouse a11y ≥ 95; full tour navigable with keyboard only.

---

## Phase B — Engagement & Sharing
*Goal: Give users reasons to return and share.*

### B1. Yatra Passport (gamification)
- [ ] `src/types/passport.ts` — `Stamp`, `Badge`, `Streak` types
- [ ] `src/store/passportStore.ts` (persisted) — stamps collected, badges earned, daily streak
- [ ] `src/lib/badgeRules.ts` — declarative rules (e.g., `unesco-10`, `all-forts`, `7-day-streak`)
- [ ] Hook into `addSession` in `userStore` → evaluate badges, push toast
- [ ] `src/components/pages/DashboardPage.tsx` — new "Passport" tab with stamp grid + badge wall
- [ ] `src/components/ui/StampToast.tsx` — animated stamp drop when earned

**Checkpoint:** Visit 3 forts → "Citadel Wanderer" badge unlocks with toast.

### B2. Shareable deep-link snapshots
- [ ] Parse `?node=&yaw=&pitch=&hfov=` query params in `TourPage`; restore Pannellum view on load
- [ ] "Share this view" button → copies URL with current camera state
- [ ] `backend/routes/share.ts` — `GET /share/:locationId/og.png` → generates OG image with location name overlay on panorama crop (use `@vercel/og` or sharp)
- [ ] `<meta>` tags in `index.html` populated dynamically per route via react-helmet-async

**Checkpoint:** Share button copies URL; pasting in Slack/WhatsApp shows a rich preview card.

### B3. Search & filter upgrade
- [ ] Add `fuse.js` for fuzzy search over name + tags + description + state
- [ ] Tag-cluster chips on ExplorePage ("Mughal architecture", "Dravidian temple") computed from `tags[]`
- [ ] Map view toggle: Leaflet + OSM tiles, markers per location, click → tour
- [ ] Persist last-used filters in `uiStore`

**Checkpoint:** Search "mughal" returns Taj/Red Fort/Fatehpur Sikri; map view shows all 50 pins.

---

## Phase C — AI Guide Upgrade
*Goal: Smarter, multilingual, persistent guide.*

### C1. Embedding-based RAG
- [ ] `ai_engine/requirements.txt` — add `sentence-transformers`, `faiss-cpu`
- [ ] `ai_engine/scripts/build_index.py` — pre-embed all Wikipedia sections for 50 locations into a FAISS index, save to `ai_engine/data/wiki_index.faiss`
- [ ] Rewrite `rag_guide.py` to query FAISS top-k chunks instead of keyword overlap
- [ ] Optional `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` env → final answer synthesis; fallback to extractive answer

**Checkpoint:** Ask "Why was the Taj Mahal built?" → coherent 2–3 sentence answer with source attribution.

### C2. Conversational memory
- [ ] `backend/db/models/Conversation.ts` — `{ userId, locationId, messages: [{role, content, ts}] }`
- [ ] `backend/routes/guide.ts` — accept + persist message history; pass last N turns to AI engine
- [ ] `src/components/ui/GuideChat.tsx` — load prior conversation on open; show streaming response

**Checkpoint:** Close guide, reopen on same location → full chat history restored.

### C3. Multi-language guide
- [ ] `src/i18n/` — `en.json`, `hi.json`, `ta.json`, `bn.json` UI strings; lightweight context-based hook (no `i18next` needed)
- [ ] Pivot `wikiSlug` per language in `wikipedia.ts` (e.g., `hi.wikipedia.org`)
- [ ] Language switcher in Navbar; persisted in `uiStore`
- [ ] Guide responses in selected language (pass `lang` to FastAPI)

**Checkpoint:** Switch to Hindi → all UI + guide answers + node descriptions in Hindi.

---

## Phase D — Time Travel & Curated Journeys
*Goal: Move beyond "look at a photo" into storytelling.*

### D1. Time-travel reconstructions
- [ ] `src/data/reconstructions.json` — historical era variants per location (e.g., `hampi-1500`, `nalanda-700`)
- [ ] Era slider component in TourPage (Now / 1947 / 1700 / 1500 / 1000 / Ancient)
- [ ] Swap Pannellum panorama URL based on slider; crossfade between eras
- [ ] Procedural R3F overlay for ruined sites (use existing `SkyEnvironment`)

**Checkpoint:** At Hampi, drag slider to 1500 CE → painting-based panorama with intact bazaar.

### D2. Curated tour playlists
- [ ] `src/data/journeys.json` — 6–8 themed multi-location routes
- [ ] `src/components/pages/JourneysPage.tsx` — browse playlists with hero imagery
- [ ] `src/components/pages/JourneyPage.tsx` — sequential tour player, auto-advance with cinematic intro card between stops
- [ ] Add `/journeys` and `/journey/:id` routes; Navbar entry

**Checkpoint:** Start "Rajput Forts" journey → auto-walks user through 7 forts back-to-back.

### D3. Festival overlays
- [ ] `src/data/festivals.json` — major Indian festivals with dates, associated sites, theme color
- [ ] Detect active/upcoming festival on TourPage mount
- [ ] Visual treatment: marigold-string overlay on Pannellum hotspots, diya particle effect for Diwali, etc.

**Checkpoint:** Visit Golden Temple near Vaisakhi → festival banner + saffron tint applied.

---

## Phase E — Social & Multi-user
*Goal: Tours become shared experiences.*

### E1. Collaborative co-tour
- [ ] Add `socket.io` to backend; new `/api/cotour/:roomId` namespace
- [ ] `backend/routes/cotour.ts` — create/join room, broadcast camera state + cursor
- [ ] `src/hooks/useCoTour.ts` — emit local camera state @ 10 Hz; render remote pointers
- [ ] `src/components/ui/CoTourPanel.tsx` — invite link, participants list, "Follow leader" toggle
- [ ] Optional WebRTC voice via `simple-peer` (later)

**Checkpoint:** Two browser tabs join same room → see each other's reticle move in real time.

### E2. User annotations (crowd wiki)
- [ ] `backend/db/models/Annotation.ts` — `{ locationId, nodeId, azimuth, elevation, text, userId, flags }`
- [ ] `backend/routes/annotations.ts` — `GET /:locationId`, `POST`, `POST /:id/flag`
- [ ] In Pannellum: render community hotspots in a distinct style; click → see text + author
- [ ] "Add note" mode: click panorama → form → submit

**Checkpoint:** Add a note on Red Fort's main gate; reload → note persists; flag removes after 3 reports.

---

## Phase F — Intelligence & Performance
*Goal: Smarter inference, faster tours.*

### F1. Gaze-weighted engagement
- [ ] Add `@mediapipe/tasks-vision` for FaceLandmarker
- [ ] `src/hooks/useGazeTracking.ts` — webcam-opt-in; map face yaw/pitch → looked-at hotspot
- [ ] Weight engagement reward by gaze time per hotspot in RL navigator
- [ ] Privacy: all processing client-side; clear opt-in banner

**Checkpoint:** With camera on, dwelling visually on a hotspot (without clicking) boosts its engagement score.

### F2. Predictive prefetch
- [ ] After scene load, call `/navigate/next` → get top-2 likely next nodes
- [ ] Prefetch their panorama images via `<link rel="prefetch">` injection
- [ ] Track cache hit rate in dev mode

**Checkpoint:** Network tab shows next-node images loaded during current-node dwell; transitions feel instant.

### F3. Offline / PWA
- [ ] `vite-plugin-pwa` setup with Workbox
- [ ] Cache strategy: app shell (precache), Wikimedia images (stale-while-revalidate), API (network-first)
- [ ] "Save tour for offline" button per location → forces panorama cache
- [ ] Installable manifest with proper icons

**Checkpoint:** Visit Taj Mahal once → go offline → can re-enter the full tour.

---

## Phase G — Education & Polish
*Goal: Make Yatra360 classroom-ready.*

### G1. Educator dashboard
- [ ] `backend/db/models/Classroom.ts` — `{ teacherId, code, studentIds, assignedLocationId }`
- [ ] `backend/routes/classroom.ts` — create class, join with code, fetch aggregated engagement heatmap
- [ ] `src/components/pages/ClassroomPage.tsx` — teacher view: students online, per-node attention heatmap, time spent histogram

**Checkpoint:** Teacher creates class, assigns Hampi; 3 students join → teacher sees real-time aggregate heatmap.

### G2. Compare view
- [ ] `src/components/pages/ComparePage.tsx` — `/compare?a=konark-sun-temple&b=khajuraho-temples`
- [ ] Two synced Pannellum instances side-by-side (optional sync camera toggle)
- [ ] Difference panel: era, region, FeatureVector radar overlay

**Checkpoint:** Open compare URL → both panoramas load; toggle sync → drag one, both rotate together.

### G3. ASI dataset integration
- [ ] Convert ASI CSV → `src/data/asi_monuments.json`
- [ ] Map each of 50 locations to ASI record; surface "ASI Protected: Yes/No", monument number, district
- [ ] On TourPage InfoPanel, show nearby ASI monuments (within 10 km) via Overpass query

**Checkpoint:** Taj Mahal panel shows ASI ID N-UP-A4 + 3 nearby protected sites.

---

## Phase H — Quality, CI, Deploy
*Goal: Production-grade.*

- [ ] Vitest + RTL setup; tests for `engagementScore`, `recommendationEngine`, `heatmapGenerator`, `apiQueue`
- [ ] Pytest for AI engine (`rag_guide`, `hybrid_recommender`)
- [ ] GitHub Actions: lint + type-check + test on PR
- [ ] Frontend → Vercel; backend → Render; AI engine → Hugging Face Space
- [ ] `.env.production.example` documented
- [ ] README rewrite: architecture diagram, screenshots, deploy guide

**Checkpoint:** Push to main → CI green → all three services auto-deploy → public URL live.

---

## Recommended Build Order

| # | Phase | Why first |
|---|---|---|
| 1 | **A — Immersion** | Pure frontend, highest visible impact, no infra changes |
| 2 | **B — Engagement** | Builds on A; gamification + share = retention loop |
| 3 | **C — AI Guide** | Touches AI engine; unlocks multilingual reach |
| 4 | **D — Time Travel** | Storytelling layer; needs A's narration to shine |
| 5 | **G3 — ASI data** | Quick data win, can slip in anytime |
| 6 | **F — Intelligence/Perf** | Optimizes after we know real usage patterns |
| 7 | **E — Social** | Most infra-heavy; do once core is stable |
| 8 | **G1/G2 — Education** | Niche-but-valuable; needs E's plumbing |
| 9 | **H — CI/Deploy** | Continuous, kicks off whenever we want it live |

---

## Definition of Done (per sub-task)
- TypeScript strict passes (`npm run type-check`)
- Manual checkpoint in browser confirmed
- No console errors/warnings
- Mobile viewport verified for any UI work
- Persisted state (Zustand) survives reload where applicable
