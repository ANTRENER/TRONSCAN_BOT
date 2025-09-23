import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from '../database/database.module';
import { TronModule } from '../tron/tron.module';
import { TelegramModule } from '../telegram/telegram.module';
import { MonitoringService } from './monitoring.service';

@Module({
    imports: [
        ScheduleModule.forRoot(),
        DatabaseModule,
        TronModule,
        TelegramModule,
    ],
    providers: [MonitoringService],
    exports: [MonitoringService],
})
export class MonitoringModule { }
