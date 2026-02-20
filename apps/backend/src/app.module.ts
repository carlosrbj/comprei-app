import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { InvoicesModule } from './invoices/invoices.module';
import { CategoriesModule } from './categories/categories.module';
import { ReportsModule } from './reports/reports.module';
import { PaymentsModule } from './payments/payments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { FridayModule } from './friday/friday.module';
import { ReferralModule } from './referral/referral.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ExportsModule } from './exports/exports.module';
import { BudgetsModule } from './budgets/budgets.module';
import { ProductsModule } from './products/products.module';
import { InsightsModule } from './insights/insights.module';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    PrismaModule,
    InvoicesModule,
    CategoriesModule,
    ReportsModule,
    PaymentsModule,
    NotificationsModule,
    FridayModule,
    ReferralModule,
    AnalyticsModule,
    ExportsModule,
    BudgetsModule,
    ProductsModule,
    InsightsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
