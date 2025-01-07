import express from 'express';
import { protect as auth } from '../middleware/auth.js';
import { getChatbotAnalytics, generateAnalyticsReport } from '../services/analyticsService.js';
import Chatbot from '../models/Chatbot.js';
import ChatHistory from '../models/ChatHistory.js';

const router = express.Router();

// Get analytics for a specific chatbot
router.get('/chatbot/:chatbotId', auth, async (req, res) => {
    try {
        const { chatbotId } = req.params;
        const { timeRange } = req.query;

        const chatbot = await Chatbot.findOne({
            _id: chatbotId,
            user: req.user.id,
        });

        if (!chatbot) {
            return res.status(404).json({
                success: false,
                error: 'Chatbot not found',
            });
        }

        const analytics = await getChatbotAnalytics(chatbotId, timeRange);

        res.json({
            success: true,
            analytics: {
                messageStats: {
                    total: analytics.totalMessages || 0,
                },
                responseTimeStats: {
                    average: analytics.averageResponseTime || 0,
                },
                satisfactionStats: {
                    average: analytics.userSatisfaction || 0,
                }
            },
        });
    } catch (error) {
        console.error('Error fetching chatbot analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Error fetching chatbot analytics',
        });
    }
});

// Get detailed analytics report
router.get('/report/:chatbotId', auth, async (req, res) => {
    try {
        const { chatbotId } = req.params;
        const { timeRange } = req.query;

        const chatbot = await Chatbot.findOne({
            _id: chatbotId,
            user: req.user.id,
        });

        if (!chatbot) {
            return res.status(404).json({
                success: false,
                error: 'Chatbot not found',
            });
        }

        const report = await generateAnalyticsReport(chatbotId, timeRange);

        res.json({
            success: true,
            report,
        });
    } catch (error) {
        console.error('Error generating analytics report:', error);
        res.status(500).json({
            success: false,
            error: 'Error generating analytics report',
        });
    }
});

// Get aggregated analytics for all user's chatbots
router.get('/overview', auth, async (req, res) => {
    try {
        const { timeRange } = req.query;

        const chatbots = await Chatbot.find({ user: req.user.id });
        const analyticsPromises = chatbots.map((chatbot) =>
            getChatbotAnalytics(chatbot._id, timeRange)
                .then((analytics) => ({
                    chatbotId: chatbot._id,
                    name: chatbot.name,
                    analytics: {
                        messageStats: {
                            total: analytics.totalMessages || 0,
                        },
                        responseTimeStats: {
                            average: analytics.averageResponseTime || 0,
                        },
                        satisfactionStats: {
                            average: analytics.userSatisfaction || 0,
                        }
                    },
                }))
                .catch((error) => {
                    console.error(
                        `Error fetching analytics for chatbot ${chatbot._id}:`,
                        error
                    );
                    return null;
                })
        );

        const results = await Promise.all(analyticsPromises);
        const validResults = results.filter(Boolean);

        // Calculate aggregated metrics
        const aggregated = {
            totalMessages: 0,
            totalConversations: 0,
            averageResponseTime: 0,
            averageSatisfaction: 0,
            chatbotCount: validResults.length,
        };

        validResults.forEach(({ analytics }) => {
            aggregated.totalMessages += analytics.messageStats.total;
            aggregated.totalConversations += Math.floor(
                analytics.messageStats.total /
                    analytics.messageStats.averagePerSession
            );
            aggregated.averageResponseTime += analytics.responseTimeStats.average;
            aggregated.averageSatisfaction += analytics.satisfactionStats.average;
        });

        if (validResults.length > 0) {
            aggregated.averageResponseTime /= validResults.length;
            aggregated.averageSatisfaction /= validResults.length;
        }

        res.json({
            success: true,
            overview: {
                aggregated,
                chatbots: validResults,
            },
        });
    } catch (error) {
        console.error('Error fetching analytics overview:', error);
        res.status(500).json({
            success: false,
            error: 'Error fetching analytics overview',
        });
    }
});

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
                    lastTimestamp: { $max: "$timestamp" }
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
                    timestamp: { $gte: thirtyDaysAgo },
                    userId: { $exists: true, $ne: null } // Ensure userId exists
                }
            },
            {
                $group: {
                    _id: "$userId",
                    lastActive: { $max: "$timestamp" }
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

// Export analytics data
router.get('/export/:chatbotId', auth, async (req, res) => {
    try {
        const { chatbotId } = req.params;
        const { timeRange, format = 'json' } = req.query;

        const chatbot = await Chatbot.findOne({
            _id: chatbotId,
            user: req.user.id,
        });

        if (!chatbot) {
            return res.status(404).json({
                success: false,
                error: 'Chatbot not found',
            });
        }

        const report = await generateAnalyticsReport(chatbotId, timeRange);

        if (format === 'csv') {
            // Convert report to CSV format
            const csv = this.convertToCSV(report);
            res.header('Content-Type', 'text/csv');
            res.attachment(`${chatbot.name}-analytics.csv`);
            return res.send(csv);
        }

        // Default to JSON format
        res.header('Content-Type', 'application/json');
        res.attachment(`${chatbot.name}-analytics.json`);
        res.send(JSON.stringify(report, null, 2));
    } catch (error) {
        console.error('Error exporting analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Error exporting analytics',
        });
    }
});

// Helper function to convert report to CSV format
function convertToCSV(report) {
    const {
        messageStats,
        responseTimeStats,
        satisfactionStats,
        topQueries,
        hourlyActivity,
    } = report.analytics;

    const lines = [
        // Headers
        [
            'Metric',
            'Value',
            'Time Range',
            'Generated At',
            'Chatbot Name',
        ].join(','),
        // Message Stats
        ['Total Messages', messageStats.total, report.timeRange, report.generatedAt, report.chatbot.name].join(','),
        ['User Messages', messageStats.user, report.timeRange, report.generatedAt, report.chatbot.name].join(','),
        ['Assistant Messages', messageStats.assistant, report.timeRange, report.generatedAt, report.chatbot.name].join(','),
        ['Average Messages Per Session', messageStats.averagePerSession.toFixed(2), report.timeRange, report.generatedAt, report.chatbot.name].join(','),
        // Response Time Stats
        ['Average Response Time (ms)', responseTimeStats.average.toFixed(2), report.timeRange, report.generatedAt, report.chatbot.name].join(','),
        ['Min Response Time (ms)', responseTimeStats.min, report.timeRange, report.generatedAt, report.chatbot.name].join(','),
        ['Max Response Time (ms)', responseTimeStats.max, report.timeRange, report.generatedAt, report.chatbot.name].join(','),
        // Satisfaction Stats
        ['Average Satisfaction', satisfactionStats.average.toFixed(2), report.timeRange, report.generatedAt, report.chatbot.name].join(','),
        ['Total Ratings', satisfactionStats.total, report.timeRange, report.generatedAt, report.chatbot.name].join(','),
    ];

    // Add top queries
    topQueries.forEach((query, index) => {
        lines.push([
            `Top Query ${index + 1}`,
            `${query.query} (${query.count} times)`,
            report.timeRange,
            report.generatedAt,
            report.chatbot.name,
        ].join(','));
    });

    // Add hourly activity
    hourlyActivity.forEach((hour) => {
        lines.push([
            `Activity at ${hour.hour}:00`,
            hour.count,
            report.timeRange,
            report.generatedAt,
            report.chatbot.name,
        ].join(','));
    });

    return lines.join('\n');
}

export default router;
