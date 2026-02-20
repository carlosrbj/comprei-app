import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReferralService } from './referral.service';

@Controller('referral')
@UseGuards(AuthGuard('jwt'))
export class ReferralController {
    constructor(private readonly referralService: ReferralService) {}

    @Get('stats')
    getStats(@Request() req: any) {
        return this.referralService.getMyStats(req.user.id);
    }
}
