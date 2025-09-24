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
            // Получаем USDT transfers для конкретного адреса
            const params: any = {
                relatedAddress: address,
                limit: Math.min(limit, 20),
                contract_address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', // USDT contract address
                sort: '-timestamp',
            };

            if (minBlockTimestamp) {
                params.start_timestamp = minBlockTimestamp * 1000;
            }

            this.logger.debug(`API request params for USDT transfers:`, params);

            const response = await this.httpClient.get('/token_trc20/transfers', {
                params,
            });

            this.logger.debug(`API response for ${address}:`, response.data.token_transfers?.[0]);
            return response.data.token_transfers || [];
        } catch (error) {
            this.logger.error(`Failed to get USDT transfers for ${address}: ${error.message}`);
            throw error;
        }
    }

    async getAccountBalance(address: string): Promise<number> {
        try {
            // Получаем данные аккаунта с балансами токенов
            const response = await this.httpClient.get('/account', {
                params: { address },
            });

            const accountData = response.data;

            if (!accountData || !accountData.trc20token_balances) {
                this.logger.warn(`No account data or trc20token_balances for ${address}`);
                return 0;
            }

            // Ищем USDT токен по адресу контракта
            const usdtToken = accountData.trc20token_balances.find(
                token => token.tokenAddress === 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'
            );

            // Если не найден по адресу, попробуем найти по символу
            if (!usdtToken) {
                const usdtBySymbol = accountData.trc20token_balances.find(
                    token => token.tokenAbbr === 'USDT'
                );

                if (usdtBySymbol) {
                    const balance = parseFloat(usdtBySymbol.balance) / Math.pow(10, usdtBySymbol.tokenDecimal || 6);
                    this.logger.debug(`USDT balance for ${address}: ${balance}`);
                    return balance;
                }
            } else {
                const balance = parseFloat(usdtToken.balance) / Math.pow(10, usdtToken.tokenDecimal || 6);
                this.logger.debug(`USDT balance for ${address}: ${balance}`);
                return balance;
            }

            this.logger.warn(`USDT token not found for ${address}`);
            return 0;
        } catch (error) {
            this.logger.error(`Failed to get USDT balance for ${address}: ${error.message}`);
            return 0;
        }
    }

    formatTransactionForNotification(
        tx: TronTransaction,
        currentBalance: number,
        walletAddress: string,
    ): {
        walletAddress: string;
        from: string;
        to: string;
        amount: string;
        balance: string;
        timestamp: string;
        txHash: string;
        direction: 'in' | 'out';
    } {
        // Определяем сумму USDT транзакции
        let amount = '0';
        if (tx.amount && tx.amount > 0) {
            // USDT имеет 6 десятичных знаков
            const amountValue = tx.amount / 1000000;
            amount = this.formatNumber(amountValue);
        } else if ((tx as any).quant) {
            // Для TRC20 transfers используется поле quant
            const amountValue = (tx as any).quant / 1000000;
            amount = this.formatNumber(amountValue);
        }

        // Определяем timestamp
        const timestampValue = tx.timestamp || (tx as any).block_ts || Date.now();
        const date = new Date(timestampValue);

        // Проверяем, что дата валидна
        const isValidDate = !isNaN(date.getTime());
        const timestamp = isValidDate ? date.toISOString() : new Date().toISOString();

        // Определяем hash транзакции
        const txHash = tx.transactionHash || (tx as any).transaction_id || 'undefined';

        // Определяем адреса отправителя и получателя для USDT transfers
        const from = (tx as any).from_address || tx.from || 'Неизвестный';
        const to = (tx as any).to_address || tx.to || 'Неизвестный';

        // Определяем направление транзакции
        const direction = from.toLowerCase() === walletAddress.toLowerCase() ? 'out' : 'in';

        return {
            walletAddress,
            from,
            to,
            amount,
            balance: this.formatNumber(currentBalance),
            timestamp,
            txHash,
            direction,
        };
    }

    private formatNumber(value: number): string {
        // Убираем лишние нули и добавляем разделители тысяч
        const formatted = value.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
        return formatted;
    }

    isValidTronAddress(address: string): boolean {
        // Простая валидация TRON адреса (начинается с T, 34 символа)
        return /^T[0-9a-zA-Z]{33}$/.test(address);
    }
}
