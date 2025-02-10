import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
    chatbotId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chatbot',
        required: true
    },
    metadata: {
        originalName: {
            type: String,
            required: true
        },
        mimeType: {
            type: String,
            required: true
        },
        size: {
            type: Number,
            required: true
        },
        createdBy: {
            type: String
        },
        lastModified: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['processing', 'chunking', 'embedding', 'completed', 'error'],
            default: 'processing'
        },
        processingStartTime: {
            type: Date
        },
        processingEndTime: {
            type: Date
        },
        chunkCount: {
            type: Number,
            default: 0
        },
        processedChunkCount: {
            type: Number,
            default: 0
        },
        error: {
            type: String
        }
    },
    chunks: [{
        content: String,
        metadata: {
            page: Number,
            source: String,
            position: Number,
            length: Number,
            tokenCount: Number,
            embedding_model: {
                type: String,
                default: 'text-embedding-3-small'  // OpenAI's latest embedding model
            }
        },
        embedding: [Number],
        vectorId: String,
        status: {
            type: String,
            enum: ['pending', 'embedded', 'stored'],
            default: 'pending'
        },
        error: String
    }],
    error: String,
    progress: {
        totalChunks: Number,
        processedChunks: Number,
        embeddedChunks: Number,
        storedChunks: Number,
        startTime: Date,
        endTime: Date,
        retryCount: {
            type: Number,
            default: 0
        }
    },
    analytics: {
        averageChunkSize: Number,
        totalTokens: Number,
        processingTime: Number,
        embeddingTime: Number,
        storageTime: Number
    }
}, {
    timestamps: true
});

// Update timestamp on save
documentSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Calculate analytics before save
documentSchema.pre('save', function(next) {
    if (this.chunks && this.chunks.length > 0) {
        const totalLength = this.chunks.reduce((sum, chunk) => sum + chunk.content.length, 0);
        this.analytics = {
            ...this.analytics,
            averageChunkSize: Math.round(totalLength / this.chunks.length),
            totalTokens: this.chunks.reduce((sum, chunk) => sum + (chunk.metadata.tokenCount || 0), 0)
        };
    }
    next();
});

const Document = mongoose.model('Document', documentSchema);

export default Document;
