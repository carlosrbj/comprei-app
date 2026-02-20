import { getDatabase } from '../database/schema';

export interface LocalCategory {
    id: string;
    name: string;
    emoji: string;
    color: string;
}

export interface LocalProduct {
    id: string;
    ean: string;
    name: string;
    description: string | null;
    categoryId: string | null;
    category?: LocalCategory;
}

export interface LocalInvoiceItem {
    id: string;
    invoiceId: string;
    productEan: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    synced: number;
    product?: LocalProduct;
}

export interface LocalInvoice {
    id: string;
    userId: string;
    accessKey: string | null;
    storeName: string | null;
    storeCnpj: string | null;
    date: string;
    total: number;
    status: string;
    synced: number;
    syncError: string | null;
    localOnly: number;
    createdAt: string;
    updatedAt: string;
    items?: LocalInvoiceItem[];
}

// Raw row type matching SQL column names
interface InvoiceRow {
    id: string;
    user_id: string;
    access_key: string | null;
    store_name: string | null;
    store_cnpj: string | null;
    date: string;
    total: number;
    status: string;
    synced: number;
    sync_error: string | null;
    local_only: number;
    created_at: string;
    updated_at: string;
}

interface ItemRow {
    id: string;
    invoice_id: string;
    product_ean: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    synced: number;
    product_name?: string;
    category_id?: string;
    category_name?: string;
    category_emoji?: string;
    category_color?: string;
}

