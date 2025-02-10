const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { botService } = require('../services/bot.service');
const crypto = require('crypto');

// Verify webhook signature
const verifyWebhookSignature = (req, res, next) => {
    const signature = req.headers['x-webhook-signature'];
    const timestamp = req.headers['x-webhook-timestamp'];
    const body = JSON.stringify(req.body);
    
    if (!signature || !timestamp) {
        return res.status(401).json({ message: 'Missing webhook signature or timestamp' });
    }

    // Verify timestamp is recent (within 5 minutes)
    const timestampAge = Math.floor(Date.now() / 1000) - parseInt(timestamp);
    if (timestampAge > 300) {
        return res.status(401).json({ message: 'Webhook timestamp too old' });
    }

    // Verify signature
    const expectedSignature = crypto
        .createHmac('sha256', process.env.WEBHOOK_SECRET || 'your-webhook-secret')
        .update(`${timestamp}.${body}`)
        .digest('hex');

    if (signature !== expectedSignature) {
        return res.status(401).json({ message: 'Invalid webhook signature' });
    }

    next();
};

// Register a new webhook
router.post('/register', protect, async (req, res) => {
    try {
        const { botId, url, events, secret } = req.body;

        if (!url || !events || !Array.isArray(events)) {
            return res.status(400).json({ 
                message: 'URL and events array are required' 
            });
        }

        const webhook = await botService.registerWebhook(botId, {
            url,
            events,
            secret: secret || crypto.randomBytes(32).toString('hex')
        });

        res.json(webhook);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// List webhooks for a bot
router.get('/bot/:botId', protect, async (req, res) => {
    try {
        const { botId } = req.params;
        const webhooks = await botService.getWebhooks(botId);
        res.json(webhooks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update webhook
router.put('/:webhookId', protect, async (req, res) => {
    try {
        const { webhookId } = req.params;
        const { url, events, active } = req.body;

        const webhook = await botService.updateWebhook(webhookId, {
            url,
            events,
            active
        });

        res.json(webhook);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete webhook
router.delete('/:webhookId', protect, async (req, res) => {
    try {
        const { webhookId } = req.params;
        await botService.deleteWebhook(webhookId);
        res.json({ message: 'Webhook deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Webhook endpoint for receiving events from external services
router.post('/receive/:botId', verifyWebhookSignature, async (req, res) => {
    try {
        const { botId } = req.params;
        const event = req.body;

        // Process the incoming webhook event
        await botService.processWebhookEvent(botId, event);
        res.json({ message: 'Event processed successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
