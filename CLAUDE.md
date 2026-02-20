# CLAUDE.md — Comprei App

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

**Problema que resolve:** Consumidores nao tem visibilidade sobre para onde vai o dinheiro gasto em supermercados. O app automatiza o registro via QR Code e categoriza gastos para gerar insights acionaveis.

**Publico-alvo:** Familias brasileiras que fazem compras regulares em supermercados/atacarejos e querem controlar gastos sem planilhas manuais.

**Status atual do codigo:**
- Monorepo funcional com backend (NestJS) e mobile (Expo/React Native)
- Auth completo: login, registro, JWT, restore token
- Fluxo de scan: camera QR Code -> preview dos itens -> salvar nota
- CRUD de notas fiscais com scraper (Puppeteer + Cheerio) para SEFAZ PR
- Persistencia: PostgreSQL via Prisma (User, Invoice, Product, InvoiceItem)
- UI basica com NativeWind (tema azul padrao, sem design system do requisito)
- **NAO implementado:** Dashboard, Historico, Relatorios, Perfil, categorias, bottom tabs, design system "Fresh Finance"

---

## 2. STACK TECNOLOGICO

### Frontend — Mobile
| Tecnologia | Versao | Uso |
|---|---|---|
| React Native | 0.76.9 | Framework mobile |
| Expo | ~52.0.0 | Build toolchain |
| Expo Router | ~4.0.0 | File-based routing |
| Expo Camera | ~16.0.0 | Leitura de QR Code |
| NativeWind | 4.2.1 | Styling (Tailwind para RN) |
| TailwindCSS | 3.3.2 | Utilidades CSS |
| Zustand | 5.0.11 | State management |
| Axios | 1.13.5 | HTTP client |
| Expo Secure Store | ~14.0.0 | Token storage (nativo) |
| AsyncStorage | 1.23.1 | Persistencia local |
| TypeScript | ~5.9.2 | Tipagem |

### Backend — API
| Tecnologia | Versao | Uso |
|---|---|---|
| NestJS | 11.x | Framework API |
| Prisma | 5.22.0 | ORM |
| PostgreSQL | - | Banco de dados |
| Puppeteer | 24.x | Scraping de NF-e (SEFAZ) |
| Cheerio | 1.2 | HTML parsing |
| Passport + JWT | 0.7 / 11.x | Autenticacao |
| bcrypt | 6.0 | Hash de senhas |
| class-validator | 0.14 | Validacao de DTOs |

### Bibliotecas a instalar (baseado nos requisitos)
```
# Mobile
expo-haptics              # Vibracao haptica no scan
expo-av                   # Som de confirmacao
react-native-svg          # Graficos (donut, barras, radar)
victory-native            # OU react-native-chart-kit para graficos
expo-notifications        # Alertas de orcamento
expo-file-system           # Exportacao PDF/CSV
expo-sharing              # Compartilhar relatorios
@expo/vector-icons        # Ja parcialmente usado (Ionicons)
react-native-reanimated   # Animacoes avancadas (numeros rolando)

# Backend
@nestjs/schedule          # Jobs agendados (insights, alertas)
```

---

## 3. ARQUITETURA E ESTRUTURA DE PASTAS

