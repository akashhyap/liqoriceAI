import mongoose from 'mongoose';

const visitorSessionSchema = new mongoose.Schema({
    visitorUser: {
        type: mongoose.Schema.ObjectId,
        ref: 'VisitorUser',
        required: true
    },
    chatbot: {
        type: mongoose.Schema.ObjectId,
        ref: 'Chatbot',
        required: true
    },
    sessionStartTime: {
        type: Date,
        default: Date.now
    },
    sessionEndTime: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: true
    },
    messageCount: {
        type: Number,
        default: 0
    },
    lastMessageAt: {
        type: Date
    },
    analytics: {
        duration: Number, // in minutes
        responseRate: Number, // percentage
        topics: [{
            topic: String,
            count: Number
        }],
        userSentiment: {
            type: String,
            enum: ['positive', 'neutral', 'negative']
        }
    },
    chatHistory: {
        type: mongoose.Schema.ObjectId,
        ref: 'VisitorChatHistory'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Method to end session
visitorSessionSchema.methods.endSession = async function() {
    this.sessionEndTime = Date.now();
    this.isActive = false;
    
    // Calculate session analytics
    if (this.sessionStartTime) {
        const duration = (this.sessionEndTime - this.sessionStartTime) / (1000 * 60); // Convert to minutes
        this.analytics = {
            ...this.analytics,
            duration
        };
    }
    
    await this.save();
};

// Method to increment message count
visitorSessionSchema.methods.incrementMessageCount = async function() {
    this.messageCount += 1;
    this.lastMessageAt = Date.now();
    await this.save();
};

// Static method to get chatbot analytics
visitorSessionSchema.statics.getChatbotAnalytics = async function(chatbotId) {
    const pipeline = [
        {
            $match: {
                chatbot: mongoose.Types.ObjectId(chatbotId)
            }
        },
        {
            $group: {
                _id: null,
                totalSessions: { $sum: 1 },
                activeSessions: {
                    $sum: {
                        $cond: [{ $eq: ['$isActive', true] }, 1, 0]
                    }
                },
                totalMessages: { $sum: '$messageCount' },
                avgDuration: { $avg: '$analytics.duration' },
                topics: { $push: '$analytics.topics' }
            }
        }
    ];

    const result = await this.aggregate(pipeline);
    return result[0] || null;
};

// Static method to get visitor analytics
visitorSessionSchema.statics.getVisitorAnalytics = async function(visitorId) {
    const pipeline = [
        {
            $match: {
                visitorUser: mongoose.Types.ObjectId(visitorId)
            }
        },
        {
            $group: {
                _id: null,
                totalSessions: { $sum: 1 },
                activeSessions: {
                    $sum: {
                        $cond: [{ $eq: ['$isActive', true] }, 1, 0]
                    }
                },
                totalMessages: { $sum: '$messageCount' },
                avgDuration: { $avg: '$analytics.duration' },
                lastActive: { $max: '$lastMessageAt' },
                topics: { $push: '$analytics.topics' },
                // Group sessions by hour
                engagementByHour: {
                    $push: {
                        hour: { $hour: '$sessionStartTime' },
                        count: 1
                    }
                }
            }
        }
    ];

    const result = await this.aggregate(pipeline);
    return result[0] || null;
};

const VisitorSession = mongoose.model('VisitorSession', visitorSessionSchema);

export default VisitorSession;
