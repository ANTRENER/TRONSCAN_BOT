import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { TronModule } from '../tron/tron.module';
import { TelegramService } from './telegram.service';
import { TelegramController } from './telegram.controller';

@Module({
    imports: [ConfigModule, DatabaseModule, TronModule],
    providers: [TelegramService],
    controllers: [TelegramController],
    exports: [TelegramService],
})
export class TelegramModule { }
