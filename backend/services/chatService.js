import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { Pinecone } from '@pinecone-database/pinecone';
import Chatbot from '../models/Chatbot.js';
import documentService from './documentService.js';
import websiteTrainingService from './websiteTrainingService.js';

class ChatService {
    constructor() {
        this.pinecone = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY
        });
        this.modelCache = new Map();
    }

    async getModel(settings) {
        const modelName = settings?.model || 'gpt-3.5-turbo';
        const temperature = settings?.temperature || 0.7;
        const maxTokens = settings?.maxTokens || 2000;

        const cacheKey = `${modelName}-${temperature}-${maxTokens}`;
        if (this.modelCache.has(cacheKey)) {
            return this.modelCache.get(cacheKey);
        }

        const model = new ChatOpenAI({
            modelName,
            temperature,
            maxTokens,
            openAIApiKey: process.env.OPENAI_API_KEY
        });

        this.modelCache.set(cacheKey, model);
        return model;
    }

    async generateResponse(chatbot, message, sessionId = null) {
        try {
            const model = await this.getModel(chatbot.settings);
            
            // Get context from session if needed
            let context = '';
            if (sessionId) {
                const session = await VisitorSession.findById(sessionId).populate('chatHistory');
                if (session && session.chatHistory) {
                    // Get last few messages for context
                    context = session.chatHistory.messages
                        .slice(-3) // Get last 3 messages
                        .map(msg => `${msg.role}: ${msg.content}`)
                        .join('\n');
                }
            }

            // Prepare messages
            const messages = [
                new SystemMessage(chatbot.settings?.customPrompt?.systemMessage || 
                    "You are a helpful AI assistant that answers questions based on the provided context."),
                new HumanMessage(message)
            ];

            if (context) {
                messages.splice(1, 0, new SystemMessage(`Previous conversation:\n${context}`));
            }

            // Generate response
            const response = await model.call(messages);
            return response.content;
        } catch (error) {
            console.error('Error generating response:', error);
            throw new Error('Failed to generate response');
        }
    }

    async processMessage(chatbotId, message, settings = {}) {
        try {
            // Get the chatbot to access custom prompts
            const chatbot = await Chatbot.findById(chatbotId);
            if (!chatbot) {
                throw new Error('Chatbot not found');
            }

            const response = await this.generateResponse(chatbot, message);
            return response;
        } catch (error) {
            console.error('Error processing message:', error);
            throw error;
        }
    }

    async streamResponse(chatbotId, message, settings = {}) {
        const model = await this.getModel(settings);
        const chatbot = await Chatbot.findById(chatbotId);
        
        if (!chatbot) {
            throw new Error('Chatbot not found');
        }

        // Initialize vector store for this chatbot's namespace
        const pineconeIndex = this.pinecone.index(process.env.PINECONE_INDEX);
        const vectorStore = await PineconeStore.fromExistingIndex(new OpenAIEmbeddings(), {
            pineconeIndex
        });
        
        // Search for relevant context
        const k = Math.min(3, chatbot.training.totalChunks); // Don't try to fetch more chunks than we have
        const relevantDocs = await vectorStore.similaritySearch(message, k);
        
        // Format context from documents
        const context = relevantDocs.map(doc => doc.pageContent).join('\n\n');
        
        // Get custom prompts
        const customPrompt = chatbot.settings?.customPrompt || {};
        const systemMessage = customPrompt.systemMessage || 
            "You are a helpful AI assistant that answers questions based on the provided context.";
        
        const promptTemplate = customPrompt.promptTemplate ||
            "Answer the following question based on the context provided. If you cannot find the answer in the context, say so.\n\nContext: {context}\n\nQuestion: {question}";

        // Format the prompt
        const formattedPrompt = promptTemplate
            .replace('{context}', context)
            .replace('{question}', message);

        return model.streamChatCompletion([
            { role: 'system', content: systemMessage },
            { role: 'user', content: formattedPrompt }
        ]);
    }
}

const chatService = new ChatService();
export default chatService;
