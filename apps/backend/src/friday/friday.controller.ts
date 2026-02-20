import { Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FridayService } from './friday.service';
import { FridayScheduler } from './friday.scheduler';

@Controller('friday')
@UseGuards(AuthGuard('jwt'))
export class FridayController {
    constructor(
        private readonly fridayService: FridayService,
        private readonly fridayScheduler: FridayScheduler,
    ) {}

    @Get('current')
    getCurrentWeek(@Request() req: any) {
        return this.fridayService.getCurrentWeek(req.user.id);
    }

    @Get('history')
    getHistory(@Request() req: any) {
        return this.fridayService.getHistory(req.user.id);
    }

    @Post('send-now')
    sendNow(@Request() req: any) {
        return this.fridayService.sendFridayNotification(req.user.id);
    }

    @Post('trigger-all')
    triggerAll() {
        return this.fridayScheduler.sendNow();
    }
}
