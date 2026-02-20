import axios from 'axios';
import { API_URL } from '../constants/api';
import { tokenStorage } from './storage';
import { databaseService, LocalInvoice } from './database';
import { syncService } from './sync';
import { useAuthStore } from '../store/authStore';
import { Invoice, InvoiceItem } from '../types';
import * as Crypto from 'expo-crypto';
const uuidv4 = () => Crypto.randomUUID();

function localToInvoice(local: LocalInvoice): Invoice {
    return {
        id: local.id,
        accessKey: local.accessKey || '',
        url: '',
        date: local.date,
        totalValue: local.total,
        establishmentName: local.storeName || 'Estabelecimento',
        items: local.items?.map(
            (item): InvoiceItem => ({
                id: item.id,
                quantity: item.quantity,
                unit: 'UN',
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
                product: item.product
                    ? {
                          id: item.product.id || '',
                          code: item.productEan,
                          description: item.product.name,
                          categoryId: item.product.categoryId || null,
                          category: item.product.category
                              ? { ...item.product.category, keywords: [] }
                              : null,
                      }
                    : undefined,
            }),
        ),
    };
}

export const invoiceService = {
    // Fluxo novo: QR URL → backend processa tudo → retorna invoice salvo
    scanQrCode: async (qrCodeUrl: string) => {
        const token = await tokenStorage.getItem('userToken');
        const response = await axios.post(
            `${API_URL}/invoices/scan`,
            { qrCodeUrl },
            { headers: { Authorization: `Bearer ${token}` }, timeout: 60000 },
        );
        return response.data as { status: 'success' | 'duplicate'; message: string; invoice: Invoice };
    },

    // Requires network — used by scanner flow
    scan: async (url: string) => {
        const token = await tokenStorage.getItem('userToken');
        const response = await axios.post(
            `${API_URL}/invoices`,
            { url },
            { headers: { Authorization: `Bearer ${token}` } },
        );
        return response.data;
    },

    // Requires network — scrapes SEFAZ
    preview: async (url: string) => {
        const token = await tokenStorage.getItem('userToken');
        const response = await axios.post(
            `${API_URL}/invoices/preview`,
            { url },
            { headers: { Authorization: `Bearer ${token}` } },
        );
        return response.data;
    },

    // Offline-first: try API, fall back to local save
    create: async (invoiceData: any): Promise<Invoice> => {
        const token = await tokenStorage.getItem('userToken');
        const userId = useAuthStore.getState().user?.id;

        try {
            const response = await axios.post(
                `${API_URL}/invoices`,
                invoiceData,
                { headers: { Authorization: `Bearer ${token}` } },
            );
            const saved: Invoice = response.data;

            // Cache in local DB
            if (userId) {
                await databaseService
                    .createInvoice({
                        id: saved.id!,
                        userId,
                        accessKey: saved.accessKey || invoiceData.accessKey || null,
                        storeName: saved.establishmentName || invoiceData.establishmentName || null,
                        storeCnpj: null,
                        date: saved.date || invoiceData.date,
                        total: Number(saved.totalValue ?? invoiceData.totalValue),
                        status: 'saved',
                        synced: 1,
                        syncError: null,
                        localOnly: 0,
                    })
                    .catch(() => {});
            }

            return saved;
        } catch {
            // Offline: save locally and queue for sync
            if (!userId) {
                throw new Error('Usuário não autenticado');
            }

            const localId = uuidv4();

            await databaseService.createInvoice({
                id: localId,
                userId,
                accessKey: invoiceData.accessKey || null,
                storeName: invoiceData.establishmentName || null,
                storeCnpj: null,
                date: invoiceData.date,
                total: Number(invoiceData.totalValue),
                status: 'pending',
                synced: 0,
                syncError: null,
                localOnly: 1,
            });

            for (const item of invoiceData.items || []) {
                const ean = item.code || item.product?.code || `local-${uuidv4()}`;
                await databaseService.createProduct({
                    id: uuidv4(),
                    ean,
                    name: item.description || item.product?.description || 'Produto',
                    description: item.product?.description || null,
                    categoryId: item.product?.categoryId || null,
                });
                await databaseService.createInvoiceItem({
                    id: uuidv4(),
                    invoiceId: localId,
                    productEan: ean,
                    quantity: Number(item.quantity),
                    unitPrice: Number(item.unitPrice),
                    totalPrice: Number(item.totalPrice),
                    synced: 0,
                });
            }

            await databaseService.addToSyncQueue('invoice', localId, 'create_invoice', invoiceData);

            return {
                id: localId,
                accessKey: invoiceData.accessKey || '',
                url: invoiceData.url || '',
                date: invoiceData.date,
                totalValue: Number(invoiceData.totalValue),
                establishmentName: invoiceData.establishmentName || '',
                items: invoiceData.items,
            };
        }
    },

    // Offline-first reads: try API, fall back to local DB
    findAll: async (): Promise<Invoice[]> => {
        const token = await tokenStorage.getItem('userToken');
        try {
            const response = await axios.get(`${API_URL}/invoices`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return response.data;
        } catch {
            const userId = useAuthStore.getState().user?.id;
            if (!userId) return [];
            const locals = await databaseService.getInvoices(userId);
            return locals.map(localToInvoice);
        }
    },

    findOne: async (id: string): Promise<Invoice> => {
        // Check local DB first (works offline + faster)
        const local = await databaseService.getInvoiceById(id);
        if (local) return localToInvoice(local);

        // Fall back to API
        const token = await tokenStorage.getItem('userToken');
        const response = await axios.get(`${API_URL}/invoices/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    },

    deleteInvoice: async (id: string) => {
        // Always remove from local first (instant UI response)
        await databaseService.deleteInvoice(id).catch(() => {});

        const online = await syncService.isOnline();
        if (online) {
            const token = await tokenStorage.getItem('userToken');
            try {
                await axios.delete(`${API_URL}/invoices/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            } catch {
                // Already removed locally; no need to re-queue if it was local-only
            }
        } else {
            await databaseService.addToSyncQueue('invoice', id, 'delete_invoice', { id });
        }
    },
};
