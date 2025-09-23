"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TelegramService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const telegraf_1 = require("telegraf");
const wallet_service_1 = require("../database/services/wallet.service");
const tron_service_1 = require("../tron/tron.service");
let TelegramService = TelegramService_1 = class TelegramService {
    configService;
    walletService;
    tronService;
    logger = new common_1.Logger(TelegramService_1.name);
    bot;
    constructor(configService, walletService, tronService) {
        this.configService = configService;
        this.walletService = walletService;
        this.tronService = tronService;
        const token = this.configService.get('telegram.botToken');
        this.bot = new telegraf_1.Telegraf(token);
        this.setupCommands();
        if (process.env.VERCEL_URL) {
            const webhookUrl = `${process.env.VERCEL_URL}/api/telegram`;
            this.bot.telegram.setWebhook(webhookUrl);
            this.logger.log(`Telegram webhook set to: ${webhookUrl}`);
        }
        else {
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
    async handleWebhook(update) {
        await this.bot.handleUpdate(update);
    }
};
exports.TelegramService = TelegramService;
exports.TelegramService = TelegramService = TelegramService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        wallet_service_1.WalletService,
        tron_service_1.TronService])
], TelegramService);
//# sourceMappingURL=telegram.service.js.map