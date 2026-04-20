# AGENTS.md

Guía de referencia para el agente. Define las skills disponibles, cuándo activarlas y cómo opera el sistema.

---

## ¿Qué son las Skills?

Las skills son instrucciones especializadas que el agente carga automáticamente según el contexto de la tarea. Cada skill contiene patrones críticos, ejemplos de código y reglas del proyecto para un dominio específico.

**Regla general:** Si la tarea encaja con el dominio de una skill — aunque el usuario no la mencione explícitamente — cargarla y seguirla.

---

## Skills disponibles

| Skill | Dominio | Cuándo activar | Archivo |
|---|---|---|---|
| `git-commits-pr` | Git, commits, pull requests | Usuario dice "commit", "PR", "sube los cambios", "push", o termina de implementar cualquier feature/fix | [SKILL.md](skill/git-commits-pr/SKILL.md) |
| `hexagonal-frontend` | Arquitectura React + TypeScript | Usuario pide crear un módulo, feature, pantalla o pregunta cómo organizar código frontend | [SKILL.md](skill/hexagonal-frontend/SKILL.MD) |
| `playwright` | Testing E2E | Usuario pide tests, E2E, o menciona Playwright | [SKILL.md](skill/playwright/SKILL.md) |
| `pr-review` | Code review de PRs | Usuario comparte una URL de PR o pide revisar un PR | [SKILL.md](skill/pr-review/SKILL.md) |
| `react-19` | Componentes React | Cualquier componente React — no usar `useMemo`/`useCallback` manual | [SKILL.md](skill/react-19/SKILL.md) |
| `tailwind-4` | Estilos CSS | Cualquier tarea de estilos con Tailwind — nunca `var()` en className | [SKILL.md](skill/tailwind-4/SKILL.md) |
| `typescript` | Tipos TypeScript | Cualquier código TypeScript — const types, interfaces planas, sin `any` | [SKILL.md](skill/typescript/SKILL.md) |
| `zod-4` | Validación de schemas | Usuario usa Zod para validar datos o formularios | [SKILL.md](skill/zod-4/SKILL.md) |
| `zustand-5` | Estado global React | Usuario maneja estado global con Zustand | [SKILL.md](skill/zustand-5/SKILL.md) |
| `skill-creator` | Crear nuevas skills | Usuario pide crear, editar o mejorar una skill | [SKILL.md](skill/skill-creator/SKILL.md) |

---

## Reglas de activación

### Skills que siempre aplican en este proyecto

Estas skills deben estar activas en **cualquier tarea de desarrollo frontend**, sin excepción:

- **`typescript`** — Todo el código es TypeScript. Sin `any`, const types, interfaces planas.
- **`react-19`** — Todo componente React usa React 19. Sin `useMemo`/`useCallback` manual.
- **`tailwind-4`** — Todo el styling usa Tailwind 4. Sin `var()` en className, sin hex colors.

### Skills que se activan por contexto

| Si el usuario... | Activar |
|---|---|
| Termina de implementar algo (feature, fix, refactor) | `git-commits-pr` |
| Dice "commit", "PR", "push", "sube los cambios" | `git-commits-pr` |
| Comparte una URL de GitHub con `/pull/` | `pr-review` |
| Pide crear un módulo, login, registro, lista, carrito, pagos | `hexagonal-frontend` |
| Pregunta cómo organizar carpetas o separar lógica de UI | `hexagonal-frontend` |
| Pide escribir tests o menciona Playwright | `playwright` |
| Usa Zod en un schema o formulario | `zod-4` |
| Usa Zustand para estado global | `zustand-5` |
| Pide crear o mejorar una skill | `skill-creator` |

### Combinaciones frecuentes

Algunas tareas activan múltiples skills a la vez:

- **Crear un módulo nuevo** → `hexagonal-frontend` + `typescript` + `react-19` + `tailwind-4`
- **Crear formulario con validación** → `hexagonal-frontend` + `zod-4` + `react-19` + `tailwind-4`
- **Terminar un feature** → `git-commits-pr` (proponer commit + PR automáticamente)
- **Escribir tests E2E** → `playwright` + `typescript`
- **Revisar código de otro** → `pr-review`

---

## Comportamiento esperado al terminar cambios

Cuando se complete cualquier tarea de desarrollo (feature, fix, refactor, etc.), el agente debe **proponer automáticamente** el commit y PR correspondientes siguiendo la skill `git-commits-pr`, sin esperar a que el usuario lo solicite explícitamente.

Flujo obligatorio:
```
Terminar implementación → Analizar cambios → Proponer commit con Conventional Commits → Proponer PR con template correcto
```

---

## Agregar nuevas skills

Al crear una nueva skill con `skill-creator`, registrarla en la tabla de arriba:

```markdown
| `nombre-skill` | Dominio breve | Cuándo activarla | [SKILL.md](skill/nombre-skill/SKILL.md) |
```
