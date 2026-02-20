import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) {}

    @UseGuards(AuthGuard('jwt'))
    @Post('register')
    registerToken(
        @Request() req: any,
        @Body() body: { token: string; platform: string },
    ) {
        return this.notificationsService.registerToken(
            req.user.id,
            body.token,
            body.platform,
        );
    }
}
