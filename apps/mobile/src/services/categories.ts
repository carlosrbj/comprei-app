import { api } from './api';

export interface Category {
    id: string;
    name: string;
    emoji: string;
    color: string;
}

export const categoriesService = {
    async getCategories(): Promise<Category[]> {
        const { data } = await api.get('/categories');
        return data;
    },
};
