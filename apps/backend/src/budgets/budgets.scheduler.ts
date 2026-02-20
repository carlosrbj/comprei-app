import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BudgetsService } from './budgets.service';

@Injectable()
export class BudgetsScheduler {
  private readonly logger = new Logger(BudgetsScheduler.name);

  constructor(private readonly budgetsService: BudgetsService) {}

  // Verifica todos os orçamentos diariamente às 21h BRT
  @Cron('0 21 * * *', {
    name: 'check-budgets',
    timeZone: 'America/Sao_Paulo',
  })
  async handleBudgetCheck() {
    this.logger.log('💰 Iniciando verificação diária de orçamentos...');
    await this.budgetsService.checkAllBudgets();
  }
}
