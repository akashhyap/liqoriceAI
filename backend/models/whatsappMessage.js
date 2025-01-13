import mongoose from 'mongoose';

const whatsappMessageSchema = new mongoose.Schema({
    messageId: {
        type: String,
        required: true,
        unique: true
    },
    chatbotId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chatbot',
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    direction: {
        type: String,
        enum: ['incoming', 'outgoing'],
        required: true
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'document', 'location', 'video', 'audio'],
        default: 'text'
    },
    content: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['sent', 'delivered', 'read', 'failed'],
        default: 'sent'
    },
    metadata: {
        type: Map,
        of: String
    }
}, { timestamps: true });

// Indexes for better query performance
whatsappMessageSchema.index({ chatbotId: 1, timestamp: -1 });
whatsappMessageSchema.index({ phoneNumber: 1, timestamp: -1 });

const WhatsappMessage = mongoose.model('WhatsappMessage', whatsappMessageSchema);

export default WhatsappMessage;
