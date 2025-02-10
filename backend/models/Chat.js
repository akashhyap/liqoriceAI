import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
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
    messages: [{
        role: {
            type: String,
            enum: ['user', 'assistant'],
            required: true
        },
        content: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        responseTime: {
            type: Number, // in milliseconds
            required: false
        }
    }],
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: false
    },
    metadata: {
        userAgent: String,
        ipAddress: String,
        location: String,
        platform: String,
        sessionDuration: Number // in seconds
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'abandoned'],
        default: 'active'
    }
}, {
    timestamps: true
});

// Add indexes for better query performance
chatSchema.index({ chatbot: 1, createdAt: -1 });
chatSchema.index({ user: 1, createdAt: -1 });
chatSchema.index({ 'messages.timestamp': -1 });

// Calculate session duration before saving
chatSchema.pre('save', function(next) {
    if (this.endTime && this.startTime) {
        this.metadata.sessionDuration = (this.endTime - this.startTime) / 1000; // Convert to seconds
    }
    next();
});

// Virtual for average response time
chatSchema.virtual('averageResponseTime').get(function() {
    const responseTimes = this.messages
        .filter(msg => msg.responseTime)
        .map(msg => msg.responseTime);
    
    if (responseTimes.length === 0) return 0;
    return responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
});

const Chat = mongoose.model('Chat', chatSchema);

export default Chat;
