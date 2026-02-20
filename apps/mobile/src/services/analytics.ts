import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
const uuidv4 = () => Crypto.randomUUID();
import { api } from './api';

const SESSION_KEY = '@comprei:session_id';

export const analyticsService = {
    async getSessionId(): Promise<string> {
        let sessionId = await AsyncStorage.getItem(SESSION_KEY);
        if (!sessionId) {
            sessionId = uuidv4();
            await AsyncStorage.setItem(SESSION_KEY, sessionId);
        }
        return sessionId;
    },

    async trackOnboarding(step: number, action: string, metadata?: Record<string, unknown>) {
        try {
            const sessionId = await this.getSessionId();
            await api.post('/analytics/onboarding', { sessionId, step, action, metadata });
        } catch {
            // Fire-and-forget — never block the UI for analytics
        }
    },
};
