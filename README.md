# crossub_mobile_inspector

Field operations platform for property inspectors in the CROSSUB ecosystem. Consumes the [crossub_web](https://github.com/justin-crossub/crossub_web) API.

> **Use pnpm only.** Run all scripts via `pnpm`.

## Purpose

The Inspector App is a complete field operations platform — not just a reporting tool. Inspectors can:

- Accept jobs from the pool or manager assignments
- Navigate to properties (Google Maps, Apple Maps, Waze)
- Perform open, ingoing, outgoing, and routine inspections
- Attend tribunal hearings with auto-compiled evidence packages
- Track weekly earnings
- Communicate with agents and leasing teams
- Work offline with automatic sync when reconnected

## Apps

- `apps/inspector` — `@crossub/inspector`, Next.js 16 inspector portal (port **3006** locally)

## Requirements

- Node.js `>=20`
- pnpm `>=9`
- `crossub_web` API running (Postgres + Redis in that repo)

## Local development

```bash
pnpm install
cp apps/inspector/.env.example apps/inspector/.env

# Terminal 1 — API (crossub_web)
cd ../crossub_web && pnpm dev:api

# Terminal 2 — inspector app (this repo)
pnpm dev
```

Open [http://localhost:3006](http://localhost:3006).

The app ships with **demo data** for all PRD modules. When the API is reachable, auth and health checks use the live backend.

---

## Deploy on Render

Deploy **after** the `crossub_web` API is live on Render.

### Step 1 — Deploy the API (crossub_web)

Deploy `crossub_web` → `apps/api` as a Render Web Service. Note the public URL, e.g.:

```
https://crossub-api.onrender.com
```

See `crossub_web/README.md` for Postgres, Redis, and API env vars.

### Step 2 — Create the inspector Web Service

**Option A — Blueprint (recommended)**

1. Push this repo to GitHub.
2. [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**.
3. Connect the `crossub_mobile_inspector` repo — Render reads `render.yaml`.
4. When prompted, set environment variables (see Step 3).

**Option B — Manual Web Service**

| Setting | Value |
|---------|--------|
| **Name** | `crossub-mobile-inspector` |
| **Environment** | Node |
| **Region** | Singapore (or your preference) |
| **Branch** | `main` |
| **Root Directory** | *(blank)* |
| **Build Command** | `corepack pnpm install --frozen-lockfile && corepack pnpm build:inspector` |
| **Start Command** | `corepack pnpm --filter @crossub/inspector start` |
| **Health Check Path** | `/login` |
| **Plan** | Starter (or higher) |

### Step 3 — Environment variables

Set these in Render → your service → **Environment**:

| Variable | Value | Required |
|----------|-------|----------|
| `NODE_ENV` | `production` | Yes |
| `NEXT_PUBLIC_API_URL` | `/api` | Yes |
| `API_INTERNAL_URL` | `https://crossub-api.onrender.com` | Yes |
| `NEXT_PUBLIC_WEB_URL` | `https://crossub-web.onrender.com` | Optional |
| `NEXT_PUBLIC_AGENT_PORTAL_URL` | `https://crossub-mobile-agent.onrender.com` | Optional |

Replace URLs with your actual Render service URLs. Do **not** add `/api` to the end of `API_INTERNAL_URL`.

Render injects `PORT` automatically; the start script binds via `next start -H 0.0.0.0`.

### Step 4 — Update API CORS / email links (crossub_web)

In `crossub_web` API env on Render, add your inspector app URL:

```bash
# Password-reset emails point here when inspectors use this portal
WEB_URL=https://crossub-mobile-inspector.onrender.com

# Only needed if a frontend calls the API directly (not via /api proxy)
CORS_ORIGINS=https://crossub-mobile-inspector.onrender.com,https://crossub-mobile-agent.onrender.com
```

Leave `COOKIE_DOMAIN` empty so auth cookies bind to the inspector app hostname.

### Troubleshooting builds

**`EROFS: read-only file system, unlink '/usr/bin/pnpm'`** — Do not run `corepack enable` on Render. The filesystem is read-only; use `corepack pnpm` directly (as in `render.yaml` and the build command above).

### Step 5 — Verify

1. Open `https://crossub-mobile-inspector.onrender.com/login`
2. Sign in with a CROSSUB account from the shared API
3. Dashboard, Job Pool, and inspection workflows should load (demo data until inspector API endpoints exist)

---

## PRD module map

| PRD Section | Route |
|-------------|-------|
| Inspector Dashboard | `/dashboard` |
| Job Pool | `/job-pool` |
| Inspections (OPEN / INGOING / OUTGOING / ROUTINE) | `/inspections` |
| Manager Assignment | `/inspections` (redirect from `/jobs`) |
| Job Detail & Navigation | `/jobs/[id]` |
| Open Inspection | `/jobs/[id]/open` |
| Ingoing Inspection | `/jobs/[id]/ingoing` |
| Outgoing Inspection | `/jobs/[id]/outgoing` |
| Routine Inspection | `/jobs/[id]/routine` |
| Tribunal Module | `/tribunal`, `/tribunal/[id]` |
| Inspector Earnings | `/earnings` |
| Communication Hub | `/messages` |
| Notification Centre | `/notifications` |
| Offline Mode | Settings + auto-sync banner |
| Profile | `/profile` |

## Environment reference

| Variable | Local | Render |
|----------|-------|--------|
| `NEXT_PUBLIC_API_URL` | `/api` | `/api` |
| `API_INTERNAL_URL` | `http://localhost:3001` | `https://your-api.onrender.com` |
| `PORT` | `3006` (dev script) | Set by Render |

## Build

```bash
pnpm build:inspector
```

## Project structure

```
crossub_mobile_inspector/
├── apps/inspector/       Next.js inspector portal
├── render.yaml           Render Blueprint
├── scripts/              Dev helpers
└── package.json          Workspace root
```

## Ecosystem ports (local)

| App | Port |
|-----|------|
| crossub_web (web) | 3000 |
| crossub_web (api) | 3001 |
| crossub_mobile_agent | 3002 |
| crossub_tenant_app | 3003 |
| crossub_mobile_maintenance | 3004 |
| crossub_mobile_landlord_app | 3005 |
| **crossub_mobile_inspector** | **3006** |

## API integration (future)

The shared API does not yet have dedicated inspector-scoped endpoints. Before production:

- Add `INSPECTOR` RBAC role with job-scoped permissions
- Inspector job pool, assignment, workflow, and tribunal endpoints
- Add inspector portal URL to API `CORS_ORIGINS` / `WEB_URL`

Until then, the app uses demo data for jobs, inspections, and earnings while auth connects to the live API.
