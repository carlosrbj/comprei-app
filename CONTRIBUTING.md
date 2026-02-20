# Como Contribuir

Obrigado por querer contribuir com o Comprei! Este guia cobre o fluxo básico.

---

## 1. Fork e clone

```bash
# Fork via GitHub, depois:
git clone https://github.com/SEU_USER/comprei-app.git
cd comprei-app
npm install
```

## 2. Crie uma branch

Use o padrão `tipo/descricao-curta`:

```bash
git checkout -b feat/comparador-de-precos
git checkout -b fix/calculo-total-preview
git checkout -b refactor/formatacao-moeda
```

## 3. Faça suas alterações

- Siga as convenções em [CLAUDE.md](CLAUDE.md) (nomenclatura, design tokens, regras de estilo)
- Não hardcode cores — use `COLORS` de `src/constants/colors.ts`
- Não use `any` sem justificativa — tipagem adequada com interfaces de `src/types/`
- Remova `console.log` antes de commitar

## 4. Commits (Conventional Commits)

```
feat: adiciona componente DonutChart na tela de relatórios
fix: corrige cálculo de total quando item é removido no preview
refactor: extrai lógica de formatação de moeda para utils/currency.ts
style: aplica paleta Fresh Finance no dashboard
chore: adiciona expo-haptics ao package.json
docs: atualiza CLAUDE.md com novas rotas
```

Formato: `tipo(escopo opcional): descrição em minúsculas`

Tipos válidos: `feat`, `fix`, `refactor`, `style`, `chore`, `docs`, `test`, `perf`

## 5. Abra um Pull Request

- Base branch: `main`
- Título seguindo Conventional Commits
- Descreva **o que** muda e **por quê**
- Se for UI, inclua screenshot ou vídeo curto

---

## Dúvidas?

Abra uma [Issue](https://github.com/SEU_USER/comprei-app/issues) com o label `question`.
