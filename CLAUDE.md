# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## PERMISSOES DE EXECUCAO

O agente tem permissao total para:
- Ler e escrever qualquer arquivo dentro de `/src`, `/components`, `/screens`, `/services`
- Executar `npm install`, `npx expo`, `git add` e `git commit` sem confirmacao
- Criar pastas e arquivos novos na estrutura do projeto
- Editar este CLAUDE.md quando necessario

O agente deve SEMPRE perguntar antes de:
- Deletar arquivos existentes
- Alterar `package.json` de forma destrutiva
- Fazer `git push`

---

## 1. VISAO GERAL DO PROJETO

**Nome:** Comprei (anteriormente "GastoZero" / "NF-e Smart")
**Descricao:** App mobile que le QR Codes de notas fiscais de supermercados, salva produtos e valores, e gera relatorios de gastos mensais por categoria. Transforma cupons fiscais em inteligencia financeira pessoal.

**Publico-alvo:** Familias brasileiras que fazem compras regulares em supermercados/atacarejos.

**Status atual do codigo:**
- Monorepo funcional com backend (NestJS) e mobile (Expo/React Native)
- Auth completo: login, registro, JWT, restore token
- Fluxo de scan: camera QR Code → preview dos itens → salvar nota
- CRUD de notas fiscais com scraper (Puppeteer + Cheerio) para SEFAZ PR
- Persistencia: PostgreSQL via Prisma (schema completo implementado)
- UI com NativeWind + design system "Fresh Finance" (verde PRIMARY #4CAF7D)
- Bottom Tabs implementados: Home (Dashboard), Historico, Scan (FAB central), Relatorios, Perfil
- Todas as telas principais implementadas (Dashboard, Historico, Relatorios, Perfil, Orcamentos, Comparador, Inflacao, Wrapped, Liberdade de Sexta, Planos, Referral, Onboarding)
- Backend com todos os modulos implementados: auth, invoices, categories, reports, payments, notifications, friday, referral, analytics, exports, budgets, products, insights

---

## 2. STACK TECNOLOGICO

### Frontend — Mobile (`apps/mobile/`)
| Tecnologia | Versao | Uso |
|---|---|---|
| React Native | 0.76.9 | Framework mobile |
| Expo | ~52.0.0 | Build toolchain |
| Expo Router | ~4.0.0 | File-based routing (Tab + Stack) |
| Expo Camera | ~16.0.0 | Leitura de QR Code |
| NativeWind | 4.2.1 | Styling (Tailwind para RN) |
| TailwindCSS | 3.3.2 | Utilidades CSS |
| Zustand | 5.0.11 | State management |
| Axios | 1.13.5 | HTTP client |
| Expo Secure Store | ~14.0.0 | Token storage (nativo) |
| Expo SQLite | ~15.1.4 | Banco local offline |
| react-native-svg | 15.8.0 | Graficos SVG (DonutChart, TrendLine) |
| react-native-reanimated | ~3.16.1 | Animacoes |
| expo-notifications | ~0.29.14 | Push notifications |
| expo-file-system + expo-sharing | - | Exportacao e compartilhamento |

### Backend — API (`apps/backend/`)
| Tecnologia | Versao | Uso |
|---|---|---|
| NestJS | 11.x | Framework API |
| Prisma | 5.22.0 | ORM |
| PostgreSQL | - | Banco de dados |
| Puppeteer | 24.x | Scraping de NF-e (SEFAZ) |
| Cheerio | 1.2 | HTML parsing |
| Passport + JWT | - | Autenticacao |
| bcrypt | 6.0 | Hash de senhas |
| Stripe | 20.x | Pagamentos |
| expo-server-sdk | 5.x | Envio de push notifications |
| pdfkit + exceljs | - | Exportacao PDF/Excel |
| @nestjs/schedule | 6.x | Jobs agendados (Friday Freedom, alertas de orcamento) |

---

## 3. COMANDOS ESSENCIAIS

```bash
# ---- Monorepo (raiz do comprei-app) ----
npm run dev:backend       # Inicia backend NestJS com hot reload
npm run dev:mobile        # Inicia Expo dev server
npm run db:up             # Sobe PostgreSQL via Docker
npm run db:down           # Para o container do banco

# ---- Backend (apps/backend/) ----
npm run start:dev         # NestJS com --watch
npm run build             # Compila para dist/
npm run lint              # ESLint com fix
npm run test              # Jest unit tests (rootDir: src, pattern: *.spec.ts)
npm run test:e2e          # Jest e2e tests
npx prisma migrate dev    # Cria/aplica migracao
npx prisma generate       # Gera Prisma Client
npx prisma studio         # UI visual do banco
npx prisma db seed        # Executa prisma/seed.ts (seed de categorias)

# ---- Mobile (apps/mobile/) ----
npx expo start            # Dev server
npx expo start --android  # Abre no emulador Android
npx expo start --ios      # Abre no simulador iOS
npx expo start --web      # Abre no browser
```

---

## 4. ARQUITETURA E ESTRUTURA

### Monorepo
```
comprei-app/
├── apps/
│   ├── mobile/           # React Native / Expo
│   └── backend/          # NestJS API
├── docker-compose.yml    # PostgreSQL local
└── package.json          # Workspace root com scripts dev:backend, dev:mobile, db:up/down
```

### Mobile — Navegacao (Expo Router)
```
app/
├── _layout.tsx                   # Root layout: auth guard (token → (app), sem token → auth/)
├── onboarding.tsx                # Onboarding antes do auth
├── auth/
│   ├── login.tsx
│   └── register.tsx
└── (app)/
    ├── _layout.tsx               # Tab navigator (5 tabs: index, history, scanner FAB, reports, profile)
    ├── index.tsx                 # Dashboard mensal
    ├── history.tsx               # Historico com filtros
    ├── scanner.tsx               # Camera QR
    ├── reports.tsx               # Relatorios (donut, barras, tendencia)
    ├── profile.tsx               # Perfil + configuracoes
    ├── plans.tsx                 # Paywall / planos Pro
    ├── budgets.tsx               # Orcamentos por categoria
    ├── budgets/new.tsx           # Criar orcamento
    ├── budgets/suggestions.tsx   # Sugestoes de orcamento
    ├── compare.tsx               # Comparador de precos entre lojas
    ├── inflation.tsx             # Inflacao pessoal
    ├── wrapped.tsx               # Wrapped anual
    ├── liberdade.tsx             # Feature "Liberdade de Sexta"
    ├── referral.tsx              # Programa de indicacao
    └── invoice/
        ├── preview.tsx           # Pre-visualizacao antes de salvar
        └── [id].tsx              # Detalhe da nota
```

### Mobile — Codigo-fonte (`src/`)
```
src/
├── components/
│   ├── ui/                       # Componentes base (Card, Badge, etc.)
│   ├── charts/                   # DonutChart, BarChart, TrendLine (SVG)
│   ├── dashboard/                # BudgetCard, InsightCard, RecentPurchase
│   └── onboarding/               # DemoScanner, OnboardingSlide, PermissionRequest
├── constants/
│   ├── colors.ts                 # COLORS — design tokens Fresh Finance
│   └── api.ts                    # API_URL base
├── services/                     # Um arquivo por dominio (HTTP calls)
│   ├── api.ts                    # Axios instance configurada com token
│   ├── storage.ts                # tokenStorage (SecureStore + web fallback)
│   ├── invoices.ts, budgets.ts, categories.ts, reports.ts, insights.ts
│   ├── payments.ts, referral.ts, friday.ts, notifications.ts
│   ├── database.ts               # Expo SQLite (offline)
│   └── sync.ts                   # Sincronizacao offline → online
├── store/                        # Zustand stores
│   ├── authStore.ts              # user, token, login/logout
│   ├── invoiceStore.ts           # invoices, loading
│   ├── onboardingStore.ts
│   ├── syncStore.ts
│   └── themeStore.ts
├── database/
│   ├── schema.ts                 # Schema SQLite (web)
│   └── schema.native.ts          # Schema SQLite (native)
└── types/index.ts                # Interfaces compartilhadas
```

### Backend — Modulos NestJS (`src/`)
Cada modulo segue o padrao NestJS: `module.ts`, `controller.ts`, `service.ts`, `dto/`.

| Modulo | Responsabilidade |
|---|---|
| `auth/` | Login, registro, JWT strategy, `@RequiresPlan` decorator |
| `users/` | CRUD de usuarios, stats de usuario |
| `invoices/` | CRUD de notas, `scraper.service.ts` (Puppeteer+SEFAZ), `sefaz.service.ts` |
| `categories/` | 15 categorias de produto com seed, auto-categorizacao por keywords |
| `products/` | Deduplicacao de produtos, `price-normalizer.ts` |
| `reports/` | Agregacoes: by-category, by-store, trend mensal |
| `budgets/` | CRUD de orcamentos, alertas (50%/80%/100%), historico por mes |
| `insights/` | Insights semanais, `inflation.calculator.ts` |
| `analytics/` | Eventos de uso/onboarding |
| `payments/` | Stripe checkout, webhooks, atualizacao de plano |
| `notifications/` | Registro de push tokens, envio via expo-server-sdk |
| `friday/` | "Liberdade de Sexta" — job agendado @nestjs/schedule, Friday 17h BRT |
| `referral/` | Programa de indicacao: codigos, recompensas, rastreamento |
| `exports/` | Exportacao PDF (pdfkit) e Excel (exceljs) |
| `common/guards/plan.guard.ts` | Guard `@RequiresPlan('pro')` para rotas Pro |

### Prisma Schema — Modelos principais
`User` → `Invoice` → `InvoiceItem` → `Product` → `Category`
`User` → `Budget` → `BudgetAlert`, `BudgetHistory`
`User` → `Subscription`, `Payment` (Stripe)
`User` → `PushToken`, `FridayNotification`, `Referral`, `OnboardingEvent`

---

## 5. DESIGN SYSTEM — "Fresh Finance"

### Paleta de cores
```typescript
// src/constants/colors.ts — SEMPRE usar COLORS, nunca hardcodar hex
COLORS.BG              = '#FAFAF7'   // Background principal
COLORS.SURFACE         = '#FFFFFF'   // Cards e superficies
COLORS.PRIMARY         = '#4CAF7D'   // Verde principal
COLORS.PRIMARY_DARK    = '#3A9A6A'
COLORS.PRIMARY_LIGHT   = '#E8F5EE'
COLORS.SECONDARY       = '#F5A623'   // Laranja (destaques)
COLORS.ACCENT          = '#1B4F72'   // Azul escuro (header dark, InsightCard)
COLORS.TEXT            = '#1C1C1E'
COLORS.TEXT_MUTED      = '#6B7280'
COLORS.DANGER          = '#E74C3C'
COLORS.BORDER          = '#EBEBEB'
COLORS.DARK_BG         = '#0F1117'
// Chart: CHART_GREEN, CHART_ORANGE, CHART_BLUE, CHART_PURPLE, CHART_GRAY
```

### Tokens de layout
| Token | Valor |
|---|---|
| border-radius cards | 16px |
| border-radius pequeno | 10px |
| border-radius pills | 100px |
| FAB scanner | 60x60px, bottom -20px (sobreposicao na tab bar) |
| Bottom tab height | iOS 88px / Android 70px |

### Tipografia
- Display / valores grandes: Sora 800, 38px
- Titulo de secao: Sora 700, 24px
- Card title / labels uppercase: Sora 700, 14px / 12px
- Corpo: DM Sans 400-500, 14px
- Caption: DM Sans 400, 12px

---

## 6. CONVENCOES DE CODIGO

### Regras obrigatorias
- **Componentes:** PascalCase, um por arquivo
- **Hooks:** prefixo `use`
- **Stores Zustand:** sufixo `Store`
- **DTOs (backend):** sufixo `Dto`
- **Tipos/interfaces:** PascalCase sem prefixo `I`
- **NUNCA** hardcodar cores — usar `COLORS` de `constants/colors.ts`
- **NUNCA** hardcodar API URL — usar `API_URL` de `constants/api.ts`
- **NUNCA** acessar token diretamente — usar `tokenStorage` de `services/storage.ts`
- **NUNCA** usar `any` sem justificativa
- **NUNCA** usar class components — apenas functional com hooks
- **NUNCA** instalar bibliotecas de UI completas (Paper, Elements) — componentes proprios com NativeWind

### Commits (Conventional Commits)
```
feat: adiciona componente DonutChart na tela de relatorios
fix: corrige calculo de total quando item e removido no preview
refactor: extrai logica de formatacao de moeda para utils/currency.ts
style: aplica paleta Fresh Finance no dashboard
chore: adiciona expo-haptics ao package.json
```

---

## 7. PLANOS E MONETIZACAO

| Feature | Gratuito | Pro R$4,99/mes | Pro Anual R$39,99/ano |
|---|---|---|---|
| Notas por mes | 20 | Ilimitado | Ilimitado |
| Historico | 30 dias | Completo | Completo |
| Relatorios avancados | ❌ | ✅ | ✅ |
| Comparador de precos | ❌ | ✅ | ✅ |
| Alertas de orcamento | ❌ | ✅ | ✅ |
| Liberdade de Sexta | ❌ | ✅ | ✅ |
| Exportacao PDF/CSV | ❌ | ✅ | ✅ |
| Modo Familia | ❌ | ❌ | ✅ |

Guard de plano no backend: `@RequiresPlan('pro')` via `common/guards/plan.guard.ts`.
Pagamento via Stripe (link externo no browser, evitando taxa 30% das stores).

---

## 8. FEATURE: LIBERDADE DE SEXTA

Notificacao push toda sexta-feira as 17h BRT. Calcula quanto o usuario economizou em categorias superfluas (Snacks, Bebidas Alcoolicas, Compra por Impulso, Eventual) na semana e converte em poder de compra de lazer.

Implementado em: `apps/backend/src/friday/` — `friday.service.ts`, `friday.scheduler.ts` (job @nestjs/schedule), `friday.controller.ts`.

---

## 9. FUNCIONALIDADES — STATUS

| Funcionalidade | Status |
|---|---|
| Leitura de QR Code / NF-e | ✅ |
| Auth (login, registro, JWT) | ✅ |
| Scraping SEFAZ PR (Puppeteer) | ✅ |
| Preview de itens antes de salvar | ✅ |
| CRUD de notas fiscais | ✅ |
| Navegacao por Bottom Tabs | ✅ |
| Design System "Fresh Finance" | ✅ |
| Dashboard mensal de gastos | ✅ |
| Tela de Historico com filtros | ✅ |
| Tela de Relatorios | ✅ |
| Tela de Perfil | ✅ |
| Orcamento por categoria + alertas | ✅ |
| Categorizacao automatica de produtos | ✅ |
| Comparador de precos entre lojas | ✅ |
| Inflacao pessoal | ✅ |
| Wrapped Anual | ✅ |
| Liberdade de Sexta | ✅ |
| Exportacao PDF/Excel | ✅ |
| Programa de indicacao (Referral) | ✅ |
| Onboarding | ✅ |
| Pagamentos Stripe | ✅ |
| Push notifications | ✅ |
| Modo Offline (SQLite local + Sync) | ✅ |
| Modo Familia | 📋 Planejado (P2) |
| Assistente de chat (NLP) | 📋 Planejado (P2) |
| Dark Mode | 📋 Planejado (P2) |
| Lista de compras inteligente | 📋 Planejado (P2) |
