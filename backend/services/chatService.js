import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAIEmbeddings } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';
import Chatbot from '../models/Chatbot.js';
import documentService from './documentService.js';
import websiteTrainingService from './websiteTrainingService.js';
import VisitorSession from '../models/VisitorSession.js';
import VisitorChatHistory from '../models/VisitorChatHistory.js';

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

    async generateResponse(chatbot, message, sessionId = null, onToken = null) {
        try {
            const model = await this.getModel(chatbot.settings);
            
            // Initialize vector store for this chatbot's namespace
            const pineconeIndex = this.pinecone.index(process.env.PINECONE_INDEX);
            const vectorStore = await PineconeStore.fromExistingIndex(
                new OpenAIEmbeddings(),
                {
                    pineconeIndex,
                    filter: { chatbotId: chatbot._id.toString() }  // Add namespace filtering
                }
            );
            
            // Search for relevant context with similarity scores
            const k = Math.min(5, chatbot.training?.totalChunks || 5); // Increase initial fetch to allow for filtering
            const relevantDocsWithScores = await vectorStore.similaritySearchWithScore(message, k);
            
            // Filter and sort by similarity score
            const similarityThreshold = chatbot.settings?.similarityThreshold || 0.7;
            const filteredDocs = relevantDocsWithScores
                .filter(([doc, score]) => score >= similarityThreshold)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3); // Take top 3 after filtering
            
            // Format context from documents with source tracking and scores
            const knowledgeContext = filteredDocs.length > 0 
                ? filteredDocs
                    .map(([doc, score], index) => {
                        const source = doc.metadata?.source || 'Knowledge Base';
                        const relevance = (score * 100).toFixed(1);
                        return `[Source ${index + 1}: ${source}] (Relevance: ${relevance}%)\n${doc.pageContent}`;
                    })
                    .join('\n\n')
                : '';
            
            // Log retrieval metrics for monitoring
            console.log('RAG Metrics:', {
                chatbotId: chatbot._id,
                query: message,
                totalMatches: relevantDocsWithScores.length,
                filteredMatches: filteredDocs.length,
                averageScore: filteredDocs.reduce((acc, [_, score]) => acc + score, 0) / filteredDocs.length,
                topScore: filteredDocs[0]?.[1] || 0
            });
            
            // Get conversation context from session if needed
            let conversationContext = '';
            if (sessionId) {
                const session = await VisitorSession.findById(sessionId).populate('chatHistory');
                if (session && session.chatHistory) {
                    // Get last few messages for context
                    conversationContext = session.chatHistory.messages
                        .slice(-3) // Get last 3 messages
                        .map(msg => `${msg.role}: ${msg.content}`)
                        .join('\n');
                }
            }

            // Get custom prompts
            const customPrompt = chatbot.settings?.customPrompt || {};
            const systemMessage = customPrompt.systemMessage || 
                `You are a helpful AI assistant that answers questions based on the provided context. 
            
                Important Instructions:
                1. If the context provided is empty or if you cannot find a relevant answer in the context, explicitly state: "I apologize, but I don't have enough relevant information in my knowledge base to answer your question accurately."
                2. If you find relevant information but it's not complete, acknowledge what you know and what you're unsure about.
                3. When using information from the context, prefer sources with higher relevance scores.
                4. Do not make up information or draw from general knowledge outside the provided context.
                
                Format your responses using markdown for better readability:
                1. Use # for main headings and ## for subheadings
                2. Use bullet points (*) for unordered lists
                3. Use numbered lists (1.) for ordered steps or services
                4. Use --- for horizontal rules to separate sections
                5. Use \`backticks\` for important terms or technical words
                6. Use **bold** for emphasis on important points
                7. Format phone numbers consistently as (XXX) XXX-XXXX
                8. For scheduling links, use markdown format: [text](url)
                9. Add a horizontal rule (---) between different sections
                
                Keep responses clear, organized, and visually structured.`;
            
            const promptTemplate = customPrompt.promptTemplate ||
                `Based on the following context and conversation history, provide a detailed answer. 
                 If you cannot find the answer in the context, explicitly state that you don't have enough information.

Knowledge Base Context:
{context}

Previous Conversation:
{conversation}

Question: {question}

Remember:
1. Only use information from the provided context
2. Acknowledge any uncertainty
3. Consider the relevance scores when using information
4. Format your response using markdown as specified`;
            
            // Format the prompt with both knowledge base and conversation context
            const formattedPrompt = promptTemplate
                .replace('{context}', knowledgeContext)
                .replace('{conversation}', conversationContext)
                .replace('{question}', message);

            // Prepare messages
            const messages = [
                new SystemMessage(systemMessage),
                new HumanMessage(formattedPrompt)
            ];

            // Get streaming completion from the model
            if (onToken) {
                const stream = await model.stream(messages);
                for await (const chunk of stream) {
                    if (chunk.content) {
                        onToken(chunk.content);
                    }
                }
            } else {
                // Fallback to non-streaming if no onToken callback
                const completion = await model.invoke(messages);
                return completion.content;
            }
        } catch (error) {
            console.error('Error generating response:', error);
            throw error;
        }
    }

    async processMessage(chatbotId, message, settings = {}) {
        try {
            // Get the chatbot to access custom prompts and settings
            const chatbot = await Chatbot.findById(chatbotId);
            if (!chatbot) {
                throw new Error('Chatbot not found');
            }

            // Use the main generateResponse method which handles context properly
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

    async chat(message, chatbotId, sessionId) {
        try {
            const model = await this.getModel();
            const chatbot = await Chatbot.findById(chatbotId);
            if (!chatbot) {
                throw new Error('Chatbot not found');
            }

            // Get context from session if needed
            let context = '';
            if (sessionId) {
                const session = await VisitorSession.findById(sessionId);
                if (!session) {
                    throw new Error('Session not found');
                }
                
                if (session.chatHistory) {
                    const chatHistory = await VisitorChatHistory.findById(session.chatHistory);
                    if (chatHistory) {
                        context = chatHistory.messages
                            .slice(-3) // Get last 3 messages
                            .map(msg => `${msg.role}: ${msg.content}`)
                            .join('\n');
                    }
                }
            }

            // Prepare messages
            const messages = [
                new SystemMessage(chatbot.settings?.customPrompt?.systemMessage || 
                    `You are a helpful AI assistant that answers questions based on the provided context. 
                    Format your responses using markdown for better readability:
                    
                    1. Use # for main headings and ## for subheadings
                    2. Use bullet points (*) for unordered lists
                    3. Use numbered lists (1.) for ordered steps or services
                    4. Use --- for horizontal rules to separate sections
                    5. Use \`backticks\` for important terms or technical words
                    6. Use **bold** for emphasis on important points
                    7. Format phone numbers consistently as (XXX) XXX-XXXX
                    8. For scheduling links, either:
                       - Use markdown format: [Calendly](actual-calendly-url), or
                       - Simply mention "Calendly link" (will use default scheduling URL)
                    9. Do not repeat phone numbers in the same paragraph
                    10. Add a horizontal rule (---) between different sections
                    
                    Keep responses clear, organized, and visually structured.`),
                new HumanMessage(message)
            ];

            if (context) {
                messages.splice(1, 0, new SystemMessage(`Previous conversation:\n${context}`));
            }

            // Create a stream to send the response
            const encoder = new TextEncoder();
            const stream = new ReadableStream({
                async start(controller) {
                    try {
                        const completion = await model.streamChatCompletion(messages);

                        for await (const chunk of completion) {
                            const content = chunk.content || '';
                            if (content) {
                                controller.enqueue(encoder.encode(content));
                            }
                        }
                        controller.close();
                    } catch (error) {
                        console.error('Streaming error:', error);
                        controller.error(error);
                    }
                }
            });

            // Save the message to chat history asynchronously
            if (sessionId) {
                this.saveToChatHistory(sessionId, message, '').catch(err => {
                    console.error('Error saving to chat history:', err);
                });
            }

            return { success: true, stream };
        } catch (error) {
            console.error('Error in chat service:', error);
            throw error;
        }
    }

    async saveToChatHistory(sessionId, userMessage, botResponse) {
        try {
            const session = await VisitorSession.findById(sessionId);
            if (!session) {
                throw new Error('Session not found');
            }

            let chatHistory = await VisitorChatHistory.findOne({ visitorSession: sessionId });
            if (!chatHistory) {
                chatHistory = await VisitorChatHistory.create({
                    visitorSession: sessionId,
                    messages: []
                });

                session.chatHistory = chatHistory._id;
                await session.save();
            }

            chatHistory.messages.push(
                { role: 'user', content: userMessage, timestamp: new Date() }
            );
            if (botResponse) {
                chatHistory.messages.push(
                    { role: 'assistant', content: botResponse, timestamp: new Date() }
                );
            }
            await chatHistory.save();
        } catch (error) {
            console.error('Error saving to chat history:', error);
            // Don't throw the error as this is a background operation
        }
    }
}

const chatService = new ChatService();
export default chatService;
