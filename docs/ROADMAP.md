# Comprei App — Roadmap de Implementação

Plano completo de desenvolvimento organizado em fases sequenciais. Cada fase tem seu próprio documento detalhado em `docs/phases/`.

---

## Visão Geral

| Fase | Título | Status | Documento |
|------|--------|--------|-----------|
| 1 | Organização Git e Estrutura do Repositório | ✅ Concluída | [fase-1-git.md](phases/fase-1-git.md) |
| 2 | CI/CD e Deploy Infrastructure | ✅ Concluída | [fase-2-cicd.md](phases/fase-2-cicd.md) |
| 3 | Comparador de Preços entre Lojas | 📋 Planejada | [fase-3-comparador.md](phases/fase-3-comparador.md) |
| 4 | Modo Família | 📋 Planejada | [fase-4-familia.md](phases/fase-4-familia.md) |
| 5 | Inflação Pessoal e Previsão de Gastos | 📋 Planejada | [fase-5-inflacao.md](phases/fase-5-inflacao.md) |

---

## Backlog de Features por Prioridade

### P0 — Core (implementado)
- ✅ Leitura de QR Code / NF-e (scanner real SEFAZ + 27 UFs)
- ✅ Auth (login, registro, JWT)
- ✅ CRUD de notas fiscais
- ✅ Preview de itens antes de salvar

### P1 — Diferenciação (maioria implementada)
- ✅ Navegação por Bottom Tabs
- ✅ Design System "Fresh Finance"
- ✅ Dashboard mensal de gastos
- ✅ Tela de Histórico com filtros
- ✅ Tela de Relatórios (donut, barras, tendência)
- ✅ Tela de Perfil
- ✅ Categorização automática de produtos (15 categorias)
- ✅ Orçamento por categoria + alertas (Tarefa 17)
- ✅ Liberdade de Sexta (notificação push sexta 17h)
- ✅ Exportação PDF/CSV/Excel (Pro)
- ✅ Offline-first + Sync automático
- 📋 **Comparador de preços entre lojas** (Fase 3)

### P2 — Crescimento
- 📋 **Modo Família** até 4 membros (Fase 4)
- 📋 **Inflação pessoal** (Fase 5)
- 📋 Previsão de gastos com ML simples
- 📋 Lista de compras inteligente
- 📋 Gamificação (streaks, badges, Wrapped Anual)
- 📋 Dark Mode
- 📋 Assistente de chat (NLP)

---

## Guias de Deploy

- [Railway (Backend)](deploy/railway.md) — deploy automático na push para `main`
- [EAS Build (Mobile)](deploy/eas.md) — builds Android/iOS via Expo Application Services

---

## Arquitetura do Monorepo

```
comprei-app/                  # git root (npm workspaces)
├── .github/
│   └── workflows/
│       ├── ci.yml            # Lint + typecheck + test (PRs)
│       └── deploy-backend.yml # Deploy Railway (push main)
├── apps/
│   ├── backend/              # NestJS API → Railway
│   └── mobile/               # Expo/React Native → EAS
└── docs/                     # Esta pasta
```
