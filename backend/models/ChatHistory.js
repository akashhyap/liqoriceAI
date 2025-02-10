import mongoose from 'mongoose';

const chatHistorySchema = new mongoose.Schema(
    {
        chatbot: {
            type: mongoose.Schema.ObjectId,
            ref: 'Chatbot',
            required: true,
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: false,  // Optional for public chat
        },
        anonymousUserId: {
            type: String,
            required: false,
            index: true      // Index for analytics queries
        },
        sessionId: {
            type: String,
            required: false,
            default: () => Math.random().toString(36).substring(7),
            index: true      // Index for session tracking
        },
        message: {
            type: String,
            required: true,
        },
        response: {
            type: String,
            required: true,
        },
        timestamp: {
            type: Date,
            default: Date.now,
            index: true      // Index for time-based queries
        },
        metadata: {
            sources: [String],
            confidence: Number,
            processingTime: Number,
            userAgent: String,
            lastActivityTime: Date,
            ipAddress: String
        }
    },
    {
        timestamps: true,
    }
);

// Add compound indexes for analytics queries
chatHistorySchema.index({ chatbot: 1, timestamp: -1 });
chatHistorySchema.index({ chatbot: 1, anonymousUserId: 1, timestamp: -1 });
chatHistorySchema.index({ chatbot: 1, sessionId: 1, timestamp: -1 });

const ChatHistory = mongoose.model('ChatHistory', chatHistorySchema);
export default ChatHistory;