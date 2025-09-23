import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

interface TronTransaction {
    // Новые поля из API /transfer
    transactionHash: string;
    block: number;
    timestamp: number;
    from: string;
    to: string;
    amount: number;
    tokenInfo?: {
        address: string;
        name: string;
        symbol: string;
        decimals: number;
    };
    confirmed: boolean;

    // Старые поля для совместимости (могут отсутствовать)
    txID?: string;
    block_timestamp?: number;
    ownerAddress?: string;
    toAddress?: string;
    contractRet?: string;
    contractData?: {
        amount?: number;
        asset_name?: string;
    };

    // Дополнительные поля, которые могут быть в ответе
    [key: string]: any;
}

interface TronAccount {
    balance: number;
    address: string;
}

@Injectable()
export class TronService {
    private readonly logger = new Logger(TronService.name);
    private readonly httpClient: AxiosInstance;

    constructor(private configService: ConfigService) {
        this.httpClient = axios.create({
            baseURL: this.configService.get<string>('tronscan.apiUrl'),
            timeout: 10000,
            headers: {
                'TRON-PRO-API-KEY': this.configService.get<string>('tronscan.apiKey'),
            },
        });
    }

    async getAccountTransactions(
        address: string,
        limit = 50,
        minBlockTimestamp?: number,
    ): Promise<TronTransaction[]> {
        try {
            const params: any = {
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
        } catch (error) {
            this.logger.error(`Failed to get transactions for ${address}: ${error.message}`);
            throw error;
        }
    }

    async getAccountBalance(address: string): Promise<number> {
        try {
            const response = await this.httpClient.get('/account', {
                params: { address },
            });

            const account: TronAccount = response.data;
            return account.balance ? account.balance / 1000000 : 0; // TRX имеет 6 десятичных знаков
        } catch (error) {
            this.logger.error(`Failed to get balance for ${address}: ${error.message}`);
            return 0;
        }
    }

    formatTransactionForNotification(
        tx: TronTransaction,
        currentBalance: number,
    ): {
        from: string;
        to: string;
        amount: string;
        balance: string;
        timestamp: string;
        txHash: string;
    } {
        // ВРЕМЕННО отключаем детальные логи
        // this.logger.debug('Transaction object keys:', Object.keys(tx));
        // this.logger.debug('Transaction object:', JSON.stringify(tx, null, 2));

        // Определяем сумму транзакции
        let amount = '0';
        if (tx.amount && tx.amount > 0) {
            // TRX имеет 6 десятичных знаков, TRC10/TRC20 могут иметь разные decimals
            const decimals = tx.tokenInfo?.decimals || 6;
            amount = (tx.amount / Math.pow(10, decimals)).toFixed(6);
        } else if (tx.contractData?.amount) {
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
        const from = (tx as any).transferFromAddress || tx.from || tx.ownerAddress || 'Неизвестный';
        const to = (tx as any).transferToAddress || tx.to || tx.toAddress || 'Системный контракт';

        return {
            from,
            to,
            amount,
            balance: currentBalance.toFixed(6),
            timestamp,
            txHash,
        };
    }

    isValidTronAddress(address: string): boolean {
        // Простая валидация TRON адреса (начинается с T, 34 символа)
        return /^T[0-9a-zA-Z]{33}$/.test(address);
    }
}
