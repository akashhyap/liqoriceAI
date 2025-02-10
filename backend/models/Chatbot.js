import mongoose from 'mongoose';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import openai from '../utils/openai.js';
import VisitorSession from './VisitorSession.js';
import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAIEmbeddings } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';

const chatbotSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    training: {
        documents: [{
            type: { type: String, enum: ['file', 'text'] },
            fileType: String,
            path: String,
            content: String,
            status: {
                type: String,
                enum: ['pending', 'processing', 'processed', 'error'],
                default: 'pending'
            },
            error: String,
            processedAt: Date,
            chunks: Number // Number of chunks after splitting
        }],
        websites: [{
            url: String,
            lastCrawled: Date,
            status: {
                type: String,
                enum: ['pending', 'processing', 'processed', 'error'],
                default: 'pending'
            },
            error: String,
            pagesProcessed: Number // Number of pages processed
        }],
        lastTrainingDate: Date, // Last time any training was performed
        totalDocuments: { type: Number, default: 0 }, // Total number of documents
        totalWebsites: { type: Number, default: 0 }, // Total number of websites
        totalChunks: { type: Number, default: 0 } // Total chunks in vector store
    },
    deployment: {
        status: {
            type: String,
            enum: ['draft', 'training', 'trained', 'deploying', 'deployed', 'error'],
            default: 'draft'
        },
        version: {
            type: Number,
            default: 1
        },
        currentEndpoint: String,
        history: [{
            version: Number,
            deployedAt: Date,
            status: String,
            endpoint: String
        }],
        error: String,
        lastDeployedAt: Date
    },
    settings: {
        model: {
            type: String,
            enum: ['gpt-3.5-turbo', 'gpt-4'],
            default: 'gpt-3.5-turbo'
        },
        temperature: {
            type: Number,
            default: 0.7,
            min: 0,
            max: 1
        },
        maxTokens: {
            type: Number,
            default: 2000
        },
        contextWindow: {
            type: Number,
            default: 4000
        },
        customPrompt: {
            systemMessage: {
                type: String,
                default: `You are a helpful AI assistant. For greetings like 'hi', 'hello', 'hey', respond naturally and briefly like 'Hi! How can I help you today?' or 'Hello! What can I assist you with?'

For all other queries, you should:
1. Use the provided context to give accurate answers
2. If you cannot find the answer in the context, say so
3. Follow the response format requirements as specified`
            },
            promptTemplate: {
                type: String,
                default: `Context: {context}

Previous conversation:
{conversationHistory}

User: {question}`
            }
        }
    },
    analytics: {
        totalMessages: {
            type: Number,
            default: 0
        },
        averageResponseTime: {
            type: Number,
            default: 0
        },
        lastActive: Date,
        userFeedback: {
            positive: {
                type: Number,
                default: 0
            },
            negative: {
                type: Number,
                default: 0
            }
        }
    }
}, {
    timestamps: true
});

// Pre-save middleware to update totals
chatbotSchema.pre('save', function(next) {
    // Update total documents
    this.training.totalDocuments = this.training.documents.filter(doc => 
        doc.status === 'processed'
    ).length;

    // Update total websites
    this.training.totalWebsites = this.training.websites.filter(site => 
        site.status === 'processed'
    ).length;

    // Update total chunks
    this.training.totalChunks = 
        this.training.documents.reduce((sum, doc) => sum + (doc.chunks || 0), 0) +
        this.training.websites.reduce((sum, site) => sum + (site.pagesProcessed || 0), 0);

    // If we have any processed documents/websites but no last training date, set it
    if ((this.training.totalDocuments > 0 || this.training.totalWebsites > 0) && !this.training.lastTrainingDate) {
        this.training.lastTrainingDate = new Date();
    }

    next();
});

// Method to generate response
chatbotSchema.methods.generateResponse = async function(message, sessionId) {
    try {
        const { model, temperature, maxTokens, customPrompt } = this.settings;
        
        // Get OpenAI model
        const chatModel = openai.getModel({
            model,
            temperature,
            maxTokens
        });

        // Initialize Pinecone and get the vector store
        let relevantContext = '';
        try {
            const pinecone = new Pinecone({
                apiKey: process.env.PINECONE_API_KEY
            });
            
            const pineconeIndex = pinecone.index(process.env.PINECONE_INDEX);
            
            const embeddings = new OpenAIEmbeddings({
                openAIApiKey: process.env.OPENAI_API_KEY
            });

            const vectorStore = await PineconeStore.fromExistingIndex(
                embeddings,
                { 
                    pineconeIndex,
                    filter: { chatbotId: this._id.toString() }
                }
            );

            // Get relevant documents from vector store
            const vectorResults = await vectorStore.similaritySearch(message, 3);
            
            // Extract and format context from vector results
            if (vectorResults && vectorResults.length > 0) {
                relevantContext = vectorResults
                    .map(doc => doc.pageContent)
                    .join('\n\n');
            }
        } catch (vectorError) {
            console.error('Error getting vector store context:', vectorError);
            // Continue without vector store context
        }

        // Get conversation context from session if needed
        let conversationContext = '';
        if (sessionId) {
            const session = await VisitorSession.findById(sessionId).populate('chatHistory');
            if (session && session.chatHistory && session.chatHistory.messages) {
                // Get last few messages for context
                conversationContext = session.chatHistory.messages
                    .slice(-3) // Get last 3 messages
                    .map(msg => `${msg.role}: ${msg.content}`)
                    .join('\n');
            }
        }

        // Prepare messages
        const messages = [
            new SystemMessage(customPrompt?.systemMessage || 
                "You are a helpful AI assistant that answers questions based on the provided context."),
        ];

        // Add trained data context if available
        if (relevantContext) {
            messages.push(new SystemMessage(
                `Use this relevant information to answer the question:\n${relevantContext}`
            ));
        }

        // Add conversation context if available
        if (conversationContext) {
            messages.push(new SystemMessage(
                `Previous conversation:\n${conversationContext}`
            ));
        }

        // Add user's question
        messages.push(new HumanMessage(message));

        // Generate response
        const response = await chatModel.call(messages);
        return response.content;
    } catch (error) {
        console.error('Error generating response:', error);
        throw new Error(error.message || 'Failed to generate response');
    }
};

const Chatbot = mongoose.model('Chatbot', chatbotSchema);
export default Chatbot;
