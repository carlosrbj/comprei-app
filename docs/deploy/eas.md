# Deploy — Mobile (EAS Build)

O app Comprei usa [Expo Application Services (EAS)](https://expo.dev/eas) para builds Android e iOS. Builds são disparados manualmente via CLI.

---

## Pré-requisitos

```bash
npm install -g eas-cli
eas login
```

---

## Perfis de Build (`apps/mobile/eas.json`)

| Perfil | Uso | Output |
|--------|-----|--------|
| `development` | Dev client (hot reload no dispositivo real) | APK interno |
| `preview` | Testes internos / beta | APK (Android) |
| `production` | Release para stores | APK/AAB assinado |

---

## Build Android

```bash
cd apps/mobile

# Preview (APK para testes — compartilhar via QR Code)
eas build --profile preview --platform android

# Produção (APK assinado)
eas build --profile production --platform android
```

### Keystore

O keystore está em `apps/mobile/credentials/comprei.keystore` (ignorado pelo git).

O `eas.json` usa `"credentialsSource": "local"` no perfil production — o keystore é lido localmente durante o build.

Configurações do keystore (em `credentials.json`, também ignorado pelo git):
- `keystorePath`: `credentials/comprei.keystore`
- `keyAlias`: `comprei-key`

---

## Build iOS (futuro)

```bash
eas build --profile production --platform ios
```

Requer:
- Conta Apple Developer (US$ 99/ano)
- Certificados e provisioning profiles (EAS gerencia automaticamente)

---

## Submit para Stores (futuro)

```bash
# Google Play Store
eas submit --platform android --latest

# App Store (após build iOS)
eas submit --platform ios --latest
```

---

## Update Over-the-Air (OTA)

Para atualizações de JS sem novo build:

```bash
eas update --branch production --message "Fix: correção no scanner"
```

> OTA não funciona para mudanças nativas (novos módulos, permissões, splash screen).

---

## Variáveis de Ambiente Mobile

O app mobile lê a URL da API de `apps/mobile/src/constants/api.ts`. Para produção, alterar `API_URL` para a URL do Railway.

> Alternativa futura: usar `eas.json` com `env` por perfil para injetar `EXPO_PUBLIC_API_URL` em build time.
