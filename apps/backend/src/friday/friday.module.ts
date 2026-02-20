import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { FridayService } from './friday.service';
import { FridayScheduler } from './friday.scheduler';
import { FridayController } from './friday.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [
        ScheduleModule.forRoot(),
        PrismaModule,
        NotificationsModule,
    ],
    controllers: [FridayController],
    providers: [FridayService, FridayScheduler],
    exports: [FridayService],
})
export class FridayModule {}
