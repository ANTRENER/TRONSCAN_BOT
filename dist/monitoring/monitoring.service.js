"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MonitoringService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoringService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const wallet_service_1 = require("../database/services/wallet.service");
const transaction_checkpoint_service_1 = require("../database/services/transaction-checkpoint.service");
const tron_service_1 = require("../tron/tron.service");
const telegram_service_1 = require("../telegram/telegram.service");
let MonitoringService = MonitoringService_1 = class MonitoringService {
    walletService;
    checkpointService;
    tronService;
    telegramService;
    logger = new common_1.Logger(MonitoringService_1.name);
    constructor(walletService, checkpointService, tronService, telegramService) {
        this.walletService = walletService;
        this.checkpointService = checkpointService;
        this.tronService = tronService;
        this.telegramService = telegramService;
    }
    async checkTransactions() {
        this.logger.debug('Checking transactions...');
        try {
            const wallets = await this.walletService.getAllWallets();
            const promises = wallets.map(wallet => this.checkWalletTransactions(wallet));
            await Promise.allSettled(promises);
        }
        catch (error) {
            this.logger.error(`Error during transaction check: ${error.message}`);
        }
    }
    async validateCheckpoints() {
        this.logger.debug('Validating all checkpoints...');
        try {
            const wallets = await this.walletService.getAllWallets();
            for (const wallet of wallets) {
                const checkpoint = await this.checkpointService.getCheckpoint(wallet.address);
                if (!checkpoint) {
                    this.logger.warn(`Wallet ${wallet.address} has no checkpoint!`);
                }
            }
        }
        catch (error) {
            this.logger.error(`Error during checkpoint validation: ${error.message}`);
        }
    }
    async checkWalletTransactions(wallet) {
        try {
            let checkpoint = await this.checkpointService.getCheckpoint(wallet.address);
            this.logger.debug(`Checkpoint for ${wallet.address}:`, checkpoint);
            const minBlockTimestamp = checkpoint && checkpoint.lastBlockNumber
                ? checkpoint.lastBlockNumber * 1000
                : undefined;
            this.logger.debug(`minBlockTimestamp: ${minBlockTimestamp}`);
            const transactions = await this.tronService.getAccountTransactions(wallet.address, 20, minBlockTimestamp);
            if (transactions.length === 0) {
                return;
            }
            const currentBalance = await this.tronService.getAccountBalance(wallet.address);
            let newTransactions = transactions;
            if (checkpoint && checkpoint.lastTransactionHash) {
                const lastProcessedIndex = transactions.findIndex(tx => (tx.transactionHash || tx.txID) === checkpoint.lastTransactionHash);
                if (lastProcessedIndex !== -1) {
                    newTransactions = transactions.slice(0, lastProcessedIndex);
                    this.logger.debug(`Found last processed tx at index ${lastProcessedIndex}, processing ${newTransactions.length} new transactions`);
                }
                else {
                    this.logger.debug(`Last processed tx not found, deleting old checkpoint and processing recent transactions`);
                    try {
                        await this.checkpointService.updateCheckpoint(wallet.address, Date.now(), undefined);
                        this.logger.debug(`Old checkpoint deleted for ${wallet.address}`);
                    }
                    catch (error) {
                        this.logger.error(`Failed to delete old checkpoint for ${wallet.address}: ${error.message}`);
                    }
                    checkpoint = null;
                    newTransactions = transactions.slice(0, 2);
                }
            }
            if (!checkpoint) {
                newTransactions = transactions.slice(0, 2);
                this.logger.debug(`Processing ${newTransactions.length} most recent transactions`);
            }
            this.logger.debug(`Total transactions from API: ${transactions.length}, will process: ${newTransactions.length}`);
            let latestProcessedTx = null;
            let processedCount = 0;
            for (const tx of newTransactions.reverse()) {
                if ((tx.contractRet === 'SUCCESS' || tx.confirmed === true) && tx.amount > 0) {
                    processedCount++;
                    const notificationData = this.tronService.formatTransactionForNotification(tx, currentBalance);
                    await this.telegramService.sendTransactionNotification(wallet.chatId, notificationData);
                    this.logger.log(`Sent notification for transaction ${tx.transactionHash || tx.txID} to chat ${wallet.chatId}`);
                    latestProcessedTx = tx;
                }
            }
            this.logger.debug(`Processed ${processedCount} transactions for ${wallet.address}`);
            if (latestProcessedTx) {
                const timestampValue = latestProcessedTx.timestamp || latestProcessedTx.block_timestamp || Date.now();
                const blockNumber = typeof timestampValue === 'number'
                    ? Math.floor(timestampValue / 1000)
                    : Math.floor(Date.now() / 1000);
                const txHash = latestProcessedTx.transactionHash || latestProcessedTx.txID;
                this.logger.debug(`Updating checkpoint for ${wallet.address}: block=${blockNumber}, hash=${txHash}`);
                try {
                    await this.checkpointService.updateCheckpoint(wallet.address, blockNumber, txHash);
                    this.logger.debug(`Checkpoint updated successfully for ${wallet.address}`);
                }
                catch (error) {
                    this.logger.error(`Failed to update checkpoint for ${wallet.address}: ${error.message}`);
                }
            }
            else {
                this.logger.debug(`No transactions processed for ${wallet.address}, skipping checkpoint update`);
                if (checkpoint && transactions.length > 0) {
                    const latestTx = transactions[0];
                    const timestampValue = latestTx.timestamp || latestTx.block_timestamp || Date.now();
                    const blockNumber = typeof timestampValue === 'number'
                        ? Math.floor(timestampValue / 1000)
                        : Math.floor(Date.now() / 1000);
                    try {
                        await this.checkpointService.updateCheckpoint(wallet.address, blockNumber, checkpoint.lastTransactionHash);
                        this.logger.debug(`Updated checkpoint timestamp for ${wallet.address}`);
                    }
                    catch (error) {
                        this.logger.error(`Failed to update checkpoint timestamp for ${wallet.address}: ${error.message}`);
                    }
                }
            }
        }
        catch (error) {
            this.logger.error(`Error checking transactions for wallet ${wallet.address}: ${error.message}`);
        }
    }
};
exports.MonitoringService = MonitoringService;
__decorate([
    (0, schedule_1.Cron)('0 0 */6 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MonitoringService.prototype, "validateCheckpoints", null);
exports.MonitoringService = MonitoringService = MonitoringService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [wallet_service_1.WalletService,
        transaction_checkpoint_service_1.TransactionCheckpointService,
        tron_service_1.TronService,
        telegram_service_1.TelegramService])
], MonitoringService);
//# sourceMappingURL=monitoring.service.js.map