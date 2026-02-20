import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { REQUIRES_PLAN_KEY } from '../decorators/requires-plan.decorator';

@Injectable()
export class PlanGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly prisma: PrismaService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredPlans = this.reflector.getAllAndOverride<string[]>(
            REQUIRES_PLAN_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (!requiredPlans || requiredPlans.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const userId = request.user?.id;

        if (!userId) {
            throw new ForbiddenException({
                code: 'AUTH_REQUIRED',
                message: 'Authentication required',
            });
        }

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { plan: true, planExpiresAt: true },
        });

        if (!user) {
            throw new ForbiddenException({
                code: 'USER_NOT_FOUND',
                message: 'User not found',
            });
        }

        const hasValidPlan = requiredPlans.includes(user.plan);
        const isExpired =
            user.planExpiresAt && new Date(user.planExpiresAt) < new Date();

        if (!hasValidPlan || isExpired) {
            throw new ForbiddenException({
                code: 'UPGRADE_REQUIRED',
                message: 'This feature requires a Pro plan',
                upgradeUrl: '/plans',
            });
        }

        return true;
    }
}
