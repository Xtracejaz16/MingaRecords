## Exploration: Beat Upload & Delete System (Issue #64)

### Current State

**Backend (apps/backend):**
- **Beats module** (`src/modules/beats/`) is fully implemented: routes, Zod-validated schemas, service with ownership checks, Prisma repository, status transitions, catalog listing, genres endpoint, dashboard stats, producer profile. All endpoints are wired in `app.ts`.
- **POST /api/v1/beats** — creates beat metadata (title, description, priceCents, genre, bpm, key, tags). Requires `BEATMAKER` role. Returns 201 with the created beat.
- **DELETE /api/v1/beats/:id** — soft-deletes (sets `deletedAt` + status `deleted`). Ownership check in service: `beat.producerId !== currentUserId` throws `BeatForbiddenError`.
- **Storage module** (`src/modules/storage/`) has two route files: `routes.ts` (current, used in app.ts) and `storage.route.ts` (older, unused). The current one uses `StorageService` with adapter pattern (LocalStorageAdapter / S3Adapter), multer for file upload (memory storage, 50MB limit, MP3/WAV/FLAC only).
- **POST /api/v1/storage/upload/:beatId** — uploads audio via multer, saves to storage, calls `markAudioReady` to set `audioUrl` and transition status to `ready`.
- **Cover image upload is MISSING** from the storage module. The `Beat.coverUrl` field exists in the schema but there's no endpoint or flow to upload cover images. Need to add image upload (jpg, png, webp) to storage.
- **Auth**: JWT-based with `requireAuth` middleware. JWT payload includes `userId`, `email`, `role`.

**Frontend (apps/web):**
- **BeatsPage** (`src/ui/beats/components/BeatsPage.tsx`) exists with a working upload form and delete, but ALL logic is inline — raw `fetch` calls, local state, no hexagonal separation. Works but is not maintainable.
- Upload flow: POST metadata → POST audio file (2-step). Already implemented inline.
- Cover image upload: NOT implemented in the form. No cover URL field.
- Delete: Uses `confirm()` dialog, calls `DELETE /api/v1/beats/:id`, refreshes list. Works.
- **Hexagonal architecture**: Only the auth and marketplace modules follow it properly (domain entities → application use cases → infrastructure adapters → ui hooks). Beats has NO domain entities, NO application layer, NO infrastructure adapter.
- **Routing**: `#/beats` is registered in `routes.ts`, kind: `private`. `BeatsPage` is rendered in `App.tsx` at line 138.
- **Auth hooks**: `useAuth` provides `session`, `getAccessToken()` — already used in BeatsPage.
- **BeatmakerProfileScreen** and `useBeatmakerProfile` show the pattern for hex-clean feature hooks: fetch wrapper, form state, field validation, save/cancel.

**Schema:**
- `Beat` model has: id, title, slug, description, priceCents, genre, bpm, key, tags[], audioUrl, coverUrl, previewUrl, streamUrl, playsCount, salesCount, status (BeatStatus enum), publishedAt, deletedAt, producerId, buyerId, licenses[], timestamps.
- `BeatStatus` enum: draft, pending_audio, processing, ready, published, sold, archived, deleted.
- `Genre` model: id, name (unique), slug (unique), createdAt.
- `License` model: id, type (BASIC/PREMIUM/EXCLUSIVE), priceCents, isActive, beatId.

### Stitch/Remy Components Found

**None.** No Stitch or Remy design system components exist in the project. The only "stitch" reference is an SVG `<feTurbulence>` filter attribute (`stitchTiles='stitch'`). All UI is hand-crafted with Tailwind v4 classes and custom design tokens (obsidian, muiscaGold, taironaTerracotta, etc.).

### Affected Areas

