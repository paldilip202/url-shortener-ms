const express = require('express');
const app = express();
app.use(express.json());

// In-memory store — survives as long as the process is running
// In a real system this would be Redis or a database
const clickData = new Map();
// Structure: { 'abc123': { clicks: 5, lastClicked: Date, history: [...] } }

// ── RECORD A CLICK ────────────────────────────────────────────────────
// Called by URL Service every time someone visits a short URL
app.post('/track', (req, res) => {
    const { code, originalUrl, userAgent, ip } = req.body;

    if (!code) {
        return res.status(400).json({ error: 'code is required' });
    }

    // Get existing data or create fresh entry
    const existing = clickData.get(code) || {
        code,
        originalUrl,
        clicks: 0,
        createdAt: new Date(),
        lastClicked: null,
        history: []
    };

    // Update the analytics
    existing.clicks += 1;
    existing.lastClicked = new Date();
    existing.history.push({
        timestamp: new Date(),
        userAgent: userAgent || 'unknown',
        ip: ip || 'unknown'
    });

    // Keep only last 100 clicks in history (memory management)
    if (existing.history.length > 100) {
        existing.history = existing.history.slice(-100);
    }

    clickData.set(code, existing);

    console.log(`[Analytics] Tracked click for code: ${code} | Total: ${existing.clicks}`);

    res.status(200).json({ success: true, totalClicks: existing.clicks });
});

// ── GET STATS FOR ONE URL ─────────────────────────────────────────────
app.get('/stats/:code', (req, res) => {
    const { code } = req.params;
    const data = clickData.get(code);

    if (!data) {
        return res.status(404).json({ error: 'No stats found for this code' });
    }

    res.json({
        code,
        originalUrl: data.originalUrl,
        totalClicks: data.clicks,
        createdAt: data.createdAt,
        lastClicked: data.lastClicked,
        recentHistory: data.history.slice(-10) // last 10 clicks
    });
});

// ── GET STATS FOR ALL URLs ────────────────────────────────────────────
app.get('/stats', (req, res) => {
    const allStats = Array.from(clickData.values()).map(d => ({
        code: d.code,
        originalUrl: d.originalUrl,
        totalClicks: d.clicks,
        lastClicked: d.lastClicked
    }));

    // Sort by most clicked
    allStats.sort((a, b) => b.totalClicks - a.totalClicks);

    res.json({
        totalUrls: allStats.length,
        totalClicks: allStats.reduce((sum, s) => sum + s.totalClicks, 0),
        urls: allStats
    });
});

// ── HEALTH CHECK ─────────────────────────────────────────────────────
// Every service must have this — used by gateway to check if service is alive
app.get('/health', (req, res) => {
    res.json({
        service: 'analytics-service',
        status: 'ok',
        uptime: Math.floor(process.uptime()),
        trackedUrls: clickData.size
    });
});

const PORT = 3002;
app.listen(PORT, () => {
    console.log(`✅ Analytics Service running on http://localhost:${PORT}`);
});