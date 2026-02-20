import axios from 'axios';
import { API_URL } from '../constants/api';
import { tokenStorage } from './storage';

export interface ReportSummary {
    totalSpent: number;
    invoiceCount: number;
    avgTicket: number;
    estimatedSavings: number;
    totalVariation: number;
    ticketVariation: number;
    period: { startDate: string; endDate: string };
}

export interface CategoryData {
    name: string;
    emoji: string;
    color: string;
    total: number;
    percentage: number;
}

export interface StoreData {
    name: string;
    total: number;
}

export interface TrendData {
    month: string;
    monthLabel: string;
    total: number;
}

export interface InflationData {
    name: string;
    currentPrice: number;
    lastPrice: number;
    variation: number;
}

const getAuthHeaders = async () => {
    const token = await tokenStorage.getItem('userToken');
    return { Authorization: `Bearer ${token}` };
};

export const reportsService = {
    async getSummary(period: string = 'current'): Promise<ReportSummary> {
        const headers = await getAuthHeaders();
        const { data } = await axios.get(`${API_URL}/reports/summary`, {
            params: { period },
            headers,
        });
        return data;
    },

    async getByCategory(period: string = 'current'): Promise<CategoryData[]> {
        const headers = await getAuthHeaders();
        const { data } = await axios.get(`${API_URL}/reports/by-category`, {
            params: { period },
            headers,
        });
        return data;
    },

    async getByStore(period: string = 'current'): Promise<StoreData[]> {
        const headers = await getAuthHeaders();
        const { data } = await axios.get(`${API_URL}/reports/by-store`, {
            params: { period },
            headers,
        });
        return data;
    },

    async getTrend(months: number = 6): Promise<TrendData[]> {
        const headers = await getAuthHeaders();
        const { data } = await axios.get(`${API_URL}/reports/trend`, {
            params: { months },
            headers,
        });
        return data;
    },

    async getInflation(limit: number = 10): Promise<InflationData[]> {
        const headers = await getAuthHeaders();
        const { data } = await axios.get(`${API_URL}/reports/inflation`, {
            params: { limit },
            headers,
        });
        return data;
    },
};
