import mongoose from 'mongoose';

const chatSessionSchema = new mongoose.Schema({
    chatbot: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chatbot',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date
    },
    messageCount: {
        type: Number,
        default: 0
    },
    messages: [{
        role: {
            type: String,
            enum: ['user', 'assistant', 'system'],
            required: true
        },
        content: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    userSatisfactionScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    averageResponseTime: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'completed'],
        default: 'active'
    },
    channel: {
        type: String,
        required: true,
        enum: ['web', 'whatsapp', 'facebook', 'instagram']
    },
    metadata: {
        userAgent: String,
        ipAddress: String,
        location: String,
        deviceType: String
    }
}, {
    timestamps: true
});

// Calculate average response time when adding new messages
chatSessionSchema.methods.updateMetrics = function() {
    if (this.messages.length < 2) return;

    // Calculate average response time
    let totalResponseTime = 0;
    let responseCount = 0;

    for (let i = 1; i < this.messages.length; i++) {
        const currentMessage = this.messages[i];
        const prevMessage = this.messages[i - 1];

        if (currentMessage.role === 'assistant' && prevMessage.role === 'user') {
            const responseTime = currentMessage.timestamp - prevMessage.timestamp;
            totalResponseTime += responseTime;
            responseCount++;
        }
    }

    this.averageResponseTime = responseCount > 0 ? totalResponseTime / responseCount / 1000 : 0; // Convert to seconds
    this.messageCount = this.messages.length;
};

// Update session status when ended
chatSessionSchema.methods.endSession = function() {
    this.status = 'completed';
    this.endTime = new Date();
};

const ChatSession = mongoose.model('ChatSession', chatSessionSchema);

export default ChatSession;
