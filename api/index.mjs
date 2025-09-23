// Vercel serverless function entry point
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const app = require('../dist/main.js');

export default async (req, res) => {
    try {
        // Call the NestJS handler
        if (app.default) {
            return app.default(req, res);
        } else {
            return app(req, res);
        }
    } catch (error) {
        console.error('Function error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};