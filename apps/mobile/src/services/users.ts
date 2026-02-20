import axios from 'axios';
import { API_URL } from '../constants/api';
import { tokenStorage } from './storage';

export interface UserProfile {
    id: string;
    email: string;
    name: string | null;
    plan: string;
    planExpiresAt: string | null;
    createdAt: string;
}

export interface Badge {
    id: string;
    emoji: string;
    name: string;
    description: string;
    unlocked: boolean;
}

export interface UserStats {
    invoiceCount: number;
    streak: number;
    savings: number;
    badges: Badge[];
}

const getAuthHeaders = async () => {
    const token = await tokenStorage.getItem('userToken');
    return { Authorization: `Bearer ${token}` };
};

export const usersService = {
    async getProfile(): Promise<UserProfile> {
        const headers = await getAuthHeaders();
        const { data } = await axios.get(`${API_URL}/users/me`, { headers });
        return data;
    },

    async getStats(): Promise<UserStats> {
        const headers = await getAuthHeaders();
        const { data } = await axios.get(`${API_URL}/users/me/stats`, { headers });
        return data;
    },
};
