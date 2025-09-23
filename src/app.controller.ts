import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { MonitoringService } from './monitoring/monitoring.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly monitoringService: MonitoringService,
  ) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // Endpoint для Vercel cron jobs
  @Post('api/cron')
  async handleCron() {
    console.log('Vercel cron triggered');
    await this.monitoringService.checkTransactions();
    return { status: 'ok', message: 'Transaction check completed' };
  }

  // Альтернативный endpoint для cron
  @Post('cron')
  async handleCronAlt() {
    console.log('Alternative cron triggered');
    await this.monitoringService.checkTransactions();
    return { status: 'ok', message: 'Transaction check completed' };
  }

  // Health check endpoint
  @Get('health')
  getHealth() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  // Migration endpoint (только для разработки)
  @Post('migrate')
  async runMigration() {
    if (process.env.NODE_ENV === 'production') {
      return { error: 'Migrations disabled in production' };
    }

    try {
      // Имитируем миграцию через SQL команды
      const { Client } = require('pg');
      const client = new Client({
        connectionString: process.env.DATABASE_URL
      });

      await client.connect();

      // Добавить колонку user_id (если еще нет)
      await client.query('ALTER TABLE wallets ADD COLUMN IF NOT EXISTS user_id VARCHAR(255)');

      // Удалить уникальное ограничение на address
      await client.query('ALTER TABLE wallets DROP CONSTRAINT IF EXISTS UQ_f907d5fd09a9d374f1da4e13bd3');

      // Добавить уникальное ограничение на address + user_id
      await client.query('ALTER TABLE wallets ADD CONSTRAINT UQ_wallet_address_user UNIQUE (address, user_id)');

      // Добавить индекс на user_id
      await client.query('CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets (user_id)');

      await client.end();

      return { status: 'ok', message: 'Migration completed successfully' };
    } catch (error) {
      return { error: 'Migration failed', details: error.message };
    }
  }
}
