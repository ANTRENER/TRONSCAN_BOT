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
exports.TelegramService = void 0;
const common_1 = require("@nestjs/common");
const telegraf_1 = require("telegraf");
let TelegramService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var TelegramService = _classThis = class {
        constructor(configService, walletService, tronService) {
            this.configService = configService;
            this.walletService = walletService;
            this.tronService = tronService;
            this.logger = new common_1.Logger(TelegramService.name);
            const token = this.configService.get('telegram.botToken');
            this.bot = new telegraf_1.Telegraf(token);
            this.setupCommands();
            // Для Vercel используем webhook вместо polling
            if (process.env.VERCEL_URL) {
                const webhookUrl = `${process.env.VERCEL_URL}/api/telegram`;
                this.bot.telegram.setWebhook(webhookUrl);
                this.logger.log(`Telegram webhook set to: ${webhookUrl}`);
            }
            else {
                // Для локальной разработки используем polling
                this.bot.launch();
                this.logger.log('Telegram bot started with polling');
            }
        }
        setupCommands() {
            this.bot.start((ctx) => {
                ctx.reply('Привет! Я бот для мониторинга транзакций TRON кошельков.\n\n' +
                    'Команды:\n' +
                    '/add_wallet <адрес> - добавить кошелек для мониторинга\n' +
                    '/remove_wallet <адрес> - удалить кошелек\n' +
                    '/list_wallets - показать список отслеживаемых кошельков\n' +
                    '/help - показать эту справку');
            });
            this.bot.help((ctx) => {
                ctx.reply('Команды:\n' +
                    '/add_wallet <адрес> - добавить кошелек для мониторинга\n' +
                    '/remove_wallet <адрес> - удалить кошелек\n' +
                    '/list_wallets - показать список отслеживаемых кошельков\n' +
                    '/help - показать эту справку');
            });
            this.bot.command('add_wallet', async (ctx) => {
                const address = ctx.message.text.split(' ')[1];
                if (!address) {
                    ctx.reply('Пожалуйста, укажите адрес кошелька: /add_wallet <адрес>');
                    return;
                }
                if (!this.tronService.isValidTronAddress(address)) {
                    ctx.reply('Неверный формат TRON адреса. Адрес должен начинаться с T и содержать 34 символа.');
                    return;
                }
                try {
                    const chatId = ctx.chat.id.toString();
                    await this.walletService.addWallet(address, chatId);
                    ctx.reply(`✅ Кошелек ${address} добавлен для мониторинга`);
                }
                catch (error) {
                    ctx.reply(`❌ Ошибка: ${error.message}`);
                }
            });
            this.bot.command('remove_wallet', async (ctx) => {
                const address = ctx.message.text.split(' ')[1];
                if (!address) {
                    ctx.reply('Пожалуйста, укажите адрес кошелька: /remove_wallet <адрес>');
                    return;
                }
                try {
                    const chatId = ctx.chat.id.toString();
                    await this.walletService.removeWallet(address, chatId);
                    ctx.reply(`✅ Кошелек ${address} удален из мониторинга`);
                }
                catch (error) {
                    ctx.reply(`❌ Ошибка: ${error.message}`);
                }
            });
            this.bot.command('list_wallets', async (ctx) => {
                try {
                    const chatId = ctx.chat.id.toString();
                    const wallets = await this.walletService.getWalletsByChatId(chatId);
                    if (wallets.length === 0) {
                        ctx.reply('У вас нет отслеживаемых кошельков');
                        return;
                    }
                    const walletList = wallets
                        .map(wallet => `• ${wallet.address}`)
                        .join('\n');
                    ctx.reply(`📋 Ваши отслеживаемые кошельки:\n${walletList}`);
                }
                catch (error) {
                    ctx.reply(`❌ Ошибка: ${error.message}`);
                }
            });
        }
        async sendTransactionNotification(chatId, transaction) {
            const message = `🔔 Новая транзакция!\n\n` +
                `Исходящий кошелек: ${transaction.from}\n` +
                `Кому: ${transaction.to}\n` +
                `Сумма: ${transaction.amount} TRX\n` +
                `Баланс: ${transaction.balance} TRX\n` +
                `Дата и время: ${transaction.timestamp}\n\n` +
                `🔗 [Посмотреть транзакцию](https://tronscan.org/#/transaction/${transaction.txHash})`;
            try {
                await this.bot.telegram.sendMessage(chatId, message, {
                    parse_mode: 'Markdown',
                });
            }
            catch (error) {
                this.logger.error(`Failed to send notification: ${error.message}`);
            }
        }
        getBotInfo() {
            return this.bot.telegram.getMe();
        }
        async stopBot() {
            await this.bot.stop();
        }
        // Метод для обработки webhook (для Vercel)
        async handleWebhook(update) {
            await this.bot.handleUpdate(update);
        }
    };
    __setFunctionName(_classThis, "TelegramService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        TelegramService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return TelegramService = _classThis;
})();
exports.TelegramService = TelegramService;
