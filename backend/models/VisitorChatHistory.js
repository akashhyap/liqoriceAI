import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
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
    }
});

const visitorChatHistorySchema = new mongoose.Schema({
    visitorSession: {  
        type: mongoose.Schema.ObjectId,
        ref: 'VisitorSession',
        required: true
    },
    messages: [messageSchema],
    metadata: {
        totalTokens: Number,
        promptTokens: Number,
        completionTokens: Number
    }
}, {
    timestamps: true
});

// Index for efficient querying
visitorChatHistorySchema.index({ 'visitorSession': 1, 'createdAt': -1 });

// Method to add message
visitorChatHistorySchema.methods.addMessage = async function(role, content) {
    this.messages.push({ role, content });
    await this.save();
    return this;
};

// Static method to get chat history by session
visitorChatHistorySchema.statics.getHistoryBySession = async function(sessionId) {
    return this.findOne({ visitorSession: sessionId }).sort({ 'messages.timestamp': 1 });
};

const VisitorChatHistory = mongoose.model('VisitorChatHistory', visitorChatHistorySchema);

export default VisitorChatHistory;
