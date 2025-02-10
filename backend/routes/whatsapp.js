import express from 'express';
import { protect } from '../middleware/auth.js';
import WhatsappMessage from '../models/whatsappMessage.js';
import logger from '../services/loggerService.js';

const router = express.Router();

// Webhook endpoint for receiving WhatsApp messages
router.post('/webhook', async (req, res) => {
    try {
        // This will be implemented when WhatsApp Business API is integrated
        // For now, just log and return success
        logger.info('Received webhook request', { body: req.body });
        res.status(200).send('OK');
    } catch (error) {
        logger.error('Error in webhook handler', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get messages for a specific chatbot
router.get('/messages/:chatbotId', protect, async (req, res) => {
    try {
        const { chatbotId } = req.params;
        const { page = 1, limit = 50 } = req.query;

        const messages = await WhatsappMessage.find({ chatbotId })
            .sort({ timestamp: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await WhatsappMessage.countDocuments({ chatbotId });

        res.json({
            messages,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        logger.error('Error fetching WhatsApp messages', { error });
        res.status(500).json({ error: 'Error fetching messages' });
    }
});

// Get conversation history with a specific phone number
router.get('/conversation/:chatbotId/:phoneNumber', protect, async (req, res) => {
    try {
        const { chatbotId, phoneNumber } = req.params;
        const { page = 1, limit = 50 } = req.query;

        const messages = await WhatsappMessage.find({ chatbotId, phoneNumber })
            .sort({ timestamp: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await WhatsappMessage.countDocuments({ chatbotId, phoneNumber });

        res.json({
            messages,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        logger.error('Error fetching conversation history', { error });
        res.status(500).json({ error: 'Error fetching conversation history' });
    }
});

// Get message statistics
router.get('/stats/:chatbotId', protect, async (req, res) => {
    try {
        const { chatbotId } = req.params;
        const { startDate, endDate } = req.query;

        const query = { chatbotId };
        if (startDate && endDate) {
            query.timestamp = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const stats = await WhatsappMessage.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$direction',
                    count: { $sum: 1 },
                    messageTypes: {
                        $push: '$messageType'
                    }
                }
            }
        ]);

        res.json(stats);
    } catch (error) {
        logger.error('Error fetching WhatsApp statistics', { error });
        res.status(500).json({ error: 'Error fetching statistics' });
    }
});

export default router;
