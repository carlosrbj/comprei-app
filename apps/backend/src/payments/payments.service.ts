import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CreateCheckoutInput {
    userId: string;
    plan: 'pro_monthly' | 'pro_annual';
}

interface WebhookPayload {
    type: string;
    externalId: string;
    subscriptionId?: string;
    customerId?: string;
    plan: string;
    amount: number;
    currency?: string;
    status: string;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
    cancelAtPeriodEnd?: boolean;
    metadata?: Record<string, any>;
}

const PLAN_PRICES: Record<string, { amount: number; label: string }> = {
    pro_monthly: { amount: 4.99, label: 'Pro Mensal' },
    pro_annual: { amount: 39.99, label: 'Pro Anual' },
};

@Injectable()
export class PaymentsService {
    private readonly logger = new Logger(PaymentsService.name);
    private readonly stripeEnabled: boolean;

    constructor(private readonly prisma: PrismaService) {
        this.stripeEnabled = !!process.env.STRIPE_SECRET_KEY;
        if (!this.stripeEnabled) {
            this.logger.warn('STRIPE_SECRET_KEY not set — running in dev mode (payments simulated)');
        }
    }

    async createCheckout(input: CreateCheckoutInput) {
        const { userId, plan } = input;
        const planInfo = PLAN_PRICES[plan];
        if (!planInfo) {
            throw new BadRequestException(`Invalid plan: ${plan}`);
        }

        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new BadRequestException('User not found');
        }

        if (this.stripeEnabled) {
            return this.createStripeCheckout(user, plan, planInfo);
        }

