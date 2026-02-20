import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const SUPERFLUOUS_CATEGORIES = [
    'Snacks e Guloseimas',
    'Bebidas Alcoólicas',
    'Bebidas Não-alcoólicas',
];

const MESSAGE_TEMPLATES = [
    {
        id: 'beer_bbq',
        emoji: '🍺',
        template: 'Você economizou R$ {amount} essa semana! Dá pra um churrasco pra 4 pessoas e ainda sobra pra cerveja. Bom fim de semana!',
        suggestions: ['🍖 Churrasco pra 4', '🎬 2 ingressos cinema', '🍺 Cerveja gelada'],
    },
    {
        id: 'weekend_fun',
        emoji: '🎬',
        template: 'Bora gastar bem esse fim de semana? Você cortou R$ {amount} em supérfluos. Isso é exatamente um jantar no rodízio + Uber de volta.',
        suggestions: ['🍽️ Rodízio de carnes', '🚗 Uber de volta', '🍨 Sobremesa especial'],
    },
    {
        id: 'epic_weekend',
        emoji: '🍕',
        template: 'Semana controlada = fim de semana épico! R$ {amount} livres. Isso é uma pizza grande, uma rodada de chopp e ainda sobra!',
        suggestions: ['🍕 Pizza grande', '🍻 Rodada de chopp', '🎮 Jogo novo'],
    },
    {
        id: 'nice_weekend',
        emoji: '🏖️',
        template: 'Missão cumprida! R$ {amount} economizados. Que tal um passeio gostoso esse fim de semana? Você ganhou!',
        suggestions: ['🏖️ Passeio ao ar livre', '☕ Café especial', '🎨 Atração cultural'],
    },
];

@Injectable()
export class FridayService {
    private readonly logger = new Logger(FridayService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly notifications: NotificationsService,
    ) {}

    async calculateWeeklySavings(userId: string, weekStart: Date, weekEnd: Date) {
        const invoices = await this.prisma.invoice.findMany({
            where: {
                userId,
                date: { gte: weekStart, lte: weekEnd },
            },
            include: {
                items: {
                    include: {
                        product: {
                            include: { category: true },
                        },
                    },
                },
            },
        });

        const categoryBreakdown: Record<string, number> = {};
        let totalSuperfluous = 0;

        for (const invoice of invoices) {
            for (const item of invoice.items) {
                const categoryName = item.product?.category?.name;
                if (categoryName && SUPERFLUOUS_CATEGORIES.includes(categoryName)) {
                    const amount = Number(item.totalPrice);
                    categoryBreakdown[categoryName] = (categoryBreakdown[categoryName] || 0) + amount;
                    totalSuperfluous += amount;
                }
            }
        }

        // Compare with previous week
        const lastWeekStart = new Date(weekStart);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        const lastWeekEnd = new Date(weekEnd);
        lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);

        const lastWeekInvoices = await this.prisma.invoice.findMany({
            where: {
                userId,
                date: { gte: lastWeekStart, lte: lastWeekEnd },
            },
            include: {
                items: {
                    include: {
                        product: { include: { category: true } },
                    },
                },
            },
        });

        let lastWeekSuperfluous = 0;
        for (const invoice of lastWeekInvoices) {
            for (const item of invoice.items) {
                const categoryName = item.product?.category?.name;
                if (categoryName && SUPERFLUOUS_CATEGORIES.includes(categoryName)) {
                    lastWeekSuperfluous += Number(item.totalPrice);
                }
            }
        }

        const savedAmount = Math.max(0, lastWeekSuperfluous - totalSuperfluous);

