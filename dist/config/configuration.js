"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => ({
    telegram: {
        botToken: process.env.TELEGRAM_BOT_TOKEN
    },
    database: {
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '5432', 10),
        username: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME
    },
    tronscan: {
        apiUrl: process.env.TRONSCAN_API_URL,
        apiKey: process.env.TRONSCAN_API_KEY
    },
});
//# sourceMappingURL=configuration.js.map