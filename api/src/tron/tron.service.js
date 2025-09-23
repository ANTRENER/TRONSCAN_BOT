"use strict";
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
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TronService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
let TronService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var TronService = _classThis = class {
        constructor(configService) {
            this.configService = configService;
            this.logger = new common_1.Logger(TronService.name);
            this.httpClient = axios_1.default.create({
                baseURL: this.configService.get('tronscan.apiUrl'),
                timeout: 10000,
                headers: {
                    'TRON-PRO-API-KEY': this.configService.get('tronscan.apiKey'),
                },
            });
        }
        async getAccountTransactions(address, limit = 50, minBlockTimestamp) {
            try {
                const params = {
                    address,
                    limit: Math.min(limit, 20), // Увеличиваем лимит для лучшей фильтрации
                    sort: '-timestamp',
                };
                // ВРЕМЕННО отключаем start_timestamp, так как API возвращает 400
                // if (minBlockTimestamp) {
                //     // minBlockTimestamp приходит в секундах, API ожидает миллисекунды
                //     params.start_timestamp = minBlockTimestamp * 1000;
                //     this.logger.debug(`Requesting transactions since: ${new Date(params.start_timestamp).toISOString()}`);
                // }
                this.logger.debug(`API request params:`, params);
                const response = await this.httpClient.get('/transfer', {
                    params,
                });
                this.logger.debug(`API response for ${address}:`, response.data.data?.[0]);
                return response.data.data || [];
            }
            catch (error) {
                this.logger.error(`Failed to get transactions for ${address}: ${error.message}`);
                throw error;
            }
        }
        async getAccountBalance(address) {
            try {
                const response = await this.httpClient.get('/account', {
                    params: { address },
                });
                const account = response.data;
                return account.balance ? account.balance / 1000000 : 0; // TRX имеет 6 десятичных знаков
            }
            catch (error) {
                this.logger.error(`Failed to get balance for ${address}: ${error.message}`);
                return 0;
            }
        }
        formatTransactionForNotification(tx, currentBalance) {
            // ВРЕМЕННО отключаем детальные логи
            // this.logger.debug('Transaction object keys:', Object.keys(tx));
            // this.logger.debug('Transaction object:', JSON.stringify(tx, null, 2));
            // Определяем сумму транзакции
            let amount = '0';
            if (tx.amount && tx.amount > 0) {
                // TRX имеет 6 десятичных знаков, TRC10/TRC20 могут иметь разные decimals
                const decimals = tx.tokenInfo?.decimals || 6;
                amount = (tx.amount / Math.pow(10, decimals)).toFixed(6);
            }
            else if (tx.contractData?.amount) {
                // Старый формат для совместимости
                amount = (tx.contractData.amount / 1000000).toFixed(6);
            }
            // Определяем timestamp
            const timestampValue = tx.timestamp || tx.block_timestamp || Date.now();
            const date = new Date(timestampValue);
            // Проверяем, что дата валидна
            const isValidDate = !isNaN(date.getTime());
            const timestamp = isValidDate ? date.toLocaleString('ru-RU', {
                timeZone: 'Europe/Moscow',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            }) : 'Неверная дата';
            // Определяем hash транзакции
            const txHash = tx.transactionHash || tx.txID || 'undefined';
            // Определяем адреса отправителя и получателя
            // Для /transfer endpoint используются transferFromAddress и transferToAddress
            const from = tx.transferFromAddress || tx.from || tx.ownerAddress || 'Неизвестный';
            const to = tx.transferToAddress || tx.to || tx.toAddress || 'Системный контракт';
            return {
                from,
                to,
                amount,
                balance: currentBalance.toFixed(6),
                timestamp,
                txHash,
            };
        }
        isValidTronAddress(address) {
            // Простая валидация TRON адреса (начинается с T, 34 символа)
            return /^T[0-9a-zA-Z]{33}$/.test(address);
        }
    };
    __setFunctionName(_classThis, "TronService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        TronService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return TronService = _classThis;
})();
exports.TronService = TronService;
