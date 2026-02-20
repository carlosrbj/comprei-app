import { Module } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ScraperService } from './scraper.service';
import { SefazService } from './sefaz.service';
import { CategoriesModule } from '../categories/categories.module';
import { BudgetsModule } from '../budgets/budgets.module';

@Module({
    imports: [PrismaModule, CategoriesModule, BudgetsModule],
    controllers: [InvoicesController],
    providers: [InvoicesService, ScraperService, SefazService],
})
export class InvoicesModule { }
