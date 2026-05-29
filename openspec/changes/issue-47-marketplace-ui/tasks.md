# Tasks: Marketplace UI Parity

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 350-500 |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (theme + nav) → PR 2 (components) |
| Delivery strategy | ask-always |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Theme tokens + marketplace nav shells | PR 1 | Foundation; no behavior changes |
| 2 | Component visual rewrite + page composition | PR 2 | Depends on PR 1; bulk of visual work |

## Phase 1: Theme & Foundation

- [ ] 1.1 Add stitch design tokens to `apps/web/index.html` (surface palette, typography, font imports)
- [ ] 1.2 Create `apps/web/src/ui/marketplace/components/TopNavBar.tsx` matching stitch reference
- [ ] 1.3 Create `apps/web/src/ui/marketplace/components/SideNavBar.tsx` matching stitch reference
- [ ] 1.4 Update `apps/web/src/ui/marketplace/marketplace.css` grain/pattern/scrollbar utilities

## Phase 2: Component Visual Rewrite

- [ ] 2.1 Rewrite `HeroHeader.tsx` layout and typography to match stitch hero
- [ ] 2.2 Rewrite `SearchBar.tsx` input styling to match stitch search
- [ ] 2.3 Rewrite `GenreFilterChips.tsx` chip styling to match stitch filters
- [ ] 2.4 Rewrite `BeatCard.tsx` card layout, overlay, and typography to match stitch
- [ ] 2.5 Rewrite `ActivityCard.tsx` card styling to match stitch activity
- [ ] 2.6 Rewrite `ReleaseList.tsx` list styling to match stitch releases
- [ ] 2.7 Rewrite `PersistentPlayer.tsx` player bar to match stitch player
- [ ] 2.8 Rewrite `ToastNotification.tsx` toast styling to match stitch toast

## Phase 3: Page Composition

- [ ] 3.1 Update `MarketplacePage.tsx` imports to use marketplace-specific nav
- [ ] 3.2 Update `MarketplacePage.tsx` section layout and spacing to match stitch
- [ ] 3.3 Verify responsive behavior (grid cols, nav collapse)

## Phase 4: Verification

- [ ] 4.1 Run `pnpm test:run` — all existing tests pass
- [ ] 4.2 Run `pnpm build` — no TypeScript or Tailwind errors
- [ ] 4.3 Side-by-side visual QA with `stitch_generated_screen/code.html`
