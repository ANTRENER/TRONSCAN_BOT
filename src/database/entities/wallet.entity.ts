import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('wallets')
export class Wallet {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    address: string;

    @Column()
    chatId: string;


    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
