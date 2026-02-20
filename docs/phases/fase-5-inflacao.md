# FASE 5 — Inflação Pessoal e Previsão de Gastos

**Status:** ✅ Concluída em 20/02/2026

---

## Objetivo

Calcular a inflação real do usuário — não o IPCA genérico, mas quanto os produtos que *ele* compra subiram de preço ao longo dos meses. Gerar previsão do gasto do próximo mês com base no histórico.

---

## Por Que Isso é Valioso

O IPCA mede uma "cesta" genérica. Se você gasta mais em carnes e laticínios, sua inflação real pode ser 3× o IPCA oficial. Mostrar isso ao usuário é um insight genuinamente surpreendente e compartilhável ("minha inflação pessoal foi de 18% esse ano").

---

## Funcionalidades

### 5.1 Inflação Pessoal

**Cálculo:** Para cada produto recorrente (comprado pelo menos 3× em períodos diferentes), calcular a variação percentual do preço médio entre períodos.

```
Inflação pessoal = média ponderada das variações de preço
                   ponderada pelo gasto total em cada produto
```

**UI:**
- Card "📈 Sua inflação pessoal: +X.X% nos últimos 12 meses"
- Comparativo com IPCA do período (valor estático atualizado mensalmente)
- Top 5 produtos que mais subiram (com variação %)
- Top 5 produtos que ficaram mais baratos

### 5.2 Previsão de Gastos

**Modelo:** Média móvel dos últimos 3 meses ajustada por sazonalidade simples.

```
Previsão mês N = média(meses N-1, N-2, N-3)
                 × fator_sazonal(mês_do_ano)
```

Fator sazonal calculado a partir do histórico do próprio usuário (meses de dezembro e janeiro tendem a ser maiores).

**UI:**
- "Em janeiro você deve gastar aproximadamente R$ X"
- Barra de progresso do mês atual vs. previsão
- Alerta quando o usuário está no caminho de superar a previsão

### 5.3 Relatório Anual (Wrapped)

Inspirado no Spotify Wrapped — relatório anual compartilhável:
- Total gasto no ano
- Estabelecimento favorito
- Produto mais comprado
- Mês mais caro
- Inflação pessoal do ano
- Quanto economizou vs. se tivesse comprado na loja mais cara

Card visual compartilhável (imagem gerada no backend com `canvas` ou template HTML → screenshot).

---

## Arquivos a Criar

### Backend
```
apps/backend/src/
└── insights/
    ├── insights.controller.ts    # GET /insights/inflation, /forecast, /wrapped
    ├── insights.service.ts       # Cálculos de inflação e previsão
    ├── insights.module.ts
    └── inflation.calculator.ts   # Algoritmo de inflação pessoal
```

### Mobile
```
apps/mobile/
├── app/(app)/
│   ├── wrapped.tsx               # Relatório anual animado
│   └── inflation.tsx             # Dashboard de inflação pessoal
└── src/
    ├── components/
    │   ├── InflationCard.tsx      # Card de inflação pessoal
    │   └── ForecastBar.tsx        # Barra de previsão vs. real
    └── services/
        └── insights.ts            # Service para /insights endpoints
```

---

## Dependências Adicionais

### Backend
- `@napi-rs/canvas` ou `sharp` — geração de imagem para o Wrapped (opcional, pode ser HTML estático)

### Mobile
- `react-native-share` — compartilhamento do Wrapped como imagem
- `expo-image-manipulator` — captura de screenshot do card

---

## Critérios de Aceite

- [ ] Inflação pessoal calculada para usuários com 3+ meses de histórico
- [ ] Comparativo com IPCA exibido no card
- [ ] Previsão do próximo mês com margem de erro estimada
- [ ] Alerta push quando gasto ultrapassa 80% da previsão
- [ ] Wrapped Anual disponível em dezembro/janeiro
- [ ] Card do Wrapped compartilhável como imagem

---

## Estimativa de Complexidade

**Médio-Alto** — Os algoritmos são simples, mas a geração de imagem para o Wrapped e o compartilhamento têm complexidade de integração. O cálculo de inflação requer dados suficientes (mínimo 3 meses de histórico).
