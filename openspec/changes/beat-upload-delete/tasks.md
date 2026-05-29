# Tasks: Beat Upload & Delete (Issue #64)

## Task 1: Backend — Cover image upload
- [x] 1.1 Multer config — Allow image MIME types (jpg, png, webp, gif), 10MB limit
- [x] 1.2 Storage service — Add `uploadCover` with ownership check
- [x] 1.3 Storage routes — Add `POST /api/v1/storage/cover/:beatId`

## Task 2: Frontend — Hexagonal beats module
- [x] 2.1 Domain — `Beat` entity, `CreateBeatInput`, `BeatStatus` type
- [x] 2.2 Infrastructure — `ApiBeatRepository` with CRUD + upload methods
- [x] 2.3 Application — `useCases.ts` orchestrating repository calls
- [x] 2.4 Hook — `useBeats()` providing beats state, upload, delete
- [x] 2.5 Refactor BeatsPage — consume `useBeats`, add cover upload field, loading/error states

## Task 3: Verify
- [x] 3.1 Backend `tsc --noEmit` — 0 errors
- [x] 3.2 Frontend `tsc --noEmit` — 0 errors
