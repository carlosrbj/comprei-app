# FASE 3 — Comparador de Preços entre Lojas

**Status:** ✅ Concluída em 20/02/2026

---

## Objetivo

Permitir que o usuário veja, para cada produto que já comprou, em qual loja estava mais barato e qual a variação de preço ao longo do tempo. Transforma o histórico de NF-e em inteligência de compra ativa.

---

## Problema

O usuário já escaneou dezenas de notas de diferentes supermercados. Mas não tem como saber se o arroz está mais barato no Atacadão ou no Carrefour — esses dados já estão no banco, só precisam ser surfaçados.

---

## Funcionalidades

### 3.1 Backend — Histórico de preços por produto

**Endpoint:** `GET /products/price-history?name=arroz&limit=10`

Retorna os últimos N registros de preço do produto (agrupado por nome normalizado), com loja, data e valor unitário.

```json
{
  "product": "ARROZ TIOPINHO 5KG",
  "normalized": "arroz tiopinho 5kg",
  "history": [
    { "store": "Atacadão", "price": 22.90, "date": "2026-02-15", "unit": "5kg" },
    { "store": "Carrefour", "price": 25.50, "date": "2026-02-10", "unit": "5kg" },
    { "store": "Atacadão", "price": 23.50, "date": "2026-01-28", "unit": "5kg" }
  ],
  "cheapest": { "store": "Atacadão", "avgPrice": 23.20 },
  "mostExpensive": { "store": "Carrefour", "avgPrice": 25.50 },
  "savingsPotential": 2.30
}
```

**Endpoint:** `GET /products/compare?name=arroz` — comparação direta entre lojas para o produto.

**Endpoint:** `GET /products/top-savings` — produtos onde a diferença de preço entre lojas é maior (oportunidades de economia).

### 3.2 Backend — Normalização de nomes

Problema: "ARROZ TIOPINHO 5KG", "ARROZ TIPO 1 5 KG" e "ARR TIOPINHO 5KG" são o mesmo produto escrito de formas diferentes.

Estratégia:
1. Lowercase + remove acentos + remove caracteres especiais
2. Remove palavras genéricas: "tipo", "un", "cx", "pct", "kg"
3. Fuzzy match com distância de Levenshtein ≤ 2 para agrupar variantes

### 3.3 Mobile — Tela de Comparador

**Rota:** `/(app)/compare.tsx` (nova tab ou acessível do produto)

**UX:**
- Campo de busca de produto com autocomplete dos produtos já comprados
- Card de comparação: loja A vs loja B — preço médio, última compra, variação %
- Destaque visual na loja mais barata (badge verde "Melhor preço")
- Botão "Adicionar à lista de compras" (futura feature)

**Widget no Dashboard:**
- Card "💡 Você pode economizar R$ X" com o top-3 de oportunidades de troca de loja

---

## Arquivos a Criar

### Backend
```
apps/backend/src/
└── products/
    ├── products.controller.ts    # GET /products/price-history, /compare, /top-savings
    ├── products.service.ts       # Lógica de comparação + normalização
    ├── products.module.ts        # Módulo NestJS
    └── price-normalizer.ts       # Utilitário de normalização de nomes
```

### Mobile
```
apps/mobile/
├── app/(app)/compare.tsx         # Tela principal do comparador
└── src/
    ├── components/
    │   └── PriceCompareCard.tsx  # Card de comparação loja A vs loja B
    └── services/
        └── products.ts           # Service para /products endpoints
```

---

## Schema Prisma — Sem mudanças necessárias

Os dados já estão no modelo `InvoiceItem` (preço unitário, descrição do produto) e `Invoice` (estabelecimento). A comparação é feita via queries agregadas — não precisamos de um novo modelo.

---

## Critérios de Aceite

- [ ] Buscar por nome de produto retorna histórico com pelo menos 2 lojas diferentes
- [ ] Loja mais barata destacada visualmente na UI
- [ ] Widget "Economize R$ X" aparece no dashboard quando há oportunidades
- [ ] Normalização une variantes do mesmo produto (fuzzy match)
- [ ] Feature disponível apenas no plano Pro (guard `@RequiresPlan('pro')`)

---

## Estimativa de Complexidade

**Médio** — A lógica mais complexa é a normalização de nomes de produtos (os dados da SEFAZ têm formatação inconsistente). O resto é query SQL + UI de comparação.
