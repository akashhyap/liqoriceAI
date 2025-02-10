import Chat from '../models/Chat.js';

export async function getChatbotAnalytics(chatbotId, timeRange = '7d') {
    try {
        // Get the date range
        const endDate = new Date();
        const startDate = new Date();
        switch (timeRange) {
            case '24h':
                startDate.setHours(startDate.getHours() - 24);
                break;
            case '7d':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case '30d':
                startDate.setDate(startDate.getDate() - 30);
                break;
            default:
                startDate.setDate(startDate.getDate() - 7);
        }

        // Get chat messages for the chatbot within the time range
        const messages = await Chat.find({
            chatbot: chatbotId,
            timestamp: { $gte: startDate, $lte: endDate }
        });

        // Calculate analytics
        const totalMessages = messages.length;
        
        // Calculate average response time (in seconds)
        const responseTimes = messages
            .filter(msg => msg.responseTime)
            .map(msg => msg.responseTime);
        const averageResponseTime = responseTimes.length > 0
            ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
            : 0;

        // Calculate user satisfaction (if implemented)
        const ratings = messages
            .filter(msg => msg.rating)
            .map(msg => msg.rating);
        const userSatisfaction = ratings.length > 0
            ? ratings.reduce((a, b) => a + b, 0) / ratings.length
            : 0;

        return {
            totalMessages,
            averageResponseTime,
            userSatisfaction
        };
    } catch (error) {
        console.error('Error getting chatbot analytics:', error);
        throw error;
    }
}

export async function generateAnalyticsReport(chatbotId, timeRange = '7d') {
    try {
        const analytics = await getChatbotAnalytics(chatbotId, timeRange);
        
        // Add any additional report-specific data here
        return {
            generatedAt: new Date(),
            timeRange,
            ...analytics,
            // Add more detailed metrics as needed
            messageBreakdown: {
                total: analytics.totalMessages,
                averagePerDay: analytics.totalMessages / (timeRange === '7d' ? 7 : 30)
            },
            performanceMetrics: {
                averageResponseTime: analytics.averageResponseTime,
                userSatisfaction: analytics.userSatisfaction
            }
        };
    } catch (error) {
        console.error('Error generating analytics report:', error);
        throw error;
    }
}
