import { ChatOpenAI } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from "@langchain/core/output_parsers";
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

    async generateResponse(chatbot, message) {
        try {
            console.log('Starting generateResponse for chatbot:', chatbot._id);
            
            // Check training status from both documents and websites
            const trainingStatus = await documentService.getNamespaceStats(chatbot._id);
            console.log('Training status:', trainingStatus);
            
            if (!trainingStatus?.vectorCount) {
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

            // Initialize vector store with correct index format
            const pineconeIndex = this.pinecone.index(process.env.PINECONE_INDEX);
            
            // Query directly using Pinecone
            const queryEmbedding = await embeddings.embedQuery(message);
            const queryFilter = {
                chatbotId: chatbot._id.toString()
            };
            
            console.log('Querying Pinecone:', {
                chatbotId: chatbot._id.toString(),
                filter: queryFilter,
                topK: Math.min(3, trainingStatus.vectorCount)
            });
            
            const queryResponse = await pineconeIndex.query({
                vector: queryEmbedding,
                topK: Math.min(3, trainingStatus.vectorCount),
                includeMetadata: true,
                filter: queryFilter
            });

            console.log('Pinecone query response:', {
                matchCount: queryResponse.matches?.length,
                matches: queryResponse.matches?.map(match => ({
                    score: match.score,
                    metadata: match.metadata
                }))
            });

            if (!queryResponse.matches.length) {
                return {
                    response: "I couldn't find any relevant information in my training data to answer your question. Could you try rephrasing it?",
                    sources: []
                };
            }

            // Format the context from matched documents
            const context = queryResponse.matches
                .map(match => match.metadata.text)
                .join('\n\n');

            const sourceTypes = [...new Set(queryResponse.matches.map(match => match.metadata.sourceType))].join(' and ');

            // Create prompt template
            const promptTemplate = PromptTemplate.fromTemplate(`
                {system_message}
                
                Context information from {source_types}:
                {context}
                
                User: {question}
                
                Assistant: I'll help you with your question. Let me analyze the context and provide a clear, accurate response.
            `);

            // Format the prompt with actual values
            const formattedPrompt = await promptTemplate.format({
                system_message: chatbot.settings?.customPrompt?.systemMessage || 
                    'You are a helpful AI assistant that answers questions based on the provided context.',
                source_types: sourceTypes,
                context: context,
                question: message
            });

            // Create the chain
            const chain = promptTemplate
                .pipe(model)
                .pipe(new StringOutputParser());

            // Generate response
            const response = await chain.invoke({
                system_message: chatbot.settings?.customPrompt?.systemMessage || 
                    'You are a helpful AI assistant that answers questions based on the provided context.',
                source_types: sourceTypes,
                context: context,
                question: message
            });
            
            console.log('Generated response');

            // Update analytics
            chatbot.analytics.totalMessages += 1;
            chatbot.analytics.lastMessageAt = new Date();
            await chatbot.save();

            return {
                response,
                sources: queryResponse.matches.map(match => ({
                    content: match.metadata.text,
                    metadata: {
                        ...match.metadata,
                        preview: match.metadata.text.substring(0, 200)
                    }
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
