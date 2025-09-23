// TRONSCAN Bot - Vercel Serverless Function
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Import your existing NestJS app
const app = require('../dist/main.js');

export default async (req, res) => {
    console.log('=== TRONSCAN Bot Function Called ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);

    try {
        // Call your existing NestJS app
        if (app.default) {
            return app.default(req, res);
        } else {
            return app(req, res);
        }
    } catch (error) {
        console.error('❌ ERROR:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
};
