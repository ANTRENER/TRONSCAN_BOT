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

    async addWallet(address: string, chatId: string, userId?: string): Promise<Wallet> {
        // Проверяем, есть ли уже этот кошелек в этом чате
        const existingWallet = await this.walletRepository.findOne({
            where: { address, chatId },
        });

        if (existingWallet) {
            throw new Error('Этот кошелек уже отслеживается в этом чате');
        }

        // Если userId передан, проверяем, есть ли этот кошелек у этого пользователя в другом чате
        if (userId) {
            const userWallet = await this.walletRepository.findOne({
                where: { address, userId },
            });

            if (userWallet) {
                throw new Error('Этот кошелек уже отслеживается вами в другом чате');
            }
        }

        const wallet = this.walletRepository.create({
            address,
            chatId,
            userId,
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
