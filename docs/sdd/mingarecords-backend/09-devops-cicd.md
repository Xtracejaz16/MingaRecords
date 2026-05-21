# 09 — DevOps, CI/CD y Deployment

> **Versión:** 2.0 — **Fecha:** 19 de mayo de 2026

---

## 9.1 Filosofía DevOps para MVP de 1 Semana

Somos 2 developers con presupuesto $0 y deadline de 1 semana. NO necesitamos 8 workflows, Docker multi-stage, preview environments ni Railway. Necesitamos:

| Principio | Qué significa |
|-----------|--------------|
| **Simple > Completo** | 1 workflow de CI, deploy manual por SSH |
| **1 proceso = 1 deploy** | Modular monolith, no hay servicios separados |
| **PM2 para producción** | Auto-restart, logs, zero config |
| **Secrets en .env** | `.env` en EC2, GitHub Secrets para CI |
| **Rollback = git revert + pm2 restart** | Sin workflows dedicados |

---

## 9.2 Entornos

| Entorno | Cómo se corre | Cuándo |
|---------|--------------|--------|
| **Local** | `pnpm dev` (nodemon) | Desarrollo diario |
| **Producción** | AWS EC2 t2.micro + PM2 | Deploy desde main |

No hay staging, no hay preview environments. Para un MVP de 1 semana, testeamos en local y deployamos a prod con cuidado.

---

## 9.3 CI — GitHub Actions (1 workflow)

Un solo workflow que corre en cada push y PR:

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    name: Lint, Type-Check, Test
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: '9'

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

      - name: Type-Check
        run: pnpm type-check

      - name: Tests
        run: pnpm test
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          JWT_SECRET: ci-test-secret
          MERCADOPAGO_ACCESS_TOKEN: ${{ secrets.MERCADOPAGO_ACCESS_TOKEN }}
          CLOUDFLARE_R2_ACCESS_KEY_ID: ${{ secrets.CLOUDFLARE_R2_ACCESS_KEY_ID }}
          CLOUDFLARE_R2_SECRET_ACCESS_KEY: ${{ secrets.CLOUDFLARE_R2_SECRET_ACCESS_KEY }}
```

**Qué hace:**
- Instala dependencias con caché de pnpm
- Corre ESLint
- Corre TypeScript (`tsc --noEmit`)
- Corre tests con variables de entorno de CI

**Qué NO hace:**
- No builda (el build se hace en EC2)
- No deploya
- No detecta cambios por servicio (es un monolith)
- No sube artifacts ni coverage

---

## 9.4 Deploy a AWS EC2

### Infraestructura

| Recurso | Detalle |
|---------|---------|
| **Proveedor** | AWS EC2 t2.micro (Free Tier — 750h/mes gratis por 12 meses) |
| **OS** | Ubuntu Server 22.04 LTS |
| **Runtime** | Node.js 20 LTS |
| **Process Manager** | PM2 |
| **DB** | Supabase (PostgreSQL) — externo |
| **Storage** | Cloudflare R2 — externo |
| **Pagos** | MercadoPago — externo |

### Setup inicial de EC2 (una sola vez)

```bash
# Conectar por SSH
ssh -i ~/.ssh/mingarecords.pem ubuntu@<EC2_PUBLIC_IP>

# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar pnpm
corepack enable
corepack prepare pnpm@9 --activate

# Instalar PM2 global
sudo npm install -g pm2

# Clonar el repo
git clone https://github.com/<org>/mingarecords.git ~/app
cd ~/app

# Instalar dependencias de producción
pnpm install --prod

# Build
pnpm build

# Copiar .env (crear manualmente en EC2)
nano .env

# Iniciar con PM2
pm2 start dist/app.js --name mingarecords

# Guardar configuración de PM2 (arranca en reboot)
pm2 save
pm2 startup
```

### Script de deploy (reutilizable)

```bash
#!/bin/bash
# scripts/deploy.sh
# Ejecutar desde local: bash scripts/deploy.sh

EC2_USER="ubuntu"
EC2_HOST="<EC2_PUBLIC_IP>"
SSH_KEY="~/.ssh/mingarecords.pem"

echo "🚀 Deploying MingaRecords..."

ssh -i "$SSH_KEY" "$EC2_USER@$EC2_HOST" 'bash -s' << 'EOF'
  cd ~/app
  git pull origin main
  pnpm install --prod
  pnpm build
  pm2 restart mingarecords
  echo "✅ Deploy complete"
EOF
```

### Deploy con GitHub Actions (opcional)

Si querés automatizar el deploy sin SSH manual:

```yaml
# .github/workflows/deploy.yml
name: Deploy to EC2

