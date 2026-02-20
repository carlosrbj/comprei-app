import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BudgetsService } from './budgets.service';

@Controller('budgets')
@UseGuards(AuthGuard('jwt'))
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  // POST /budgets
  @Post()
  setBudget(
    @Request() req: any,
    @Body() body: { categoryId?: string; amount: number; period?: string },
  ) {
    return this.budgetsService.setBudget(
      req.user.id,
      body.categoryId ?? null,
      body.amount,
      (body.period as any) ?? 'monthly',
    );
  }

  // GET /budgets
  @Get()
  getUserBudgets(@Request() req: any) {
    return this.budgetsService.getUserBudgets(req.user.id);
  }

  // GET /budgets/suggestions
  @Get('suggestions')
  getSuggestions(@Request() req: any) {
    return this.budgetsService.getSuggestedBudgets(req.user.id);
  }

  // GET /budgets/history
  @Get('history')
  getHistory(@Request() req: any) {
    return this.budgetsService.getBudgetHistory(req.user.id);
  }

  // GET /budgets/:id/progress
  @Get(':id/progress')
  getProgress(@Param('id') id: string) {
    return this.budgetsService.calculateProgress(id);
  }

  // DELETE /budgets/:id
  @Delete(':id')
  deleteBudget(@Request() req: any, @Param('id') id: string) {
    return this.budgetsService.deleteBudget(req.user.id, id);
  }
}
