# Deploy — Backend (Railway)

O backend do Comprei roda no [Railway](https://railway.app) via Nixpacks. O deploy é automático a cada push para `main` via GitHub Actions.

---

## Setup Inicial (uma única vez)

### 1. Criar projeto no Railway

1. Acesse [railway.app](https://railway.app) → **New Project**
2. Selecione **Deploy from GitHub repo** → `carlosrbj/comprei-app`
3. Configure o **Root Directory**: `apps/backend`
4. Railway detecta `nixpacks.toml` automaticamente

### 2. Adicionar PostgreSQL

No projeto Railway:
1. **+ New** → **Database** → **PostgreSQL**
2. O Railway injeta `DATABASE_URL` automaticamente nas variáveis de ambiente

### 3. Configurar variáveis de ambiente

Em **Settings → Variables**, adicionar:

```
JWT_SECRET=<gere com: openssl rand -base64 32>
NODE_ENV=production
PORT=3000
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
EXPO_ACCESS_TOKEN=<token do Expo para push notifications>
```

> `DATABASE_URL` é injetada automaticamente pelo PostgreSQL plugin — não precisa configurar manualmente.

### 4. Obter credenciais para CI/CD

Para o deploy automático via GitHub Actions:

1. **Railway Token:** Account Settings → Tokens → **New Token**
2. **Service ID:** Seu projeto → Service → Settings → copiar o ID

Salvar em **GitHub → Settings → Secrets → Actions**:
- `RAILWAY_TOKEN` = token gerado
- `RAILWAY_SERVICE_ID` = ID do service

---

## Arquivos de Configuração

### `apps/backend/railway.toml`
```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "node dist/main"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 5
```

### `apps/backend/nixpacks.toml`
Instala Google Chrome (necessário para o Puppeteer scraping da SEFAZ).

---

## Deploy Manual (emergência)

```bash
npm install -g @railway/cli
railway login
cd apps/backend
railway up --service <service-id>
```

---

## Migrations em Produção

As migrations do Prisma **não rodam automaticamente**. Após mudanças no schema:

```bash
# Via Railway CLI
railway run npx prisma migrate deploy --service <service-id>

# Ou conectar via Railway shell
railway shell
npx prisma migrate deploy
```

---

## Monitoramento

- **Logs:** Railway dashboard → Deployments → Ver logs em tempo real
- **Métricas:** Railway dashboard → Metrics (CPU, memória, requests)
- **Health check:** `GET /` retorna `{ "status": "ok" }`
