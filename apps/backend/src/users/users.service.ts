import { Injectable, ConflictException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ReferralService } from '../referral/referral.service';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly referralService: ReferralService,
    ) {}

    private generateReferralCode(): string {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars[Math.floor(Math.random() * chars.length)];
        }
        return code;
    }

    async create(createUserDto: CreateUserDto) {
        const { referredBy, ...userFields } = createUserDto;
        const hashedPassword = await bcrypt.hash(userFields.password, 10);
        const referralCode = this.generateReferralCode();

        let user;
        try {
            user = await this.prisma.user.create({
                data: {
                    ...userFields,
                    password: hashedPassword,
                    referralCode,
                },
            });
        } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
                throw new ConflictException('Este email já está em uso.');
            }
            throw e;
        }

        if (referredBy) {
            this.referralService.processReferral(user.id, referredBy.toUpperCase()).catch(() => {});
        }

        return user;
    }

    findAll() {
        return this.prisma.user.findMany();
    }

    findOne(id: string) {
        return this.prisma.user.findUnique({ where: { id } });
    }

    findByEmail(email: string) {
        return this.prisma.user.findUnique({ where: { email } });
    }

    async getProfile(id: string) {
        return this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                plan: true,
                planExpiresAt: true,
                createdAt: true,
            },
        });
    }

    async getUserStats(userId: string) {
        const invoiceCount = await this.prisma.invoice.count({
            where: { userId },
        });

        const streak = await this.calculateStreak(userId);

        const totalAgg = await this.prisma.invoice.aggregate({
            where: { userId },
            _sum: { totalValue: true },
        });
        const totalSpent = Number(totalAgg._sum.totalValue ?? 0);
        const savings = Math.round(totalSpent * 0.05 * 100) / 100;

        const badges = await this.getUserBadges(userId, invoiceCount, streak, savings);

        return {
            invoiceCount,
            streak,
            savings,
            badges,
        };
    }

    private async calculateStreak(userId: string): Promise<number> {
        const invoices = await this.prisma.invoice.findMany({
            where: { userId },
            select: { date: true },
            orderBy: { date: 'desc' },
        });

        if (invoices.length === 0) return 0;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const lastScan = new Date(invoices[0].date);
        lastScan.setHours(0, 0, 0, 0);

        if (lastScan < yesterday) return 0;

        const scanDates = new Set(
            invoices.map((inv) => {
                const d = new Date(inv.date);
                d.setHours(0, 0, 0, 0);
                return d.getTime();
            }),
        );

        let streak = 0;
        const currentDate = new Date(today);

        while (scanDates.has(currentDate.getTime())) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        }

        return streak;
    }

    private async getUserBadges(
        userId: string,
        invoiceCount: number,
        streak: number,
        savings: number,
    ) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { plan: true },
        });

        const atacadoCount = await this.prisma.invoice.count({
            where: {
                userId,
                establishmentName: { contains: 'atacad', mode: 'insensitive' },
            },
        });

        return [
            {
                id: 'first_scan',
                emoji: '🎯',
                name: 'Primeira Nota',
                description: 'Escaneou sua primeira NF-e',
                unlocked: invoiceCount >= 1,
            },
            {
                id: 'scanner_10',
                emoji: '📊',
                name: 'Analista Jr',
                description: '10 notas escaneadas',
                unlocked: invoiceCount >= 10,
            },
            {
                id: 'big_saver',
                emoji: '💰',
                name: 'Economizador',
                description: 'Economizou R$100+',
                unlocked: savings >= 100,
            },
            {
                id: 'atacado_master',
                emoji: '🏭',
                name: 'Mestre do Atacado',
                description: '5 compras em atacarejo',
                unlocked: atacadoCount >= 5,
            },
            {
                id: 'streak_7',
                emoji: '🔥',
                name: 'Semana Perfeita',
                description: '7 dias de streak',
                unlocked: streak >= 7,
            },
            {
                id: 'pro_user',
                emoji: '⭐',
                name: 'Membro Pro',
                description: 'Upgrade para plano Pro',
                unlocked: user?.plan === 'pro',
            },
        ];
    }

    update(id: string, updateUserDto: UpdateUserDto) {
        return this.prisma.user.update({
            where: { id },
            data: updateUserDto,
        });
    }

    remove(id: string) {
        return this.prisma.user.delete({ where: { id } });
    }
}
