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

    // Здесь можно добавить логику миграций
    return { status: 'ok', message: 'Migration completed' };
  }
}