        return {
            savedAmount: Math.round(savedAmount * 100) / 100,
            categoryBreakdown,
            totalSuperfluous: Math.round(totalSuperfluous * 100) / 100,
            lastWeekSuperfluous: Math.round(lastWeekSuperfluous * 100) / 100,
        };
    }

    generateSuggestions(amount: number) {
        if (amount >= 150) {
            return [
                { emoji: '🍖', text: 'Churrasco pra 4 pessoas', value: 120 },
                { emoji: '🎬', text: '2 ingressos cinema', value: 80 },
            ];
        } else if (amount >= 80) {
            return [
                { emoji: '🍕', text: 'Pizza grande + refri', value: 70 },
                { emoji: '🍻', text: 'Rodada de chopp', value: 60 },
            ];
        } else if (amount >= 40) {
            return [
                { emoji: '☕', text: 'Café especial + bolo', value: 35 },
                { emoji: '🎮', text: 'Jogo indie na Steam', value: 30 },
            ];
        }
        return [
            { emoji: '🍦', text: 'Sorvete premium', value: 20 },
            { emoji: '🎨', text: 'Entrada em museu', value: 15 },
        ];
    }

    private getWeekBounds(date: Date) {
        const dayOfWeek = date.getDay(); // 0=dom, 1=seg, ..., 5=sex
        const weekStart = new Date(date);
        // Go back to Monday (day 1)
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        weekStart.setDate(date.getDate() - daysToMonday);
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(date);
        weekEnd.setHours(23, 59, 59, 999);

        return { weekStart, weekEnd };
    }

    async sendFridayNotification(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { plan: true, name: true },
        });

        if (!user || user.plan !== 'pro') {
            return { sent: false, reason: 'not_pro' };
        }

        const { weekStart, weekEnd } = this.getWeekBounds(new Date());

        // Check if already sent this week
        const alreadySent = await this.prisma.fridayNotification.findFirst({
            where: { userId, weekStartDate: weekStart },
        });
        if (alreadySent) {
            return { sent: false, reason: 'already_sent' };
        }

        const { savedAmount, categoryBreakdown } = await this.calculateWeeklySavings(
            userId,
            weekStart,
            weekEnd,
        );

        if (savedAmount < 5) {
            return { sent: false, reason: 'amount_too_low', savedAmount };
        }

        // Pick random template
        const template = MESSAGE_TEMPLATES[Math.floor(Math.random() * MESSAGE_TEMPLATES.length)];
        const message = template.template.replace('{amount}', savedAmount.toFixed(2));
        const suggestions = this.generateSuggestions(savedAmount);

        // Save notification record
        const notification = await this.prisma.fridayNotification.create({
            data: {
                userId,
                weekStartDate: weekStart,
                weekEndDate: weekEnd,
                savedAmount,
                categories: categoryBreakdown,
                suggestions,
                messageTemplate: template.id,
            },
        });

        // Send push
        await this.notifications.sendPushNotification(
            userId,
            `${template.emoji} Liberdade de Sexta`,
            message,
            { screen: 'liberdade', notificationId: notification.id },
        );

        this.logger.log(`Friday notification sent to user ${userId}: R$${savedAmount.toFixed(2)}`);

        return { sent: true, notification, savedAmount, message };
    }

    async sendFridayNotificationsToAll() {
        const proUsers = await this.prisma.user.findMany({
            where: { plan: 'pro' },
            select: { id: true },
        });

        this.logger.log(`Sending Friday notifications to ${proUsers.length} Pro users...`);

        const results: any[] = [];
        for (const user of proUsers) {
            try {
                const result = await this.sendFridayNotification(user.id);
                results.push({ userId: user.id, ...result });
            } catch (error: any) {
                results.push({ userId: user.id, sent: false, error: error.message });
            }
            // Small delay to avoid overwhelming
            await new Promise((resolve) => setTimeout(resolve, 100));
        }

        const sent = results.filter((r) => r.sent).length;
        this.logger.log(`Friday notifications: ${sent}/${results.length} sent`);

        return results;
    }

    async getHistory(userId: string) {
        return this.prisma.fridayNotification.findMany({
            where: { userId },
            orderBy: { sentAt: 'desc' },
            take: 10,
        });
    }

    async getCurrentWeek(userId: string) {
        const { weekStart, weekEnd } = this.getWeekBounds(new Date());

        const data = await this.calculateWeeklySavings(userId, weekStart, weekEnd);
        const suggestions = this.generateSuggestions(data.savedAmount);

        return {
            ...data,
            suggestions,
            weekStart,
            weekEnd,
        };
    }
}
