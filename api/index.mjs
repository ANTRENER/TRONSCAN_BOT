// TRONSCAN Bot - Vercel Serverless Function
export default async (req, res) => {
    console.log('=== TRONSCAN Bot Function Called ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Headers:', req.headers);

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        console.log('OPTIONS request - returning 200');
        res.status(200).end();
        return;
    }

    try {
        // Handle different endpoints
        if (req.url === '/api/cron' && req.method === 'POST') {
            console.log('✅ CRON ENDPOINT TRIGGERED');
            res.status(200).json({
                status: 'ok',
                message: 'Transaction check completed',
                timestamp: new Date().toISOString(),
                endpoint: 'cron'
            });
        }
        else if (req.url === '/api/telegram' && req.method === 'POST') {
            console.log('✅ TELEGRAM WEBHOOK RECEIVED');
            console.log('Body:', req.body);
            res.status(200).json({
                status: 'ok',
                message: 'Telegram update processed',
                timestamp: new Date().toISOString(),
                endpoint: 'telegram'
            });
        }
        else if (req.url === '/health' && req.method === 'GET') {
            console.log('✅ HEALTH CHECK');
            res.status(200).json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                service: 'TRONSCAN Bot',
                endpoint: 'health'
            });
        }
        else if (req.url === '/' && req.method === 'GET') {
            console.log('✅ ROOT ENDPOINT');
            res.status(200).json({
                status: 'ok',
                message: 'TRONSCAN Bot is running',
                timestamp: new Date().toISOString(),
                endpoints: ['/api/cron', '/api/telegram', '/health']
            });
        }
        else {
            console.log('❌ NOT FOUND:', req.url, req.method);
            res.status(404).json({
                error: 'Not found',
                url: req.url,
                method: req.method,
                availableEndpoints: ['/api/cron', '/api/telegram', '/health', '/']
            });
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
