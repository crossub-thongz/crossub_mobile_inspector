<!-- shared-rules:start v1 — identical in every CROSSUB repo. Change it in all repos together, never in one. -->
# AGENTS.md

Rules for every AI coding tool working in this repo (Cursor and any other). This file is the
shared source: `.cursor/rules/shared-rules.mdc` only points here. Put new rules in this file,
never in that pointer.

## Shared rules (all CROSSUB repos)

These ten rules apply before anything else in this file. If a request conflicts with one, say so
and stop; do not quietly pick a side.

1. **If blocked or unsure, stop and ask.** Never work around a problem. A missing endpoint, a
   client that looks broken, a failing check or an unclear requirement is a question for the
   developer, not something to route around.
2. **Never invent data.** No made up names, counts, amounts, dates, scores, emails, addresses or
   ids anywhere outside test files. A value a user can see is either read from the API or it is a
   policy constant the code enforces (a target, a limit, a page size). A measurement is never a
   constant.
3. **If an endpoint is missing, build it or show an empty state.** Never fill a screen with sample
   rows, a seed list or a fixed number. Never show a success message for something that was not
   saved. A feature with no real backend says "not available".
4. **Use the shared paths.** In the API, read a record type through the module that owns it; do
   not add a new direct database read of another module's records. In the web app, call the API
   through the existing `lib/*-api.ts` clients. In the mobile apps, call the API only through the
   typed contract client.
5. **Never write request or response types by hand, and never edit, wrap or replace the contract
   client.** Types come from `@crossub-thongz/api-contract`. If the client seems not to work, stop
   and ask (rule 1).
6. **Use constants for status, stage, role and type values.** No raw string or number comparisons.
   Shared helpers go in `utils`, shared values in `constants`.
7. **Never switch off, skip, delete or loosen a check.** That covers tests, guard specs, lint
   rules, type checking, exemption lists and CI steps. If a check fails, fix the code. If you
   believe the check is wrong, stop and ask.
8. **Change only what the task needs.** No whole file overwrites, no unrelated edits, no reverting
   lines you did not write. List every behaviour change in the pull request description or the
   hand back message.
9. **Run the repo's checks and fix every failure before saying the work is done.** Report results
   as they are. Do not say a check passed if it was not run.
10. **Staging is where work is verified.** Never use a local database. No API address, login,
    password, key or personal email in source. Do not push to `main` unless the developer you are
    working for has asked for it in this task: a push to `main` can be a production release.

When a hidden failure would be covered by default or empty data, show the failure instead.
<!-- shared-rules:end -->

## This repo: crossub_mobile_inspector (inspector app)

The CROSSUB inspector mobile-web app (Next.js 16; the app is in `apps/inspector/`). One
of five role apps; the others and the backend are **sibling repos** under
`~/Desktop/crossub/`.

### The API contract is the source of truth

Talk to the backend through the **published contract**, never hand-written types:

- Package: **`@crossub-thongz/api-contract`** — generated from the NestJS API's OpenAPI
  (`openapi.mobile.json`, the `/api/v1` facades).
- Typed client: `apps/inspector/lib/crossub-api/client.ts` — `createCrossubClient`
  (openapi-fetch, base `/api/v1`, cookie session via `credentials: 'include'`).
- This app's facade is **`/api/v1/inspector/*`** — the billable jobs ledger plus the
  assignment workflow (inspections: accept / complete / detail / file report). Add calls
  in `apps/inspector/lib/crossub-api/inspector-client.ts` using the `crossub` client +
  `components['schemas'][...]` types. **Never hand-roll request/response types.**

### Where things live (sibling repos under `~/Desktop/crossub/`)

- **Backend (NestJS):** `crossub_web/apps/api` — the inspector facade is `/api/v1/inspector/*`.
- **Contract (vendored):** `packages/api-contract` — copied from `crossub_web/packages/api-contract`.
  Re-sync after backend OpenAPI changes (`pnpm build:inspector` builds it before the app).

### Auth & data flow

- Cookie session (`csb_at`) via `/auth/login`; every call goes through the BFF proxy
  `apps/inspector/app/api/[...path]/route.ts` → `API_INTERNAL_URL`.
