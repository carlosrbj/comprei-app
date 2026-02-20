import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  calcInflationFromItems,
  getIpcaReference,
  InflationResult,
} from './inflation.calculator';

export interface MonthlyTotal {
  month: string; // "YYYY-MM"
  label: string; // "Jan", "Fev", etc.
  total: number;
}

export interface ForecastData {
  currentMonth: string; // "Fevereiro 2026"
  currentSpent: number;
  forecast: number;
  progressPercent: number; // 0-150
  daysLeft: number;
  projectedTotal: number; // if current daily rate continues
  lastMonths: MonthlyTotal[];
  isOnTrack: boolean;
}

export interface CategoryBreakdown {
  name: string;
  emoji: string;
  total: number;
  percentage: number;
}

export interface WrappedData {
  year: number;
  totalSpent: number;
  invoiceCount: number;
  favoriteStore: string;
  favoriteStoreVisits: number;
  topProduct: string;
  topProductCount: number;
  mostExpensiveMonth: string;
  mostExpensiveMonthTotal: number;
  personalInflation: number;
  avgMonthlySpend: number;
  categoryBreakdown: CategoryBreakdown[];
}

const MONTH_NAMES_SHORT = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];
const MONTH_NAMES_FULL = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

@Injectable()
export class InsightsService {
  constructor(private readonly prisma: PrismaService) {}

  async getInflation(userId: string): Promise<InflationResult> {
    const yearAgo = new Date();
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);

    const items = await this.prisma.invoiceItem.findMany({
      where: { invoice: { userId, date: { gte: yearAgo } } },
      include: {
        invoice: { select: { date: true } },
        product: { select: { description: true } },
      },
    });

