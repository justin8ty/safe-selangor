**Technical Implementation Plan (Final, With Gemini + Google Places + Mapbox + Supabase)**

**1) Final Tech Stack**
- Web: Next.js (App Router) + TypeScript
- Map: Mapbox GL JS (2D district/city choropleth)
- API + Realtime: Bun (TypeScript) + Fastify (HTTP) + Socket.IO (WebSocket)
- Auth + DB + Storage: Supabase Auth + Supabase Postgres + Supabase Storage
- AI (required): Gemini API (image + text moderation)
- Google dev tech (integral, non-AI): Google Places API (automatic “nearby landmark” label from GPS)
- Geo: Turf.js `booleanPointInPolygon` + district GeoJSON boundaries
- Validation/types: Zod (API-local schemas)

---

**2) System Architecture**
- Next.js calls the Fastify API for all reads/writes (avoid direct client DB access).
- Exception: Next.js uses Supabase Auth directly for sign-in/sign-out only.
- Next.js sends the Supabase access token to the API on each request (e.g. `Authorization: Bearer <token>`). The API validates the token via Supabase Auth and derives `profile_id` from the token subject.
- Images upload to Supabase Storage via signed upload URLs from the API.
- Fastify runs the report processing pipeline (Chain of Responsibility) and emits events on an in-process pub/sub bus.
- Socket.IO broadcasts:
  - `feed:new_report` when a report is approved/published
  - `moderation:queue_updated` when a report needs moderator review
  - optional `map:districts_updated` when aggregates change

Public display rule:
- Store exact GPS privately; public UI shows only `district` and `landmark label` (no coordinates, no pins).

---

**3) Supabase Data Model**
Given source tables (already imported):
- `crime_official(state, district, category, type, date, crimes)`
- `crime_scraped(state, district, category, type, date, crimes)`

App tables:
- `profiles(id pk/fk -> auth.users.id, email, karma)`
- `reports(id, user_id, state, district, category, type, date, description, status, ai_confidence, created_at)`
- `report_location_private(report_id pk/fk, lat, lng)` (never returned to public clients)
- `report_media(id, report_id, storage_key)`
- `moderation_queue(report_id pk/fk, status)`
- `moderation_actions(id, report_id, moderator_profile_id, action)`
- `report_metrics(report_id pk/fk, likes int, views int)`
- `report_likes(report_id, user_id, unique(report_id,user_id))`

Live reports aggregation rule:
Each approved report contributes +1 to crimes count for its corresponding:
(state, district, category, type, date)

Aggregation queries combine:
- SUM(crimes) from crime_official
- SUM(crimes) from crime_scraped
- COUNT(*) from reports WHERE status='approved'

---

**4) Google Places Integration (Automatic Landmark Label)**
Goal: no user decision; the app auto-fills “nearby landmark” into the report description context.

Implementation:
- In the pipeline after receiving exact GPS, call Google Places API Nearby Search:
  - Input: `lat,lng`
  - Use `rankby=distance` (or small `radius`) to get nearest relevant place
  - Output: `place_id`, `name`, `vicinity` → build `landmark_label = "{name}, {vicinity}"`
- Store `place_id` + `landmark_label` on `reports`.
- Frontend report form:
  - shows “Near: {landmark_label}” as read-only and appends it to the description UI (or displays as separate field used in display cards).

This makes Places “integral” because every report is contextualized/anchored by a real place label and shown in feed/details.

---

**5) Geo + District Assignment (Point-in-Polygon)**
- Load district boundary GeoJSON (same used for choropleth).
- For each report GPS:
  - `district = first polygon where booleanPointInPolygon(point, polygon) == true`
  - `state` derived from polygon properties or mapping table
- Persist `district/state` on the report.
- If no match: route to moderator (or fallback to “unknown district” and exclude from choropleth).

---

**6) AI Moderation (Gemini)**
Inputs:
- image attachment(s) (jpg/jpeg/png/webp)
- claimed `category/type`
- description + `landmark_label`
- district/state (once assigned)

Output schema:
- `decision: approved | rejected | needs_moderator`
- `confidence: 0..100`
- `reason_codes: string[]`
- `explanation: string`

Threshold routing:
- `confidence >= 90` → auto-approve
- `< 90` → moderator queue
- No PII detection logic.

Practical API handling:
- Download image bytes from Supabase Storage (service role) and send to Gemini as inline/base64 (most reliable).
- Timeout/fallback: on Gemini error → `needs_moderator`.

---

**7) Report Processing Pipeline (Chain of Responsibility + Pub/Sub)**
Use an internal event bus (typed EventEmitter) and a sequential handler chain.

Handlers (recommended order):
1. ValidateHandler
   - auth present, required fields, 1+ image, allowed mime, basic rate limit
2. MediaHandler
   - ensure Storage objects exist, create `report_media`, create `report_metrics`
3. LocationHandler
   - store `lat/lng` in `report_location_private`
4. LandmarkHandler (Google Places)
   - fetch `place_id` + `landmark_label`, persist to `reports`
5. DistrictAssignHandler (point-in-polygon)
   - set `district/state`
6. AiModerationHandler (Gemini)
   - set `ai_confidence/reasons/explanation`, decision
