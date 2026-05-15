const express = require('express');
const { nanoid } = require('nanoid');
const axios = require('axios');

const app = express();
app.use(express.json());

// Service URLs — in production these come from environment variables
// or a service discovery system
const ANALYTICS_SERVICE_URL = process.env.ANALYTICS_URL || 'http://localhost:3002';

// In-memory URL store
const urlStore = new Map();
// Structure: { 'abc123': { code, originalUrl, createdAt, createdBy } }

// ── SHORTEN A URL ─────────────────────────────────────────────────────
app.post('/shorten', async (req, res) => {
    const { url, customCode } = req.body;

    // Validate input
    if (!url) {
        return res.status(400).json({ error: 'url is required' });
    }

    // Basic URL validation
    try {
        new URL(url); // throws if invalid URL
    } catch {
        return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Use custom code if provided, otherwise generate one
    const code = customCode || nanoid(7); // 7-character random code

    // Check if custom code is already taken
    if (customCode && urlStore.has(customCode)) {
        return res.status(409).json({ error: 'This custom code is already taken' });
    }

    // Check if this URL was already shortened (deduplication)
    for (const [existingCode, data] of urlStore.entries()) {
        if (data.originalUrl === url) {
            return res.json({
                message: 'URL already shortened',
                code: existingCode,
                shortUrl: `http://localhost:3000/${existingCode}`,
                originalUrl: url,
                createdAt: data.createdAt
            });
        }
    }

    // Store the mapping
    const entry = {
        code,
        originalUrl: url,
        createdAt: new Date()
    };
    urlStore.set(code, entry);

    console.log(`[URL Service] Shortened: ${url} → ${code}`);

    res.status(201).json({
        code,
        shortUrl: `http://localhost:3000/${code}`,
        originalUrl: url,
        createdAt: entry.createdAt
    });
});

// ── REDIRECT ──────────────────────────────────────────────────────────
app.get('/:code', async (req, res) => {
    const { code } = req.params;
    const entry = urlStore.get(code);

    if (!entry) {
        return res.status(404).json({ error: 'Short URL not found' });
    }

    console.log(`[URL Service] Redirecting: ${code} → ${entry.originalUrl}`);

    // Notify analytics service — fire and forget (async, non-blocking)
    // We don't await this — we don't want to slow down the redirect
    // if Analytics Service is slow or temporarily down
    axios.post(`${ANALYTICS_SERVICE_URL}/track`, {
        code,
        originalUrl: entry.originalUrl,
        userAgent: req.headers['user-agent'],
        ip: req.ip
    }).catch(err => {
        // Log but don't fail the redirect — analytics is non-critical
        console.warn(`[URL Service] Analytics tracking failed: ${err.message}`);
    });

    // Redirect the user immediately — don't wait for analytics
    res.redirect(301, entry.originalUrl);
});

// ── GET ALL STORED URLs ───────────────────────────────────────────────
app.get('/', (req, res) => {
    const urls = Array.from(urlStore.values()).map(e => ({
        code: e.code,
        shortUrl: `http://localhost:3000/${e.code}`,
        originalUrl: e.originalUrl,
        createdAt: e.createdAt
    }));

    res.json({ total: urls.length, urls });
});

// ── HEALTH CHECK ──────────────────────────────────────────────────────
app.get('/health', (req, res) => {
    res.json({
        service: 'url-service',
        status: 'ok',
        uptime: Math.floor(process.uptime()),
        storedUrls: urlStore.size
    });
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`✅ URL Service running on http://localhost:${PORT}`);
});