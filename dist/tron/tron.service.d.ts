import { ConfigService } from '@nestjs/config';
interface TronTransaction {
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
    txID?: string;
    block_timestamp?: number;
    ownerAddress?: string;
    toAddress?: string;
    contractRet?: string;
    contractData?: {
        amount?: number;
        asset_name?: string;
    };
    [key: string]: any;
}
export declare class TronService {
    private configService;
    private readonly logger;
    private readonly httpClient;
    constructor(configService: ConfigService);
    getAccountTransactions(address: string, limit?: number, minBlockTimestamp?: number): Promise<TronTransaction[]>;
    getAccountBalance(address: string): Promise<number>;
    formatTransactionForNotification(tx: TronTransaction, currentBalance: number): {
        from: string;
        to: string;
        amount: string;
        balance: string;
        timestamp: string;
        txHash: string;
    };
    isValidTronAddress(address: string): boolean;
}
export {};
