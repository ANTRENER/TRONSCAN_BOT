// Простой скрипт миграции
const { Client } = require('pg');

async function migrate() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });

    try {
        await client.connect();
        console.log('Connected to database');

        // Добавить колонку user_id (если еще нет)
        await client.query('ALTER TABLE wallets ADD COLUMN IF NOT EXISTS user_id VARCHAR(255)');
        console.log('Added user_id column');

        // Удалить уникальное ограничение на address
        await client.query('ALTER TABLE wallets DROP CONSTRAINT IF EXISTS UQ_f907d5fd09a9d374f1da4e13bd3');
        console.log('Removed unique constraint on address');

        // Добавить уникальное ограничение на address + user_id
        await client.query('ALTER TABLE wallets ADD CONSTRAINT UQ_wallet_address_user UNIQUE (address, user_id)');
        console.log('Added unique constraint on address + user_id');

        // Добавить индекс на user_id
        await client.query('CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets (user_id)');
        console.log('Added index on user_id');

        console.log('Migration completed successfully!');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await client.end();
    }
}

migrate();
