import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { normalizeName } from './price-normalizer';

export interface PriceHistoryItem {
    store: string;
    price: number;
    date: Date;
    description: string;
    unit: string;
}

export interface StoreComparison {
    name: string;
    avgPrice: number;
    minPrice: number;
    maxPrice: number;
    count: number;
    lastDate: Date;
}

export interface CompareResult {
    product: string;
    stores: StoreComparison[];
    cheapest: { store: string; avgPrice: number } | null;
    mostExpensive: { store: string; avgPrice: number } | null;
    savingsPotential: number;
}

export interface SavingsOpportunity {
    product: string;
    cheapestStore: string;
    cheapestPrice: number;
    currentStore: string;
    currentPrice: number;
    savingsPotential: number;
    storeCount: number;
}

@Injectable()
export class ProductsService {
    constructor(private readonly prisma: PrismaService) {}

    /**
     * Returns distinct product descriptions from the user's invoices matching the query.
     */
    async searchProducts(userId: string, q: string): Promise<string[]> {
        const items = await this.prisma.invoiceItem.findMany({
            where: {
                invoice: { userId },
                product: {
                    description: { contains: q, mode: 'insensitive' },
                },
            },
            select: { product: { select: { description: true } } },
            distinct: ['productId'],
            take: 15,
            orderBy: { product: { description: 'asc' } },
        });

        const seen = new Set<string>();
        const results: string[] = [];

        for (const item of items) {
            const desc = item.product.description;
            if (!seen.has(desc)) {
                seen.add(desc);
                results.push(desc);
            }
        }

        return results;
    }

    /**
     * Returns the price history for a product across all stores.
     */
    async getPriceHistory(
        userId: string,
        name: string,
        limit = 30,
    ): Promise<PriceHistoryItem[]> {
        const items = await this.prisma.invoiceItem.findMany({
            where: {
                invoice: { userId },
                product: {
                    description: { contains: name, mode: 'insensitive' },
                },
            },
            include: {
                invoice: {
                    select: { establishmentName: true, date: true },
                },
                product: { select: { description: true } },
            },
            orderBy: { invoice: { date: 'desc' } },
            take: limit,
        });

        return items.map((item) => ({
            store: item.invoice.establishmentName,
            price: Number(item.unitPrice),
            date: item.invoice.date,
            description: item.product.description,
            unit: item.unit,
        }));
    }

    /**
     * Compares prices for a product across different stores.
     */
    async compareStores(userId: string, name: string): Promise<CompareResult> {
        const history = await this.getPriceHistory(userId, name, 100);

        const storeMap = new Map<string, { prices: number[]; lastDate: Date }>();

        for (const h of history) {
            if (!storeMap.has(h.store)) {
                storeMap.set(h.store, { prices: [], lastDate: h.date });
            }
            const entry = storeMap.get(h.store)!;
            entry.prices.push(h.price);
            if (h.date > entry.lastDate) entry.lastDate = h.date;
        }

        const stores: StoreComparison[] = Array.from(storeMap.entries())
            .map(([name, { prices, lastDate }]) => ({
                name,
                avgPrice: prices.reduce((a, b) => a + b, 0) / prices.length,
                minPrice: Math.min(...prices),
                maxPrice: Math.max(...prices),
                count: prices.length,
                lastDate,
            }))
            .sort((a, b) => a.avgPrice - b.avgPrice);

        const cheapest = stores[0] ?? null;
        const mostExpensive = stores[stores.length - 1] ?? null;

        return {
            product: name,
            stores,
            cheapest: cheapest
                ? { store: cheapest.name, avgPrice: cheapest.avgPrice }
                : null,
            mostExpensive: mostExpensive
                ? { store: mostExpensive.name, avgPrice: mostExpensive.avgPrice }
                : null,
            savingsPotential:
                cheapest && mostExpensive && cheapest.name !== mostExpensive.name
                    ? mostExpensive.avgPrice - cheapest.avgPrice
                    : 0,
        };
    }

    /**
     * Returns the top products where switching to the cheapest store saves the most.
     * Only includes products bought at 2+ different stores.
     */
    async getTopSavings(userId: string, limit = 5): Promise<SavingsOpportunity[]> {
        const items = await this.prisma.invoiceItem.findMany({
            where: { invoice: { userId } },
            include: {
                invoice: { select: { establishmentName: true, date: true } },
                product: { select: { description: true } },
            },
            orderBy: { invoice: { date: 'desc' } },
            take: 500, // cap to avoid performance issues
        });

        // Group by normalized product name
        const productMap = new Map<
            string,
            { original: string; stores: Map<string, number[]> }
        >();

        for (const item of items) {
            const normalized = normalizeName(item.product.description);
            if (!productMap.has(normalized)) {
                productMap.set(normalized, {
                    original: item.product.description,
                    stores: new Map(),
                });
            }
            const entry = productMap.get(normalized)!;
            const store = item.invoice.establishmentName;
            if (!entry.stores.has(store)) entry.stores.set(store, []);
            entry.stores.get(store)!.push(Number(item.unitPrice));
        }

        const opportunities: SavingsOpportunity[] = [];

        for (const [, { original, stores }] of productMap) {
            if (stores.size < 2) continue;

            const storeStats = Array.from(stores.entries())
                .map(([store, prices]) => ({
                    store,
                    avgPrice: prices.reduce((a, b) => a + b, 0) / prices.length,
                }))
                .sort((a, b) => a.avgPrice - b.avgPrice);

            const cheapest = storeStats[0];
            const mostExpensive = storeStats[storeStats.length - 1];
            const potential = mostExpensive.avgPrice - cheapest.avgPrice;

            if (potential > 0.5) {
                opportunities.push({
                    product: original,
                    cheapestStore: cheapest.store,
                    cheapestPrice: cheapest.avgPrice,
                    currentStore: mostExpensive.store,
                    currentPrice: mostExpensive.avgPrice,
                    savingsPotential: potential,
                    storeCount: stores.size,
                });
            }
        }

        return opportunities
            .sort((a, b) => b.savingsPotential - a.savingsPotential)
            .slice(0, limit);
    }

    /**
     * Returns the total potential monthly savings if the user always bought
     * each product at the cheapest store found.
     */
    async getTotalSavingsPotential(userId: string): Promise<number> {
        const opportunities = await this.getTopSavings(userId, 20);
        return opportunities.reduce((acc, o) => acc + o.savingsPotential, 0);
    }
}
