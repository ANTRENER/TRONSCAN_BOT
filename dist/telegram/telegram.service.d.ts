import { ConfigService } from '@nestjs/config';
import { WalletService } from '../database/services/wallet.service';
import { TronService } from '../tron/tron.service';
export declare class TelegramService {
    private configService;
    private walletService;
    private tronService;
    private readonly logger;
    private bot;
    constructor(configService: ConfigService, walletService: WalletService, tronService: TronService);
    private setupCommands;
    sendTransactionNotification(chatId: string | number, transaction: {
        from: string;
        to: string;
        amount: string;
        balance: string;
        timestamp: string;
        txHash: string;
    }): Promise<void>;
    getBotInfo(): Promise<import("@telegraf/types").UserFromGetMe>;
    stopBot(): Promise<void>;
    handleWebhook(update: any): Promise<void>;
}
