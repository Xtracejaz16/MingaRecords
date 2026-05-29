# Proposal: Marketplace UI Parity

## Intent

Achieve pixel-perfect visual parity between the current `#/marketplace` route and the design source of truth in `stitch_generated_screen/code.html`. This addresses visual discrepancies in layout, typography, and component hierarchy while preserving existing data flows.

## Scope

### In Scope
- Rebuilding `MarketplacePage` composition and layout.
- Updating marketplace components (hero, search, filters, cards, activity, releases, player, toast) to match the reference.
- Adapting shared layout components (TopNavBar, SideNavBar) or creating marketplace-specific overrides.
- Syncing Tailwind theme tokens, custom CSS overlays, and fonts to align with the design source.

### Out of Scope
- Modifying underlying hexagonal data models or use cases (`application`/`domain`/`infrastructure`).
- Changes to routing rules or authentication logic.
- New features not present in the reference design.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
None. The change is purely implementation-focused on the UI presentation layer and does not alter spec-level behavioral requirements.

## Approach

Use the existing hexagonal data and model layer (e.g., `useMarketplace()`) but rewrite the UI presentation components. We will perform a component-by-component visual refactor using Tailwind CSS styling to exactly mirror `code.html`. If shared components drift too far from the reference, marketplace-specific overrides will be used to reduce collateral impact.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `apps/web/src/ui/marketplace/pages/MarketplacePage.tsx` | Modified | Core layout composition |
| `apps/web/src/ui/marketplace/components/*` | Modified | Visual refactor of specific sections |
| `apps/web/src/ui/shared/components/*` | Modified | Nav bar alignment |
| `apps/web/index.html` & `marketplace.css` | Modified | Tailwind tokens, typography, overlays |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Impacting non-marketplace views via shared nav changes | Medium | Use marketplace-specific variants if divergence is too large. |
| Missing visual details (spacing, overlays) | High | Conduct side-by-side visual QA against `code.html`. |
| Tailwind theme conflict | Low | Audit theme config against the design specs. |

## Rollback Plan

If UI breaking changes leak or styling becomes unmanageable, revert the branch/PR to the `main` baseline. The use of a feature branch enables simple `git revert` or branch deletion.

## Dependencies

- `stitch_generated_screen/code.html` (Design Reference)

## Success Criteria

- [ ] `#/marketplace` UI matches `code.html` exactly in structure, spacing, typography, and colors.
- [ ] No regression in application data flow or existing tests.
- [ ] UI components strictly adhere to React 19 and Tailwind 4 practices.