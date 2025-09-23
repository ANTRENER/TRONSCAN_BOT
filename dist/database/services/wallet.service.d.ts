import { Repository } from 'typeorm';
import { Wallet } from '../entities/wallet.entity';
export declare class WalletService {
    private walletRepository;
    constructor(walletRepository: Repository<Wallet>);
    addWallet(address: string, chatId: string): Promise<Wallet>;
    removeWallet(address: string, chatId: string): Promise<void>;
    getWalletsByChatId(chatId: string): Promise<Wallet[]>;
    getAllWallets(): Promise<Wallet[]>;
    isWalletExists(address: string, chatId: string): Promise<boolean>;
}
