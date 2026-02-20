import axios from 'axios';
import { API_URL } from '../constants/api';
import { tokenStorage } from './storage';

export interface Plan {
    id: string;
    name: string;
    price: number;
    currency: string;
    interval: 'month' | 'year';
    discount?: string;
    features: string[];
}

export interface PlansResponse {
    plans: Plan[];
    free: {
        limits: {
            invoicesPerMonth: number;
            historyDays: number;
            categories: number;
        };
    };
}

export interface CheckoutResponse {
    url: string | null;
    sessionId?: string;
    simulated?: boolean;
    plan?: string;
    expiresAt?: string;
}

export interface SubscriptionStatus {
    plan: string;
    expiresAt: string | null;
    subscription: {
        id: string;
        plan: string;
        status: string;
        currentPeriodEnd: string;
        cancelAtPeriodEnd: boolean;
    } | null;
}

const getAuthHeaders = async () => {
    const token = await tokenStorage.getItem('userToken');
    return { Authorization: `Bearer ${token}` };
};

export const paymentsService = {
    async getPlans(): Promise<PlansResponse> {
        const { data } = await axios.get(`${API_URL}/payments/plans`);
        return data;
    },

    async createCheckout(plan: 'pro_monthly' | 'pro_annual'): Promise<CheckoutResponse> {
        const headers = await getAuthHeaders();
        const { data } = await axios.post(
            `${API_URL}/payments/checkout`,
            { plan },
            { headers },
        );
        return data;
    },

    async getSubscription(): Promise<SubscriptionStatus> {
        const headers = await getAuthHeaders();
        const { data } = await axios.get(`${API_URL}/payments/subscription`, { headers });
        return data;
    },
};
