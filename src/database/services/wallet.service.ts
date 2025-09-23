import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from '../entities/wallet.entity';

@Injectable()
export class WalletService {
    constructor(
        @InjectRepository(Wallet)
        private walletRepository: Repository<Wallet>,
    ) { }

    async addWallet(address: string, chatId: string): Promise<Wallet> {
        const existingWallet = await this.walletRepository.findOne({
            where: { address, chatId },
        });

        if (existingWallet) {
            throw new Error('Этот кошелек уже отслеживается');
        }

        const wallet = this.walletRepository.create({
            address,
            chatId,
        });

        return this.walletRepository.save(wallet);
    }

    async removeWallet(address: string, chatId: string): Promise<void> {
        const result = await this.walletRepository.delete({
            address,
            chatId,
        });

        if (result.affected === 0) {
            throw new Error('Кошелек не найден');
        }
    }

    async getWalletsByChatId(chatId: string): Promise<Wallet[]> {
        return this.walletRepository.find({
            where: { chatId },
        });
    }

    async getAllWallets(): Promise<Wallet[]> {
        return this.walletRepository.find();
    }

    async isWalletExists(address: string, chatId: string): Promise<boolean> {
        const count = await this.walletRepository.count({
            where: { address, chatId },
        });
        return count > 0;
    }
}
