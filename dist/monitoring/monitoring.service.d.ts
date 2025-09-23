import { WalletService } from '../database/services/wallet.service';
import { TransactionCheckpointService } from '../database/services/transaction-checkpoint.service';
import { TronService } from '../tron/tron.service';
import { TelegramService } from '../telegram/telegram.service';
export declare class MonitoringService {
    private walletService;
    private checkpointService;
    private tronService;
    private telegramService;
    private readonly logger;
    constructor(walletService: WalletService, checkpointService: TransactionCheckpointService, tronService: TronService, telegramService: TelegramService);
    checkTransactions(): Promise<void>;
    validateCheckpoints(): Promise<void>;
    private checkWalletTransactions;
}
