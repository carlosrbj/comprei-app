import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { PlanGuard } from '../common/guards/plan.guard';
import { RequiresPlan } from '../common/decorators/requires-plan.decorator';
import { ExportsService } from './exports.service';

function parseDates(startDate: string, endDate: string): { start: Date; end: Date } {
  if (!startDate || !endDate) {
    throw new BadRequestException('startDate e endDate são obrigatórios (YYYY-MM-DD)');
  }
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Set end to end-of-day
  end.setHours(23, 59, 59, 999);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new BadRequestException('Datas inválidas. Use o formato YYYY-MM-DD');
  }
  if (start > end) {
    throw new BadRequestException('startDate deve ser anterior a endDate');
  }
  return { start, end };
}

@Controller('exports')
@UseGuards(AuthGuard('jwt'), PlanGuard)
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  // GET /exports/pdf?startDate=2026-01-01&endDate=2026-01-31
  @Get('pdf')
  @RequiresPlan('pro')
  async exportPdf(
    @Request() req: any,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() res: Response,
  ) {
    const { start, end } = parseDates(startDate, endDate);
    const buffer = await this.exportsService.exportPdf(req.user.id, start, end);
    const filename = `comprei-relatorio-${startDate}-${endDate}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }

  // GET /exports/excel?startDate=2026-01-01&endDate=2026-01-31
  @Get('excel')
  @RequiresPlan('pro')
  async exportExcel(
    @Request() req: any,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() res: Response,
  ) {
    const { start, end } = parseDates(startDate, endDate);
    const buffer = await this.exportsService.exportExcel(req.user.id, start, end);
    const filename = `comprei-dados-${startDate}-${endDate}.xlsx`;

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }

  // GET /exports/csv?startDate=2026-01-01&endDate=2026-01-31
  @Get('csv')
  @RequiresPlan('pro')
  async exportCsv(
    @Request() req: any,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() res: Response,
  ) {
    const { start, end } = parseDates(startDate, endDate);
    const csv = await this.exportsService.exportCsv(req.user.id, start, end);
    const filename = `comprei-dados-${startDate}-${endDate}.csv`;

    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    res.send('\uFEFF' + csv); // BOM para Excel abrir UTF-8 corretamente
  }
}
