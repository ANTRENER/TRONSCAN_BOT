import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionCheckpoint } from '../entities/transaction-checkpoint.entity';

@Injectable()
export class TransactionCheckpointService {
    constructor(
        @InjectRepository(TransactionCheckpoint)
        private checkpointRepository: Repository<TransactionCheckpoint>,
    ) { }

    async getCheckpoint(walletAddress: string): Promise<TransactionCheckpoint | null> {
        return this.checkpointRepository.findOne({
            where: { walletAddress },
        });
    }

    async updateCheckpoint(
        walletAddress: string,
        lastBlockNumber: number,
        lastTransactionHash?: string,
    ): Promise<TransactionCheckpoint> {
        let checkpoint = await this.getCheckpoint(walletAddress);

        if (!checkpoint) {
            checkpoint = this.checkpointRepository.create({
                walletAddress,
                lastBlockNumber,
                lastTransactionHash,
            });
        } else {
            checkpoint.lastBlockNumber = lastBlockNumber;
            if (lastTransactionHash) {
                checkpoint.lastTransactionHash = lastTransactionHash;
            }
        }

        const saved = await this.checkpointRepository.save(checkpoint);
        console.log(`Checkpoint saved for ${walletAddress}:`, saved);
        return saved;
    }
}
