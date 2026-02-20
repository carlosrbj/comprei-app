import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
    constructor(private prisma: PrismaService) {}

    async getSummary(userId: string, period: string) {
        const { startDate, endDate } = this.parsePeriod(period);

        const invoices = await this.prisma.invoice.findMany({
            where: {
                userId,
                date: { gte: startDate, lte: endDate },
            },
            select: { totalValue: true },
        });

        const totalSpent = invoices.reduce((sum, inv) => sum + Number(inv.totalValue), 0);
        const invoiceCount = invoices.length;
        const avgTicket = invoiceCount > 0 ? totalSpent / invoiceCount : 0;

        // Previous period for comparison
        const periodDuration = endDate.getTime() - startDate.getTime();
        const prevStart = new Date(startDate.getTime() - periodDuration);
        const prevEnd = new Date(startDate.getTime() - 1);

        const prevInvoices = await this.prisma.invoice.findMany({
            where: {
                userId,
                date: { gte: prevStart, lte: prevEnd },
            },
            select: { totalValue: true },
        });

        const prevTotal = prevInvoices.reduce((sum, inv) => sum + Number(inv.totalValue), 0);
        const prevCount = prevInvoices.length;
        const prevAvgTicket = prevCount > 0 ? prevTotal / prevCount : 0;

        const totalVariation = prevTotal > 0 ? ((totalSpent - prevTotal) / prevTotal) * 100 : 0;
        const ticketVariation = prevAvgTicket > 0 ? ((avgTicket - prevAvgTicket) / prevAvgTicket) * 100 : 0;

        return {
            totalSpent: Math.round(totalSpent * 100) / 100,
            invoiceCount,
            avgTicket: Math.round(avgTicket * 100) / 100,
            estimatedSavings: 0,
            totalVariation: Math.round(totalVariation * 10) / 10,
            ticketVariation: Math.round(ticketVariation * 10) / 10,
            period: { startDate, endDate },
        };
    }

    async getByCategory(userId: string, period: string) {
        const { startDate, endDate } = this.parsePeriod(period);

        const invoices = await this.prisma.invoice.findMany({
            where: {
                userId,
                date: { gte: startDate, lte: endDate },
            },
            include: {
                items: {
                    include: {
                        product: { include: { category: true } },
                    },
                },
            },
        });

        const categoryMap = new Map<string, { name: string; emoji: string; color: string; total: number }>();

        for (const invoice of invoices) {
            for (const item of invoice.items) {
                const category = item.product?.category;
                if (category) {
                    const existing = categoryMap.get(category.id) || {
                        name: category.name,
                        emoji: category.emoji,
                        color: category.color,
                        total: 0,
                    };
                    existing.total += Number(item.totalPrice);
                    categoryMap.set(category.id, existing);
                }
            }
        }

        const categories = Array.from(categoryMap.values())
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);

        const total = categories.reduce((sum, cat) => sum + cat.total, 0);

        return categories.map((cat) => ({
            ...cat,
            total: Math.round(cat.total * 100) / 100,
            percentage: total > 0 ? Math.round((cat.total / total) * 100) : 0,
        }));
    }

    async getByStore(userId: string, period: string) {
        const { startDate, endDate } = this.parsePeriod(period);

        const invoices = await this.prisma.invoice.findMany({
            where: {
                userId,
                date: { gte: startDate, lte: endDate },
            },
            select: {
                establishmentName: true,
                totalValue: true,
            },
        });

        const storeMap = new Map<string, number>();

        for (const invoice of invoices) {
            const store = invoice.establishmentName || 'Outros';
            storeMap.set(store, (storeMap.get(store) || 0) + Number(invoice.totalValue));
        }

        return Array.from(storeMap.entries())
            .map(([name, total]) => ({ name, total: Math.round(total * 100) / 100 }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 8);
    }

    async getTrend(userId: string, months: number = 6) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - months + 1);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);

        const invoices = await this.prisma.invoice.findMany({
            where: {
                userId,
                date: { gte: startDate, lte: endDate },
            },
            select: {
                date: true,
                totalValue: true,
            },
            orderBy: { date: 'asc' },
        });

        const monthMap = new Map<string, number>();

        for (const invoice of invoices) {
            const monthKey = invoice.date.toISOString().substring(0, 7);
            monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + Number(invoice.totalValue));
        }

        return Array.from(monthMap.entries())
            .map(([month, total]) => ({
                month,
                monthLabel: this.formatMonth(month),
                total: Math.round(total * 100) / 100,
            }))
            .sort((a, b) => a.month.localeCompare(b.month));
    }

    async getInflation(userId: string, limit: number = 10) {
        const topProducts = await this.prisma.invoiceItem.groupBy({
            by: ['productId'],
            where: {
                invoice: { userId },
            },
            _count: { productId: true },
            orderBy: { _count: { productId: 'desc' } },
            take: limit,
        });

        const inflationData = [];
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        for (const entry of topProducts) {
            const product = await this.prisma.product.findUnique({
                where: { id: entry.productId },
            });

            if (!product) continue;

            const currentMonthItems = await this.prisma.invoiceItem.findMany({
                where: {
                    productId: entry.productId,
                    invoice: {
                        userId,
                        date: { gte: currentMonthStart },
                    },
                },
                orderBy: { invoice: { date: 'desc' } },
                take: 1,
            });

            const lastMonthItems = await this.prisma.invoiceItem.findMany({
                where: {
                    productId: entry.productId,
                    invoice: {
                        userId,
                        date: {
                            gte: lastMonthStart,
                            lt: currentMonthStart,
                        },
                    },
                },
                orderBy: { invoice: { date: 'desc' } },
                take: 1,
            });

            if (currentMonthItems.length && lastMonthItems.length) {
                const currentPrice = Number(currentMonthItems[0].unitPrice);
                const lastPrice = Number(lastMonthItems[0].unitPrice);
                const variation = lastPrice > 0 ? ((currentPrice - lastPrice) / lastPrice) * 100 : 0;

                inflationData.push({
                    name: product.description,
                    currentPrice: Math.round(currentPrice * 100) / 100,
                    lastPrice: Math.round(lastPrice * 100) / 100,
                    variation: Math.round(variation * 10) / 10,
                });
            }
        }

        return inflationData;
    }

    private parsePeriod(period: string): { startDate: Date; endDate: Date } {
        const now = new Date();
        let startDate: Date;
        let endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        if (period === 'year' || /^\d{4}$/.test(period)) {
            const year = period === 'year' ? now.getFullYear() : parseInt(period);
            startDate = new Date(year, 0, 1);
            endDate = new Date(year, 11, 31, 23, 59, 59);
        } else if (period.endsWith('m')) {
            const months = parseInt(period);
            startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
        } else if (/^\d{4}-\d{2}$/.test(period)) {
            const [year, month] = period.split('-').map(Number);
            startDate = new Date(year, month - 1, 1);
            endDate = new Date(year, month, 0, 23, 59, 59);
        } else {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        return { startDate, endDate };
    }

    private formatMonth(month: string): string {
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const m = parseInt(month.split('-')[1]);
        return months[m - 1] || month;
    }
}
