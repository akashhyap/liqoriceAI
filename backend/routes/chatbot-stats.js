import express from 'express';
import { protect as auth } from '../middleware/auth.js';
import Chatbot from '../models/Chatbot.js';
import ChatHistory from '../models/ChatHistory.js';

const router = express.Router();

// Get total conversations and active users stats
router.get('/stats', auth, async (req, res) => {
    try {
        const chatbots = await Chatbot.find({ user: req.user.id });
        const chatbotIds = chatbots.map(chatbot => chatbot._id);

        // Get total conversations (unique session count)
        const totalConversations = await ChatHistory.aggregate([
            {
                $match: {
                    chatbot: { $in: chatbotIds }
                }
            },
            {
                $group: {
                    _id: "$sessionId",
                    count: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 }
                }
            }
        ]);

        // Get active users (unique users in the last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const activeUsers = await ChatHistory.aggregate([
            {
                $match: {
                    chatbot: { $in: chatbotIds },
                    timestamp: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: "$userId",
                    count: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 }
                }
            }
        ]);

        res.json({
            totalConversations: totalConversations[0]?.total || 0,
            activeUsers: activeUsers[0]?.total || 0
        });
    } catch (error) {
        console.error('Error fetching chatbot stats:', error);
        res.status(500).json({
            success: false,
            error: 'Error fetching chatbot stats'
        });
    }
});

export default router;
