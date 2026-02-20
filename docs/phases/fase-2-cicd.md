# FASE 2 — CI/CD e Deploy Infrastructure

**Status:** ✅ Concluída em 20/02/2026

---

## Objetivo

Automatizar qualidade de código e deploy para garantir que `main` sempre contenha código válido e que o backend seja publicado automaticamente no Railway a cada push aprovado.

---

## Arquitetura

```
Push / PR para main
       │
       ├─► GitHub Actions: ci.yml
       │       ├─ Backend: lint + typecheck + tests
       │       └─ Mobile: typecheck
       │
       └─► (se push para main) GitHub Actions: deploy-backend.yml
               └─ Railway CLI → redeploy backend
```

---

## Arquivos Criados

| Arquivo | Propósito |
|---------|-----------|
| `.github/workflows/ci.yml` | CI em PRs e pushes para main |
| `.github/workflows/deploy-backend.yml` | Deploy automático Railway |
| `.github/pull_request_template.md` | Template de PR |
| `docs/deploy/railway.md` | Guia de setup Railway |
| `docs/deploy/eas.md` | Guia de build mobile |

---

## Secrets configurados no GitHub

Configurados via Railway GraphQL API + GitHub REST API (libsodium).

| Secret | Valor |
|--------|-------|
| `RAILWAY_TOKEN` | Project Token gerado via Railway API (não session token) |
| `RAILWAY_SERVICE_ID` | `adedf5aa-2534-488a-a330-d61779157d7e` |

> **Nota técnica:** O `RAILWAY_TOKEN` deve ser um **Project Token** gerado via `projectTokenCreate` mutation GraphQL — tokens de sessão interativa (`rw_Fe26.*`) não funcionam em CI.

---

## CI Workflow — O que verifica

### Backend (`apps/backend`)
1. `npm run lint` — ESLint com regras TypeScript
2. `npx tsc --noEmit` — Typecheck sem emitir arquivos
3. `npm test` — Jest unit tests (sem banco — mocks)

### Mobile (`apps/mobile`)
1. `npx tsc --noEmit` — Typecheck do React Native / Expo

---

## Deploy Railway — Fluxo

1. Push chega em `main` com mudanças em `apps/backend/**`
2. GitHub Actions instala Railway CLI
3. `railway up --detach --service <SERVICE_ID>` faz upload do código
4. Railway builda via Nixpacks (usando `nixpacks.toml`)
5. Railway executa `node dist/main` (via `railway.toml`)

---

## Mobile — Deploy Manual (EAS)

Mobile não tem deploy automático — builds são disparados manualmente:

```bash
# Preview (APK interno para testes)
cd apps/mobile
eas build --profile preview --platform android

# Produção
eas build --profile production --platform android
```

Ver guia completo em [docs/deploy/eas.md](../deploy/eas.md).
