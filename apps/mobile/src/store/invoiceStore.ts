import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Invoice } from '../types';

interface InvoiceState {
    invoices: Invoice[];
    setInvoices: (invoices: Invoice[]) => void;
    addInvoice: (invoice: Invoice) => void;
    clearInvoices: () => void;
    deleteInvoice: (id: string) => Promise<void>;
    previewData: Invoice | null;
    setPreviewData: (data: Invoice | null) => void;
}

export const useInvoiceStore = create<InvoiceState>()(
    persist(
        (set) => ({
            invoices: [],
            setInvoices: (invoices) => set({ invoices }),
            addInvoice: (invoice) => set((state) => {
                // Prevent duplicates
                const exists = state.invoices.some((i) => i.id === invoice.id);
                if (exists) return state;
                return { invoices: [invoice, ...state.invoices] };
            }),
            deleteInvoice: async (id) => {
                // Optimistic update
                set((state) => ({
                    invoices: state.invoices.filter((i) => i.id !== id)
                }));
            },
            previewData: null,
            setPreviewData: (data) => set({ previewData: data }),
            clearInvoices: () => set({ invoices: [] }),
        }),
        {
            name: 'invoice-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
