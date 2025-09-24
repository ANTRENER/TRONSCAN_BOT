import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf } from 'telegraf';
import { WalletService } from '../database/services/wallet.service';
import { TronService } from '../tron/tron.service';

@Injectable()
export class TelegramService {
    private readonly logger = new Logger(TelegramService.name);
    private bot: Telegraf;

    constructor(
        private configService: ConfigService,
        private walletService: WalletService,
        private tronService: TronService,
    ) {
        const token = this.configService.get('telegram.botToken');
        this.bot = new Telegraf(token);

        this.setupCommands();

        // Для Vercel используем webhook вместо polling
        if (process.env.VERCEL_URL) {
            const webhookUrl = `${process.env.VERCEL_URL}/api/telegram`;
            this.bot.telegram.setWebhook(webhookUrl);
            this.logger.log(`Telegram webhook set to: ${webhookUrl}`);
        } else {
            // Для локальной разработки используем polling
            this.bot.launch();
            this.logger.log('Telegram bot started with polling');
        }
    }

    private setupCommands() {
        this.bot.start((ctx) => {
            ctx.reply(
                'Привет! Я бот для мониторинга транзакций TRON кошельков.\n\n' +
                'Команды:\n' +
                '/add_wallet <адрес> - добавить кошелек для мониторинга\n' +
                '/remove_wallet <адрес> - удалить кошелек\n' +
                '/list_wallets - показать список отслеживаемых кошельков\n' +
                '/help - показать эту справку'
            );
        });

        this.bot.help((ctx) => {
            ctx.reply(
                'Команды:\n' +
                '/add_wallet <адрес> - добавить кошелек для мониторинга\n' +
                '/remove_wallet <адрес> - удалить кошелек\n' +
                '/list_wallets - показать список отслеживаемых кошельков\n' +
                '/help - показать эту справку'
            );
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
            } catch (error) {
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
            } catch (error) {
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
            } catch (error) {
                ctx.reply(`❌ Ошибка: ${error.message}`);
            }
        });
    }

    async sendTransactionNotification(
        chatId: string | number,
        transaction: {
            walletAddress: string;
            from: string;
            to: string;
            amount: string;
            balance: string;
            timestamp: string;
            txHash: string;
            direction: 'in' | 'out';
        }
    ) {
        const direction = transaction.direction === 'out' ? '🔺 Исходящий' : '🔻 Входящий';
        const date = new Date(transaction.timestamp).toLocaleString('ru-RU', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        const message =
            `Кошелек:\n` +
            `${transaction.walletAddress}\n` +
            `Исходящий 🔺/ Входящий 🔻\n` +
            `Кому:\n` +
            `${transaction.to}\n\n` +
            `Сумма: ${transaction.amount} USDT\n` +
            `Баланс: ${transaction.balance} USDT\n\n` +
            `Дата/время: ${date}\n` +
            `🔗 [Ссылка на транзакцию](https://tronscan.org/#/transaction/${transaction.txHash})`;

        try {
            await this.bot.telegram.sendMessage(chatId, message, {
                parse_mode: 'Markdown',
            });
        } catch (error) {
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
    async handleWebhook(update: any) {
        await this.bot.handleUpdate(update);
    }
}
