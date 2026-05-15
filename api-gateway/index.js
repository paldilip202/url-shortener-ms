const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const axios = require('axios');

const app = express();
app.use(express.json());

// Service registry — in production this is Kubernetes DNS or Consul
const SERVICES = {
    url:       process.env.URL_SERVICE       || 'http://localhost:3001',
    analytics: process.env.ANALYTICS_SERVICE || 'http://localhost:3002'
};

// ── LOGGING MIDDLEWARE ────────────────────────────────────────────────
// Every request through the gateway gets logged — one place for all traffic
app.use((req, res, next) => {
    const start = Date.now();
    console.log(`[Gateway] → ${req.method} ${req.url}`);

    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[Gateway] ← ${req.method} ${req.url} ${res.statusCode} (${duration}ms)`);
    });

    next();
});

// ── HEALTH DASHBOARD ──────────────────────────────────────────────────
// The gateway aggregates health from ALL services into one endpoint
// Load balancers and monitoring tools call this single endpoint
app.get('/health', async (req, res) => {
    const checks = await Promise.allSettled([
        axios.get(`${SERVICES.url}/health`,       { timeout: 3000 }),
        axios.get(`${SERVICES.analytics}/health`, { timeout: 3000 })
    ]);

    const services = {
        'url-service': checks[0].status === 'fulfilled'
            ? { status: 'ok', ...checks[0].value.data }
            : { status: 'down', error: checks[0].reason?.message },

        'analytics-service': checks[1].status === 'fulfilled'
            ? { status: 'ok', ...checks[1].value.data }
            : { status: 'down', error: checks[1].reason?.message }
    };

    const allHealthy = Object.values(services).every(s => s.status === 'ok');

    res.status(allHealthy ? 200 : 503).json({
        gateway: 'ok',
        timestamp: new Date().toISOString(),
        services
    });
});

// ── ROUTE: Shorten a URL ──────────────────────────────────────────────
// POST /shorten → forwards to URL Service
app.use('/shorten', createProxyMiddleware({
    target: SERVICES.url,
    changeOrigin: true
}));

// ── ROUTE: Get stats ──────────────────────────────────────────────────
// GET /stats or /stats/:code → forwards to Analytics Service
app.use('/stats', createProxyMiddleware({
    target: SERVICES.analytics,
    changeOrigin: true
}));

// ── ROUTE: Redirect short URLs ────────────────────────────────────────
// GET /:code → forwards to URL Service
// This must be last — it's a catch-all for short codes
app.use('/:code', createProxyMiddleware({
    target: SERVICES.url,
    changeOrigin: true,

    // Rewrite the path so URL Service gets /:code correctly
    pathRewrite: (path) => path
}));

// ── 404 handler ───────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found',
        availableRoutes: [
            'POST /shorten         — shorten a URL',
            'GET  /:code           — redirect to original URL',
            'GET  /stats           — all URL statistics',
            'GET  /stats/:code     — stats for one URL',
            'GET  /health          — system health check'
        ]
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`\n API Gateway running on http://localhost:${PORT}`);
    console.log(`   Routing to URL Service      → ${SERVICES.url}`);
    console.log(`   Routing to Analytics Service → ${SERVICES.analytics}`);
    console.log(`\n   Try: curl -X POST http://localhost:${PORT}/shorten \\`);
    console.log(`             -H "Content-Type: application/json" \\`);
    console.log(`             -d '{"url":"https://google.com"}'`);
});