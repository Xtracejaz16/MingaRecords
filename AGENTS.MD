# Code Review Rules

## TypeScript
- Use strict typing, no `any`.
- Prefer interfaces for object shapes.
- Keep imports explicit and remove unused symbols.

## React
- Use functional components and hooks.
- Keep components visual-only when possible.
- Avoid synchronous state updates inside effects unless they come from external subscriptions.

## Hexagonal Frontend
- `domain` must not import `ui` or `infrastructure`.
- `application` must depend only on `domain`.
- `infrastructure` implements ports from `domain`.
- `ui` consumes hooks and must not call adapters directly.

## General
- Keep files and folders aligned with actual usage.
- Prefer small, clear modules over large orchestration files.