### Estrutura atual
```
comprei -app/
├── package.json              # Monorepo workspaces
├── README.md
├── apps/
│   ├── mobile/
│   │   ├── app/
│   │   │   ├── _layout.tsx           # Root layout (auth guard)
│   │   │   ├── auth/
│   │   │   │   ├── _layout.tsx       # Stack auth
│   │   │   │   ├── login.tsx
│   │   │   │   └── register.tsx
│   │   │   └── (app)/
│   │   │       ├── _layout.tsx       # Stack (sem tabs)
│   │   │       ├── index.tsx         # Home (lista de notas)
│   │   │       ├── scanner.tsx       # Camera QR
│   │   │       └── invoice/
│   │   │           ├── preview.tsx   # Pre-visualizacao
│   │   │           └── [id].tsx      # Detalhe da nota
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   └── InvoiceCard.tsx
│   │   │   ├── constants/
│   │   │   │   └── api.ts
│   │   │   ├── services/
│   │   │   │   ├── invoices.ts
│   │   │   │   └── storage.ts
│   │   │   ├── store/
│   │   │   │   ├── authStore.ts
│   │   │   │   └── invoiceStore.ts
│   │   │   └── types/
│   │   │       └── index.ts
│   │   ├── app.json
│   │   ├── package.json
│   │   ├── tailwind.config.js
│   │   └── tsconfig.json
│   └── backend/
│       ├── prisma/
│       │   └── schema.prisma
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.module.ts
│       │   ├── auth/
│       │   │   ├── auth.controller.ts
│       │   │   ├── auth.service.ts
│       │   │   ├── auth.module.ts
│       │   │   └── jwt.strategy.ts
│       │   ├── users/
│       │   │   ├── users.controller.ts
│       │   │   ├── users.service.ts
│       │   │   ├── users.module.ts
│       │   │   ├── dto/
│       │   │   └── entities/
│       │   ├── invoices/
│       │   │   ├── invoices.controller.ts
│       │   │   ├── invoices.service.ts
│       │   │   ├── invoices.module.ts
│       │   │   ├── scraper.service.ts
│       │   │   └── dto/
│       │   └── prisma/
│       │       ├── prisma.service.ts
│       │       └── prisma.module.ts
│       ├── package.json
│       └── tsconfig.json
```

### Estrutura final proposta (pastas a criar)
```
apps/mobile/
├── app/
│   ├── (app)/
│   │   ├── _layout.tsx           # ALTERAR: Stack -> Tabs (bottom nav)
│   │   ├── index.tsx             # ALTERAR: Dashboard (nao lista simples)
│   │   ├── history.tsx           # CRIAR: Tela de historico
│   │   ├── reports.tsx           # CRIAR: Tela de relatorios
│   │   ├── profile.tsx           # CRIAR: Tela de perfil
│   │   ├── scanner.tsx           # Manter
│   │   └── invoice/
│   │       ├── preview.tsx       # Manter
│   │       └── [id].tsx          # Manter
│   └── ...
├── src/
│   ├── components/
│   │   ├── ui/                   # CRIAR: componentes base reutilizaveis
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── CategoryBadge.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   └── AnimatedNumber.tsx
│   │   ├── charts/               # CRIAR: componentes de grafico
│   │   │   ├── DonutChart.tsx
│   │   │   ├── BarChart.tsx
│   │   │   └── TrendLine.tsx
│   │   ├── dashboard/            # CRIAR: widgets do dashboard
│   │   │   ├── BudgetCard.tsx
│   │   │   ├── InsightCard.tsx
│   │   │   └── RecentPurchase.tsx
│   │   └── InvoiceCard.tsx       # Manter (refatorar cores)
│   ├── constants/
│   │   ├── api.ts                # Manter
│   │   ├── colors.ts             # CRIAR: design tokens
│   │   └── categories.ts         # CRIAR: mapa de categorias
│   ├── services/
│   │   ├── invoices.ts           # Manter
│   │   ├── storage.ts            # Manter
│   │   └── reports.ts            # CRIAR: servico de relatorios
│   ├── store/
│   │   ├── authStore.ts          # Manter
│   │   ├── invoiceStore.ts       # Manter
│   │   └── budgetStore.ts        # CRIAR: metas e orcamento
│   ├── hooks/                    # CRIAR
│   │   └── useFormattedCurrency.ts
│   ├── utils/                    # CRIAR
│   │   ├── currency.ts
│   │   └── date.ts
│   └── types/
│       └── index.ts              # Expandir com Category, Budget, Report

apps/backend/
├── prisma/
│   └── schema.prisma             # EXPANDIR: Category, Budget, meta models
├── src/
│   ├── categories/               # CRIAR: modulo de categorias
│   └── reports/                  # CRIAR: modulo de relatorios/analytics
```