- `apps/backend/src/modules/storage/multer.config.ts` — Add cover image file types (jpg, png, webp) and a separate multer config or reuse existing with additional allowed types.
- `apps/backend/src/modules/storage/routes.ts` — Add cover image upload endpoint or extend existing upload flow.
- `apps/backend/src/modules/storage/service.ts` — Add cover image upload method.
- `apps/backend/src/modules/storage/local.adapter.ts` / `s3.adapter.ts` — Already supports general upload; may need path adjustments for covers.
- `apps/backend/src/modules/beats/service.ts` — Already has `markAudioReady`; may need a similar `markCoverReady` or extend the beat update flow.
- `apps/backend/src/modules/beats/route.ts` — Possibly update `CreateBeatInputSchema` or add a cover-specific endpoint.
- `apps/web/src/domain/` — New domain module for beats (entities, value objects).
- `apps/web/src/application/beats/` — New use cases (CreateBeatUseCase, UploadAudioUseCase, DeleteBeatUseCase).
- `apps/web/src/infrastructure/beats/` — New API adapter for beats.
- `apps/web/src/ui/beats/` — Refactor existing BeatsPage to use hexagonal layers, add cover upload, improve form UX.
- `apps/web/src/routing/routes.ts` — No changes needed (route exists).
- `apps/web/src/App.tsx` — No changes needed (BeatsPage already wired).

### Approaches

1. **Minimal patch to existing BeatsPage** — Just add cover image upload to the existing inline BeatsPage and fix the storage route.
   - Pros: Fast, minimal changes
   - Cons: Leaves the technical debt of inline architecture, hard to test
   - Effort: Low (1-2 days)

2. **Proper hexagonal refactor** — Create domain entities, application use cases, infrastructure adapter, refactor BeatsPage to use hooks, add cover upload to storage.
   - Pros: Clean architecture, testable, matches project patterns
   - Cons: More work upfront, but pays off for future beat features (edit, publish, etc.)
   - Effort: Medium (3-4 days)

3. **Hybrid** — Add cover upload to storage backend (needed either way), refactor frontend beats into proper hexagonal layers, but keep the existing BeatsPage as-is initially and create a new `BeatUploadForm` component.
   - Pros: Adds the missing backend feature, cleans up frontend incrementally
   - Cons: Partial refactor still leaves some tech debt
   - Effort: Low-Medium (2-3 days)

### Recommendation

**Approach 3 (Hybrid).** The backend storage module needs cover image support regardless (it's the only missing backend piece). On the frontend, we should follow the hexagonal patterns already established by auth and marketplace — create `domain/beats/`, `application/beats/`, `infrastructure/beats/` and have `ui/beats/` use proper hooks. The existing BeatsPage already works for listing and deleting; we need to:
1. Add image upload to storage routes (multer config + endpoint)
2. Create domain entities (`Beat.ts`, `BeatUpload.ts`, etc.)
3. Create application use cases (`CreateBeatUseCase.ts`, `UploadAudioUseCase.ts`, `UploadCoverUseCase.ts`, `DeleteBeatUseCase.ts`)
4. Create infrastructure API adapter (`BeatsApiAdapter.ts`)
5. Create a `useBeats` hook (or similar) for the UI layer
6. Refactor BeatsPage to use the hook, add cover image upload field
7. Keep existing table/list view, improve error handling

### Risks

- **Storage route duplication**: There are two storage route files (`routes.ts` and `storage.route.ts`). Only `routes.ts` is wired in `app.ts`. Need to ensure we modify the correct one.
- **Cover image auth**: The current audio upload endpoint uses `requireAuth` and checks `userId`. Cover upload should follow the same pattern — only the beat producer can upload covers.
- **Existing BeatsPage coupling**: The current BeatsPage uses inline `fetch` with a complex upload flow. Refactoring to hexagonal requires careful extraction to avoid breaking existing functionality.
- **No tests**: The beats module on frontend has zero tests. After refactoring, we should add tests for the domain and application layers.

### Ready for Proposal

Yes — all backend CRUD already exists (minus cover image upload), the frontend route and screen are already wired, and the hexagonal pattern for auth/marketplace provides a clear reference.
