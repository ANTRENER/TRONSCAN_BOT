// Simple Vercel function for TRONSCAN Bot
export default async (req, res) => {
    console.log('Request:', req.method, req.url);

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        if (req.url === '/api/cron' && req.method === 'POST') {
            console.log('Cron triggered');
            res.status(200).json({
                status: 'ok',
                message: 'Transaction check completed',
                timestamp: new Date().toISOString()
            });
        } else if (req.url === '/api/telegram' && req.method === 'POST') {
            console.log('Telegram webhook received');
            res.status(200).json({
                status: 'ok',
                message: 'Telegram update processed'
            });
        } else if (req.url === '/health' && req.method === 'GET') {
            res.status(200).json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                service: 'TRONSCAN Bot'
            });
        } else {
            res.status(404).json({
                error: 'Not found',
                url: req.url,
                method: req.method
            });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
};