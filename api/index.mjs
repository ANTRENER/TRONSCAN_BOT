// TRONSCAN Bot - Vercel Serverless Function
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

export default async (req, res) => {
    console.log('=== TRONSCAN Bot Function Called ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);

    try {
        // Load your existing NestJS app
        const app = require('../dist/main.js');
        console.log('NestJS app loaded successfully');

        // Call your existing NestJS handler
        const handler = app.default || app;
        return handler(req, res);

    } catch (error) {
        console.error('❌ FUNCTION ERROR:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
    }
};
