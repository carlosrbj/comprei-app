import { Controller, Post, Body } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface TrackOnboardingDto {
    userId?: string;
    sessionId: string;
    step: number;
    action: string;
    metadata?: Record<string, unknown>;
}

@Controller('analytics')
export class AnalyticsController {
    constructor(private readonly prisma: PrismaService) {}

    @Post('onboarding')
    async trackOnboarding(@Body() body: TrackOnboardingDto) {
        await this.prisma.onboardingEvent.create({
            data: {
                userId: body.userId || null,
                sessionId: body.sessionId,
                step: body.step,
                action: body.action,
                metadata: (body.metadata ?? {}) as any,
            },
        });
        return { success: true };
    }
}
