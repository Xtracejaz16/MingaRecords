## Exploration: Fix Beat Playback (Issue #46)

### Current State

The mini player (`PersistentPlayer`) is a fixed bottom bar rendered in `MarketplacePage`. It uses a hexagonal architecture flow:

**Data flow:**
1. `MockMarketplaceRepository` provides 3 beats with SoundHelix audio URLs
2. `useMarketplace` hook loads beats via `GetBeatsUseCase`
3. User clicks `BeatCard` → `handlePlay` → `useAudioPlayer().playBeat(beat)` → `PlayBeatUseCase.execute(beat)` → `HTMLAudioPlayerAdapter.load(url)` + `adapter.play()`
4. `PersistentPlayer` reads from `usePlayerStore` (Zustand) for `currentBeat`, `isPlaying`, `progress`, `duration`, `volume`, `isMuted`
5. Controls delegate to `useAudioPlayer` hook methods: `seek`, `setVolume`, `toggleMute`, `pause`, `resume`

**Audio adapter:** `HTMLAudioPlayerAdapter` wraps the native `HTMLAudioElement` with callbacks for `timeupdate`, `loadedmetadata`, `ended`, `error`. The adapter stores a single callback per event type.

**Existing tests:** `PersistentPlayer.test.tsx` verifies render states (visible/hidden, play/pause icons, mute icons) but fully mocks `useAudioPlayer` — no seek/volume interaction testing. `useAudioPlayer.test.ts` verifies `setVolume` and `toggleMute` update the store, but adapter is fully mocked. `HTMLAudioPlayerAdapter.test.ts` verifies `seek` clamping and `setVolume` mapping but uses a mock `Audio` global.

### Root Cause Analysis: Two Problems

