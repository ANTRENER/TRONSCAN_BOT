import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Wallet } from './entities/wallet.entity';
import { TransactionCheckpoint } from './entities/transaction-checkpoint.entity';
import { WalletService } from './services/wallet.service';
import { TransactionCheckpointService } from './services/transaction-checkpoint.service';

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                type: 'postgres',
                host: configService.get('database.host'),
                port: configService.get('database.port'),
                username: configService.get('database.username'),
                password: configService.get('database.password'),
                database: configService.get('database.database'),
                entities: [Wallet, TransactionCheckpoint],
                synchronize: true, // В продакшене использовать миграции
                logging: false,
                ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
            }),
            inject: [ConfigService],
        }),
        TypeOrmModule.forFeature([Wallet, TransactionCheckpoint]),
    ],
    providers: [WalletService, TransactionCheckpointService],
    exports: [TypeOrmModule, WalletService, TransactionCheckpointService],
})
export class DatabaseModule { }
