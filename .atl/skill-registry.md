# Skill Registry — MingaRecords

Updated: 2026-05-11 | SDD Init

## Project Conventions

### AGENTS.md (project root)
- **TypeScript**: Strict typing, no `any`, prefer interfaces, explicit imports, remove unused.
- **React**: Functional components + hooks. Keep components visual-only. No synchronous state updates inside effects.
- **Hexagonal Frontend**: `domain` → no deps; `application` → only `domain`; `infrastructure` → implements `domain` ports; `ui` → consumes hooks, never calls adapters directly.
- **General**: Small clear modules. File/folder alignment.
- **Conventional Commits** with Spanish-scoped, Colombian-themed codebase.

### Architecture
- Hash-based routing (no React Router). Routes defined in `src/routing/routes.ts`.
- Colombian indigenous theming: Muisca, Tairona, Kogui, Zenú, Embera, Wayuu cultures.
- ADRs live in `docs/decisions/`.
- UI language: Spanish.

---

## Always-Active Skills (mandatory on every frontend task)

| Skill | Source | Rules |
|-------|--------|-------|
| `typescript` | user (`~/.config/opencode/skills/typescript/`) | Const types first (`STATUS = {...} as const` → `type Status = (typeof STATUS)[keyof...]`), flat interfaces, branded types for IDs, strict null checks. No `any`, no `as` casts except for JSON. |
| `react-19` | **project** (`skill/react-19/`) | React Compiler NOT configured — useMemo/useCallback still needed for expensive computations. Named imports only. `ref` as prop (no forwardRef). |
| `tailwind-4` | user (`~/.config/opencode/skills/tailwind-4/`) | Never `var()` in className. Use `cn()` for conditional classes. Theme colors via Tailwind config, not inline hex. |

**Note**: Tailwind v4 is installed (devDep) but the project uses Tailwind CDN in `index.html` for runtime utility classes. The build pipeline uses PostCSS + Autoprefixer. Custom CSS classes with Colombian-themed design tokens coexist with CDN-provided Tailwind utilities.

## Context-Activated Skills

| Skill | Source | Trigger | Key Rules |
|-------|--------|---------|-----------|
| `hexagonal-frontend` | **project** (`skill/hexagonal-frontend/`) | Crear módulo, feature, pantalla, o preguntar arquitectura | `domain → application → infrastructure → ui`. Siempre en este orden. El hook es el ÚNICO lugar donde se inyecta el adaptador. Mock hoy, API mañana: cambiar una línea. |
| `git-commits-pr` | user (`~/.config/opencode/skills/git-commits-pr/`) | Commit, PR, push, o terminar feature | Conventional Commits: `tipo(scope): descripción`. Scope en español por módulo. Cuerpo: QUÉ y POR QUÉ. |
| `pr-review` | user (`~/.config/opencode/skills/pr-review/`) | URL de PR o "revisar PR" | Review humano, directo, concreto. Señalar problemas con evidencia. |
| `playwright` | user (`~/.config/opencode/skills/playwright/`) | Tests E2E o "Playwright" | MCP workflow primero si disponible. Page Objects, selectores data-testid. |
| `zod-4` | user (`~/.config/opencode/skills/zod-4/`) | Validación con Zod | Zod 4 breaking changes: `z.email()` no `z.string().email()`, `z.uuid()`, `z.url()`. Schemas como valores, no tipos. |
| `zustand-5` | user (`~/.config/opencode/skills/zustand-5/`) | Estado global con Zustand | `create<T>()` con interface explícita. Stores pequeños por dominio. No middleware anidado. |
| `branch-pr` | user (`~/.config/opencode/skills/branch-pr/`) | Crear PR | Issue-first: verificar que existe issue antes del PR. Template correcto, descripción clara. |
| `chained-pr` | user (`~/.config/opencode/skills/chained-pr/`) | PR > 400 líneas, stacked PRs | Dividir en slices revisables. Cada PR compila y pasa tests independientemente. |
| `work-unit-commits` | user (`~/.config/opencode/skills/work-unit-commits/`) | Planear commits, splitting | Commits como unidades de review atómicas. Tests + docs viajan con el código. |
| `issue-creation` | user (`~/.config/opencode/skills/issue-creation/`) | Crear issues | Issue-first: template claro, scope definido, acceptance criteria. |
| `cognitive-doc-design` | user (`~/.config/opencode/skills/cognitive-doc-design/`) | READMEs, RFCs, docs | Reducir carga cognitiva. Jerarquía clara. Menos es más. |
| `comment-writer` | user (`~/.config/opencode/skills/comment-writer/`) | Feedback en PR, issues, replies | Cálido, directo, colaborativo. Sin pasivo-agresivo. |
| `judgment-day` | user (`~/.config/opencode/skills/judgment-day/`) | "judgment day", "juzgar" | Dual review a ciegas, corregir issues, re-juzgar. |
| `skill-creator` | **project** (`skill/skill-creator/`) | Crear/editar skills | LLM-first: frontmatter, activation contract, hard rules, decision gates, output contract. Target 180-450 tokens. |

## SDD Workflow Skills (available, loaded by orchestrator)

| Skill | Source | Trigger |
|-------|--------|---------|
| `sdd-init` | user | Inicializar contexto SDD |
| `sdd-explore` | user | Explorar codebase antes de cambios |
| `sdd-propose` | user | Crear propuesta de cambio |
| `sdd-spec` | user | Escribir delta specs |
| `sdd-design` | user | Diseño técnico y arquitectura |
| `sdd-tasks` | user | Desglose en tareas de implementación |
| `sdd-apply` | user | Implementar tareas |
| `sdd-verify` | user | Verificar implementación |
| `sdd-archive` | user | Archivar cambio completado |
| `sdd-onboard` | user | Walkthrough del ciclo SDD completo |
| `skill-registry` | user | Actualizar registro de skills |

## Not Loaded / Not Relevant

| Skill | Reason |
|-------|--------|
| `go-testing` | Go-specific. MingaRecords es TypeScript/React. |

## Style Patterns (extracted from codebase)

- CSS: Custom class-based design system (`page-shell`, `topbar`, `stone-tablet`, `wayuu-diamond-border`, `mineral-grain`), NOT Tailwind utility classes in JSX.
- Colors: Semantic tokens (`obsidian`, `muiscaGold`, `taironaTerracotta`, `koguiCream`, etc.) defined in both `tailwind.config.js` and `index.html` CDN config.
- Fonts: Cinzel (headings), Crimson Pro (body), loaded via Google Fonts.
- Theme: Dark, earthy, pre-Columbian Colombian aesthetic. No rounded corners (`border-radius: 0` on buttons). Gold/terracotta accents.
