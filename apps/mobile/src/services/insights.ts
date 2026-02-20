import axios from 'axios';
import { API_URL } from '../constants/api';
import { tokenStorage } from './storage';

export interface ProductVariation {
    product: string;
    variation: number;
    oldAvgPrice: number;
    newAvgPrice: number;
}

export interface InflationData {
    personalInflation: number;
    ipcaReference: number;
    period: string;
    topRisers: ProductVariation[];
    topFallers: ProductVariation[];
    hasEnoughData: boolean;
    productCount: number;
}

export interface MonthlyTotal {
    month: string;
    label: string;
    total: number;
}

export interface ForecastData {
    currentMonth: string;
    currentSpent: number;
    forecast: number;
    progressPercent: number;
    daysLeft: number;
    projectedTotal: number;
    lastMonths: MonthlyTotal[];
    isOnTrack: boolean;
}

export interface CategoryBreakdown {
    name: string;
    emoji: string;
    total: number;
    percentage: number;
}

export interface WrappedData {
    year: number;
    totalSpent: number;
    invoiceCount: number;
    favoriteStore: string;
    favoriteStoreVisits: number;
    topProduct: string;
    topProductCount: number;
    mostExpensiveMonth: string;
    mostExpensiveMonthTotal: number;
    personalInflation: number;
    avgMonthlySpend: number;
    categoryBreakdown: CategoryBreakdown[];
}

export interface DashboardInsights {
    forecast: {
        forecast: number;
        currentSpent: number;
        progressPercent: number;
        daysLeft: number;
        isOnTrack: boolean;
    };
    ipca: number;
}

const getHeaders = async () => {
    const token = await tokenStorage.getItem('userToken');
    return { Authorization: `Bearer ${token}` };
};

export const insightsService = {
    async getInflation(): Promise<InflationData> {
        const headers = await getHeaders();
        const { data } = await axios.get(`${API_URL}/insights/inflation`, { headers });
        return data;
    },

    async getForecast(): Promise<ForecastData> {
        const headers = await getHeaders();
        const { data } = await axios.get(`${API_URL}/insights/forecast`, { headers });
        return data;
    },

    async getWrapped(year: number): Promise<WrappedData> {
        const headers = await getHeaders();
        const { data } = await axios.get(`${API_URL}/insights/wrapped`, {
            params: { year },
            headers,
        });
        return data;
    },

    async getDashboard(): Promise<DashboardInsights> {
        const headers = await getHeaders();
        const { data } = await axios.get(`${API_URL}/insights/dashboard`, { headers });
        return data;
    },
};
