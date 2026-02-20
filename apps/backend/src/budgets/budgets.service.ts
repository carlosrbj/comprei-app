import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Decimal } from '@prisma/client/runtime/library';

type Period = 'monthly' | 'weekly' | 'yearly';

@Injectable()
export class BudgetsService {
  private readonly logger = new Logger(BudgetsService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  // ---------- CRUD ----------

  async setBudget(
    userId: string,
    categoryId: string | null,
    amount: number,
    period: Period = 'monthly',
  ) {
    if (amount <= 0) {
      throw new BadRequestException('Valor deve ser maior que zero');
    }

    // Buscar orçamento existente usando findFirst (categoryId pode ser null)
    const existing = await this.prisma.budget.findFirst({
      where: { userId, categoryId: categoryId ?? null, period, active: true },
    });

    if (existing) {
      return this.prisma.budget.update({
        where: { id: existing.id },
        data: {
          amount,
          alert50Sent: false,
          alert80Sent: false,
          alert100Sent: false,
        },
        include: { category: true },
      });
    }

    return this.prisma.budget.create({
      data: {
        userId,
        categoryId: categoryId ?? null,
        amount,
        period,
        lastReset: this.getStartOfPeriod(period),
      },
      include: { category: true },
    });
  }

  async getUserBudgets(userId: string) {
    const budgets = await this.prisma.budget.findMany({
      where: { userId, active: true },
      include: { category: true },
      orderBy: { createdAt: 'asc' },
    });

    return Promise.all(
      budgets.map(async (b) => {
        const progress = await this.computeProgress(b);
        return { ...b, ...progress };
      }),
    );
  }

  async deleteBudget(userId: string, budgetId: string) {
    const budget = await this.prisma.budget.findFirst({
      where: { id: budgetId, userId },
    });

    if (!budget) {
      throw new BadRequestException('Orçamento não encontrado');
    }

    return this.prisma.budget.update({
      where: { id: budgetId },
      data: { active: false },
    });
  }

  // ---------- Progress ----------

  async calculateProgress(budgetId: string) {
    const budget = await this.prisma.budget.findUnique({
      where: { id: budgetId },
      include: { category: true },
    });

    if (!budget) {
      throw new BadRequestException('Orçamento não encontrado');
    }

    return this.computeProgress(budget);
  }

  private async computeProgress(budget: {
    id: string;
    userId: string;
    categoryId: string | null;
    amount: number;
    period: string;
    currentSpent: number;
    lastReset: Date;
  }) {
    // Verificar se precisa resetar (início de novo período)
    await this.checkAndResetBudget(budget);

    const startDate = this.getStartOfPeriod(budget.period as Period);
    const endDate = new Date();

    const spent = await this.calculateSpentInPeriod(
      budget.userId,
      budget.categoryId,
      startDate,
      endDate,
    );

    const percentage = Math.round((spent / budget.amount) * 100);
    const remaining = Math.max(0, budget.amount - spent);
    const isOver = spent > budget.amount;

    // Atualizar currentSpent no banco (sem await para não bloquear)
    this.prisma.budget
      .update({ where: { id: budget.id }, data: { currentSpent: spent } })
      .catch(() => {});

    return {
      spent,
      percentage,
      remaining,
      isOver,
      daysLeftInPeriod: this.getDaysLeftInPeriod(budget.period as Period),
    };
  }

  private toNum(v: Decimal | number | null | undefined): number {
    if (v == null) return 0;
    return typeof v === 'number' ? v : Number(v.toString());
  }

  private async calculateSpentInPeriod(
    userId: string,
    categoryId: string | null,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    if (categoryId) {
      const result = await this.prisma.invoiceItem.aggregate({
        where: {
          invoice: { userId, date: { gte: startDate, lte: endDate } },
          product: { categoryId },
        },
        _sum: { totalPrice: true },
      });
      return this.toNum(result._sum.totalPrice);
    }

    // Orçamento geral — soma totalValue de todas as invoices do período
    const result = await this.prisma.invoice.aggregate({
      where: { userId, date: { gte: startDate, lte: endDate } },
      _sum: { totalValue: true },
    });
    return this.toNum(result._sum.totalValue);
  }

  // ---------- Reset mensal ----------

  private async checkAndResetBudget(budget: {
    id: string;
    userId: string;
    period: string;
    lastReset: Date;
    currentSpent: number;
    amount: number;
  }) {
    const startOfCurrent = this.getStartOfPeriod(budget.period as Period);

    if (budget.lastReset < startOfCurrent) {
      await this.saveHistory(budget);

      await this.prisma.budget.update({
        where: { id: budget.id },
        data: {
          currentSpent: 0,
          lastReset: startOfCurrent,
          alert50Sent: false,
          alert80Sent: false,
          alert100Sent: false,
        },
      });
    }
  }

  private async saveHistory(budget: {
    id: string;
    userId: string;
    lastReset: Date;
    currentSpent: number;
    amount: number;
  }) {
    const d = new Date(budget.lastReset);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const percentage = Math.round((budget.currentSpent / budget.amount) * 100);

    await this.prisma.budgetHistory.upsert({
      where: { budgetId_month: { budgetId: budget.id, month: monthKey } },
      create: {
        userId: budget.userId,
        budgetId: budget.id,
        month: monthKey,
        targetAmount: budget.amount,
        spentAmount: budget.currentSpent,
        percentage,
        achieved: budget.currentSpent <= budget.amount,
      },
      update: {
        spentAmount: budget.currentSpent,
        percentage,
        achieved: budget.currentSpent <= budget.amount,
      },
    });
  }

  // ---------- Alertas ----------

  async checkAndSendAlerts(budgetId: string) {
    const budget = await this.prisma.budget.findUnique({
      where: { id: budgetId },
      include: { category: true },
    });

    if (!budget?.active) return;

    const progress = await this.computeProgress(budget);
    const pct = progress.percentage;

    if (pct >= 100 && !budget.alert100Sent) {
      await this.sendAlert(budget, 100, progress.spent);
      await this.prisma.budget.update({ where: { id: budgetId }, data: { alert100Sent: true } });
    } else if (pct >= 80 && !budget.alert80Sent) {
      await this.sendAlert(budget, 80, progress.spent);
      await this.prisma.budget.update({ where: { id: budgetId }, data: { alert80Sent: true } });
    } else if (pct >= 50 && !budget.alert50Sent) {
      await this.sendAlert(budget, 50, progress.spent);
      await this.prisma.budget.update({ where: { id: budgetId }, data: { alert50Sent: true } });
    }
  }

  private async sendAlert(budget: any, threshold: number, spent: number) {
    const categoryName: string = budget.category?.name || 'Geral';
    const emoji = threshold === 50 ? '⚠️' : threshold === 80 ? '🚨' : '❌';

    const bodyMap: Record<number, string> = {
      50: `${emoji} Você já usou 50% do orçamento de ${categoryName} (R$ ${spent.toFixed(2)})`,
      80: `${emoji} Alerta! 80% do orçamento de ${categoryName} foi usado`,
      100: `${emoji} Orçamento de ${categoryName} ultrapassado! (R$ ${spent.toFixed(2)})`,
    };

    await this.prisma.budgetAlert.create({
      data: {
        userId: budget.userId,
        budgetId: budget.id,
        threshold,
        amount: spent,
        budgetAmount: budget.amount,
        percentage: Math.round((spent / budget.amount) * 100),
        categoryName,
      },
    });

    await this.notifications.sendPushNotification(
      budget.userId,
      'Alerta de Orçamento',
      bodyMap[threshold],
      { screen: 'budgets', budgetId: budget.id },
    );
  }

  // ---------- Cron: verificar todos ----------

  async checkAllBudgets() {
    const budgets = await this.prisma.budget.findMany({ where: { active: true } });
    this.logger.log(`Verificando ${budgets.length} orçamentos...`);

    for (const b of budgets) {
      try {
        await this.checkAndSendAlerts(b.id);
      } catch (err: any) {
        this.logger.error(`Erro no orçamento ${b.id}: ${err.message}`);
      }
    }

    this.logger.log('Verificação de orçamentos concluída');
  }

  // ---------- Histórico ----------

  async getBudgetHistory(userId: string, budgetId?: string) {
    return this.prisma.budgetHistory.findMany({
      where: { userId, ...(budgetId ? { budgetId } : {}) },
      orderBy: { month: 'desc' },
      take: 12,
    });
  }

  // ---------- Sugestões ----------

  async getSuggestedBudgets(userId: string) {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const categories = await this.prisma.category.findMany({ orderBy: { name: 'asc' } });
    const suggestions = [];

    for (const cat of categories) {
      const avg = await this.calculateAverageSpent(userId, cat.id, threeMonthsAgo, new Date());

      if (avg > 0) {
        suggestions.push({
          categoryId: cat.id,
          categoryName: cat.name,
          emoji: cat.emoji,
          color: cat.color,
          averageSpent: parseFloat(avg.toFixed(2)),
          suggestedBudget: Math.ceil(avg * 0.9),
        });
      }
    }

    return suggestions.sort((a, b) => b.averageSpent - a.averageSpent);
  }

  private async calculateAverageSpent(
    userId: string,
    categoryId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const result = await this.prisma.invoiceItem.aggregate({
      where: {
        invoice: { userId, date: { gte: startDate, lte: endDate } },
        product: { categoryId },
      },
      _sum: { totalPrice: true },
    });

    return this.toNum(result._sum.totalPrice) / 3;
  }

  // ---------- Helpers ----------

  private getStartOfPeriod(period: Period): Date {
    const now = new Date();

    if (period === 'weekly') {
      const d = new Date(now);
      d.setDate(now.getDate() - now.getDay());
      d.setHours(0, 0, 0, 0);
      return d;
    }
    if (period === 'yearly') {
      return new Date(now.getFullYear(), 0, 1);
    }
    // monthly (default)
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  private getDaysLeftInPeriod(period: Period): number {
    const now = new Date();

    if (period === 'weekly') return 7 - now.getDay();
    if (period === 'yearly') {
      const endOfYear = new Date(now.getFullYear(), 11, 31);
      return Math.ceil((endOfYear.getTime() - now.getTime()) / 86400000);
    }
    // monthly
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return endOfMonth.getDate() - now.getDate();
  }
}
