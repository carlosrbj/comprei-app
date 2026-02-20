import axios from 'axios';
import { API_URL } from '../constants/api';
import { tokenStorage } from './storage';

export interface FridaySuggestion {
    emoji: string;
    text: string;
    value: number;
}

export interface FridayData {
    savedAmount: number;
    categoryBreakdown: Record<string, number>;
    totalSuperfluous: number;
    lastWeekSuperfluous: number;
    suggestions: FridaySuggestion[];
    weekStart: string;
    weekEnd: string;
}

export interface FridayNotification {
    id: string;
    weekStartDate: string;
    weekEndDate: string;
    savedAmount: number;
    categories: Record<string, number>;
    suggestions: FridaySuggestion[];
    messageTemplate: string;
    sentAt: string;
    opened: boolean;
}

const getAuthHeaders = async () => {
    const token = await tokenStorage.getItem('userToken');
    return { Authorization: `Bearer ${token}` };
};

export const fridayService = {
    async getCurrentWeek(): Promise<FridayData> {
        const headers = await getAuthHeaders();
        const { data } = await axios.get(`${API_URL}/friday/current`, { headers });
        return data;
    },

    async getHistory(): Promise<FridayNotification[]> {
        const headers = await getAuthHeaders();
        const { data } = await axios.get(`${API_URL}/friday/history`, { headers });
        return data;
    },

    async sendNow(): Promise<any> {
        const headers = await getAuthHeaders();
        const { data } = await axios.post(`${API_URL}/friday/send-now`, {}, { headers });
        return data;
    },
};