### Nomenclatura
- **Arquivos de componentes:** PascalCase (`BudgetCard.tsx`)
- **Arquivos de servico/store/hook:** camelCase (`authStore.ts`, `useFormattedCurrency.ts`)
- **Pastas:** kebab-case ou lowercase (`charts/`, `ui/`)
- **Rotas Expo Router:** kebab-case para arquivos de rota (`history.tsx`, `scanner.tsx`)

---

## 4. DESIGN SYSTEM

### Paleta de cores — "Fresh Finance"
```typescript
// src/constants/colors.ts
export const COLORS = {
  // Primarias
  BG:              '#FAFAF7',
  SURFACE:         '#FFFFFF',
  PRIMARY:         '#4CAF7D',
  PRIMARY_DARK:    '#3A9A6A',
  PRIMARY_LIGHT:   '#E8F5EE',

  // Secundarias
  SECONDARY:       '#F5A623',
  SECONDARY_LIGHT: '#FEF5E7',

  // Acento
  ACCENT:          '#1B4F72',
  ACCENT_LIGHT:    '#EAF2F8',

  // Texto
  TEXT:            '#1C1C1E',
  TEXT_MUTED:      '#6B7280',

  // Feedback
  DANGER:          '#E74C3C',
  DANGER_LIGHT:    '#FDEDEC',

  // Neutral
  BORDER:          '#EBEBEB',
  DARK_BG:         '#0F1117',

  // Categorias (chart colors)
  CHART_GREEN:     '#4CAF7D',
  CHART_ORANGE:    '#F5A623',
  CHART_BLUE:      '#1B4F72',
  CHART_PURPLE:    '#7C3AED',
  CHART_GRAY:      '#E5E7EB',
} as const;
```

### Tipografia
| Uso | Fonte | Peso | Tamanho |
|---|---|---|---|
| Display / valores grandes | Sora | 800 (ExtraBold) | 38px |
| Titulo de secao | Sora | 700 (Bold) | 24px |
| Subtitulo / card title | Sora | 700 | 14px |
| Labels uppercase | Sora | 700 | 12px (tracking 0.08em) |
| Corpo | DM Sans | 400-500 | 14px |
| Caption / muted | DM Sans | 400 | 12px |

> **Nota:** No React Native, usar `expo-google-fonts` para carregar Sora e DM Sans. Instalar `@expo-google-fonts/sora` e `@expo-google-fonts/dm-sans`.

### Tokens de layout
| Token | Valor |
|---|---|
| border-radius (cards) | 16px (`--r`) |
| border-radius (pequeno) | 10px (`--r-sm`) |
| border-radius (pills/chips) | 100px |
| shadow-sm | `0 1px 4px rgba(0,0,0,0.07)` |
| shadow-md | `0 4px 20px rgba(0,0,0,0.1)` |
| spacing base | 4px (multiplos: 8, 12, 16, 20, 24) |
| FAB size | 64x64px, border-radius 50% |
| FAB margin-top | -28px (sobreposicao na bottom nav) |
| Bottom nav height | 82px |

### Componentes base identificados no prototipo
- **BudgetCard:** Barra de progresso por categoria com label e valor
- **InsightCard:** Card dark (gradient accent) com icone + texto de insight
- **RecentPurchase:** Card com logo do estabelecimento, data, total
- **FilterChip:** Pill seleccionavel para filtros (ativo = PRIMARY, fill branco)
- **PeriodSelector:** Row de botoes de periodo (Jan, Fev, 3m, 6m, Ano)
- **DonutChart:** SVG donut com legenda lateral
- **BarChart:** Barras horizontais com label e valor
- **StatCard:** Mini card com label, valor grande, unidade, variacao
- **Badge:** Card com icone + nome + descricao de conquista
- **HistoryCard:** Card de compra com header (loja, data, valor) + tags de categoria

---

## 5. FUNCIONALIDADES — STATUS E PRIORIDADE

