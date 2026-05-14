# Yatra360 — Phased Build Plan

## Phase 1 — Foundation (Data + Types + Styles)
*Goal: App boots with correct theme, routing skeleton, and real data in place.*

**Files:**
- [x] `src/types/location.ts` — IndiaLocation, TourNode, Hotspot, FeatureVector
- [x] `src/types/tour.ts` — TourSession, EngagementEvent, NavigationEvent
- [x] `src/types/ai.ts` — Recommendation, RewardSignal, HeatmapData
- [x] `src/data/indiaLocations.json` — 50 real locations with lat/lng, wikiSlug, FeatureVectors, TourNodes
- [x] `src/index.css` — CSS variables (colors, fonts), base reset
- [x] `index.html` — Google Fonts import (Cinzel, Proza Libre, JetBrains Mono)
- [x] `src/App.tsx` — React Router setup (/, /explore, /tour/:id, /dashboard, /about)
- [x] `src/main.tsx` — cleaned up, Tailwind active

**Evaluation checkpoint:** `npm run dev` shows a blank dark navy page with correct fonts and routing (no 404s on any route).

---

## Phase 2 — Utility Layer (Lib + API + Stores)
*Goal: All business logic and external API calls wired up, stores readable in devtools.*

**Files:**
- [x] `src/lib/engagementScore.ts` — dwell + interaction → 0–1 score
- [x] `src/lib/recommendationEngine.ts` — cosine similarity, diversity penalty
- [x] `src/lib/heatmapGenerator.ts` — session logs → node score map
- [x] `src/lib/apiQueue.ts` — rate-limit queue (Nominatim 1/s, Wikimedia 300ms)
- [x] `src/lib/sessionLogger.ts` — batch + POST events to backend
- [x] `src/api/wikipedia.ts` — fetchSummary(), fetchFullSections()
- [x] `src/api/wikimediaImages.ts` — fetchImages(), detectPanorama()
- [x] `src/api/openStreetMap.ts` — geocode(), getNearbyPOIs()
- [x] `src/api/unsplash.ts` — getWideImage(), getPanoramaFallback()
- [x] `src/api/backend.ts` — logEvent(), getRecommendations(), askGuide()
- [x] `src/store/tourStore.ts` — active location, current node, nav history
- [x] `src/store/userStore.ts` — user prefs, session history, engagement log
- [x] `src/store/uiStore.ts` — sidebar/guide panel open state
- [x] `src/store/aiStore.ts` — recommendations, heatmap data

**Evaluation checkpoint:** Open browser console → import stores, call `fetchSummary('Taj_Mahal')` manually — Wikipedia data returns. Zustand devtools show all 4 stores.

---

## Phase 3 — React Hooks
*Goal: All stateful logic encapsulated; components will be thin consumers.*

**Files:**
- [x] `src/hooks/useEngagementTracker.ts` — dwell timer + hotspot click counter per node
- [x] `src/hooks/useTourNavigation.ts` — navigate nodes, trigger RL update, log events
- [x] `src/hooks/usePersonalization.ts` — poll AI engine, apply recommendations
- [x] `src/hooks/useWikipediaData.ts` — fetch + cache Wikipedia info per location
- [x] `src/hooks/useLocationImages.ts` — fetch Wikimedia images, pick best panorama
- [x] `src/hooks/useVRMode.ts` — WebXR session management

**Evaluation checkpoint:** `tsc --noEmit` passes with zero errors. All hooks export correctly typed return values.

---

## Phase 4 — 3D Viewer Components
*Goal: Full-screen panorama viewer works with keyboard/mouse/touch navigation and hotspots.*

**Files:**
- [x] `src/components/viewer/TourCanvas.tsx` — R3F Canvas wrapper, camera + scene setup
- [x] `src/components/viewer/PanoramaViewer.tsx` — inside-out sphere, equirect texture
- [x] `src/components/viewer/CameraController.tsx` — OrbitControls for 360 look-around
- [x] `src/components/viewer/NavigationHotspot.tsx` — glowing 3D sphere, float animation
- [x] `src/components/viewer/InfoHotspot.tsx` — floating 3D billboard with popup
- [x] `src/components/viewer/TransitionEffect.tsx` — fade-to-black on node change
- [x] `src/components/viewer/SkyEnvironment.tsx` — ambient lighting + HDRI sky
- [x] `src/components/viewer/VRButton.tsx` — WebXR "Enter VR" overlay button

**Evaluation checkpoint:** Navigate to `/tour/taj-mahal-agra` → panorama loads, drag to look around 360°, hotspot spheres are visible and glow on hover, clicking one changes the node with a fade transition.

