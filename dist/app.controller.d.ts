import { AppService } from './app.service';
import { MonitoringService } from './monitoring/monitoring.service';
export declare class AppController {
    private readonly appService;
    private readonly monitoringService;
    constructor(appService: AppService, monitoringService: MonitoringService);
    getHello(): string;
    handleCron(): Promise<{
        status: string;
        message: string;
    }>;
    getHealth(): {
        status: string;
        timestamp: string;
    };
}
