import {
  Controller,
  Get,
  Query,
  Request,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InsightsService } from './insights.service';
import { PlanGuard } from '../common/guards/plan.guard';
import { RequiresPlan } from '../common/decorators/requires-plan.decorator';

@Controller('insights')
@UseGuards(AuthGuard('jwt'))
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  /**
   * GET /insights/inflation
   * Returns the user's personal inflation for the last 12 months (Pro).
   */
  @Get('inflation')
  @UseGuards(PlanGuard)
  @RequiresPlan('pro')
  async getInflation(@Request() req: any) {
    return this.insightsService.getInflation(req.user.id);
  }

  /**
   * GET /insights/forecast
   * Returns next-month spending forecast based on 3-month moving average (Pro).
   */
  @Get('forecast')
  @UseGuards(PlanGuard)
  @RequiresPlan('pro')
  async getForecast(@Request() req: any) {
    return this.insightsService.getForecast(req.user.id);
  }

  /**
   * GET /insights/wrapped?year=2025
   * Returns the annual "Wrapped" report for a given year (Pro).
   */
  @Get('wrapped')
  @UseGuards(PlanGuard)
  @RequiresPlan('pro')
  async getWrapped(
    @Request() req: any,
    @Query('year', new DefaultValuePipe(new Date().getFullYear()), ParseIntPipe)
    year: number,
  ) {
    return this.insightsService.getWrapped(req.user.id, year);
  }

  /**
   * GET /insights/dashboard
   * Lightweight forecast summary for the dashboard (free + pro).
   */
  @Get('dashboard')
  async getDashboard(@Request() req: any) {
    return this.insightsService.getDashboardInsights(req.user.id);
  }
}
