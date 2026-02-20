import { create } from 'zustand';
import { tokenStorage } from '../services/storage';
import axios from 'axios';
import { API_URL } from '../constants/api';

interface User {
    id: string;
    email: string;
    name: string;
    plan?: string;
    referralCode?: string;
}

interface AuthState {
    token: string | null;
    user: User | null;
    isLoading: boolean;
    signIn: (email: string, pass: string) => Promise<void>;
    signOut: () => Promise<void>;
    restoreToken: () => Promise<void>;
    signUp: (email: string, pass: string, name?: string, referredBy?: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    token: null,
    user: null,
    isLoading: true,
    signIn: async (email, password) => {
        try {
            const response = await axios.post(`${API_URL}/auth/login`, { email, password });
            const { access_token, user } = response.data;
            await tokenStorage.setItem('userToken', access_token);
            set({ token: access_token, user, isLoading: false });
        } catch (error) {
            console.error('Login failed', error);
            throw error;
        }
    },
    signOut: async () => {
        await tokenStorage.removeItem('userToken');
        set({ token: null, user: null, isLoading: false });
    },
    restoreToken: async () => {
        try {
            const token = await tokenStorage.getItem('userToken');
            if (token) {
                // Optionally validate token with backend here
                try {
                    const response = await axios.get(`${API_URL}/auth/profile`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    set({ token, user: response.data, isLoading: false });
                } catch (e) {
                    console.error('Token validation failed', e);
                    await tokenStorage.removeItem('userToken');
                    set({ token: null, user: null, isLoading: false });
                }
            } else {
                set({ token: null, user: null, isLoading: false });
            }
        } catch (error) {
            console.error('Restore token failed', error);
            set({ token: null, user: null, isLoading: false });
        }
    },
    signUp: async (email, password, name, referredBy) => {
        await axios.post(`${API_URL}/auth/register`, { email, password, name, referredBy: referredBy || undefined });
    }
}));
