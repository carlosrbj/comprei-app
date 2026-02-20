import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Prioridade: variável de ambiente de build (EAS) > app.json extra > fallback
const buildApiUrl = Constants.expoConfig?.extra?.apiUrl as string | undefined;

const PRODUCTION_URL = 'https://api-production-8888.up.railway.app';

const fallbackUrl =
    __DEV__ && Platform.OS === 'android'
        ? 'http://10.0.2.2:3000'   // Android Emulator → host machine em dev local
        : __DEV__ && Platform.OS !== 'web'
        ? 'http://localhost:3000'  // iOS Simulator em dev local
        : PRODUCTION_URL;          // Web ou produção → Railway

export const API_URL = buildApiUrl ?? fallbackUrl;