| Funcionalidade | Status | Prioridade |
|---|---|---|
| Leitura de QR Code / NF-e | ✅ Implementado | P0 |
| Auth (login, registro, JWT) | ✅ Implementado | P0 |
| Scraping de dados da SEFAZ (Puppeteer) | ✅ Implementado | P0 |
| Preview de itens antes de salvar | ✅ Implementado | P0 |
| CRUD de notas fiscais | ✅ Implementado | P0 |
| Persistencia local (Zustand + AsyncStorage) | ✅ Implementado | P0 |
| Navegacao por Bottom Tabs | 📋 Planejado | P0 |
| Design System "Fresh Finance" | 📋 Planejado | P0 |
| Dashboard mensal de gastos | 📋 Planejado | P0 |
| Tela de Historico com filtros | 📋 Planejado | P0 |
| Tela de Relatorios (donut, barras, tendencia) | 📋 Planejado | P1 |
| Tela de Perfil | 📋 Planejado | P1 |
| Categorizacao automatica de produtos | 📋 Planejado | P1 |
| Orcamento por categoria + alertas | 📋 Planejado | P1 |
| Comparador de precos entre lojas | 📋 Planejado | P1 |
| Inflacao pessoal | 📋 Planejado | P2 |
| Modo Familia | 📋 Planejado | P2 |
| Lista de compras inteligente | 📋 Planejado | P2 |
| Modo Offline + Sync | 📋 Planejado | P2 |
| Exportacao PDF/CSV/Excel | 📋 Planejado | P2 |
| Assistente de chat (NLP) | 📋 Planejado | P2 |
| Previsao de gastos | 📋 Planejado | P2 |
| Gamificacao (streaks, badges) | 📋 Planejado | P2 |
| Wrapped Anual (compartilhavel) | 📋 Planejado | P2 |
| Dark Mode | 📋 Planejado | P2 |

---

## 6. TELAS DO APP

### 6.1 Dashboard (Home)
- **Rota:** `/(app)/index.tsx`
- **Status:** Existe como lista simples. Precisa ser reescrita como dashboard.
- **Componentes principais:** Header com saudacao + total do mes, BudgetCard (barras por categoria), InsightCard (insight da semana), lista de compras recentes (RecentPurchase)
- **State:** `invoiceStore.invoices`, `budgetStore.budgets` (a criar), total mensal calculado, variacao percentual vs mes anterior
- **APIs:** `GET /invoices` (existente), `GET /reports/monthly-summary` (a criar)

### 6.2 Scanner
- **Rota:** `/(app)/scanner.tsx`
- **Status:** ✅ Implementado
- **Componentes principais:** CameraView fullscreen, scan corners overlay, scan line animada, botao "Da Galeria", botao "Manual", botao "Flash", overlay de sucesso
- **State:** `scanned`, `processing`, `manualUrl`, `showManualInput`
- **APIs:** `POST /invoices/preview` (existente)

### 6.3 Historico
- **Rota:** `/(app)/history.tsx` (a criar)
- **Componentes principais:** Header (titulo + contagem), FilterChip row (Todos, Supermercado, Farmacia, Atacado, Padaria), agrupamento por mes com subtotal, HistoryCard com tags de categorias
- **State:** `invoiceStore.invoices` filtrados por mes e tipo de estabelecimento
- **APIs:** `GET /invoices` com query params de filtro (a implementar no backend)

### 6.4 Relatorios
- **Rota:** `/(app)/reports.tsx` (a criar)
- **Componentes principais:** PeriodSelector (Jan-Dez, 3m, 6m, Ano), StatsRow (total, ticket medio, qtd compras, economia), DonutChart por categoria, BarChart por estabelecimento, TrendLine de evolucao mensal
- **State:** periodo selecionado, dados agregados do periodo
- **APIs:** `GET /reports/by-category` (a criar), `GET /reports/by-store` (a criar), `GET /reports/trend` (a criar)

### 6.5 Perfil
- **Rota:** `/(app)/profile.tsx` (a criar)
- **Componentes principais:** Header com avatar + nome + email, stats row (notas escaneadas, streak, economizado), badges de conquista, lista de configuracoes (Metas, Notificacoes, Familia, Exportar, Tema)
- **State:** `authStore.user`, estatisticas do usuario
- **APIs:** `GET /auth/profile` (existente), `GET /users/:id/stats` (a criar)

