# Comprei — Inteligência Financeira no Supermercado

> Escaneia o QR Code da nota fiscal, categoriza seus gastos automaticamente e gera relatórios mensais para você entender para onde vai o dinheiro da feira.

---

## Funcionalidades

- **Scan de NF-e** — lê o QR Code do cupom fiscal e baixa os dados diretamente da SEFAZ
- **Categorização automática** — 15 categorias de produtos detectadas por keywords
- **Dashboard mensal** — total gasto, variação vs. mês anterior, barras por categoria
- **Histórico filtrado** — por estabelecimento, período e tipo de compra
- **Relatórios** — gráfico donut por categoria, barras por loja, tendência mensal
- **Metas de orçamento** — defina limites por categoria com alertas automáticos
- **Liberdade de Sexta** — notificação toda sexta às 17h com o quanto você economizou convertido em lazer real
- **Exportação Pro** — PDF, CSV e Excel com resumo do período
- **Offline-first** — funciona sem internet, sincroniza quando reconectar

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Mobile | React Native + Expo + Expo Router |
| Estilo | NativeWind (Tailwind para RN) |
| Estado | Zustand |
| Backend | NestJS + Prisma |
| Banco | PostgreSQL |
| Scraping | Puppeteer + Cheerio |
| Auth | JWT + Passport |
| Notificações | Expo Push Notifications |

---

## Estrutura do Monorepo

```
comprei-app/
├── apps/
│   ├── mobile/          # Expo / React Native
│   └── backend/         # NestJS API
├── package.json         # npm workspaces (raiz)
└── docker-compose.yml   # PostgreSQL local
```

---

## Como rodar localmente

### Pré-requisitos

- Node.js 18+
- Docker + Docker Compose
- (opcional) Expo Go no celular ou emulador Android/iOS

### 1. Clonar e instalar dependências

```bash
git clone https://github.com/SEU_USER/comprei-app.git
cd comprei-app
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp apps/backend/.env.example apps/backend/.env
# Editar apps/backend/.env com suas credenciais
```

### 3. Subir o banco de dados

```bash
npm run db:up
```

### 4. Aplicar migrations e gerar Prisma Client

```bash
cd apps/backend
npx prisma migrate dev
npx prisma generate
cd ../..
```

### 5. Iniciar backend

```bash
npm run dev:backend
```

### 6. Iniciar app mobile (em outro terminal)

```bash
npm run dev:mobile
# ou: cd apps/mobile && npx expo start
```

Escaneie o QR Code com o Expo Go ou pressione `a` para abrir no emulador Android.

---

## Variáveis de Ambiente

Veja [`apps/backend/.env.example`](apps/backend/.env.example) para a lista completa.

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | Connection string PostgreSQL |
| `JWT_SECRET` | Secret para assinar tokens JWT (mín. 32 chars) |
| `PORT` | Porta do servidor (padrão: 3000) |
| `NODE_ENV` | `development` ou `production` |
| `PUPPETEER_EXECUTABLE_PATH` | Caminho do Chromium (vazio = usa bundled) |
| `EXPO_ACCESS_TOKEN` | Token Expo para push em produção |

---

## Comandos úteis

```bash
# Monorepo (raiz)
npm run dev:backend       # Backend com hot reload
npm run dev:mobile        # Expo dev server
npm run db:up             # Sobe PostgreSQL via Docker
npm run db:down           # Para o container

# Backend
cd apps/backend
npx prisma studio         # UI visual do banco
npx prisma migrate dev    # Criar/aplicar migrations
npm run test              # Testes unitários

# Mobile
cd apps/mobile
npx expo start --android  # Abre no emulador Android
npx expo start --ios      # Abre no simulador iOS
```

---

## Planos

| Feature | Gratuito | Pro (R$4,99/mês) |
|---------|----------|-----------------|
| Notas por mês | 20 | Ilimitado |
| Histórico | 30 dias | Completo |
| Relatórios avançados | — | ✅ |
| Alertas de orçamento | — | ✅ |
| Liberdade de Sexta | — | ✅ |
| Exportação PDF/CSV | — | ✅ |

---

## Contribuindo

Veja [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Licença

MIT © 2026 — veja [LICENSE](LICENSE).
