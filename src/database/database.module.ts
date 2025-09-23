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
                synchronize: process.env.NODE_ENV !== 'production', // В продакшене использовать миграции
                logging: process.env.NODE_ENV === 'development',
                ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
                // Настройки для serverless среды
                extra: process.env.NODE_ENV === 'production' ? {
                    ssl: { rejectUnauthorized: false }
                } : undefined,
                // Ограничение пула соединений для Vercel
                maxQueryExecutionTime: 10000, // 10 секунд таймаут
            }),
            inject: [ConfigService],
        }),
        TypeOrmModule.forFeature([Wallet, TransactionCheckpoint]),
    ],
    providers: [WalletService, TransactionCheckpointService],
    exports: [TypeOrmModule, WalletService, TransactionCheckpointService],
})
export class DatabaseModule { }
