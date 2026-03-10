export interface Category {
    id: string;
    name: string;
    emoji: string;
    color: string;
    keywords: string[];
}

export interface Product {
    id: string;
    code: string | null;
    description: string;
    categoryId?: string | null;
    category?: Category | null;
}

export interface InvoiceItem {
    id?: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
    product?: Product;
    // For scraped items before saving
    description?: string;
    code?: string | null;
}

export interface Invoice {
    id?: string;
    accessKey: string;
    url: string;
    date: string;
    totalValue: number;
    establishmentName: string;
    storeCnpj?: string | null;
    storeAddress?: string | null;
    discount?: number | null;
    amountToPay?: number | null;
    paymentMethod?: string | null;
    amountPaid?: number | null;
    items?: InvoiceItem[];
}
