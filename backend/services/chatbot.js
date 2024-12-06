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
            // Search for relevant context in the vector store
            const relevantDocs = await this.vectorStore.similaritySearch(message, 3);
            const contextText = relevantDocs.map(doc => doc.pageContent).join('\n');

            let prompt;
            if (context.chatbotId) {
                // Fetch chatbot settings if chatbotId is provided
                const chatbot = await Chatbot.findById(context.chatbotId);
                if (chatbot?.settings?.customPrompt?.systemMessage || chatbot?.settings?.customPrompt?.promptTemplate) {
                    const systemMessage = chatbot.settings.customPrompt.systemMessage || 'You are a helpful AI assistant.';
                    const promptTemplate = chatbot.settings.customPrompt.promptTemplate || 
                        'Context: {context}\n\nUser: {query}\n\nAssistant:';
                    
                    // Replace template variables
                    prompt = promptTemplate
                        .replace('{context}', contextText)
                        .replace('{query}', message);
                    
                    // Add system message if using ChatOpenAI
                    if (this.model instanceof ChatOpenAI) {
                        prompt = `${systemMessage}\n\n${prompt}`;
                    }
                }
            }

            // Fallback to default prompt if no custom prompt is set
            if (!prompt) {
                prompt = `Context: ${contextText}\n\nUser: ${message}\n\nAssistant:`;
            }

            // Generate response using the model
            const response = await this.model.predict(prompt);

            return {
                response,
                sources: relevantDocs.map(doc => doc.metadata)
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
