import { OpenAI, OpenAIEmbeddings, ChatOpenAI } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';
import { Pinecone } from '@pinecone-database/pinecone';
import { createRetrievalChain } from 'langchain/chains/retrieval';
import { createHistoryAwareRetriever } from 'langchain/chains/history_aware_retriever';
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { AIMessage, HumanMessage, AIMessageChunk } from '@langchain/core/messages';
import { BufferMemory, ChatMessageHistory } from 'langchain/memory';
import mongoose from 'mongoose';

class OpenAIService {
    private openai: OpenAI;
    private pinecone: Pinecone;
    private embeddings: OpenAIEmbeddings;
    private pineconeIndex: any;

    constructor() {
        this.openai = new OpenAI({
            modelName: 'gpt-3.5-turbo',
            temperature: 0.7,
            streaming: true,
            openAIApiKey: process.env.OPENAI_API_KEY,
        });

        this.embeddings = new OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAI_API_KEY,
        });

        this.pinecone = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY!
        });
    }

    async initialize() {
        this.pineconeIndex = this.pinecone.index(process.env.PINECONE_INDEX!);
    }

    async createConversationalRetrievalChain(vectorStore: PineconeStore, chatbotSettings: any) {
        const chatModel = new ChatOpenAI({
            modelName: chatbotSettings?.model || 'gpt-3.5-turbo',
            temperature: chatbotSettings?.temperature || 0.7,
            streaming: true,
            openAIApiKey: process.env.OPENAI_API_KEY,
        });
    
        // Create the prompt template using custom system message if available
        const questionAnsweringPrompt = ChatPromptTemplate.fromMessages([
            ["system", chatbotSettings?.customPrompt?.systemMessage || "You are a helpful AI assistant that answers questions based on the provided context."],
            new MessagesPlaceholder("chat_history"),
            ["human", "{input}"],
            ["human", chatbotSettings?.customPrompt?.promptTemplate || 
                "Answer the following question based on the context provided. If you cannot find the answer in the context, say so.\n\nContext: {context}\n\nQuestion: {question}"]
        ]);
    
        // Create the document chain
        const combineDocsChain = await createStuffDocumentsChain({
            llm: chatModel,
            prompt: questionAnsweringPrompt,
        });
    
        // Create history-aware retriever
        const historyAwareRetriever = await createHistoryAwareRetriever({
            llm: chatModel,
            retriever: vectorStore.asRetriever(),
            rephrasePrompt: ChatPromptTemplate.fromTemplate(
                'Given this conversation history, rephrase the follow up question to be a standalone question: {input}'
            )
        });
    
        // Create the retrieval chain
        const retrievalChain = await createRetrievalChain({
            combineDocsChain,
            retriever: historyAwareRetriever,
        });
    
        return retrievalChain;
    }

    async streamChatResponse(
        question: string,
        botId: string,
        chatHistory: { role: string; content: string }[],
        onToken: (token: string) => void
    ) {
        try {
            // First get the chatbot settings
            const chatbot = await mongoose.model('Chatbot').findById(botId);
            if (!chatbot) {
                throw new Error('Chatbot not found');
            }

            const vectorStore = await PineconeStore.fromExistingIndex(
                this.embeddings,
                { pineconeIndex: this.pineconeIndex, namespace: botId }
            );

            // Convert chat history to LangChain format
            const messages = chatHistory.map(msg => {
                return msg.role === 'user'
                    ? new HumanMessage(msg.content)
                    : new AIMessage(msg.content);
            });

            const memory = new BufferMemory({
                chatHistory: new ChatMessageHistory(messages),
                returnMessages: true,
                memoryKey: 'chat_history',
            });

            // Pass chatbot settings to create the chain
            const retrievalChain = await this.createConversationalRetrievalChain(vectorStore, chatbot.settings);

            const response = await retrievalChain.invoke({
                input: question,
                chat_history: messages,
                memory: memory
            });

            return {
                answer: response.text,
                sources: response.sourceDocuments,
            };
        } catch (error) {
            console.error('Error in streamChatResponse:', error);
            throw error;
        }
    }

    async generateEmbeddings(text: string) {
        try {
            const embeddings = await this.embeddings.embedQuery(text);
            return embeddings;
        } catch (error) {
            console.error('Error generating embeddings:', error);
            throw error;
        }
    }

    async storeDocument(
        botId: string,
        documentText: string,
        metadata: Record<string, any>
    ) {
        try {
            const vectorStore = await PineconeStore.fromExistingIndex(
                this.embeddings,
                { pineconeIndex: this.pineconeIndex, namespace: botId }
            );

            await vectorStore.addDocuments([
                {
                    pageContent: documentText,
                    metadata,
                },
            ]);

            return true;
        } catch (error) {
            console.error('Error storing document:', error);
            throw error;
        }
    }
}

export const openAIService = new OpenAIService();
