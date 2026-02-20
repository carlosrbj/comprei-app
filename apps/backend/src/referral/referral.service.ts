import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReferralService {
    constructor(private readonly prisma: PrismaService) {}

    async getMyStats(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { referralCode: true, referralCount: true },
        });

        const referrals = await this.prisma.referral.findMany({
            where: { referrerId: userId },
            include: { referee: { select: { name: true, createdAt: true } } },
            orderBy: { activatedAt: 'desc' },
        });

        const count = user?.referralCount ?? 0;
        const proMonthsEarned = Math.floor(count / 3);
        const neededForNextReward = count % 3 === 0 ? 3 : 3 - (count % 3);

        return {
            referralCode: user?.referralCode,
            referralCount: count,
            proMonthsEarned,
            neededForNextReward,
            referrals: referrals.map((r) => ({
                name: r.referee.name ?? 'Usuário',
                joinedAt: r.activatedAt,
                rewarded: r.rewarded,
            })),
        };
    }

    async processReferral(newUserId: string, referralCode: string): Promise<void> {
        const referrer = await this.prisma.user.findUnique({
            where: { referralCode },
        });

        if (!referrer || referrer.id === newUserId) return;

        // Avoid duplicate referrals
        const existing = await this.prisma.referral.findUnique({
            where: { refereeId: newUserId },
        });
        if (existing) return;

        await this.prisma.referral.create({
            data: {
                referrerId: referrer.id,
                refereeId: newUserId,
                referralCode,
            },
        });

        const newCount = referrer.referralCount + 1;
        await this.prisma.user.update({
            where: { id: referrer.id },
            data: { referralCount: newCount },
        });

        // Grant 1 month Pro for every 3 referrals
        if (newCount % 3 === 0) {
            const current = referrer.planExpiresAt && referrer.planExpiresAt > new Date()
                ? referrer.planExpiresAt
                : new Date();
            const expiresAt = new Date(current);
            expiresAt.setMonth(expiresAt.getMonth() + 1);

            await this.prisma.user.update({
                where: { id: referrer.id },
                data: { plan: 'pro', planExpiresAt: expiresAt },
            });

            await this.prisma.referral.update({
                where: { refereeId: newUserId },
                data: { rewarded: true, rewardedAt: new Date() },
            });
        }
    }
}
