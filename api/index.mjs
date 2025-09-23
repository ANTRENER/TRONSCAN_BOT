// Vercel serverless function entry point
import app from '../dist/main.js';

export default async (req, res) => {
    try {
        // Call the NestJS handler
        return app(req, res);
    } catch (error) {
        console.error('Function error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};