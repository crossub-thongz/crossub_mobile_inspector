# Changelog

## 2026-07-03

### Added
- Findings now persist to the server: all four execution screens (ingoing / routine / outgoing / open) submit their gathered per-area conditions, notes, issues + responsibility calls, and readiness verdict through the new `saveInspectionFindings` provider action (`POST /inspector/inspections/{id}/findings`) BEFORE completing — previously everything typed on site died in component state. Ingoing photo uploads now attach to the current area of the findings tree (`areaName` on the photo upload).
- Tribunal tab now live for assigned cases: `refresh()` overlays `GET /inspector/tribunal-cases` onto the demo seed (hearing logistics, claim amounts, evidence checklist, staff-recorded outcome; checklist's server-derivable keys come derived, toggles + outcome recorder stay local-only for now).
- Profile + registration wired: `GET /inspector/profile` hydrates the roster credentials (real `tribunalQualified`) and registration status; the register form now ALSO submits to `POST /inspector/registration` — the application lands in the real staff review queue, so approved/rejected/reviewedAt can actually happen. Local copy keeps the never-echoed PII/bank fields.
- New typed fetchers: `saveInspectionFindings`, `declineInspection`, `releaseInspection`, `fetchInspectorTribunalCases`, `fetchInspectorProfile`, `submitInspectorRegistration`; new mappers `mapTribunalCases` / `mapInspectorRegistration`; `TRIBUNAL_TYPE(_LABEL)` constants.

### Changed
- Decline and release are no longer local-only: declining an API-backed pool job hits the real facade (server hides it from THIS inspector's pool, keeps it for everyone else); the cancel dialog's release-to-pool / flag-admin now reverts the real job to the pool with the reason on the server audit trail. The $10 emergency bonus stays a local display — the server deliberately moves no money on a release.
- Findings read view prefers the app's own condition vocabulary (`ratingRaw`, e.g. 'Damaged') over the mapped enum label for app-authored areas.
- Refreshed the vendored `packages/api-contract` types + dist (7 new inspector paths + 5 DTOs).

### Added
- `recordKeyCustody` / `uploadKeyCustodyPhoto` typed fetchers (`lib/crossub-api/inspector-client.ts`) for the key-custody facade (`POST /inspector/inspections/{id}/key-custody/{collect|return}` + `…/photos/upload`).
- `syncKeyCustodyToServer` + `keyWorkflowFromCustody` (`lib/leasing-key-collection.ts`) — push a locally-recorded key phase to the server (proof photos base64 → R2 first, then the record call), and rebuild the local key-workflow overlay from server custody so recorded collect/return survive a new device or cleared browser storage.

### Changed
- `saveKeyWorkflow` (data provider) now syncs **key collection** to the server for API-backed jobs (photos then record; best-effort, local record stays the immediate UX). **Key return** is stashed and flushed by `completeJob` after the completion lands — the facade rejects a return recorded before the inspection is completed. Demo jobs keep the offline-queue path.
- `enrichJobWithKeyCollection` merges server custody into the job's key-workflow overlay (local mid-flight records win) and `keyAccess.photoRequired` now honours the server flag instead of hardcoding `true`.
- Refreshed the vendored `packages/api-contract` `src/types.ts` from the crossub_web contract source (adds the key-custody paths + `InspectorKeyCustodyDto`/`RecordKeyCustodyDto`/`UploadKeyCustodyPhotoDto` + `custody`/`photoRequired` on the key-collection response) and built its `dist` so the workspace link resolves.

### Fixed
- Missing `fileToBase64` import in `inspector-data-provider.tsx` (pre-existing compile error); app `tsc --noEmit` is now fully clean.

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
