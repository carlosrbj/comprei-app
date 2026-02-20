import { api } from './api';

export interface Budget {
    id: string;
    categoryId: string | null;
    category?: {
        id: string;
        name: string;
        emoji: string;
        color: string;
    };
    amount: number;
    period: string;
    currentSpent: number;
    // Campos calculados (retornados pelo backend)
    spent: number;
    percentage: number;
    remaining: number;
    isOver: boolean;
    daysLeftInPeriod: number;
}

export interface BudgetSuggestion {
    categoryId: string;
    categoryName: string;
    emoji: string;
    color: string;
    averageSpent: number;
    suggestedBudget: number;
}

export interface BudgetHistory {
    id: string;
    month: string;
    targetAmount: number;
    spentAmount: number;
    percentage: number;
    achieved: boolean;
}

export const budgetsService = {
    async getBudgets(): Promise<Budget[]> {
        const { data } = await api.get('/budgets');
        return data;
    },

    async setBudget(categoryId: string | null, amount: number, period = 'monthly') {
        const { data } = await api.post('/budgets', { categoryId, amount, period });
        return data;
    },

    async deleteBudget(budgetId: string) {
        await api.delete(`/budgets/${budgetId}`);
    },

    async getSuggestions(): Promise<BudgetSuggestion[]> {
        const { data } = await api.get('/budgets/suggestions');
        return data;
    },

    async getHistory(): Promise<BudgetHistory[]> {
        const { data } = await api.get('/budgets/history');
        return data;
    },
};
