"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const wallet_entity_1 = require("./entities/wallet.entity");
const transaction_checkpoint_entity_1 = require("./entities/transaction-checkpoint.entity");
const wallet_service_1 = require("./services/wallet.service");
const transaction_checkpoint_service_1 = require("./services/transaction-checkpoint.service");
let DatabaseModule = class DatabaseModule {
};
exports.DatabaseModule = DatabaseModule;
exports.DatabaseModule = DatabaseModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
                    type: 'postgres',
                    host: configService.get('database.host'),
                    port: configService.get('database.port'),
                    username: configService.get('database.username'),
                    password: configService.get('database.password'),
                    database: configService.get('database.database'),
                    entities: [wallet_entity_1.Wallet, transaction_checkpoint_entity_1.TransactionCheckpoint],
                    synchronize: process.env.NODE_ENV !== 'production',
                    logging: process.env.NODE_ENV === 'development',
                    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
                    extra: process.env.NODE_ENV === 'production' ? {
                        ssl: { rejectUnauthorized: false }
                    } : undefined,
                    maxQueryExecutionTime: 10000,
                }),
                inject: [config_1.ConfigService],
            }),
            typeorm_1.TypeOrmModule.forFeature([wallet_entity_1.Wallet, transaction_checkpoint_entity_1.TransactionCheckpoint]),
        ],
        providers: [wallet_service_1.WalletService, transaction_checkpoint_service_1.TransactionCheckpointService],
        exports: [typeorm_1.TypeOrmModule, wallet_service_1.WalletService, transaction_checkpoint_service_1.TransactionCheckpointService],
    })
], DatabaseModule);
//# sourceMappingURL=database.module.js.map