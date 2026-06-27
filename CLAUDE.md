# CROSSUB Inspector App — CLAUDE.md

The CROSSUB inspector mobile-web app (Next.js 16; the app is in `apps/inspector/`). One
of five role apps; the others and the backend are **sibling repos** under
`~/Desktop/crossub/`.

## The API contract is the source of truth

Talk to the backend through the **published contract**, never hand-written types:

- Package: **`@crossub-thongz/api-contract`** — generated from the NestJS API's OpenAPI
  (`openapi.mobile.json`, the `/api/v1` facades).
- Typed client: `apps/inspector/lib/crossub-api/client.ts` — `createCrossubClient`
  (openapi-fetch, base `/api/v1`, cookie session via `credentials: 'include'`).
- This app's facade is **`/api/v1/inspector/*`** — the billable jobs ledger plus the
  assignment workflow (inspections: accept / complete / detail / file report). Add calls
  in `apps/inspector/lib/crossub-api/inspector-client.ts` using the `crossub` client +
  `components['schemas'][...]` types. **Never hand-roll request/response types.**

## Where things live (sibling repos under `~/Desktop/crossub/`)

- **Backend (NestJS):** `crossub_web/apps/api` — the inspector facade is `/api/v1/inspector/*`.
- **Contract source:** `crossub_web/packages/api-contract` — wired into this session via
  `.claude/settings.json` → `additionalDirectories`, so the live contract types are in
  context without opening the whole backend or the other apps.

## Auth & data flow

- Cookie session (`csb_at`) via `/auth/login`; every call goes through the BFF proxy
  `apps/inspector/app/api/[...path]/route.ts` → `API_INTERNAL_URL`.
