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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var TronService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TronService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
let TronService = TronService_1 = class TronService {
    configService;
    logger = new common_1.Logger(TronService_1.name);
    httpClient;
    constructor(configService) {
        this.configService = configService;
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
                limit: Math.min(limit, 20),
                sort: '-timestamp',
            };
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
            return account.balance ? account.balance / 1000000 : 0;
        }
        catch (error) {
            this.logger.error(`Failed to get balance for ${address}: ${error.message}`);
            return 0;
        }
    }
    formatTransactionForNotification(tx, currentBalance) {
        let amount = '0';
        if (tx.amount && tx.amount > 0) {
            const decimals = tx.tokenInfo?.decimals || 6;
            amount = (tx.amount / Math.pow(10, decimals)).toFixed(6);
        }
        else if (tx.contractData?.amount) {
            amount = (tx.contractData.amount / 1000000).toFixed(6);
        }
        const timestampValue = tx.timestamp || tx.block_timestamp || Date.now();
        const date = new Date(timestampValue);
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
        const txHash = tx.transactionHash || tx.txID || 'undefined';
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
        return /^T[0-9a-zA-Z]{33}$/.test(address);
    }
};
exports.TronService = TronService;
exports.TronService = TronService = TronService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], TronService);
//# sourceMappingURL=tron.service.js.map