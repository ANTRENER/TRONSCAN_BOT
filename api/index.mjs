// TRONSCAN Bot - Vercel Serverless Function
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

let nestApp = null;

export default async (req, res) => {
    console.log('=== TRONSCAN Bot Function Called ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);

    try {
        // Initialize NestJS app only once
        if (!nestApp) {
            console.log('Initializing NestJS app...');
            try {
                const app = require('../dist/main.js');
                nestApp = app.default || app;
                console.log('NestJS app loaded successfully');
            } catch (error) {
                console.error('Failed to load NestJS app:', error);
                return res.status(500).json({
                    error: 'Failed to load application',
                    details: error.message
                });
            }
        }

        // Call NestJS handler
        return nestApp(req, res);

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