function rowToInvoice(row: InvoiceRow): LocalInvoice {
    return {
        id: row.id,
        userId: row.user_id,
        accessKey: row.access_key,
        storeName: row.store_name,
        storeCnpj: row.store_cnpj,
        date: row.date,
        total: row.total,
        status: row.status,
        synced: row.synced,
        syncError: row.sync_error,
        localOnly: row.local_only,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function rowToItem(row: ItemRow): LocalInvoiceItem {
    return {
        id: row.id,
        invoiceId: row.invoice_id,
        productEan: row.product_ean,
        quantity: row.quantity,
        unitPrice: row.unit_price,
        totalPrice: row.total_price,
        synced: row.synced,
        product: row.product_name
            ? {
                  id: '',
                  ean: row.product_ean,
                  name: row.product_name,
                  description: null,
                  categoryId: row.category_id || null,
                  category: row.category_name
                      ? {
                            id: row.category_id || '',
                            name: row.category_name,
                            emoji: row.category_emoji || '',
                            color: row.category_color || '',
                        }
                      : undefined,
              }
            : undefined,
    };
}

export const databaseService = {
    // ─── CATEGORIES ───

    async syncCategories(categories: any[]) {
        const db = await getDatabase();
        for (const cat of categories) {
            await db.runAsync(
                `INSERT OR REPLACE INTO categories (id, name, emoji, color, keywords, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    cat.id,
                    cat.name,
                    cat.emoji,
                    cat.color,
                    JSON.stringify(cat.keywords || []),
                    cat.createdAt || new Date().toISOString(),
                    cat.updatedAt || new Date().toISOString(),
                ],
            );
        }
    },

    async getCategories(): Promise<LocalCategory[]> {
        const db = await getDatabase();
        return db.getAllAsync<LocalCategory>('SELECT id, name, emoji, color FROM categories ORDER BY name');
    },

    // ─── INVOICES ───

    async createInvoice(invoice: Omit<LocalInvoice, 'createdAt' | 'updatedAt' | 'items'>) {
        const db = await getDatabase();
        const now = new Date().toISOString();
        await db.runAsync(
            `INSERT OR IGNORE INTO invoices
             (id, user_id, access_key, store_name, store_cnpj, date, total, status, synced, local_only, sync_error, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                invoice.id,
                invoice.userId,
                invoice.accessKey,
                invoice.storeName,
                invoice.storeCnpj,
                invoice.date,
                invoice.total,
                invoice.status || 'saved',
                invoice.synced ?? 0,
                invoice.localOnly ?? 0,
                invoice.syncError,
                now,
                now,
            ],
        );
    },

    async getInvoices(userId: string, limit = 100): Promise<LocalInvoice[]> {
        const db = await getDatabase();
        const rows = await db.getAllAsync<InvoiceRow>(
            `SELECT * FROM invoices WHERE user_id = ? ORDER BY date DESC LIMIT ?`,
            [userId, limit],
        );
        const invoices = rows.map(rowToInvoice);
        for (const inv of invoices) {
            inv.items = await this.getInvoiceItems(inv.id);
        }
        return invoices;
    },

    async getInvoiceById(id: string): Promise<LocalInvoice | null> {
        const db = await getDatabase();
        const row = await db.getFirstAsync<InvoiceRow>('SELECT * FROM invoices WHERE id = ?', [id]);
        if (!row) return null;
        const invoice = rowToInvoice(row);
        invoice.items = await this.getInvoiceItems(id);
        return invoice;
    },

    async updateInvoiceSyncStatus(id: string, synced: number, error?: string) {
        const db = await getDatabase();
        await db.runAsync(
            `UPDATE invoices SET synced = ?, sync_error = ?, updated_at = ? WHERE id = ?`,
            [synced, error || null, new Date().toISOString(), id],
        );
    },

    async deleteInvoice(id: string) {
        const db = await getDatabase();
        await db.runAsync('DELETE FROM invoices WHERE id = ?', [id]);
    },

    // ─── INVOICE ITEMS ───

    async createInvoiceItem(item: Omit<LocalInvoiceItem, 'product'>) {
        const db = await getDatabase();
        const now = new Date().toISOString();
        await db.runAsync(
            `INSERT OR IGNORE INTO invoice_items
             (id, invoice_id, product_ean, quantity, unit_price, total_price, synced, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                item.id,
                item.invoiceId,
                item.productEan,
                item.quantity,
                item.unitPrice,
                item.totalPrice,
                item.synced ?? 0,
                now,
                now,
            ],
        );
    },

    async getInvoiceItems(invoiceId: string): Promise<LocalInvoiceItem[]> {
        const db = await getDatabase();
        const rows = await db.getAllAsync<ItemRow>(
            `SELECT ii.id, ii.invoice_id, ii.product_ean, ii.quantity,
                    ii.unit_price, ii.total_price, ii.synced,
                    p.name as product_name, p.category_id,
                    c.name as category_name, c.emoji as category_emoji, c.color as category_color
             FROM invoice_items ii
             LEFT JOIN products p ON ii.product_ean = p.ean
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE ii.invoice_id = ?`,
            [invoiceId],
        );
        return rows.map(rowToItem);
    },

    // ─── PRODUCTS ───

    async createProduct(product: { id: string; ean: string; name: string; description?: string | null; categoryId?: string | null }) {
        const db = await getDatabase();
        const now = new Date().toISOString();
        await db.runAsync(
            `INSERT OR IGNORE INTO products (id, ean, name, description, category_id, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [product.id, product.ean, product.name, product.description || null, product.categoryId || null, now, now],
        );
    },

    // ─── SYNC QUEUE ───

    async addToSyncQueue(entityType: string, entityId: string, operation: string, data: any) {
        const db = await getDatabase();
        const now = new Date().toISOString();
        await db.runAsync(
            `INSERT INTO sync_queue (entity_type, entity_id, operation, data, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [entityType, entityId, operation, JSON.stringify(data), now, now],
        );
    },

    async getSyncQueue(): Promise<any[]> {
        const db = await getDatabase();
        const items = await db.getAllAsync<any>('SELECT * FROM sync_queue ORDER BY created_at ASC');
        return items.map((item: any) => ({ ...item, data: JSON.parse(item.data) }));
    },

    async removeSyncQueueItem(id: number) {
        const db = await getDatabase();
        await db.runAsync('DELETE FROM sync_queue WHERE id = ?', [id]);
    },

    async updateSyncQueueError(id: number, error: string, retryCount: number) {
        const db = await getDatabase();
        await db.runAsync(
            'UPDATE sync_queue SET last_error = ?, retry_count = ?, updated_at = ? WHERE id = ?',
            [error, retryCount, new Date().toISOString(), id],
        );
    },

    async getUnsyncedCount(): Promise<number> {
        const db = await getDatabase();
        const result = await db.getFirstAsync<{ count: number }>(
            'SELECT COUNT(*) as count FROM invoices WHERE synced = 0',
        );
        return result?.count || 0;
    },
};
