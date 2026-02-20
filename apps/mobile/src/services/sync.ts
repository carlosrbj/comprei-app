import NetInfo from '@react-native-community/netinfo';
import { api } from './api';
import { databaseService } from './database';

export interface SyncStatus {
    isSyncing: boolean;
    lastSyncAt: Date | null;
    unsyncedCount: number;
    error: string | null;
}

const MAX_RETRIES = 3;

export const syncService = {
    async isOnline(): Promise<boolean> {
        const state = await NetInfo.fetch();
        return state.isConnected === true && state.isInternetReachable === true;
    },

    async syncInvoice(invoiceId: string, invoiceData: any): Promise<{ success: boolean; error?: string }> {
        try {
            await api.post('/invoices', invoiceData);
            await databaseService.updateInvoiceSyncStatus(invoiceId, 1);
            return { success: true };
        } catch (error: any) {
            const msg = error?.response?.data?.message || error.message || 'Sync failed';
            await databaseService.updateInvoiceSyncStatus(invoiceId, 0, msg);
            return { success: false, error: msg };
        }
    },

    async deleteInvoiceRemote(invoiceId: string): Promise<{ success: boolean; error?: string }> {
        try {
            await api.delete(`/invoices/${invoiceId}`);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    async syncAll(): Promise<SyncStatus> {
        const online = await this.isOnline();
        if (!online) {
            return {
                isSyncing: false,
                lastSyncAt: null,
                unsyncedCount: await databaseService.getUnsyncedCount(),
                error: 'Sem conexão',
            };
        }

        const queueItems = await databaseService.getSyncQueue();
        let syncedCount = 0;
        let errorCount = 0;

        for (const item of queueItems) {
            let result: { success: boolean; error?: string };

            if (item.operation === 'create_invoice') {
                result = await this.syncInvoice(item.entity_id, item.data);
            } else if (item.operation === 'delete_invoice') {
                result = await this.deleteInvoiceRemote(item.entity_id);
            } else {
                result = { success: true };
            }

            if (result.success) {
                await databaseService.removeSyncQueueItem(item.id);
                syncedCount++;
            } else {
                const newRetryCount = (item.retry_count || 0) + 1;
                if (newRetryCount >= MAX_RETRIES) {
                    await databaseService.removeSyncQueueItem(item.id);
                } else {
                    await databaseService.updateSyncQueueError(item.id, result.error || 'Unknown', newRetryCount);
                }
                errorCount++;
            }

            // Small delay between requests
            await new Promise((r) => setTimeout(r, 300));
        }

        const unsyncedCount = await databaseService.getUnsyncedCount();

        return {
            isSyncing: false,
            lastSyncAt: new Date(),
            unsyncedCount,
            error: errorCount > 0 ? `${errorCount} item(ns) com falha` : null,
        };
    },

    async downloadCategories() {
        try {
            const { data } = await api.get('/categories');
            await databaseService.syncCategories(data);
        } catch {
            // Silent — categories are optional for offline
        }
    },

    async downloadInvoices(userId: string) {
        try {
            const { data } = await api.get('/invoices');
            for (const invoice of data) {
                const existing = await databaseService.getInvoiceById(invoice.id);
                if (existing) continue;

                await databaseService.createInvoice({
                    id: invoice.id,
                    userId,
                    accessKey: invoice.accessKey || null,
                    storeName: invoice.establishmentName || null,
                    storeCnpj: null,
                    date: invoice.date,
                    total: Number(invoice.totalValue),
                    status: 'saved',
                    synced: 1,
                    syncError: null,
                    localOnly: 0,
                });

                for (const item of invoice.items || []) {
                    const ean = item.product?.code || `ean-${item.id}`;

                    if (item.product) {
                        await databaseService.createProduct({
                            id: item.product.id || `prod-${ean}`,
                            ean,
                            name: item.product.description || item.description || 'Produto',
                            description: item.product.description || null,
                            categoryId: item.product.categoryId || null,
                        });
                    }

                    await databaseService.createInvoiceItem({
                        id: item.id || `item-${Math.random()}`,
                        invoiceId: invoice.id,
                        productEan: ean,
                        quantity: Number(item.quantity),
                        unitPrice: Number(item.unitPrice),
                        totalPrice: Number(item.totalPrice),
                        synced: 1,
                    });
                }
            }
        } catch {
            // Silently fail — local data still usable
        }
    },

    async performInitialSync(userId: string) {
        const online = await this.isOnline();
        if (!online) return;

        await this.downloadCategories();
        await this.downloadInvoices(userId);
    },

    setupAutoSync(onSync: (status: SyncStatus) => void): () => void {
        const unsubscribe = NetInfo.addEventListener((state) => {
            if (state.isConnected && state.isInternetReachable) {
                this.syncAll().then(onSync).catch(() => {});
            }
        });
        return unsubscribe;
    },
};
