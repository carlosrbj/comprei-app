import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(AuthGuard('jwt'))
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) {}

    @Get('summary')
    getSummary(@Request() req: any, @Query('period') period: string = 'current') {
        return this.reportsService.getSummary(req.user.id, period);
    }

    @Get('by-category')
    getByCategory(@Request() req: any, @Query('period') period: string = 'current') {
        return this.reportsService.getByCategory(req.user.id, period);
    }

    @Get('by-store')
    getByStore(@Request() req: any, @Query('period') period: string = 'current') {
        return this.reportsService.getByStore(req.user.id, period);
    }

    @Get('trend')
    getTrend(@Request() req: any, @Query('months') months: string = '6') {
        return this.reportsService.getTrend(req.user.id, parseInt(months) || 6);
    }

    @Get('inflation')
    getInflation(@Request() req: any, @Query('limit') limit: string = '10') {
        return this.reportsService.getInflation(req.user.id, parseInt(limit) || 10);
    }
}