7. DecisionHandler
   - approve vs enqueue moderator vs reject
8. PublishHandler (on approve)
   - set `reports.status=approved`
   - update live aggregates/cache
   - emit Socket.IO `feed:new_report`
9. ErrorStatusHandler
   - mark errors, ensure state transitions are valid

Core events:
- `report.submitted`, `report.enriched`, `report.moderated`, `report.needs_moderator`, `report.approved`, `report.rejected`, `report.published`, `report.error`

---

**8) API Surface (Fastify)**
Auth (Supabase Auth):
- Client signs in with Supabase Auth (email OTP/magic link).
- API validates the Supabase access token on each request and derives `profile_id` from the token subject.
- Auth header convention: `Authorization: Bearer <supabase_access_token>`.
- Suggested endpoints (optional):
  - `GET /auth/me` → returns current profile summary

Uploads:
- `POST /uploads/sign` → returns signed upload URL(s) for Supabase Storage + object paths
- `POST /reports` → creates report record referencing uploaded media + starts pipeline

Moderation:
- `GET /moderation/queue`
- `POST /moderation/:reportId/approve`
- `POST /moderation/:reportId/reject`

Feed + reports:
- `GET /feed?cursor=...`
- `GET /reports/:id`
- `POST /reports/:id/like`
- `POST /reports/:id/view`

Map + trends:
- `GET /map/choropleth?state&dateFrom&dateTo&category&type&source=combined|official|scraped|live`
- `GET /trends?state&district&dateFrom&dateTo&category&type&source=...`

Choropleth computation:
- For each district in range, compute totals per source:
  - official from `crime_official`
  - scraped from `crime_scraped`
  - live from approved `reports` (grouped into the same schema) or `crime_live`
- Normalize per source within the current query scope, then weight:
  - `score = 0.5*official + 0.3*live + 0.2*scraped`
- Return `{ district, score, bucket, breakdown }`

Caching:
- In-memory cache keyed by filter set for choropleth/trends (short TTL) + invalidate on publish.

---

**9) WebSocket (Socket.IO)**
Namespaces/rooms:
- `feed` (public stream of approved reports)
- `moderation` (moderator queue updates)

Events:
- `feed:new_report` payload: report card fields (district, landmark_label, type/category, created_at, thumbnail, likes/views)
- `moderation:queue_updated` payload: minimal queue counts + newest items
- optional `map:invalidate` to prompt clients to refetch choropleth

Fallback:
- Polling endpoints remain available if WS is flaky during demo.

---

**10) Next.js UI Plan**
Routes:
- `/login` (Supabase Auth email OTP/magic link)
- `/` (Map + sidebar feed; filters; district panel)
- `/report/new` (GPS permission + image upload + category/type + description prefilled with landmark label)
- `/report/[id]` (details)
- `/moderator` (queue + actions; protected)

Key UI behaviors:
- On entering `/report/new`:
  - request GPS
  - call backend “compute landmark label” implicitly via report submission pipeline (or show “Fetching nearby landmark…” until returned)
- Public display:
  - “District: X”
  - “Near: {landmark_label}”
  - no coordinates, no map pin

---

**11) Repo / File Structure (Monorepo)**
```
/apps
  /web
    /app
      login/page.tsx
      page.tsx
      report/new/page.tsx
      report/[id]/page.tsx
      moderator/page.tsx
    /components
      MapChoropleth.tsx
      FeedSidebar.tsx
      DistrictPanel.tsx
      ReportForm.tsx
      TrendCharts.tsx
    /lib
      apiClient.ts
      socket.ts
      mapbox.ts

  /api
    /src
      server.ts
      routes/
        auth.ts
        uploads.ts
        reports.ts
        feed.ts
        moderation.ts
        map.ts
        trends.ts
      sockets/
        index.ts
      pipeline/
        bus.ts
        events.ts
        handlers/
          validate.ts
          media.ts
          location.ts
          landmarkPlaces.ts
          districtAssign.ts
          aiGemini.ts
          decision.ts
          publish.ts
          errorStatus.ts
      services/
        supabase.ts
        storage.ts
        places.ts
        geo.ts
        gemini.ts
        aggregates.ts
       config/env.ts

/assets
  districts.geojson
```

---

**12) Environment Variables**
Web:
- `NEXT_PUBLIC_MAPBOX_TOKEN`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- (optional) none for Places if you keep Places calls server-side only

API:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`
- `GOOGLE_PLACES_API_KEY`
- `GEMINI_API_KEY`
- optional: limits `MAX_UPLOAD_MB`, `MAX_IMAGES_PER_REPORT`

---

**13) Build Order (Fastest Path to Demo)**
1. Supabase schema + import official/scraped tables + indexes
2. District GeoJSON wired into:
    - Mapbox choropleth rendering
    - point-in-polygon district assignment
 3. Auth (Supabase Auth email OTP/magic link) + API token validation
4. Report submission (signed upload → create report → pipeline)
5. Google Places automatic landmark label step
6. Gemini moderation + threshold routing
7. Moderator console
8. Socket.IO live feed updates
9. Choropleth combined scoring (50/30/20) + filters
10. Trends charts + likes/views + karma
