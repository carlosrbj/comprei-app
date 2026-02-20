import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) {}

    @Get('plans')
    getPlans() {
        return this.paymentsService.getPlans();
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('checkout')
    createCheckout(
        @Request() req: any,
        @Body() body: { plan: 'pro_monthly' | 'pro_annual' },
    ) {
        return this.paymentsService.createCheckout({
            userId: req.user.id,
            plan: body.plan,
        });
    }

    @Post('webhook')
    handleWebhook(@Body() body: any) {
        return this.paymentsService.handleWebhook(body);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('subscription')
    getSubscription(@Request() req: any) {
        return this.paymentsService.getUserSubscription(req.user.id);
    }
}