---

## 7. CATEGORIAS DE DADOS

### Categorias de Produtos
| Emoji | Categoria |
|---|---|
| 🥩 | Carnes e Proteinas |
| 🥛 | Laticinios e Frios |
| 🥬 | Frutas, Legumes e Verduras |
| 🍞 | Padaria e Confeitaria |
| 🥤 | Bebidas Nao-alcoolicas |
| 🍺 | Bebidas Alcoolicas |
| 🧊 | Congelados e Semi-prontos |
| 🧴 | Higiene e Beleza |
| 🧹 | Limpeza Domestica |
| 👶 | Bebe e Infantil |
| 🐾 | Pet Shop |
| 💊 | Farmacia e Saude |
| 🍿 | Snacks e Guloseimas |
| 🧂 | Temperos e Conservas |
| 🫙 | Graos e Cereais |

### Tipos de Estabelecimento
| Emoji | Tipo |
|---|---|
| 🏬 | Supermercado |
| 🏭 | Atacado / Atacarejo |
| 💊 | Farmacia |
| 🥖 | Padaria |
| 🌿 | Hortifruti / Feira |
| 🥩 | Acougue / Peixaria |
| 🏪 | Conveniencia |
| 🍽️ | Restaurante / Delivery |
| ⛽ | Posto de Combustivel |
| 🏢 | Loja de Departamento |

### Tipos de Gasto
| Emoji | Tipo |
|---|---|
| 🏠 | Essencial |
| 🔄 | Recorrente |
| 🎉 | Eventual / Lazer |
| ❤️ | Saude |
| 🚨 | Emergencia |
| 🎁 | Presente / Ocasiao |

### Tipos de Compra
| Emoji | Tipo |
|---|---|
| 📦 | Compra Grande (Mensal) |
| ⚡ | Compra Rapida (Reposicao) |
| 📋 | Compra Planejada |
| 💡 | Compra por Impulso |
| 🤝 | Compra Coletiva |

---

## 8. COMANDOS ESSENCIAIS

```bash
# ---- Monorepo (raiz do comprei-app) ----
npm run dev:backend       # Inicia backend NestJS com hot reload
npm run dev:mobile        # Inicia Expo dev server
npm run db:up             # Sobe PostgreSQL via Docker
npm run db:down           # Para o container do banco

# ---- Backend (apps/backend) ----
npm run start:dev         # NestJS com --watch
npm run build             # Compila para dist/
npm run lint              # ESLint com fix
npm run test              # Jest unit tests
npm run test:e2e          # Jest e2e tests
npx prisma migrate dev    # Cria/aplica migracao
npx prisma generate       # Gera Prisma Client
npx prisma studio         # UI visual do banco

# ---- Mobile (apps/mobile) ----
npx expo start            # Dev server
npx expo start --android  # Abre no emulador Android
npx expo start --ios      # Abre no simulador iOS
npx expo start --web      # Abre no browser
npx expo prebuild         # Gera projetos nativos
```

---

## 9. CONVENCOES DE CODIGO

### Commits (Conventional Commits)
```
feat: adiciona componente DonutChart na tela de relatorios
fix: corrige calculo de total quando item e removido no preview
refactor: extrai logica de formatacao de moeda para utils/currency.ts
style: aplica paleta Fresh Finance no dashboard
chore: adiciona expo-haptics ao package.json
docs: atualiza CLAUDE.md com novas rotas
```

### Regras de nomenclatura
- Componentes: PascalCase, um componente por arquivo (`BudgetCard.tsx`)
- Hooks: prefixo `use` (`useFormattedCurrency.ts`)
- Stores Zustand: sufixo `Store` (`budgetStore.ts`)
- Services: sufixo descritivo (`invoices.ts`, `reports.ts`)
- DTOs (backend): sufixo `Dto` (`CreateInvoiceDto`)
- Interfaces/types: PascalCase, sem prefixo `I` (`Invoice`, nao `IInvoice`)

