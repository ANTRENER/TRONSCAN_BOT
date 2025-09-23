"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
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
let DatabaseModule = (() => {
    let _classDecorators = [(0, common_1.Module)({
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
                    inject: [config_1.ConfigService],
                }),
                typeorm_1.TypeOrmModule.forFeature([wallet_entity_1.Wallet, transaction_checkpoint_entity_1.TransactionCheckpoint]),
            ],
            providers: [wallet_service_1.WalletService, transaction_checkpoint_service_1.TransactionCheckpointService],
            exports: [typeorm_1.TypeOrmModule, wallet_service_1.WalletService, transaction_checkpoint_service_1.TransactionCheckpointService],
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var DatabaseModule = _classThis = class {
    };
    __setFunctionName(_classThis, "DatabaseModule");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        DatabaseModule = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return DatabaseModule = _classThis;
})();
exports.DatabaseModule = DatabaseModule;
