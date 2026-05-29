## Exploration: issue-47 marketplace UI

### Current State
The marketplace is implemented as a hexagonal frontend feature with `useMarketplace()` loading beats, activities, and releases from a mock repository, and `MarketplacePage` composing shared nav plus marketplace-specific components. The route exists at `#/marketplace`, but the rendered UI does not match `stitch_generated_screen/code.html` pixel-for-pixel: the shell, typography, spacing, component hierarchy, and many visual details differ.

### Affected Areas
- `apps/web/src/App.tsx` — gates and renders the marketplace route; any UI change must preserve auth/email access rules.
- `apps/web/src/routing/routes.ts` — defines `#/marketplace` and route normalization.
- `apps/web/src/ui/shared/components/TopNavBar.tsx` — shared top bar differs from the stitch top bar.
- `apps/web/src/ui/shared/components/SideNavBar.tsx` — shared side nav exists, but the stitch marketplace uses a different layout/behavior.
- `apps/web/src/ui/marketplace/pages/MarketplacePage.tsx` — current marketplace composition and layout.
- `apps/web/src/ui/marketplace/components/*` — hero, search, filters, cards, activity, releases, player, toast all need visual parity work.
- `apps/web/src/ui/marketplace/marketplace.css` — custom scrollbar/grain/pattern helpers; must be compared with stitch overlays.
- `apps/web/index.html` — Tailwind/theme bootstrap and font setup; must support the stitch palette and typography.
- `stitch_generated_screen/code.html` and `stitch_generated_screen/DESIGN.md` — design source of truth.

### Approaches
1. **Rework existing marketplace components to match stitch exactly** — keep the hexagonal data flow, but change the visual composition and Tailwind tokens until the page mirrors the reference.
   - Pros: preserves current architecture and tests; smallest risk to behavior.
   - Cons: many components need coordinated updates; easy to miss tiny spacing/typography differences.
   - Effort: High

2. **Create a stitch-driven marketplace shell and simplify subcomponents** — collapse duplicated shared/feature nav patterns into a marketplace-specific shell that directly mirrors the reference, while keeping hooks/use-cases intact.
   - Pros: closer to the source design; reduces visual drift.
   - Cons: broader refactor surface; risk of duplicating shared nav logic.
   - Effort: High

### Recommendation
Use the existing hexagonal data/model layer, but rebuild the marketplace UI tree to follow `code.html` exactly, component by component, with Tailwind-only styling and no logic changes.

### Risks
- Current shared nav components are not visually aligned with the stitch reference and may need marketplace-specific overrides.
- The project’s active Tailwind theme in `index.html` does not fully match the stitch palette/typography assumptions.
- The issue demands pixel-perfect parity, so small differences in spacing, font loading, shadows, overlays, and responsive behavior are likely to surface during verification.
- PR readiness is blocked because issue #47 is open with only `enhancement`; there is no `status:approved` label.

### Ready for Proposal
No — the issue is understandable and scoped, but it is not approved for branch-pr and still needs visual implementation work plus a design-validation pass.