### O que NUNCA fazer neste projeto
- **NAO** usar class components — apenas functional components com hooks
- **NAO** usar StyleSheet.create quando NativeWind/className resolve — manter consistencia
- **NAO** hardcodar cores — usar sempre `COLORS` de `constants/colors.ts`
- **NAO** hardcodar strings de API URL — usar `API_URL` de `constants/api.ts`
- **NAO** fazer `console.log` em producao — usar Logger no backend, remover logs no mobile
- **NAO** commitar `.env`, `node_modules`, `dist/`, arquivos `generated/`
- **NAO** usar `any` sem justificativa — tipar adequadamente com interfaces de `types/`
- **NAO** instalar bibliotecas de UI completas (Paper, Elements) — componentes proprios com NativeWind
- **NAO** usar graficos 2D tipo pizza generica — usar donut + barras horizontais conforme design system
- **NAO** acessar token diretamente — usar `tokenStorage` abstraction de `services/storage.ts`

---

## 10. PROXIMOS PASSOS — BACKLOG IMEDIATO

### 1. Converter navegacao de Stack para Bottom Tabs
**Arquivo:** `apps/mobile/app/(app)/_layout.tsx`
**Acao:** Substituir `<Stack>` por `<Tabs>` do expo-router com 5 tabs: Home, Historico, Scan (FAB central), Relatorios, Perfil. O FAB de scan deve ser um botao circular verde elevado no centro da tab bar, conforme prototipo.

