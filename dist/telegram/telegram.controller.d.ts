import { TelegramService } from './telegram.service';
export declare class TelegramController {
    private readonly telegramService;
    constructor(telegramService: TelegramService);
    handleWebhook(update: any): Promise<{
        status: string;
    }>;
}
