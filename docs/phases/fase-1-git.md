# FASE 1 — Organização Git e Estrutura do Repositório

**Status:** ✅ Concluída em 20/02/2026
**Commit:** `716e9ac`

---

## Objetivo

Transformar o projeto de sub-repos desconexos em um monorepo público bem estruturado no GitHub, com segurança garantida (sem secrets no histórico git).

---

## Contexto Antes

- `apps/mobile/.git` — 1 commit local, sem remote
- `apps/backend/.git` — 0 commits, sem remote
- Raiz (`comprei-app/`) — SEM `.git`
- Nenhum `.gitignore` na raiz
- README genérico (ainda nomeava o projeto "GastoZero")

---

## O Que Foi Feito

### 1. Git inicializado na raiz
- Deletados `.git` de `apps/mobile` e `apps/backend`
- `git init` na raiz + branch renomeada para `main`

### 2. `.gitignore` raiz criado
Cobre: `node_modules/`, `dist/`, `.env`, `.expo/`, iOS/Android builds, `credentials/`, Prisma generated, Puppeteer cache, `.claude/`, `.mcp.json`, `credentials.json`

### 3. Segredos detectados e bloqueados
| Arquivo | Conteúdo sensível |
|---------|-------------------|
| `apps/backend/.env` | DATABASE_URL, JWT_SECRET |
| `apps/mobile/credentials/comprei.keystore` | Keystore Android |
| `apps/mobile/credentials.json` | Senhas do keystore (detectado no staging) |
| `.mcp.json` | API token Hostinger + Supabase project ref |

### 4. Arquivos criados
| Arquivo | Descrição |
|---------|-----------|
| `.gitignore` (raiz) | Cobertura completa do monorepo |
| `README.md` | Profissional: features, stack, setup, variáveis |
| `LICENSE` | MIT 2026 |
| `CONTRIBUTING.md` | Fork/branch/commit guide (Conventional Commits) |
| `apps/backend/.env.example` | Template de variáveis sem valores reais |

### 5. Push para GitHub
- Repositório: `https://github.com/carlosrbj/comprei-app`
- 178 arquivos no primeiro commit
- Branch `main` rastreando `origin/main`

---

## Arquivos Chave

```
.gitignore                         # Raiz — regras do monorepo
README.md                          # Raiz — documentação principal
LICENSE                            # MIT 2026
CONTRIBUTING.md                    # Guia de contribuição
apps/backend/.env.example          # Template de variáveis de ambiente
apps/mobile/.gitignore             # Atualizado com credentials/
```

---

## Lições Aprendidas

- `credentials.json` no mobile continha senhas do keystore — detectado durante `git status` antes do staging (nunca usar `git add .` cegamente em repos novos)
- `.mcp.json` continha tokens de API de produção — deve sempre estar no `.gitignore` de projetos Claude Code
- `.claude/` com transcripts de sessões deve também ser ignorado em repos públicos
