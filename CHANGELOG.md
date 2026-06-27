# Changelog

## 2026-06-27

### Added
- Typed inspector-facade read path: `lib/crossub-api/inspector-mappers.ts` (maps `InspectorInspectionResponseDto` → `InspectionJob` and `InspectorJobResponseDto` → `EarningsRecord`) and `constants/api-enums.ts` mirroring the API's `InspectionStatus` / `InspectionType` / `BillingSource` / invoice-status Prisma enums.

### Changed
- Assigned inspections (`/api/v1/inspector/inspections`) and the billable earnings ledger (`/api/v1/inspector/jobs`) now overlay live API data onto the demo seeds through the `InspectorDataProvider` refresh seam — a non-destructive merge by id, per-domain (a failure in one leaves just that slice on demo data), so no screen component changed. The job pool, tribunals and messages have no facade yet and stay on demo data.
- Accepting an API-backed assignment now persists on the real facade (`DRAFT → IN_PROGRESS`) with optimistic local fallback; pool claims and all other actions (decline / status / workflow / complete) stay local-optimistic until their facades land.
