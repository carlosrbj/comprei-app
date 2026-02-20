import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const tokenStorage = {
    setItem: async (key: string, value: string) => {
        if (Platform.OS === 'web') {
            try {
                localStorage.setItem(key, value);
            } catch (e) {
                console.error('Local storage is not available:', e);
            }
        } else {
            await SecureStore.setItemAsync(key, value);
        }
    },
    getItem: async (key: string) => {
        if (Platform.OS === 'web') {
            try {
                return localStorage.getItem(key);
            } catch (e) {
                console.error('Local storage is not available:', e);
                return null;
            }
        } else {
            return await SecureStore.getItemAsync(key);
        }
    },
    removeItem: async (key: string) => {
        if (Platform.OS === 'web') {
            try {
                localStorage.removeItem(key);
            } catch (e) {
                console.error('Local storage is not available:', e);
            }
        } else {
            await SecureStore.deleteItemAsync(key);
        }
    },
};