---

## Phase 5 — UI Components
*Goal: All shared UI components built and visually correct against design system.*

**Files:**
- [x] `src/components/layout/AppShell.tsx` — full-page wrapper
- [x] `src/components/layout/Navbar.tsx` — logo, nav links, mobile drawer
- [x] `src/components/ui/SkeletonCard.tsx` — loading placeholder
- [x] `src/components/ui/LoadingScreen.tsx` — full-screen branded loader
- [x] `src/components/ui/CategoryFilter.tsx` — pill-group filter
- [x] `src/components/ui/SearchBar.tsx` — debounced live search
- [x] `src/components/ui/LocationCard.tsx` — image, name, badge, AI match %, CTA
- [x] `src/components/ui/RecommendationRail.tsx` — horizontal AI-suggested scroll
- [x] `src/components/ui/HeatmapOverlay.tsx` — mini node-graph with engagement colors
- [x] `src/components/ui/SessionStats.tsx` — dwell time + engagement score
- [x] `src/components/ui/GuideChat.tsx` — floating AI guide chat panel

**Evaluation checkpoint:** All UI components render in isolation with mock props. No Tailwind class errors. Cards have gold border + hover glow. Skeleton shimmer animates.

---

## Phase 6 — Pages
*Goal: All four pages are complete and interconnected with real data and AI.*

**Files:**
- [x] `src/components/pages/HomePage.tsx` — hero, particle field, rotating 3D stupa, featured cards, category grid, stats strip
- [x] `src/components/pages/ExplorePage.tsx` — browse/filter all 50 locations, sidebar, responsive grid
- [x] `src/components/pages/TourPage.tsx` — full-screen 3D viewer + all overlay panels
- [x] `src/components/pages/DashboardPage.tsx` — session history, heatmap, radar chart
- [x] `src/components/pages/AboutPage.tsx` — project info + tech credits

**Evaluation checkpoint:** Full user journey — land on HomePage → click "Explore" → filter by "Fort" → click Mehrangarh Fort → panorama loads → navigate a node → check dashboard shows the session.

---

## Phase 7 — Backend (Node.js + Express + MongoDB)
*Goal: REST API running, session events persisting to MongoDB Atlas.*

**Files:**
- [x] `backend/db/mongo.ts` — Mongoose connection to Atlas
- [x] `backend/db/models/Session.ts`
- [x] `backend/db/models/User.ts`
- [x] `backend/db/models/LocationStats.ts`
- [x] `backend/middleware/cors.ts`
- [x] `backend/middleware/rateLimit.ts`
- [x] `backend/routes/sessions.ts` — POST /events, GET /history/:userId
- [x] `backend/routes/recommendations.ts` — POST /recommend
- [x] `backend/routes/guide.ts` — POST /guide
- [x] `backend/routes/locations.ts` — GET /locations, GET /locations/:id
- [x] `backend/server.ts` — Express app entry

**Evaluation checkpoint:** `npm run dev:backend` starts on port 3001. `curl POST /api/sessions/events` returns `{ ok: true }`. MongoDB Atlas shows the new document.

---

## Phase 8 — AI Engine (Python FastAPI)
*Goal: Recommendation, RL navigator, and RAG guide all responding correctly.*

**Files:**
- [x] `ai_engine/requirements.txt`
- [x] `ai_engine/data/location_features.json` — pre-computed FeatureVectors
- [x] `ai_engine/models/hybrid_recommender.py` — content-based + collaborative
- [x] `ai_engine/models/rl_navigator.py` — tabular Q-learning
- [x] `ai_engine/models/rag_guide.py` — Wikipedia RAG answer
- [x] `ai_engine/routers/recommend.py`
- [x] `ai_engine/routers/navigate.py`
- [x] `ai_engine/routers/guide.py`
- [x] `ai_engine/main.py` — FastAPI app + CORS

**Evaluation checkpoint:** `npm run dev:ai` starts on port 8000. `POST /recommend` returns 3 location suggestions. `POST /guide` with a question about Taj Mahal returns a coherent answer sourced from Wikipedia.

---

## Summary

| Phase | Focus | Key Deliverable |
|---|---|---|
| 1 | Foundation | App boots with theme + routing |
| 2 | Utilities | Stores + API modules working |
| 3 | Hooks | Typed stateful logic layer |
| 4 | 3D Viewer | Panorama + hotspot navigation |
| 5 | UI Components | Design system in components |
| 6 | Pages | Full end-to-end user journey |
| 7 | Backend | REST API + MongoDB persistence |
| 8 | AI Engine | Recommendations + guide live |
