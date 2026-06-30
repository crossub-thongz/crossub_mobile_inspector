# Changelog

## 2026-07-01

### Fixed
- Render deploy: vendored `packages/api-contract` (was a git symlink to `crossub_web`, which does not exist on Render). `build:inspector` now builds the contract package before the Next.js app. Removed the `postinstall` symlink script.

## 2026-06-28

### Added
- `constants/api-enums.ts`: `CONDITION_RATING` mirror (+ `CONDITION_RATING_LABEL`) of the API's `ConditionRating` enum, and `INSPECTOR_NOTIFICATION_TYPE` mirror.
- `lib/crossub-api/inspector-mappers.ts`: `mapInspectionDetail` flattens the findings tree (`InspectorInspectionDetailDto` areas → items → photos, plus inspection-level photos) into the read-view `RoomInspectionEntry[]`; `mapInspectorMessages` (threads → `MessageThread[]` + per-thread `ThreadMessage[]`, category derived from `inspectionId`); `mapInspectorNotifications` (lowercases the API type onto the FE union).
- `components/inspector/findings-card.tsx`: read-only Findings card on the job-detail page, loading the real seeded areas/items/photos via `GET /inspector/inspections/:id/detail` (renders nothing for demo jobs / unreachable facade).
- `InspectorDataProvider.loadInspectionFindings(id)`: facade-gated accessor returning the mapped findings tree. `InspectorDataProvider.uploadInspectionPhotos(id, files)`: base64 → R2 upload via the facade (no-op for demo jobs; throws so the caller can block completion).
- `lib/utils.ts`: `fileToBase64` (strips the `data:` prefix) for the inline photo-upload body.
- New inspector client fns (`lib/crossub-api/inspector-client.ts`): `fetchInspectorMessages`/`replyInspectorMessage`, `fetchInspectorNotifications`/`markInspectorNotificationRead`/`markAllInspectorNotificationsRead`, `uploadInspectionPhoto`.

### Changed
- Completing an API-backed inspection now drives the real facade (`POST /inspector/inspections/:id/complete`, `IN_PROGRESS → COMPLETED`): it posts the on-site window so the server records a PENDING `BillableAttendance` (server computes the hours + $45/hr), then refreshes so the genuine earnings row replaces the optimistic card — no synthesized local line. Demo/offline rows keep the local-synth path.
- Messages + notifications now overlay live facade data onto the demo seeds through the `InspectorDataProvider` refresh seam (per-domain `allSettled` fallback): `/inspector/messages` → threads + per-thread messages; `/inspector/notifications` → notifications. `sendMessage` posts a real reply (and reconciles) for API-backed threads; `markNotificationRead` persists on the facade for API-backed notifications; both stay local-optimistic for demo rows. The message thread view aligns the inspector's own bubble on the server-resolved `fromSelf` (falling back to the demo name).
- The ingoing inspection screen's "Add Photo" button is now a real file picker that uploads inspection-level evidence to R2 (for API-backed inspections) before completion — the uploaded photos surface back through the findings detail read.
- Bumped `@crossub-thongz/api-contract` `^0.1.0` → `^0.10.0`.

## 2026-06-27

### Added
- Typed inspector-facade read path: `lib/crossub-api/inspector-mappers.ts` (maps `InspectorInspectionResponseDto` → `InspectionJob` and `InspectorJobResponseDto` → `EarningsRecord`) and `constants/api-enums.ts` mirroring the API's `InspectionStatus` / `InspectionType` / `BillingSource` / invoice-status Prisma enums.

### Changed
- Assigned inspections (`/api/v1/inspector/inspections`) and the billable earnings ledger (`/api/v1/inspector/jobs`) now overlay live API data onto the demo seeds through the `InspectorDataProvider` refresh seam — a non-destructive merge by id, per-domain (a failure in one leaves just that slice on demo data), so no screen component changed. The job pool, tribunals and messages have no facade yet and stay on demo data.
- Accepting an API-backed assignment now persists on the real facade (`DRAFT → IN_PROGRESS`) with optimistic local fallback; pool claims and all other actions (decline / status / workflow / complete) stay local-optimistic until their facades land.