**Problem 1 — Progress seek silently fails:**
- `HTMLAudioPlayerAdapter.seek(time)` has a guard: `if (!Number.isFinite(duration) || duration <= 0) return;`. If the `Audio` element's `duration` is `NaN` (before `loadedmetadata` fires), the seek is silently dropped.
- `PersistentPlayer.handleProgressClick` has `if (duration <= 0) return;` — same silent drop.
- The drag `useEffect` lists `seek` as a dependency. But `seek` is recreated every render (it's a plain `const` arrow function in the hook body). This causes the effect to re-run and re-attach document event listeners on every render — including during drag when `progress` updates cause re-renders. While not strictly breaking, it's fragile and can cause missed events.
- There is no seek queue: if the user clicks before metadata loads, the seek position is lost forever.

**Problem 2 — Volume control lacks feedback:**
- The volume bar is a thin 24px-wide (`w-24`) `h-1` track with no drag thumb. It only supports click-to-set.
- The volume fill uses `bg-[#C8860A]/40` (40% opacity gold) against `bg-surface-container-highest` — both are similar mid-tone colors on a dark theme, making the fill nearly invisible.
- The `handleVolumeClick` correctly calculates percentage from click position and calls the hook's `setVolume`, which updates both the adapter (`this.audio.volume`) and the store. Code is correct, but the **visual feedback** is insufficient — users cannot see that their click had any effect.
- No drag-to-scrub on volume, unlike the progress bar.

### Affected Areas

- `apps/web/src/infrastructure/marketplace/HTMLAudioPlayerAdapter.ts` — `seek()` drops seeks when duration is NaN/0. Needs seek queueing or retry-on-metadata-ready.
- `apps/web/src/ui/marketplace/hooks/useAudioPlayer.ts` — `seek` and `setVolume` are plain arrow functions recreated every render. No `useCallback` stabilization.
- `apps/web/src/ui/marketplace/components/PersistentPlayer.tsx` — Progress bar drag logic has stale closure risk. Volume bar has no drag thumb and low-visibility fill. Both handlers need edge-case hardening.
- `apps/web/src/ui/marketplace/hooks/__tests__/useAudioPlayer.test.ts` — Mock adapter obscures real behavior. Need integration-style test that exercises seek/volume through the real adapter or a contract test.
- `apps/web/src/ui/marketplace/components/__tests__/PersistentPlayer.test.tsx` — No seek/volume interaction tests. Fully mocked hook.

### Approaches

1. **Minimal fix — adapter queue + `useCallback` + visual polish**
   - Add a `pendingSeek: number | null` to the adapter; apply it inside `handleLoadedMetadata` if set.
   - Wrap `seek` and `setVolume` in the hook with `useCallback` to stabilize references.
   - Remove `seek` from the drag effect's dependency array; use a `useRef`-based callback instead.
   - Improve volume fill visibility (change opacity or use the solid `bg-[#C8860A]`).
   - Add drag thumb to the volume bar (same pattern as progress bar).
   
   - Pros: Smallest diff, preserves existing architecture, fixes both issues, easy to review.
   - Cons: Doesn't extract reusable components, leaves `PersistentPlayer` monolithic.
   - Effort: Medium (~3-4 files changed, ~80-120 lines added)

2. **Extract `ProgressBar` and `VolumeSlider` components**
   - Move progress bar into `ProgressBar.tsx` with self-contained drag state.
   - Move volume controls into `VolumeSlider.tsx` with click + drag support.
   - Each component owns its interaction state (no `isDragging` in parent).
   - Both accept minimal props: `value`, `onChange`, `onDragStart`/`onDragEnd`.
   
   - Pros: Clean separation of concerns, each component independently testable, reusable.
   - Cons: More files, more refactoring, larger diff.
   - Effort: Medium-High (~6 files, ~200-250 lines)

3. **Refactor adapter + extract components + add integration tests (full fix)**
   - Approach 2 + extract `AudioPlayerAdapter` seek queue as a strategy.
   - Write a contract test (`HTMLAudioPlayerAdapter.contract.test.ts`) that verifies seek/volume with a real `Audio` element (using a known test audio file).
   - Write interaction tests for `ProgressBar` and `VolumeSlider` using `@testing-library/user-event`.
   
   - Pros: Maximum coverage, future-proof, catches regressions.
   - Cons: Largest effort, more moving parts.
   - Effort: High (~8-10 files, ~350-450 lines)

### Recommendation

**Approach 1** — minimal fix with adapter seek queue, `useCallback` stabilization, and visual polish.

**Reasoning:**
- The root cause is clearly identified and isolated: silent seek drops and insufficient volume feedback.
- The existing architecture is sound — the adapter, hook, and component already have the correct structure. They just need edge-case hardening and stabilization.
- Issue #46 is a bug fix, not a feature request. Approach 1 fixes exactly what's broken with minimal risk of introducing new issues.
- The project uses strict TDD (`tdd: true` in config). Approach 1 keeps the test surface focused and additive (new test cases for seek queue and volume visual), rather than requiring a rewrite of existing tests.
- The drag state in `PersistentPlayer` is only used for progress seeking; extracting components (Approach 2-3) is a clean-up step that can be done in a follow-up if needed, but is not required to fix the bug.

### Detailed Fix Plan

1. **`HTMLAudioPlayerAdapter.ts`: Add seek queue**
   - Add `private pendingSeek: number | null = null`
   - In `seek()`: if `duration` is NaN/0/Infinity, store `time` in `pendingSeek` and return. Otherwise set `currentTime` normally.
   - In `handleLoadedMetadata()`: if `pendingSeek !== null`, apply it, then clear.
   - This ensures seeks are never lost, even when the user clicks before metadata loads.

2. **`useAudioPlayer.ts`: Stabilize function references**
   - Wrap `seek`, `setVolume`, `toggleMute`, `pause`, `resume` in `useCallback` with empty or minimal deps.
   - Since `adapter` is created once via `useState(createAudioPlayer)`, the dependency is stable.

3. **`PersistentPlayer.tsx`: Stabilize drag effect + volume visual**
   - Replace `seek` in the drag `useEffect` dep array with a `useRef`-based approach:
     ```ts
     const seekRef = useRef(seek);
     seekRef.current = seek; // updated every render
     ```
     Then use `seekRef.current(time)` inside the effect handler.
   - Change volume fill from `bg-[#C8860A]/40` to `bg-[#C8860A]` (full opacity) for visibility.
   - Add a drag thumb to the volume bar (same `onMouseDown`/`useEffect` pattern as progress bar).

4. **Tests: Add seek/volume interaction tests**
   - `useAudioPlayer.test.ts`: Add test that `seek` calls `adapter.seek` with the correct time value.
   - `HTMLAudioPlayerAdapter.test.ts`: Add test for seek queue — call `seek` before duration is set, then fire `loadedmetadata`, verify `currentTime` is updated.
   - `PersistentPlayer.test.tsx`: Add test simulating click on progress bar and verifying `seek` was called with expected time. Add test for click on volume bar verifying `setVolume` was called.

### Risks

- **No local audio files in `public/`**: The `MockMarketplaceRepository` uses SoundHelix URLs (real external MP3s). If the requirement shifts to truly local assets (`public/audio/`), files must be added and URLs updated. This is a data concern, not a code fix — but the seek queue fix handles the case where audio URL is unreachable.
- **Drag effect edge case**: Even with `useRef` stabilization, rapid click/drag sequences on the progress bar could overlap. Mitigation: the `onMouseUp` cleanup in the `useEffect` covers this.
- **Volume drag addition**: Adding drag to the volume bar for the first time changes the UX. Consider making this a visual-only improvement (no behavioral change to existing click).
- **Seek queue memory**: If a seek is queued but the audio never loads metadata, the seek stays queued forever. A timeout or cleanup mechanism could be added, but the current `adapter.cleanup()` clears all callbacks, and the adapter itself would be garbage collected when the component unmounts. Low risk.

### Ready for Proposal

Yes — approaches and root causes are clear. The orchestrator should proceed to `sdd-propose` with the minimal fix (Approach 1) unless the user requests component extraction.
