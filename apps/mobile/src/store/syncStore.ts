import { create } from 'zustand';
import { syncService, SyncStatus } from '../services/sync';

interface SyncState extends SyncStatus {
    sync: () => Promise<void>;
    reset: () => void;
}

export const useSyncStore = create<SyncState>((set, get) => ({
    isSyncing: false,
    lastSyncAt: null,
    unsyncedCount: 0,
    error: null,

    sync: async () => {
        if (get().isSyncing) return;
        set({ isSyncing: true, error: null });
        try {
            const status = await syncService.syncAll();
            set(status);
        } catch (error: any) {
            set({ isSyncing: false, error: error.message || 'Sync failed' });
        }
    },

    reset: () => set({ isSyncing: false, lastSyncAt: null, unsyncedCount: 0, error: null }),
}));