    return calcInflationFromItems(
      items.map((i) => ({
        description: i.product.description,
        unitPrice: Number(i.unitPrice),
        totalPrice: Number(i.totalPrice),
        invoiceDate: i.invoice.date,
      })),
    );
  }

  async getForecast(userId: string): Promise<ForecastData> {
    const now = new Date();
    const sevenMonthsAgo = new Date(now);
    sevenMonthsAgo.setMonth(sevenMonthsAgo.getMonth() - 7);

    const invoices = await this.prisma.invoice.findMany({
      where: { userId, date: { gte: sevenMonthsAgo } },
      select: { date: true, totalValue: true },
    });

    // Group by YYYY-MM
    const byMonth = new Map<string, number>();
    for (const inv of invoices) {
      const key = `${inv.date.getFullYear()}-${String(inv.date.getMonth() + 1).padStart(2, '0')}`;
      byMonth.set(key, (byMonth.get(key) ?? 0) + Number(inv.totalValue));
    }

    const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentSpent = byMonth.get(currentKey) ?? 0;

    // Collect last 3 complete months that have data
    const pastMonths: MonthlyTotal[] = [];
    for (let i = 1; i <= 6 && pastMonths.length < 3; i++) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const total = byMonth.get(key) ?? 0;
      if (total > 0) {
        pastMonths.push({
          month: key,
          label: MONTH_NAMES_SHORT[d.getMonth()],
          total,
        });
      }
    }

    const forecast =
      pastMonths.length > 0
        ? pastMonths.reduce((s, m) => s + m.total, 0) / pastMonths.length
        : 0;

    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
    ).getDate();
    const daysElapsed = now.getDate();
    const daysLeft = daysInMonth - daysElapsed;
    const projectedTotal =
      daysElapsed > 0 ? (currentSpent / daysElapsed) * daysInMonth : 0;
    const progressPercent =
      forecast > 0 ? Math.min((currentSpent / forecast) * 100, 150) : 0;

    return {
      currentMonth: `${MONTH_NAMES_FULL[now.getMonth()]} ${now.getFullYear()}`,
      currentSpent,
      forecast,
      progressPercent,
      daysLeft,
      projectedTotal,
      lastMonths: pastMonths,
      isOnTrack: forecast === 0 || projectedTotal <= forecast * 1.1,
    };
  }

  async getWrapped(userId: string, year: number): Promise<WrappedData> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    const invoices = await this.prisma.invoice.findMany({
      where: { userId, date: { gte: startDate, lt: endDate } },
      include: {
        items: {
          include: { product: { include: { category: true } } },
        },
      },
    });

    if (invoices.length === 0) {
      return {
        year,
        totalSpent: 0,
        invoiceCount: 0,
        favoriteStore: '-',
        favoriteStoreVisits: 0,
        topProduct: '-',
        topProductCount: 0,
        mostExpensiveMonth: '-',
        mostExpensiveMonthTotal: 0,
        personalInflation: 0,
        avgMonthlySpend: 0,
        categoryBreakdown: [],
      };
    }

    const totalSpent = invoices.reduce(
      (s, inv) => s + Number(inv.totalValue),
      0,
    );

    // Favorite store (by visit count)
    const storeCount = new Map<string, number>();
    for (const inv of invoices) {
      storeCount.set(
        inv.establishmentName,
        (storeCount.get(inv.establishmentName) ?? 0) + 1,
      );
    }
    const [[favoriteStore, favoriteStoreVisits]] = [
      ...storeCount.entries(),
    ].sort((a, b) => b[1] - a[1]);

    // Top product (by quantity)
    const productQty = new Map<string, number>();
    for (const inv of invoices) {
      for (const item of inv.items) {
        const desc = item.product.description;
        productQty.set(
          desc,
          (productQty.get(desc) ?? 0) + Number(item.quantity),
        );
      }
    }
    const [[topProduct, topProductCount]] = [...productQty.entries()].sort(
      (a, b) => b[1] - a[1],
    );

    // Most expensive month
    const monthTotals = new Map<string, number>();
    for (const inv of invoices) {
      const name = MONTH_NAMES_FULL[inv.date.getMonth()];
      monthTotals.set(
        name,
        (monthTotals.get(name) ?? 0) + Number(inv.totalValue),
      );
    }
    const [[mostExpensiveMonth, mostExpensiveMonthTotal]] = [
      ...monthTotals.entries(),
    ].sort((a, b) => b[1] - a[1]);

    const avgMonthlySpend = totalSpent / monthTotals.size;

    // Category breakdown (top 6)
    const catTotals = new Map<
      string,
      { name: string; emoji: string; total: number }
    >();
    for (const inv of invoices) {
      for (const item of inv.items) {
        const cat = item.product.category;
        const key = cat?.id ?? '__outros__';
        if (!catTotals.has(key)) {
          catTotals.set(key, {
            name: cat?.name ?? 'Outros',
            emoji: cat?.emoji ?? '🛒',
            total: 0,
          });
        }
        catTotals.get(key)!.total += Number(item.totalPrice);
      }
    }
    const categoryBreakdown = [...catTotals.values()]
      .sort((a, b) => b.total - a.total)
      .slice(0, 6)
      .map((c) => ({
        ...c,
        percentage: Math.round((c.total / totalSpent) * 100),
      }));

    // Personal inflation reusing items
    const allItems = invoices.flatMap((inv) =>
      inv.items.map((item) => ({
        description: item.product.description,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        invoiceDate: inv.date,
      })),
    );
    const { personalInflation } = calcInflationFromItems(allItems);

    return {
      year,
      totalSpent,
      invoiceCount: invoices.length,
      favoriteStore,
      favoriteStoreVisits,
      topProduct,
      topProductCount: Math.round(topProductCount),
      mostExpensiveMonth,
      mostExpensiveMonthTotal,
      personalInflation,
      avgMonthlySpend,
      categoryBreakdown,
    };
  }

  /**
   * Returns forecast + inflation summary for the dashboard widget.
   * Free-tier safe: always returns forecast; inflation may return hasEnoughData=false.
   */
  async getDashboardInsights(userId: string): Promise<{
    forecast: Pick<
      ForecastData,
      'forecast' | 'currentSpent' | 'progressPercent' | 'daysLeft' | 'isOnTrack'
    >;
    ipca: number;
  }> {
    const ipcaRef = getIpcaReference(new Date().getFullYear());
    const forecast = await this.getForecast(userId);
    return {
      forecast: {
        forecast: forecast.forecast,
        currentSpent: forecast.currentSpent,
        progressPercent: forecast.progressPercent,
        daysLeft: forecast.daysLeft,
        isOnTrack: forecast.isOnTrack,
      },
      ipca: ipcaRef,
    };
  }
}
