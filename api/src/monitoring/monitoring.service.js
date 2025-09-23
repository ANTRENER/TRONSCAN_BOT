"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoringService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
let MonitoringService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _validateCheckpoints_decorators;
    var MonitoringService = _classThis = class {
        constructor(walletService, checkpointService, tronService, telegramService) {
            this.walletService = (__runInitializers(this, _instanceExtraInitializers), walletService);
            this.checkpointService = checkpointService;
            this.tronService = tronService;
            this.telegramService = telegramService;
            this.logger = new common_1.Logger(MonitoringService.name);
        }
        // @Cron('0 */5 * * * *') // Отключено для Vercel serverless - используется API endpoint (каждые 5 минут)
        async checkTransactions() {
            this.logger.debug('Checking transactions...');
            try {
                const wallets = await this.walletService.getAllWallets();
                // Оптимизация: параллельная обработка кошельков (не последовательно)
                const promises = wallets.map(wallet => this.checkWalletTransactions(wallet));
                await Promise.allSettled(promises); // Не падаем при ошибке одного кошелька
            }
            catch (error) {
                this.logger.error(`Error during transaction check: ${error.message}`);
            }
        }
        // Метод для резервной проверки (если основной упадет)
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
                // Проверяем ВСЕ кошельки всегда для гарантированного отслеживания
                this.logger.debug(`Checkpoint for ${wallet.address}:`, checkpoint);
                const minBlockTimestamp = checkpoint && checkpoint.lastBlockNumber
                    ? checkpoint.lastBlockNumber * 1000
                    : undefined;
                this.logger.debug(`minBlockTimestamp: ${minBlockTimestamp}`);
                const transactions = await this.tronService.getAccountTransactions(wallet.address, 20, // проверяем последние 20 транзакций
                minBlockTimestamp);
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
                    const lastProcessedIndex = transactions.findIndex(tx => (tx.transactionHash || tx.txID) === checkpoint.lastTransactionHash);
                    if (lastProcessedIndex !== -1) {
                        // Берем только транзакции НОВЕЕ последней обработанной (до этого индекса)
                        newTransactions = transactions.slice(0, lastProcessedIndex);
                        this.logger.debug(`Found last processed tx at index ${lastProcessedIndex}, processing ${newTransactions.length} new transactions`);
                    }
                    else {
                        // Если последняя транзакция не найдена, возможно она слишком старая
                        // В этом случае сбрасываем чекпоинт в базе данных и берем только самые свежие
                        this.logger.debug(`Last processed tx not found, deleting old checkpoint and processing recent transactions`);
                        try {
                            await this.checkpointService.updateCheckpoint(wallet.address, Date.now(), undefined);
                            this.logger.debug(`Old checkpoint deleted for ${wallet.address}`);
                        }
                        catch (error) {
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
                let latestProcessedTx = null;
                let processedCount = 0;
                for (const tx of newTransactions.reverse()) { // Обрабатываем в хронологическом порядке
                    if ((tx.contractRet === 'SUCCESS' || tx.confirmed === true) && tx.amount > 0) {
                        processedCount++;
                        const notificationData = this.tronService.formatTransactionForNotification(tx, currentBalance);
                        await this.telegramService.sendTransactionNotification(wallet.chatId, notificationData);
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
                        await this.checkpointService.updateCheckpoint(wallet.address, blockNumber, txHash);
                        this.logger.debug(`Checkpoint updated successfully for ${wallet.address}`);
                    }
                    catch (error) {
                        this.logger.error(`Failed to update checkpoint for ${wallet.address}: ${error.message}`);
                    }
                }
                else {
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
    __setFunctionName(_classThis, "MonitoringService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _validateCheckpoints_decorators = [(0, schedule_1.Cron)('0 0 */6 * * *')];
        __esDecorate(_classThis, null, _validateCheckpoints_decorators, { kind: "method", name: "validateCheckpoints", static: false, private: false, access: { has: obj => "validateCheckpoints" in obj, get: obj => obj.validateCheckpoints }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        MonitoringService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return MonitoringService = _classThis;
})();
exports.MonitoringService = MonitoringService;
