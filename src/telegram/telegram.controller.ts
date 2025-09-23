import { Controller, Post, Body } from '@nestjs/common';
import { TelegramService } from './telegram.service';

@Controller('api/telegram')
export class TelegramController {
    constructor(private readonly telegramService: TelegramService) { }

    @Post()
    async handleWebhook(@Body() update: any) {
        // Обработка webhook от Telegram
        await this.telegramService.handleWebhook(update);
        return { status: 'ok' };
    }
}
