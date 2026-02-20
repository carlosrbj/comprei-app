import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);
    private expo: any = null;

    constructor(private readonly prisma: PrismaService) {
        this.initExpo();
    }

    private async initExpo() {
        try {
            const { Expo } = await import('expo-server-sdk');
            this.expo = new Expo();
            this.logger.log('Expo Server SDK initialized');
        } catch {
            this.logger.warn('expo-server-sdk not available — push notifications disabled');
        }
    }

    async registerToken(userId: string, token: string, platform: string) {
        if (this.expo) {
            const { Expo } = await import('expo-server-sdk');
            if (!Expo.isExpoPushToken(token)) {
                throw new BadRequestException('Invalid push token');
            }
        }

        // Deactivate old tokens from same user+platform
        await this.prisma.pushToken.updateMany({
            where: { userId, platform },
            data: { active: false },
        });

        // Upsert new token
        return this.prisma.pushToken.upsert({
            where: { token },
            create: { userId, token, platform, active: true },
            update: { userId, active: true },
        });
    }

    async sendPushNotification(
        userId: string,
        title: string,
        body: string,
        data?: Record<string, any>,
    ) {
        const tokens = await this.prisma.pushToken.findMany({
            where: { userId, active: true },
            select: { token: true },
        });

        if (tokens.length === 0) {
            this.logger.debug(`User ${userId} has no active push tokens`);
            return [];
        }

        if (!this.expo) {
            this.logger.warn(`[DEV] Would send push to ${tokens.length} tokens: "${title}" — "${body}"`);
            return tokens.map((t) => ({ token: t.token, simulated: true }));
        }

        const { Expo } = await import('expo-server-sdk');
        const messages = tokens
            .filter((t) => Expo.isExpoPushToken(t.token))
            .map((t) => ({
                to: t.token,
                sound: 'default' as const,
                title,
                body,
                data,
                badge: 1,
                priority: 'high' as const,
            }));

        if (messages.length === 0) return [];

        const chunks = this.expo.chunkPushNotifications(messages);
        const tickets: any[] = [];

        for (const chunk of chunks) {
            try {
                const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
                tickets.push(...ticketChunk);
            } catch (error) {
                this.logger.error('Error sending push notification:', error);
            }
        }

        // Deactivate tokens that returned DeviceNotRegistered
        for (let i = 0; i < tickets.length; i++) {
            if (tickets[i].status === 'error' && tickets[i].details?.error === 'DeviceNotRegistered') {
                await this.prisma.pushToken.updateMany({
                    where: { token: messages[i].to as string },
                    data: { active: false },
                });
            }
        }

        return tickets;
    }
}
