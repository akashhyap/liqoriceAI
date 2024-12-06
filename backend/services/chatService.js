import { ChatOpenAI } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from "@langchain/core/output_parsers";
import Chatbot from '../models/Chatbot.js';

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

    async generateResponse(chatbot, message) {
        try {
            console.log('Starting generateResponse for chatbot:', chatbot._id);
            
            // Check if chatbot has any training data
            if (!chatbot.training.totalChunks) {
                return {
                    response: "I haven't been trained with any data yet. Please add some training data first.",
                    sources: []
                };
            }

            const model = await this.getModel(chatbot.settings);
            console.log('Model initialized');
            
            const embeddings = new OpenAIEmbeddings({
                openAIApiKey: process.env.OPENAI_API_KEY
            });
            console.log('Embeddings initialized');

            // Initialize vector store for this chatbot's namespace
            const pineconeIndex = this.pinecone.Index(process.env.PINECONE_INDEX);
            const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
                pineconeIndex,
                namespace: chatbot._id.toString()
            });
            console.log('Vector store initialized');

            // Search for relevant context
            const k = Math.min(3, chatbot.training.totalChunks); // Don't try to fetch more chunks than we have
            const relevantDocs = await vectorStore.similaritySearch(message, k);
            console.log('Found relevant docs:', relevantDocs.length);

            if (relevantDocs.length === 0) {
                return {
                    response: "I couldn't find any relevant information in my training data to answer your question. Could you try rephrasing it?",
                    sources: []
                };
            }

            const contextText = relevantDocs.map(doc => doc.pageContent).join('\n');

            // Get the custom system message or use default
            const systemMessage = chatbot.settings?.customPrompt?.systemMessage || 
                'You are a helpful AI assistant that answers questions based on the provided context.';

            // Construct the full prompt with system message and context
            const prompt = `${systemMessage}\n\nRelevant information:\n${contextText}\n\nUser: ${message}\n\nAssistant:`;

            // Generate response
            const response = await model.predict(prompt);
            console.log('Generated response');

            // Update analytics
            chatbot.analytics.totalMessages += 1;
            chatbot.analytics.lastMessageAt = new Date();
            await chatbot.save();

            return {
                response,
                sources: relevantDocs.map(doc => ({
                    ...doc.metadata,
                    preview: doc.pageContent.substring(0, 200) // Add a preview of the source content
                }))
            };
        } catch (error) {
            console.error('Error in generateResponse:', {
                error: error.message,
                stack: error.stack,
                chatbotId: chatbot._id,
                settings: chatbot.settings
            });
            throw error;
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

        const index = this.pinecone.Index(process.env.PINECONE_INDEX);
        const vectorStore = await PineconeStore.fromExistingIndex(
            new OpenAIEmbeddings(),
            { 
                pineconeIndex: index,
                namespace: chatbotId.toString()
            }
        );

        // Search for relevant documents
        const k = Math.min(3, chatbot.training.totalChunks); // Don't try to fetch more chunks than we have
        const documents = await vectorStore.similaritySearch(message, k);
        
        // Format context from documents
        const context = documents.map(doc => doc.pageContent).join('\n\n');
        
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
