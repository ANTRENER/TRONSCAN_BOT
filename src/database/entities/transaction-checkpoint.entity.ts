import { Entity, Column, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('transaction_checkpoints')
export class TransactionCheckpoint {
    @PrimaryColumn()
    walletAddress: string;

    @Column({ type: 'bigint' })
    lastBlockNumber: number;

    @Column({ nullable: true })
    lastTransactionHash: string;

    @UpdateDateColumn()
    updatedAt: Date;
}
