# Design: Marketplace UI Parity

## Technical Approach

Rewrite the marketplace UI tree to mirror `stitch_generated_screen/code.html` exactly, component by component, using Tailwind CSS only. The existing hexagonal data layer (`useMarketplace()`, domain entities, mock repositories) remains untouched. We modify only the presentation layer: `MarketplacePage`, its child components, shared nav overrides, and global theme tokens.

## Architecture Decisions

### Decision: Marketplace-specific shell vs. modifying shared nav

**Choice**: Create marketplace-specific `TopNavBar` and `SideNavBar` inside `src/ui/marketplace/components/` rather than modifying the shared versions.

**Alternatives considered**: Modify shared `TopNavBar`/`SideNavBar` directly.

**Rationale**: Shared nav is used by dashboard, auth, and other routes. Modifying it risks breaking those views. Marketplace-specific overrides keep the blast radius contained.

### Decision: CSS tokens approach

**Choice**: Extend the existing Tailwind theme in `apps/web/index.html` with stitch design tokens (surface hierarchy, typography, colors) rather than replacing the whole theme.

**Alternatives considered**: Replace the entire Tailwind config with stitch tokens.

**Rationale**: The existing theme is used by non-marketplace routes. A surgical extension adds stitch tokens without breaking existing consumers.

### Decision: Component granularity

**Choice**: Keep the existing component decomposition (HeroHeader, SearchBar, GenreFilterChips, BeatCard, ActivityCard, ReleaseList, PersistentPlayer, ToastNotification) and rewrite each to match stitch.

**Alternatives considered**: Collapse into fewer monolithic components.

**Rationale**: The current decomposition maps cleanly to stitch sections. Rewriting each independently allows incremental visual QA and reduces merge conflict risk.

## Data Flow

```
MarketplacePage (orchestrator)
  ├── useMarketplace() → beats, activities, releases
  ├── useUIStore() → search, genre, favorites
  ├── useAudioPlayer() → playback
  └── renders:
        TopNavBar (marketplace-specific)
        SideNavBar (marketplace-specific)
        HeroHeader
        SearchBar + GenreFilterChips
        BeatCard grid
        ActivityCard grid
        ReleaseList
        PersistentPlayer
        ToastNotification
```

No data flow changes. Only visual markup and Tailwind classes change per component.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `apps/web/index.html` | Modify | Add stitch design tokens (surface palette, typography, font imports) |
| `apps/web/src/ui/marketplace/components/TopNavBar.tsx` | Create | Marketplace-specific top nav matching stitch reference |
| `apps/web/src/ui/marketplace/components/SideNavBar.tsx` | Create | Marketplace-specific sidebar matching stitch reference |
| `apps/web/src/ui/marketplace/components/HeroHeader.tsx` | Modify | Rewrite layout/typography to match stitch hero |
| `apps/web/src/ui/marketplace/components/SearchBar.tsx` | Modify | Rewrite input styling to match stitch search |
| `apps/web/src/ui/marketplace/components/GenreFilterChips.tsx` | Modify | Rewrite chip styling to match stitch filters |
| `apps/web/src/ui/marketplace/components/BeatCard.tsx` | Modify | Rewrite card layout, overlay, typography to match stitch |
| `apps/web/src/ui/marketplace/components/ActivityCard.tsx` | Modify | Rewrite card styling to match stitch activity |
| `apps/web/src/ui/marketplace/components/ReleaseList.tsx` | Modify | Rewrite list styling to match stitch releases |
| `apps/web/src/ui/marketplace/components/PersistentPlayer.tsx` | Modify | Rewrite player bar to match stitch player |
| `apps/web/src/ui/marketplace/components/ToastNotification.tsx` | Modify | Rewrite toast styling to match stitch toast |
| `apps/web/src/ui/marketplace/pages/MarketplacePage.tsx` | Modify | Update imports, layout, and section composition |
| `apps/web/src/ui/marketplace/marketplace.css` | Modify | Update grain/pattern/scrollbar utilities to match stitch |

## Interfaces / Contracts

No new interfaces. All changes are within existing component props and Tailwind class names. Domain entities (`Beat`, `Activity`, `Release`) and use cases remain unchanged.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Component renders without crash | Vitest + @testing-library/react |
| Visual | Side-by-side comparison with `code.html` | Manual QA per component |
| Regression | Existing marketplace tests pass | `pnpm test:run` |
| Build | No TypeScript or Tailwind errors | `pnpm build` |

## Migration / Rollout

No migration required. All changes are additive visual refactors within the existing route and data flow. Feature branch enables safe revert if needed.

## Open Questions

- [ ] Should the marketplace use a completely separate Tailwind config or extend the existing one?
- [ ] Font loading: are Cinzel and Crimson Pro already loaded, or do we need to add Google Fonts imports?
