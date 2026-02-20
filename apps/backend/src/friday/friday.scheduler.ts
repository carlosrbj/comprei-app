import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { FridayService } from './friday.service';

@Injectable()
export class FridayScheduler {
    private readonly logger = new Logger(FridayScheduler.name);

    constructor(private readonly fridayService: FridayService) {}

    // Every Friday at 17:00 BRT (20:00 UTC)
    @Cron('0 17 * * 5', {
        name: 'friday-notification',
        timeZone: 'America/Sao_Paulo',
    })
    async handleFridayNotifications() {
        this.logger.log('Executing Liberdade de Sexta...');

        try {
            const results = await this.fridayService.sendFridayNotificationsToAll();
            const sent = results.filter((r: any) => r.sent).length;
            this.logger.log(`Liberdade de Sexta: ${sent}/${results.length} sent`);
            return results;
        } catch (error) {
            this.logger.error('Error sending Friday notifications:', error);
            throw error;
        }
    }

    async sendNow() {
        return this.handleFridayNotifications();
    }
}
