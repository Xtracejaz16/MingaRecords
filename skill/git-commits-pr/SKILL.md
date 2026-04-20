---
name: git-commits-pr
description: >
  Guía para crear commits y Pull Requests profesionales siguiendo Conventional Commits.
  Trigger: Cuando el usuario pida hacer un commit, abrir un PR, o pregunte sobre 
  el formato de mensajes de git. También cuando se detecte una migración de tecnología.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## When to Use

Use this skill when:
- El usuario pide hacer un commit
- El usuario quiere abrir o crear un PR
- Se detectan cambios que implican migración de tecnología (librerías, frameworks, ORMs)
- El usuario pregunta por convenciones de git en el proyecto

---

## Critical Patterns

### Formato de Commit (Conventional Commits)
<tipo>(<scope>): <descripción en imperativo, máx 72 chars>

[cuerpo opcional: QUÉ y POR QUÉ]

[footer: Closes #N | BREAKING CHANGE: descripción]

Tipos válidos: feat | fix | docs | style | refactor | test | chore | perf | revert
- Usar "!" para breaking changes: feat!: rediseño de API
- Sin punto final en la primera línea
- Descripción en imperativo ("agregar", no "agregué")

### Nombre de Ramas
feat/descripcion-corta
fix/nombre-del-bug
chore/tarea
refactor/modulo-afectado
hotfix/error-critico
style/que-se-cambia

---

## Decision Tree
¿Es migración de tecnología?     → Usar template PR de migración (ver abajo)
¿Hay breaking changes?           → Agregar "!" y BREAKING CHANGE en footer
¿PR tiene más de 400 líneas?     → Sugerir dividir en PRs más pequeños
¿Es fix urgente en producción?   → Rama hotfix/, merge directo a main
Otherwise                        → Template PR estándar

---

## Code Examples

### Commits estándar
feat(auth): agregar login con Google OAuth
fix(api): corregir timeout en peticiones mayores a 30s
docs(readme): actualizar instrucciones de instalación
chore(deps): actualizar dependencias a versiones estables
refactor(db): extraer lógica de queries a repositorio

### Template PR estándar
## 📋 Descripción
[Qué se hizo y en qué área]

## 🎯 Motivación
[Por qué era necesario este cambio]

## 📦 Cambios principales
- [ ] [cambio 1]
- [ ] [cambio 2]

## 🧪 Cómo probar
1. [paso 1]
2. [paso 2]

## ⚠️ Breaking Changes
[Si no hay, escribir "Ninguno"]

## 📚 Referencias
[Issues, links, docs o "N/A"]

### Template PR de migración (agregar además del estándar)
## 🔁 Estrategia de migración
[big bang / gradual / feature flag — explicar cuál y por qué]

## 🔄 Plan de rollback
1. [paso para revertir en producción]
2. [variable de entorno o commit a revertir]

## 📊 Comparativa
| | Antes | Después |
|---|---|---|
| [métrica 1] | | |
| [métrica 2] | | |

---

## Commands
```bash
git checkout -b feat/nombre-rama        # crear rama nueva
git add .                               # stagear cambios
git commit -m "feat(scope): descripción" # commit con formato
git push origin feat/nombre-rama        # subir rama
gh pr create --title "feat: título" --body "$(cat .github/pull_request_template.md)"  # abrir PR
```

---

## Resources

- **Templates**: Ver assets/ para plantillas de PR en markdown
- **Conventional Commits**: https://www.conventionalcommits.org
