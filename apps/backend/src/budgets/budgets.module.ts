import { Module } from '@nestjs/common';
import { BudgetsController } from './budgets.controller';
import { BudgetsService } from './budgets.service';
import { BudgetsScheduler } from './budgets.scheduler';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [BudgetsController],
  providers: [BudgetsService, BudgetsScheduler],
  exports: [BudgetsService],
})
export class BudgetsModule {}
