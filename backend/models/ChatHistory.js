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
            required: false,  // Make optional for public chat
        },
        sessionId: {
            type: String,
            required: false,  // Make optional for public chat
            default: () => Math.random().toString(36).substring(7)  // Generate random session ID if not provided
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
        },
        metadata: {
            sources: [String],
            confidence: Number,
            processingTime: Number,
        }
    },
    {
        timestamps: true,
    }
);

const ChatHistory = mongoose.model('ChatHistory', chatHistorySchema);
export default ChatHistory;