on:
  push:
    branches: [main]

jobs:
  deploy:
    name: Deploy
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ubuntu
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd ~/app
            git pull origin main
            pnpm install --prod
            pnpm build
            pm2 restart mingarecords
```

---

## 9.5 Variables de Entorno

### En EC2 (archivo `.env`)

```env
# Server
NODE_ENV=production
PORT=3000

# Supabase (PostgreSQL)
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/postgres

# JWT
JWT_SECRET=<generar-con-openssl-rand-base64-48>

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=<token>
MERCADOPAGO_WEBHOOK_SECRET=<secret>

# Cloudflare R2
CLOUDFLARE_R2_ACCESS_KEY_ID=<access_key>
CLOUDFLARE_R2_SECRET_ACCESS_KEY=<secret_key>
CLOUDFLARE_R2_BUCKET=mingarecords
CLOUDFLARE_R2_ENDPOINT=<endpoint_url>

# App
APP_URL=https://<tu-dominio-o-ip>
```

### En GitHub Secrets (para CI)

| Secret | Uso |
|--------|-----|
| `DATABASE_URL` | Tests en CI |
| `JWT_SECRET` | Tests en CI |
| `MERCADOPAGO_ACCESS_TOKEN` | Tests en CI |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | Tests en CI |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | Tests en CI |
| `EC2_HOST` | Deploy workflow (si se usa) |
| `EC2_SSH_KEY` | Deploy workflow (si se usa) |

---

## 9.6 Health Check

El monolith expone un endpoint de salud:

```
GET /health → 200 OK
{
  "status": "ok",
  "service": "mingarecords",
  "version": "1.0.0",
  "uptime": 12345,
  "checks": {
    "database": "connected"
  }
}
```

PM2 puede usarlo para auto-restart si la app se queda colgada:

```bash
# En ecosystem.config.js
module.exports = {
  apps: [{
    name: 'mingarecords',
    script: 'dist/app.js',
    max_memory_restart: '256M',  // t2.micro tiene 1GB RAM
  }]
}
```

---

## 9.7 Rollback Simple

Si algo sale mal en producción:

```bash
# Opción 1: SSH manual
ssh -i ~/.ssh/mingarecords.pem ubuntu@<EC2_PUBLIC_IP>
cd ~/app
git revert HEAD          # o git checkout <commit-anterior>
pnpm install --prod
pnpm build
pm2 restart mingarecords

# Opción 2: PM2 rollback (si usás PM2 deploy)
pm2 deploy production revert 1
```

Con un monolith y deploys infrecuentes (MVP), un `git revert` + restart es suficiente. No hace falta un workflow dedicado.

---

## 9.8 PM2 — Process Manager

### Por qué PM2

- Auto-restart en crash
- Logs centralizados (`pm2 logs`)
- Zero-downtime restart (`pm2 reload`)
- Startup script (arranca en reboot de EC2)
- Monitor de memoria (`pm2 monit`)

### Comandos útiles

```bash
pm2 status              # Ver estado de procesos
pm2 logs mingarecords   # Ver logs en vivo
pm2 restart mingarecords # Restart
pm2 reload mingarecords  # Zero-downtime reload
pm2 monit               # Monitor en tiempo real
pm2 save                # Guardar lista de procesos
```

### ecosystem.config.js

```js
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'mingarecords',
    script: 'dist/app.js',
    instances: 1,         // t2.micro = 1 vCPU, no tiene sentido cluster
    exec_mode: 'fork',
    max_memory_restart: '256M',
    env_production: {
      NODE_ENV: 'production',
    },
  }]
}
```

---

## 9.9 Resumen

| Aspecto | Solución |
|---------|----------|
| **CI** | 1 workflow GitHub Actions (lint + type-check + test) |
| **Deploy** | SSH a EC2 + git pull + pnpm build + PM2 restart |
| **Proceso** | PM2 (auto-restart, logs, startup) |
| **Infra** | AWS EC2 t2.micro (Free Tier) |
| **DB** | Supabase (externo) |
| **Storage** | Cloudflare R2 (externo) |
| **Pagos** | MercadoPago (externo) |
| **Secrets** | `.env` en EC2, GitHub Secrets para CI |
| **Rollback** | `git revert` + `pm2 restart` |
| **Health** | `GET /health` + PM2 `max_memory_restart` |

**Tiempo total de deploy**: ~2 minutos (git pull + install + build + restart).
**Costo infra**: $0 (AWS Free Tier + Supabase free + R2 free tier + MercadoPago sin costo fijo).
