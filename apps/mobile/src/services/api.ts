import axios from 'axios';
import { API_URL } from '../constants/api';
import { tokenStorage } from './storage';

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(async (config) => {
    const token = await tokenStorage.getItem('userToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
