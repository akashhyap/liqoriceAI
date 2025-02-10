import mongoose from 'mongoose';

const websiteCrawlSchema = new mongoose.Schema({
    chatbotId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chatbot',
        required: true
    },
    url: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'crawling', 'embedding', 'completed', 'failed'],
        default: 'pending'
    },
    pagesProcessed: {
        type: Number,
        default: 0
    },
    chunks: [{
        content: String,
        metadata: {
            url: String,
            title: String
        },
        vectorId: String,
        status: {
            type: String,
            enum: ['pending', 'embedded', 'stored'],
            default: 'pending'
        }
    }],
    error: String,
    progress: {
        totalChunks: Number,
        processedChunks: Number,
        embeddedChunks: Number,
        storedChunks: Number
    },
    lastCrawled: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('WebsiteCrawl', websiteCrawlSchema);
