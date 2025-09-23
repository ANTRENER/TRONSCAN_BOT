import { Repository } from 'typeorm';
import { TransactionCheckpoint } from '../entities/transaction-checkpoint.entity';
export declare class TransactionCheckpointService {
    private checkpointRepository;
    constructor(checkpointRepository: Repository<TransactionCheckpoint>);
    getCheckpoint(walletAddress: string): Promise<TransactionCheckpoint | null>;
    updateCheckpoint(walletAddress: string, lastBlockNumber: number, lastTransactionHash?: string): Promise<TransactionCheckpoint>;
}