### 2. Criar `src/constants/colors.ts` e aplicar paleta Fresh Finance
**Acao:** Criar o arquivo de design tokens com todas as cores do requisito. Atualizar `tailwind.config.js` para estender as cores customizadas. Refatorar `index.tsx` (home) e `InvoiceCard.tsx` para usar verde primario (#4CAF7D) em vez de azul (#2563EB).

### 3. Reescrever tela Home como Dashboard
**Arquivo:** `apps/mobile/app/(app)/index.tsx`
**Acao:** Substituir a lista simples atual por um dashboard com: header dark (gradient accent), total do mes com variacao, BudgetCard com barras por categoria, InsightCard, e lista de compras recentes. Usar componentes extraidos em `src/components/dashboard/`.

### 4. Criar tela de Historico com filtros e agrupamento por mes
**Arquivo:** `apps/mobile/app/(app)/history.tsx` (novo)
**Acao:** Implementar tela com FilterChip row (Todos, Supermercado, Farmacia, Atacado, Padaria, Outros), agrupamento de notas por mes com subtotal, e HistoryCard com tags de categoria por nota.

### 5. Criar modelo Category no Prisma e endpoint de categorizacao
**Arquivo:** `apps/backend/prisma/schema.prisma`
**Acao:** Adicionar model `Category` (id, name, emoji, color), relation `Product.categoryId -> Category`. Criar modulo `categories/` no backend com seed das 15 categorias de produto. Adicionar logica basica de categorizacao por keywords na descricao do produto durante o scraping.

---

---

## 11. MONETIZACAO E PLANOS

### Estrategia de preco — "Preco Invisivel"

R$ 4,99/mes esta no sweet spot brasileiro: abaixo do limiar psicologico onde o usuario para para avaliar se vale a pena. O plano anual com desconto de 33% melhora o fluxo de caixa e reduz churn.

### Estrutura de planos

| Feature | Gratuito | Pro R$4,99/mes | Pro Anual R$39,99/ano |
|---|---|---|---|
| Notas por mes | 20 | Ilimitado | Ilimitado |
| Historico | 30 dias | Completo | Completo |
| Categorias | 5 fixas | Todas (15+) | Todas (15+) |
| Dashboard basico | ✅ | ✅ | ✅ |
| Relatorios avancados | ❌ | ✅ | ✅ |
| Comparador de precos | ❌ | ✅ | ✅ |
| Alertas de orcamento | ❌ | ✅ | ✅ |
| **Liberdade de Sexta** 🍺 | ❌ | ✅ | ✅ |
| Exportacao PDF/CSV | ❌ | ✅ | ✅ |
| Modo Familia (ate 4 membros) | ❌ | ❌ | ✅ |
| Wrapped Anual compartilhavel | ❌ | ✅ | ✅ |

> **Limite gratuito:** 20 notas/mes e nao 10. Generoso o suficiente para criar habito, mas quem usa de verdade (15+ compras/mes) sente o limite e converte sem pressao.

### Projecao de receita

| Usuarios pagantes | Receita Mensal | Receita Anual (est.) |
|---|---|---|
| 1.000 | R$ 4.990 | R$ 59.880 |
| 5.000 | R$ 24.950 | R$ 299.400 |
| 10.000 | R$ 49.900 | R$ 598.800 |
| 20.000 | R$ 99.800 | R$ 1.197.600 |

**Custo marginal por usuario:** quase zero. Infraestrutura para 5.000 usuarios ativos: ~R$ 300-600/mes (cloud otimizado). Custo de IA para categorizacao + insights com 5k users fazendo 8 scans/mes = ~40k chamadas = R$ 50-200/mes dependendo do modelo.

---

## 12. FEATURE: LIBERDADE DE SEXTA 🍺

### O que e
Notificacao push toda sexta-feira as 17h calculando quanto o usuario economizou em categorias "superfluas" na semana e convertendo isso em poder de compra de lazer real.

### Por que funciona
- Transforma controle financeiro em **recompensa emocional** — em vez de culpa, gera antecipacao de prazer
- Cria um **ritual semanal** de abertura do app (retencao dramaticamente maior)
- E **naturalmente compartilhavel** — "olha o que meu app me disse" vai pro story
- E o principal **argumento de venda** do plano Pro (mencionar na paywall)

### Categorias consideradas "superfluas" (configuravel pelo usuario)
`Snacks e Guloseimas`, `Bebidas Alcoolicas`, `Compra por Impulso`, `Eventual / Lazer`

### Exemplos de mensagens (rotacionar aleatoriamente)

```typescript
// src/constants/liberdadeMessages.ts
export const LIBERDADE_MESSAGES = [
  {
    title: "🍺 Você economizou R$ {valor} essa semana!",
    body: "Dá pra um churrasco pra 4 pessoas e ainda sobra pra cerveja. Bom fim de semana!"
  },
  {
    title: "🎬 Bora gastar bem esse fim de semana?",
    body: "Você cortou R$ {valor} em supérfluos. Isso é exatamente um jantar no rodízio + Uber de volta."
  },
  {
    title: "🎉 R$ {valor} livres pra você!",
    body: "Semana controlada = fim de semana sem culpa. Vai lá aproveitar!"
  },
  {
    title: "🎡 Sua liberdade dessa semana: R$ {valor}",
    body: "Cinema + pipoca + refrigerante pra dois, e ainda sobra troco. Você merece!"
  },
  {
    title: "🍕 Missão cumprida! R$ {valor} economizados.",
    body: "Isso dá uma pizza boa, uma rodada de chopp e boa conversa. Curtam o fim de semana!"
  },
]
```

### Implementacao no backend

```typescript
// apps/backend/src/notifications/friday-freedom.service.ts
// Agendado com @nestjs/schedule: todo Friday as 17:00 BRT
// Logica:
// 1. Buscar todos usuarios Pro com push token ativo
// 2. Para cada usuario: SUM(items.price) WHERE category IN superfluas AND date >= segunda-feira
// 3. Se valor > 0: sortear mensagem e enviar via Expo Push API
// 4. Salvar historico de notificacao (evitar duplicatas)
```

### Schema adicional necessario no Prisma

```prisma
model PushToken {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  platform  String   // "ios" | "android"
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
}

model NotificationLog {
  id        String   @id @default(cuid())
  userId    String
  type      String   // "friday_freedom" | "budget_alert" | "insight"
  sentAt    DateTime @default(now())
  payload   Json
  user      User     @relation(fields: [userId], references: [id])
}
```

---

## 13. ESTRATEGIA DE CRESCIMENTO

### Fase 1 — 0 a 1.000 usuarios: Organico puro (custo zero)

| Acao | Mecanismo | Esforco |
|---|---|---|
| TikTok/Reels mostrando o scan | O gesto de escanear + dados aparecendo e visualmente satisfatorio | Baixo |
| Wrapped Anual compartilhavel | Card bonito com resumo do ano — curiosidade genuina | Medio |
| Liberdade de Sexta nos stories | Usuario compartilha a notificacao — aquisicao organica | Zero (automatico) |

### Fase 2 — 1.000 a 5.000: Indicacao com incentivo

**Programa "Chama o Trampo":**
- Indica 3 amigos que ativam o app → voce ganha 1 mes Pro gratis
- Custo: apenas 1 mes de Pro por 3 novos usuarios (CAC = R$ 1,66)
- Usuarios por indicacao tem retencao 40% maior e convertem para pago em taxa maior

```
Implementar em: apps/backend/src/referrals/ (modulo a criar)
Logica: codigo unico por usuario, rastrear ativacoes, creditar automaticamente
```

### Fase 3 — 5.000+: Parcerias e B2B leve

| Oportunidade | Como | Receita adicional |
|---|---|---|
| Dados agregados anonimos para varejo | Vender insights de comportamento de compra (nunca PII) | R$ X/mes por parceiro |
| Plano Familia | R$ 7,99/mes para ate 4 membros — ticket maior, custo marginal minimo | +60% receita por conta |
| White-label para apps de cashback | SDK de scan de NF-e licenciado para terceiros | Licenca mensal |

---

## 14. IMPLEMENTACAO DOS PLANOS (TECNICO)

### Schema Prisma — adicionar a users

```prisma
model User {
  // ... campos existentes ...
  plan          String   @default("free")  // "free" | "pro"
  planExpiresAt DateTime?
  trialEndsAt   DateTime?
  referralCode  String   @unique @default(cuid())
  referredBy    String?
  pushTokens    PushToken[]
  notifications NotificationLog[]
}
```

### Guard de plano no backend

```typescript
// apps/backend/src/auth/plan.guard.ts
// Decorator: @RequiresPlan('pro')
// Verifica user.plan === 'pro' && user.planExpiresAt > now()
// Retorna 403 com { code: 'UPGRADE_REQUIRED', upgradeUrl: '/plans' } se nao tiver plano
```

### Paywall no mobile

```typescript
// apps/mobile/src/components/Paywall.tsx
// Exibir quando usuario free tenta acessar feature Pro
// Mostrar os 3 principais beneficios + Liberdade de Sexta como destaque
// Botao "Assinar Pro — R$ 4,99/mes" e "Plano Anual — R$ 39,99 (economize 33%)"
// NAO usar IAP nativo inicialmente — usar link externo para Stripe/Hotmart (evita 30% da Apple/Google)
```

### Pagamento — estrategia para evitar taxa das stores

Opcao recomendada para MVP:
- **Stripe** com link de pagamento externo (usuario paga no browser, volta pro app)
- Alternativa BR: **Hotmart** ou **Kiwify** (ja tem PIX nativo)
- Evitar In-App Purchase da Apple/Google enquanto possivel (taxa de 15-30%)
- Quando escalar: implementar IAP para nao violar politicas das stores (acima de ~$1M/ano a Apple exige)

```
Modulo a criar: apps/backend/src/subscriptions/
- POST /subscriptions/checkout — gera link Stripe
- POST /subscriptions/webhook — recebe confirmacao de pagamento
- PATCH /users/:id/plan — atualiza plano apos confirmacao
```

---

## PERMISSÕES DE EXECUÇÃO

O agente tem permissão total para:
- Ler e escrever qualquer arquivo dentro de /src, /components, /screens, /services
- Executar npm install, npx expo, git add e git commit sem confirmação
- Criar pastas e arquivos novos na estrutura do projeto
- Editar este CLAUDE.md quando necessário

O agente deve SEMPRE perguntar antes de:
- Deletar arquivos existentes
- Alterar package.json de forma destrutiva
- Fazer git push


