import axios from 'axios';
import { API_URL } from '../constants/api';
import { tokenStorage } from './storage';

export interface PriceHistoryItem {
    store: string;
    price: number;
    date: string;
    description: string;
    unit: string;
}

export interface StoreComparison {
    name: string;
    avgPrice: number;
    minPrice: number;
    maxPrice: number;
    count: number;
    lastDate: string;
}

export interface CompareResult {
    product: string;
    stores: StoreComparison[];
    cheapest: { store: string; avgPrice: number } | null;
    mostExpensive: { store: string; avgPrice: number } | null;
    savingsPotential: number;
}

export interface SavingsOpportunity {
    product: string;
    cheapestStore: string;
    cheapestPrice: number;
    currentStore: string;
    currentPrice: number;
    savingsPotential: number;
    storeCount: number;
}

const getHeaders = async () => {
    const token = await tokenStorage.getItem('userToken');
    return { Authorization: `Bearer ${token}` };
};

export const productsService = {
    async search(q: string): Promise<string[]> {
        const headers = await getHeaders();
        const { data } = await axios.get(`${API_URL}/products/search`, {
            params: { q },
            headers,
        });
        return data;
    },

    async getPriceHistory(name: string, limit = 30): Promise<PriceHistoryItem[]> {
        const headers = await getHeaders();
        const { data } = await axios.get(`${API_URL}/products/price-history`, {
            params: { name, limit },
            headers,
        });
        return data;
    },

    async compare(name: string): Promise<CompareResult> {
        const headers = await getHeaders();
        const { data } = await axios.get(`${API_URL}/products/compare`, {
            params: { name },
            headers,
        });
        return data;
    },

    async getTopSavings(limit = 5): Promise<SavingsOpportunity[]> {
        const headers = await getHeaders();
        const { data } = await axios.get(`${API_URL}/products/top-savings`, {
            params: { limit },
            headers,
        });
        return data;
    },

    async getSavingsSummary(): Promise<{ totalPotential: number }> {
        const headers = await getHeaders();
        const { data } = await axios.get(`${API_URL}/products/savings-summary`, {
            headers,
        });
        return data;
    },
};
