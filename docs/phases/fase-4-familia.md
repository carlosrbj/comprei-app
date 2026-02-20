# FASE 4 — Modo Família

**Status:** 📋 Planejada (P2)

---

## Objetivo

Permitir que até 4 membros de uma família compartilhem o mesmo histórico de notas e orçamento. Aumenta o ticket médio (plano Anual exclusivo) e a retenção (usuário não cancela se família usa).

---

## Modelo de Negócio

- Disponível apenas no **Plano Anual** (R$ 39,99/ano)
- Até 4 membros por família
- O criador do grupo é o "dono" — paga o plano
- Membros convidados têm acesso ao histórico compartilhado mas mantêm perfil próprio

---

## Funcionalidades

### 4.1 Gerenciamento do Grupo

- Criar grupo familiar com nome (ex: "Família Rodrigues")
- Convidar por e-mail — link de convite válido por 7 dias
- Ver membros ativos + status de convite pendente
- Remover membro (só o dono)
- Sair do grupo (membro)

### 4.2 Histórico Compartilhado

- Notas de todos os membros aparecem no histórico compartilhado
- Indicação de qual membro fez a compra (avatar/inicial)
- Filtro por membro no histórico e relatórios
- Orçamento compartilhado: limite do grupo, consumo por membro

### 4.3 Dashboard Familiar

- Total gasto pelo grupo no mês
- Breakdown por membro (quem gastou quanto)
- Categorias do grupo (consolidado de todos os membros)

---

## Schema Prisma — Novos modelos

```prisma
model FamilyGroup {
  id        String         @id @default(cuid())
  name      String
  ownerId   String
  owner     User           @relation("FamilyOwner", fields: [ownerId], references: [id])
  members   FamilyMember[]
  invites   FamilyInvite[]
  createdAt DateTime       @default(now())
}

model FamilyMember {
  id        String      @id @default(cuid())
  groupId   String
  userId    String
  group     FamilyGroup @relation(fields: [groupId], references: [id])
  user      User        @relation(fields: [userId], references: [id])
  joinedAt  DateTime    @default(now())

  @@unique([groupId, userId])
}

model FamilyInvite {
  id        String      @id @default(cuid())
  groupId   String
  email     String
  token     String      @unique @default(cuid())
  expiresAt DateTime
  accepted  Boolean     @default(false)
  group     FamilyGroup @relation(fields: [groupId], references: [id])
  createdAt DateTime    @default(now())
}
```

---

## Arquivos a Criar

### Backend
```
apps/backend/src/
└── family/
    ├── family.controller.ts    # CRUD grupo + convites + membros
    ├── family.service.ts       # Lógica de negócio
    ├── family.module.ts
    └── dto/
        ├── create-group.dto.ts
        └── invite-member.dto.ts
```

### Mobile
```
apps/mobile/
├── app/(app)/
│   ├── family.tsx              # Tela principal do grupo
│   ├── family/
│   │   ├── invite.tsx          # Convidar membro
│   │   └── members.tsx         # Gerenciar membros
└── src/services/
    └── family.ts               # Service para /family endpoints
```

---

## Fluxo de Convite

```
1. Dono digita e-mail do membro
2. Backend gera token único + salva FamilyInvite
3. Backend envia e-mail com link: https://comprei.app/join?token=XXX
4. Membro clica no link → app abre (deep link)
5. Se não tem conta → registro → join automático
6. Se tem conta → login → join automático
7. Notas futuras do membro aparecem no histórico compartilhado
```

---

## Critérios de Aceite

- [ ] Criar grupo com nome e convidar por e-mail
- [ ] Link de convite expira em 7 dias
- [ ] Notas de membros aparecem no histórico com indicação do autor
- [ ] Orçamento pode ser configurado por grupo (não só individual)
- [ ] Máximo 4 membros por grupo (validado no backend)
- [ ] Só disponível no plano Anual (guard `@RequiresPlan('annual')`)

---

## Estimativa de Complexidade

**Alto** — Envolve autenticação compartilhada, deep links, e-mail transacional e mudanças no modelo de dados de invoices (precisam ter `familyGroupId` opcional).
