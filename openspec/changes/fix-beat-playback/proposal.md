# Proposal: Fix Beat Playback (Issue #46)

## Intent

Fix two audio playback bugs: seeks silently dropped before metadata loads, and volume control lacks visual feedback (low-contrast fill, no drag thumb).

## Scope

### In Scope
- Adapter seek queue — queue seeks while `duration` is NaN, apply on `loadedmetadata`
- `useCallback` stabilization for `seek`, `setVolume`, `pause`, `resume` in `useAudioPlayer`
- `useRef`-based callback for drag effect dependency in `PersistentPlayer`
- Volume fill changed to full opacity `bg-[#C8860A]` for visibility
- Drag thumb added to volume bar (same `onMouseDown`/`useEffect` pattern as progress)
- New test cases: seek queue behavior, progress click interaction, volume bar interaction

### Out of Scope
- Extracting `ProgressBar` / `VolumeSlider` as reusable components (deferred)
- Adding local audio files to `public/` (SoundHelix URLs remain)
- Shuffle/Repeat/Skip buttons (placeholders, not broken)
- Refactoring `PersistentPlayer` into smaller components

## Capabilities

No existing specs in `openspec/specs/`. This is a bug fix — no new capabilities or spec-level requirement changes.

### New Capabilities
None

### Modified Capabilities
None

## Approach

**Minimal fix (Approach 1 from exploration) — ~80-120 lines across 4 files:**

1. **`HTMLAudioPlayerAdapter.ts`**: Add `pendingSeek: number | null`. In `seek()`: if `duration` is NaN/0, store time and return. Apply stored time in `handleLoadedMetadata()`. Clear on apply.
2. **`useAudioPlayer.ts`**: Wrap `seek`, `setVolume`, `pause`, `resume` in `useCallback` with stable deps.
3. **`PersistentPlayer.tsx`**: Replace `seek` in drag effect dep array with `useRef(seek).current`. Change volume fill to `bg-[#C8860A]`. Add volume drag thumb (same pattern as progress bar — thumb div + `onMouseDown` → `mousemove`/`mouseup` listeners).
4. **Tests**: Add seek queue test in `HTMLAudioPlayerAdapter.test.ts`, seek interaction test in `PersistentPlayer.test.tsx`, volume interaction test in `PersistentPlayer.test.tsx`.

## Key Decisions

- **Seek queue over retry**: Queue-and-apply on `loadedmetadata` is simpler and covers all edge cases (slow load, long click-to-play gap).
- **`useRef` over removing `seek` from deps**: Keeps the effect correct under React 19 rules — effect closure always has latest `seek` without re-triggering.
- **Full opacity fill over new color**: `bg-[#C8860A]` (solid gold) passes contrast against dark background. No design system change needed.
- **No component extraction**: Bug fix scope. Extraction is a separate refactor.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `apps/web/src/infrastructure/marketplace/HTMLAudioPlayerAdapter.ts` | Modified | Add `pendingSeek` field, modify `seek()` and `handleLoadedMetadata()` |
| `apps/web/src/ui/marketplace/hooks/useAudioPlayer.ts` | Modified | Wrap 4 functions in `useCallback` |
| `apps/web/src/ui/marketplace/components/PersistentPlayer.tsx` | Modified | Drag effect stabilization, volume fill opacity, volume drag thumb |
| `apps/web/src/ui/marketplace/hooks/__tests__/useAudioPlayer.test.ts` | Modified | Add seek/volume interaction tests |
| `apps/web/src/infrastructure/marketplace/__tests__/HTMLAudioPlayerAdapter.test.ts` | Modified | Add seek queue test |
| `apps/web/src/ui/marketplace/components/__tests__/PersistentPlayer.test.tsx` | Modified | Add seek click and volume click tests |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Seek queue persistence if audio never loads metadata | Low | Adapter is bound to component lifecycle — `cleanup()` discards it, GC handles the rest |
| Drag ref update causes stale closure on rapid clicks | Low | `mouseup` cleanup in effect `return` covers this; same pattern as current progress bar |
| Volume drag changes UX for first time | Low | Same pattern as progress drag — familiar interaction, no behavioral regression |
| Test audio URLs (SoundHelix) may be slow/unavailable | Low | Adapter handles errors via existing `onError` callback; seek queue test can mock `duration` |

## Rollback Plan

- **Revert commit** if deployed: `git revert <sha>` — each file change is isolated.
- If seek queue causes regression: remove `pendingSeek` logic in adapter, restore original `seek()` guard. Test that old behavior (silent drop) is acceptable fallback.
- If `useCallback` causes stale closure: revert to plain arrow functions, keep `useRef` fix in `PersistentPlayer` only.
- Volume visual changes are CSS-only — revert single className change.

## Dependencies

- None — all changes are internal to `apps/web/`. No external API or package changes.

## Success Criteria

- [ ] Seek before `loadedmetadata` is applied once metadata loads (verified by test)
- [ ] `seek` in `useAudioPlayer` is reference-stable between renders (verified by `toBe` in test)
- [ ] Volume fill is visible against dark background at all volume levels
- [ ] Volume bar supports drag-to-scrub (not just click)
- [ ] All existing tests pass (`pnpm test:run`)

## Estimated Size

- **Files changed**: 6 (3 source + 3 test)
- **Lines changed**: ~100-130
- **PR budget risk**: Low (well under 400-line review cap)