        // Dev mode: simulate instant subscription
        return this.simulateCheckout(userId, plan, planInfo);
    }

    private async createStripeCheckout(
        user: { id: string; email: string; stripeCustomerId: string | null },
        plan: string,
        planInfo: { amount: number; label: string },
    ) {
        // Dynamic import to avoid crash when stripe is not installed
        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
            apiVersion: '2025-04-30.basil' as any,
        });

        let customerId = user.stripeCustomerId;
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: { userId: user.id },
            });
            customerId = customer.id;
            await this.prisma.user.update({
                where: { id: user.id },
                data: { stripeCustomerId: customerId },
            });
        }

        const priceId = process.env[`STRIPE_PRICE_${plan.toUpperCase()}`];
        if (!priceId) {
            throw new BadRequestException(`Stripe price not configured for plan: ${plan}`);
        }

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${process.env.APP_URL || 'comprei://'}payment-success`,
            cancel_url: `${process.env.APP_URL || 'comprei://'}payment-cancel`,
            metadata: { userId: user.id, plan },
        });

        return { url: session.url, sessionId: session.id };
    }

    private async simulateCheckout(
        userId: string,
        plan: string,
        planInfo: { amount: number; label: string },
    ) {
        const now = new Date();
        const periodEnd = new Date(now);
        if (plan === 'pro_annual') {
            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        } else {
            periodEnd.setMonth(periodEnd.getMonth() + 1);
        }

        const devExternalId = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        // Create subscription
        await this.prisma.subscription.create({
            data: {
                userId,
                plan,
                status: 'active',
                currentPeriodStart: now,
                currentPeriodEnd: periodEnd,
            },
        });

        // Create payment record
        await this.prisma.payment.create({
            data: {
                userId,
                externalId: devExternalId,
                amount: planInfo.amount,
                status: 'succeeded',
                plan,
            },
        });

        // Upgrade user plan
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                plan: 'pro',
                planExpiresAt: periodEnd,
            },
        });

        this.logger.log(`[DEV] Simulated checkout for user ${userId}, plan: ${plan}`);

        return { url: null, simulated: true, plan, expiresAt: periodEnd };
    }

    async handleWebhook(payload: WebhookPayload) {
        this.logger.log(`Webhook received: ${payload.type}`);

        switch (payload.type) {
            case 'checkout.session.completed':
            case 'payment_intent.succeeded':
                return this.handlePaymentSuccess(payload);
            case 'customer.subscription.updated':
                return this.handleSubscriptionUpdate(payload);
            case 'customer.subscription.deleted':
                return this.handleSubscriptionCanceled(payload);
            default:
                this.logger.warn(`Unhandled webhook type: ${payload.type}`);
                return { received: true };
        }
    }

    private async handlePaymentSuccess(payload: WebhookPayload) {
        const userId = payload.metadata?.userId;
        if (!userId) {
            this.logger.warn('Payment webhook missing userId in metadata');
            return { received: true };
        }

        const now = new Date();
        const periodEnd = new Date(payload.currentPeriodEnd || now);
        if (!payload.currentPeriodEnd) {
            if (payload.plan === 'pro_annual') {
                periodEnd.setFullYear(periodEnd.getFullYear() + 1);
            } else {
                periodEnd.setMonth(periodEnd.getMonth() + 1);
            }
        }

        await this.prisma.payment.upsert({
            where: { externalId: payload.externalId },
            create: {
                userId,
                externalId: payload.externalId,
                amount: payload.amount,
                currency: payload.currency || 'BRL',
                status: payload.status,
                plan: payload.plan,
            },
            update: {
                status: payload.status,
            },
        });

        if (payload.subscriptionId) {
            await this.prisma.subscription.upsert({
                where: { stripeSubscriptionId: payload.subscriptionId },
                create: {
                    userId,
                    stripeSubscriptionId: payload.subscriptionId,
                    plan: payload.plan,
                    status: 'active',
                    currentPeriodStart: new Date(payload.currentPeriodStart || now),
                    currentPeriodEnd: periodEnd,
                },
                update: {
                    status: 'active',
                    currentPeriodStart: new Date(payload.currentPeriodStart || now),
                    currentPeriodEnd: periodEnd,
                },
            });
        }

        await this.prisma.user.update({
            where: { id: userId },
            data: {
                plan: 'pro',
                planExpiresAt: periodEnd,
                stripeCustomerId: payload.customerId || undefined,
            },
        });

        return { received: true, upgraded: true };
    }

    private async handleSubscriptionUpdate(payload: WebhookPayload) {
        if (!payload.subscriptionId) return { received: true };

        const sub = await this.prisma.subscription.findUnique({
            where: { stripeSubscriptionId: payload.subscriptionId },
        });
        if (!sub) return { received: true };

        await this.prisma.subscription.update({
            where: { stripeSubscriptionId: payload.subscriptionId },
            data: {
                status: payload.status,
                cancelAtPeriodEnd: payload.cancelAtPeriodEnd ?? false,
                currentPeriodEnd: payload.currentPeriodEnd
                    ? new Date(payload.currentPeriodEnd)
                    : undefined,
            },
        });

        return { received: true };
    }

    private async handleSubscriptionCanceled(payload: WebhookPayload) {
        if (!payload.subscriptionId) return { received: true };

        const sub = await this.prisma.subscription.findUnique({
            where: { stripeSubscriptionId: payload.subscriptionId },
        });
        if (!sub) return { received: true };

        await this.prisma.subscription.update({
            where: { stripeSubscriptionId: payload.subscriptionId },
            data: { status: 'canceled' },
        });

        await this.prisma.user.update({
            where: { id: sub.userId },
            data: { plan: 'free', planExpiresAt: null },
        });

        return { received: true, downgraded: true };
    }

    async getPlans() {
        return {
            plans: [
                {
                    id: 'pro_monthly',
                    name: 'Pro Mensal',
                    price: 4.99,
                    currency: 'BRL',
                    interval: 'month',
                    features: [
                        'Notas ilimitadas',
                        'Historico completo',
                        'Todas as categorias (15+)',
                        'Relatorios avancados',
                        'Comparador de precos',
                        'Alertas de orcamento',
                        'Liberdade de Sexta 🍺',
                        'Exportacao PDF/CSV',
                        'Wrapped Anual',
                    ],
                },
                {
                    id: 'pro_annual',
                    name: 'Pro Anual',
                    price: 39.99,
                    currency: 'BRL',
                    interval: 'year',
                    discount: '33%',
                    features: [
                        'Tudo do Pro Mensal',
                        'Modo Familia (ate 4 membros)',
                        'Economize 33%',
                    ],
                },
            ],
            free: {
                limits: {
                    invoicesPerMonth: 20,
                    historyDays: 30,
                    categories: 5,
                },
            },
        };
    }

    async getUserSubscription(userId: string) {
        const subscription = await this.prisma.subscription.findFirst({
            where: { userId, status: { in: ['active', 'trialing'] } },
            orderBy: { createdAt: 'desc' },
        });

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { plan: true, planExpiresAt: true },
        });

        return {
            plan: user?.plan || 'free',
            expiresAt: user?.planExpiresAt,
            subscription: subscription
                ? {
                      id: subscription.id,
                      plan: subscription.plan,
                      status: subscription.status,
                      currentPeriodEnd: subscription.currentPeriodEnd,
                      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
                  }
                : null,
        };
    }
}
