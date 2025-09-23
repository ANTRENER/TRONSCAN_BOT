import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WalletService } from '../database/services/wallet.service';
import { TransactionCheckpointService } from '../database/services/transaction-checkpoint.service';
import { TronService } from '../tron/tron.service';
import { TelegramService } from '../telegram/telegram.service';

@Injectable()
export class MonitoringService {
    private readonly logger = new Logger(MonitoringService.name);

    constructor(
        private walletService: WalletService,
        private checkpointService: TransactionCheckpointService,
        private tronService: TronService,
        private telegramService: TelegramService,
    ) { }

    // @Cron('0 */5 * * * *') // Отключено для Vercel serverless - используется API endpoint (каждые 5 минут)
    async checkTransactions() {
        this.logger.debug('Checking transactions...');

        try {
            const wallets = await this.walletService.getAllWallets();

            // Оптимизация: параллельная обработка кошельков (не последовательно)
            const promises = wallets.map(wallet => this.checkWalletTransactions(wallet));
            await Promise.allSettled(promises); // Не падаем при ошибке одного кошелька
        } catch (error) {
            this.logger.error(`Error during transaction check: ${error.message}`);
        }
    }

    // Метод для резервной проверки (если основной упадет)
    @Cron('0 0 */6 * * *') // Каждые 6 часов
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
        } catch (error) {
            this.logger.error(`Error during checkpoint validation: ${error.message}`);
        }
    }

    private async checkWalletTransactions(wallet: any) {
        try {
            let checkpoint = await this.checkpointService.getCheckpoint(wallet.address);

            // Проверяем ВСЕ кошельки всегда для гарантированного отслеживания

            this.logger.debug(`Checkpoint for ${wallet.address}:`, checkpoint);

            const minBlockTimestamp = checkpoint && checkpoint.lastBlockNumber
                ? checkpoint.lastBlockNumber * 1000
                : undefined;

            this.logger.debug(`minBlockTimestamp: ${minBlockTimestamp}`);

            const transactions = await this.tronService.getAccountTransactions(
                wallet.address,
                20, // проверяем последние 20 транзакций
                minBlockTimestamp,
            );

            if (transactions.length === 0) {
                return;
            }

            // Получаем текущий баланс
            const currentBalance = await this.tronService.getAccountBalance(wallet.address);

            // Фильтруем только новые транзакции
            // Поскольку API может игнорировать start_timestamp, полагаемся на фильтрацию по hash
            let newTransactions = transactions;

            if (checkpoint && checkpoint.lastTransactionHash) {
                // Ищем индекс последней обработанной транзакции
                const lastProcessedIndex = transactions.findIndex(tx =>
                    (tx.transactionHash || tx.txID) === checkpoint!.lastTransactionHash
                );

                if (lastProcessedIndex !== -1) {
                    // Берем только транзакции НОВЕЕ последней обработанной (до этого индекса)
                    newTransactions = transactions.slice(0, lastProcessedIndex);
                    this.logger.debug(`Found last processed tx at index ${lastProcessedIndex}, processing ${newTransactions.length} new transactions`);
                } else {
                    // Если последняя транзакция не найдена, возможно она слишком старая
                    // В этом случае сбрасываем чекпоинт в базе данных и берем только самые свежие
                    this.logger.debug(`Last processed tx not found, deleting old checkpoint and processing recent transactions`);
                    try {
                        await this.checkpointService.updateCheckpoint(wallet.address, Date.now(), undefined);
                        this.logger.debug(`Old checkpoint deleted for ${wallet.address}`);
                    } catch (error) {
                        this.logger.error(`Failed to delete old checkpoint for ${wallet.address}: ${error.message}`);
                    }
                    // Сброс чекпоинта в памяти
                    checkpoint = null;
                    newTransactions = transactions.slice(0, 2); // Берем 2 свежие для надежности
                }
            }

            if (!checkpoint) {
                // Первый запуск или сброс чекпоинта - берем только свежие транзакции
                newTransactions = transactions.slice(0, 2);
                this.logger.debug(`Processing ${newTransactions.length} most recent transactions`);
            }

            this.logger.debug(`Total transactions from API: ${transactions.length}, will process: ${newTransactions.length}`);

            // Отправляем уведомления о новых транзакциях
            let latestProcessedTx: any = null;
            let processedCount = 0;

            for (const tx of newTransactions.reverse()) { // Обрабатываем в хронологическом порядке
                if ((tx.contractRet === 'SUCCESS' || tx.confirmed === true) && tx.amount > 0) {
                    processedCount++;
                    const notificationData = this.tronService.formatTransactionForNotification(
                        tx,
                        currentBalance,
                    );

                    await this.telegramService.sendTransactionNotification(
                        wallet.chatId,
                        notificationData,
                    );

                    this.logger.log(`Sent notification for transaction ${tx.transactionHash || tx.txID} to chat ${wallet.chatId}`);
                    latestProcessedTx = tx; // Запоминаем последнюю обработанную транзакцию
                }
            }

            this.logger.debug(`Processed ${processedCount} transactions for ${wallet.address}`);

            // Обновляем чекпоинт только если были обработаны транзакции
            if (latestProcessedTx) {
                const timestampValue = latestProcessedTx.timestamp || latestProcessedTx.block_timestamp || Date.now();
                const blockNumber = typeof timestampValue === 'number'
                    ? Math.floor(timestampValue / 1000)
                    : Math.floor(Date.now() / 1000);

                const txHash = latestProcessedTx.transactionHash || latestProcessedTx.txID;
                this.logger.debug(`Updating checkpoint for ${wallet.address}: block=${blockNumber}, hash=${txHash}`);

                try {
                    await this.checkpointService.updateCheckpoint(
                        wallet.address,
                        blockNumber,
                        txHash,
                    );
                    this.logger.debug(`Checkpoint updated successfully for ${wallet.address}`);
                } catch (error) {
                    this.logger.error(`Failed to update checkpoint for ${wallet.address}: ${error.message}`);
                }
            } else {
                this.logger.debug(`No transactions processed for ${wallet.address}, skipping checkpoint update`);
                // Даже если не было новых транзакций, обновляем timestamp чекпоинта
                // чтобы избежать повторных запросов одних и тех же данных
                if (checkpoint && transactions.length > 0) {
                    const latestTx = transactions[0];
                    const timestampValue = latestTx.timestamp || latestTx.block_timestamp || Date.now();
                    const blockNumber = typeof timestampValue === 'number'
                        ? Math.floor(timestampValue / 1000)
                        : Math.floor(Date.now() / 1000);

                    try {
                        await this.checkpointService.updateCheckpoint(
                            wallet.address,
                            blockNumber,
                            checkpoint.lastTransactionHash, // Сохраняем тот же hash
                        );
                        this.logger.debug(`Updated checkpoint timestamp for ${wallet.address}`);
                    } catch (error) {
                        this.logger.error(`Failed to update checkpoint timestamp for ${wallet.address}: ${error.message}`);
                    }
                }
            }
        } catch (error) {
            this.logger.error(`Error checking transactions for wallet ${wallet.address}: ${error.message}`);
        }
    }
}
