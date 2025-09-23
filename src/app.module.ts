import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { TelegramModule } from './telegram/telegram.module';
import { TronModule } from './tron/tron.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    DatabaseModule,
    TelegramModule,
    TronModule,
    MonitoringModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
