# Tasks: Fix Beat Playback (Issue #46)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~120-150 (3 source + 3 test files) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

## Phase 1: Adapter Seek Queue

- [x] 1.1 Add `pendingSeek: number | null` field to `HTMLAudioPlayerAdapter`. In `seek()`: if `duration` is NaN/0, store time in `pendingSeek` and return. Apply `pendingSeek` inside `handleLoadedMetadata()`, then clear it.
- [x] 1.2 Add test in `HTMLAudioPlayerAdapter.test.ts`: mock `duration` as NaN, call `seek(50)`, verify `currentTime` unchanged. Then simulate `loadedmetadata` with duration=100, verify `currentTime` is 50.

## Phase 2: Hook Callback Stabilization

- [x] 2.1 In `useAudioPlayer.ts`, import `useCallback`. Wrap `seek`, `setVolume`, `pause`, `resume` in `useCallback` with empty deps (`[]`). Keep function bodies identical.
- [x] 2.2 Add test in `useAudioPlayer.test.ts`: `renderHook` twice, assert `seek` is `toBe` equal across renders (reference stability). Same for `setVolume`.

## Phase 3: Component Drag Fixes

- [x] 3.1 In `PersistentPlayer.tsx`, add `const seekRef = useRef(seek); seekRef.current = seek;`. Inside the drag `useEffect`, replace `seek` calls with `seekRef.current`. Remove `seek` from deps array (keep `isDragging`, `duration`).
- [x] 3.2 Change volume fill from `bg-[#C8860A]/40` to `bg-[#C8860A]` (full opacity) in the volume bar `div`.
- [x] 3.3 Add volume drag thumb: render a thumb `div` inside volume `div` (same pattern as progress thumb — `w-3 h-3`, positioned with `left`, `cursor-grab`). Add `handleVolumeThumbMouseDown` that calls `setIsDraggingVolume(true)`. Add a second `useEffect` for volume drag with `mousemove`/`mouseup` that calls `setVolume(percent)`, keyed on `isDraggingVolume`.

## Phase 4: Interaction Tests

- [x] 4.1 In `PersistentPlayer.test.tsx`, add seek-click test: set `duration=100`, `progress=0`, mock `seek` from `useAudioPlayer`. Click progress bar at x=50% of width. Assert `seek` called with `50`.
- [x] 4.2 Add volume-click test in same file: set `volume=50`, mock `setVolume`. Click volume bar at x=75% of width. Assert `setVolume` called with `75`.
- [x] 4.3 Add volume drag test in same file: simulate `mousedown` on thumb, `mousemove`, `mouseup`. Assert `setVolume` called with expected values during drag.

## 🔴 Fix: Root Cause — Dual Adapter Instances

- [x] **5.1 Adapter singleton**: `useAudioPlayer()` era llamada desde MarketplacePage y PersistentPlayer, creando DOS adapters diferentes con sus propios `<audio>` elements. MarketplacePage tocaba en Adaptador A, PersistentPlayer intentaba controlar Adaptador B. Fix: módulo singleton (`sharedAdapter`) en `useAudioPlayer.ts`.
- [x] **5.2 Event wiring único**: Los eventos (`onTimeUpdate`, `onLoadedMetadata`, etc.) se conectaban en el `useEffect` de CADA hook, pisándose entre sí. Fix: flag `eventsWired` que solo corre la primera vez, sin `useEffect`.
- [x] **5.3 `isPlaying` en playBeat**: `playBeat` seteaba `currentBeat` y `status` pero nunca `isPlaying`. Al tocar play desde BeatCard, el audio sonaba pero el PersistentPlayer mostraba el botón `play_arrow` (no `pause`). Fix: `usePlayerStore.getState().resumeBeat()` dentro de `onLoadedMetadata`.
- [x] **5.4 `useCallback` en toggleMute**: Faltaba `useCallback` en `toggleMute`, inconsistente con las demás funciones. Fix: envuelta en `useCallback([])`.

## Verification Checklist

- [x] `pnpm test:run` passes all player tests (5 adapter + 5 hook + 8 component = 18 player tests)
- [x] Solo hay UN adapter creado (singleton) compartido entre MarketplacePage y PersistentPlayer
- [x] Los eventos se conectan UNA sola vez, no se sobrescriben entre hooks
- [x] `playBeat` desde BeatCard setea `isPlaying = true` via `onLoadedMetadata` → `resumeBeat()`
- [x] Seek queue test proves pre-metadata seeks are queued and applied
- [x] `useCallback` test proves `seek`/`setVolume` are reference-stable
- [x] Volume fill is visible at full opacity at any volume level (`bg-[#C8860A]` instead of `bg-[#C8860A]/40`)
- [x] Volume bar supports drag-to-scrub (thumb + mouse tracking)
