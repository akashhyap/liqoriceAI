import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';
import { Pinecone } from '@pinecone-database/pinecone';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { CSVLoader } from '@langchain/community/document_loaders/fs/csv';
import { CheerioWebBaseLoader } from '@langchain/community/document_loaders/web/cheerio';
import { RecursiveCharacterTextSplitter } from '@langchain/core/text_splitter';
import Chatbot from '../models/chatbot.js';
import { GREETING_SYSTEM_MESSAGE, generateSystemMessage, generatePromptTemplate } from '../utils/promptUtils.js';

class ChatbotService {
    constructor() {
        this.model = new ChatOpenAI({
            temperature: 0.7,
            modelName: 'gpt-3.5-turbo'
        });
        this.initVectorStore();
    }

    async initVectorStore() {
        const pinecone = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY,
            environment: process.env.PINECONE_ENVIRONMENT
        });
        
        const pineconeIndex = pinecone.index(process.env.PINECONE_INDEX);
        
        this.vectorStore = await PineconeStore.fromExistingIndex(
            new OpenAIEmbeddings(),
            { pineconeIndex }
        );
    }

    async processDocument(filePath, fileType) {
        let loader;
        
        switch (fileType) {
            case 'pdf':
                loader = new PDFLoader(filePath);
                break;
            case 'docx':
                loader = new DocxLoader(filePath);
                break;
            case 'txt':
                loader = new TextLoader(filePath);
                break;
            case 'csv':
                loader = new CSVLoader(filePath);
                break;
            default:
                throw new Error('Unsupported file type');
        }

        const docs = await loader.load();
        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200
        });
        
        const splitDocs = await textSplitter.splitDocuments(docs);
        await this.vectorStore.addDocuments(splitDocs);
        
        return splitDocs.length;
    }

    async crawlWebsite(url) {
        const loader = new CheerioWebBaseLoader(url);
        const docs = await loader.load();
        
        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200
        });
        
        const splitDocs = await textSplitter.splitDocuments(docs);
        await this.vectorStore.addDocuments(splitDocs);
        
        return splitDocs.length;
    }

    async generateResponse(message, context = {}) {
        try {
            const isGreeting = /^(hi|hello|hey|greetings|howdy|hi there)$/i.test(message.trim());
            
            // Get chatbot configuration
            const chatbot = context.chatbotId ? await Chatbot.findById(context.chatbotId) : null;
            const contextType = chatbot?.category || 'general knowledge';

            // Initialize chat model with appropriate settings
            const chatModel = new ChatOpenAI({
                temperature: isGreeting ? 0.8 : (chatbot?.settings?.temperature || 0.7),
                maxTokens: isGreeting ? 50 : (chatbot?.settings?.maxTokens || 500),
                modelName: chatbot?.settings?.model || 'gpt-3.5-turbo',
                presencePenalty: 0.6,
                frequencyPenalty: 0.5
            });

            // Handle greetings differently
            if (isGreeting) {
                const messages = [
                    { role: 'system', content: GREETING_SYSTEM_MESSAGE },
                    { role: 'user', content: message }
                ];
                const response = await chatModel.call(messages);
                return {
                    response: response.content,
                    sources: []
                };
            }

            // Get relevant context
            let relevantContext = '';
            try {
                const vectorResults = await this.vectorStore.similaritySearch(message, 3);
                relevantContext = vectorResults.map(doc => doc.pageContent).join('\n\n');
            } catch (error) {
                console.error('Vector search error:', error);
            }

            // Get conversation history if available
            let conversationHistory = '';
            if (context.sessionId) {
                try {
                    const session = await VisitorSession.findById(context.sessionId)
                        .populate('chatHistory')
                        .exec();
                    
                    if (session?.chatHistory?.messages) {
                        conversationHistory = session.chatHistory.messages
                            .slice(-3)
                            .map(msg => `${msg.role}: ${msg.content}`)
                            .join('\n');
                    }
                } catch (error) {
                    console.error('Error getting conversation history:', error);
                }
            }

            // Generate system message and prompt
            const systemMessage = generateSystemMessage(chatbot, contextType);
            const promptTemplate = generatePromptTemplate(
                relevantContext,
                message,
                conversationHistory,
                {
                    tone: context.responseStyle?.tone || 'professional',
                    detailLevel: context.responseStyle?.detailLevel || 'comprehensive',
                    format: context.responseStyle?.format || 'structured',
                    specificInstructions: chatbot?.settings?.customPrompt?.specificInstructions
                }
            );

            // Prepare messages array
            const messages = [
                { role: 'system', content: systemMessage },
                { role: 'user', content: promptTemplate }
            ];

            // Generate response
            const response = await chatModel.call(messages);

            // Format response if needed
            let formattedResponse = response.content;
            if (context.formatResponse) {
                formattedResponse = formattedResponse
                    .replace(/\n{3,}/g, '\n\n')
                    .replace(/\*\*([^*]+)\*\*/g, (_, p1) => `## ${p1}`)
                    .replace(/^([^#\n].+?)(?:\n|$)/gm, (_, p1) => {
                        if (p1.trim().length > 0) {
                            return `${p1}\n\n`;
                        }
                        return p1;
                    })
                    .replace(/(\d+\.) /g, '\n$1 ')
                    .replace(/\n{3,}/g, '\n\n')
                    .trim();
            }

            return {
                response: formattedResponse,
                sources: relevantContext ? vectorResults.map(doc => doc.metadata) : []
            };

        } catch (error) {
            console.error('Error generating response:', error);
            throw error;
        }
    }

    async updateAnalytics(chatbotId, metrics) {
        // Update chatbot analytics in the database
        const updatedChatbot = await Chatbot.findByIdAndUpdate(
            chatbotId,
            {
                $inc: {
                    'analytics.totalConversations': metrics.conversations || 0,
                    'analytics.totalMessages': metrics.messages || 0
                },
                $set: {
                    'analytics.averageResponseTime': metrics.responseTime,
                    'analytics.userSatisfactionScore': metrics.satisfactionScore
                }
            },
            { new: true }
        );

        return updatedChatbot;
    }
}

export default new ChatbotService();
