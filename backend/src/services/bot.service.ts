import { PrismaClient, Bot, BotModel } from '@prisma/client';
import { openAIService } from './openai.service.js'; 
import { widgetService } from './widget.service.js';
import { PineconeClient } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import config from '../config.js'; 

const prisma = new PrismaClient();

interface CreateBotInput {
    name: string;
    description: string;
    modelId: string;
    userId: string;
    welcomeMessage?: string;
    knowledgeBase?: {
        files: Array<{
            content: string;
            metadata: Record<string, any>;
        }>;
    };
}

interface UpdateBotInput extends Partial<CreateBotInput> {
    id: string;
}

interface WebhookInput {
    url: string;
    events: string[];
    secret?: string;
}

interface WebhookUpdateInput {
    url?: string;
    events?: string[];
    active?: boolean;
}

class BotService {
    private pinecone: PineconeClient;
    private openai: OpenAI;
    private index: any;

    constructor() {
        // Initialize Pinecone
        this.pinecone = new PineconeClient();
        this.pinecone.init({
            apiKey: config.pinecone.apiKey
        });

        // Initialize the index
        this.index = this.pinecone.index(config.pinecone.index, config.pinecone.host);

        // Initialize OpenAI
        this.openai = new OpenAI({
            apiKey: config.openai.apiKey
        });
    }

    async createBot(input: CreateBotInput) {
        const bot = await prisma.bot.create({
            data: {
                name: input.name,
                description: input.description,
                modelId: input.modelId,
                userId: input.userId,
                welcomeMessage: input.welcomeMessage,
            },
            include: {
                model: true,
            },
        });

        // Process knowledge base if provided
        if (input.knowledgeBase?.files) {
            for (const file of input.knowledgeBase.files) {
                await openAIService.storeDocument(
                    bot.id,
                    file.content,
                    file.metadata
                );
            }
        }

        // Generate widget and full screen link
        const widgetConfig = {
            botId: bot.id,
            theme: {
                primaryColor: '#2563eb',
                fontFamily: 'Inter, system-ui, sans-serif',
                borderRadius: '8px',
                buttonColor: '#2563eb',
                backgroundColor: '#ffffff',
                headerColor: '#1e40af',
            },
        };

        const script = widgetService.generateWidgetScript(widgetConfig);
        const fullScreenLink = widgetService.generateFullScreenLink(widgetConfig);

        await prisma.bot.update({
            where: { id: bot.id },
            data: {
                widgetScript: script,
                fullScreenLink,
            },
        });

        return {
            ...bot,
            widgetScript: script,
            fullScreenLink,
        };
    }

    async updateBot(input: UpdateBotInput) {
        const bot = await prisma.bot.update({
            where: { id: input.id },
            data: {
                name: input.name,
                description: input.description,
                modelId: input.modelId,
                welcomeMessage: input.welcomeMessage,
            },
            include: {
                model: true,
            },
        });

        // Update knowledge base if provided
        if (input.knowledgeBase?.files) {
            // Clear existing documents
            await prisma.botDocument.deleteMany({
                where: { botId: bot.id },
            });

            // Store new documents
            for (const file of input.knowledgeBase.files) {
                await openAIService.storeDocument(
                    bot.id,
                    file.content,
                    file.metadata
                );
            }
        }

        return bot;
    }

    async deleteBot(id: string) {
        // Delete associated documents first
        await prisma.botDocument.deleteMany({
            where: { botId: id },
        });

        // Delete the bot
        await prisma.bot.delete({
            where: { id },
        });

        return true;
    }

    async getBotsByUser(userId: string) {
        return prisma.bot.findMany({
            where: { userId },
            include: {
                model: true,
            },
        });
    }

    async getBot(id: string) {
        return prisma.bot.findUnique({
            where: { id },
            include: {
                model: true,
            },
        });
    }

    async getAvailableModels() {
        return prisma.botModel.findMany();
    }

    async embedText(text: string): Promise<number[]> {
        const response = await this.openai.embeddings.create({
            model: "text-embedding-ada-002",
            input: text
        });
        return response.data[0].embedding;
    }

    async upsertVector(id: string, values: number[], metadata: any = {}) {
        await this.index.upsert([{
            id,
            values,
            metadata
        }]);
    }

    async queryVector(values: number[], topK: number = 5) {
        const queryResponse = await this.index.query({
            vector: values,
            topK,
            includeMetadata: true
        });
        return queryResponse.matches;
    }

    async deleteVector(id: string) {
        await this.index.deleteOne(id);
    }

    async deleteVectors(ids: string[]) {
        await this.index.deleteMany(ids);
    }

    async registerWebhook(botId: string, input: WebhookInput) {
        return prisma.webhook.create({
            data: {
                url: input.url,
                events: input.events,
                secret: input.secret,
                botId: botId,
                active: true
            }
        });
    }

    async getWebhooks(botId: string) {
        return prisma.webhook.findMany({
            where: { botId }
        });
    }

    async updateWebhook(webhookId: string, input: WebhookUpdateInput) {
        return prisma.webhook.update({
            where: { id: webhookId },
            data: input
        });
    }

    async deleteWebhook(webhookId: string) {
        return prisma.webhook.delete({
            where: { id: webhookId }
        });
    }

    async processWebhookEvent(botId: string, event: any) {
        // Log the webhook event
        await prisma.webhookEvent.create({
            data: {
                botId,
                eventType: event.type,
                payload: event
            }
        });

        // Process the event based on its type
        switch (event.type) {
            case 'message':
                // Handle incoming message
                await this.processIncomingMessage(botId, event);
                break;
            case 'feedback':
                // Handle user feedback
                await this.processFeedback(botId, event);
                break;
            // Add more event types as needed
        }
    }

    private async processIncomingMessage(botId: string, event: any) {
        // Create a chat message
        await prisma.message.create({
            data: {
                botId,
                content: event.message.content,
                role: 'user',
                metadata: {
                    source: 'webhook',
                    webhookEventId: event.id
                }
            }
        });

        // Generate bot response
        // Implementation depends on your chat processing logic
    }

    private async processFeedback(botId: string, event: any) {
        // Store feedback
        await prisma.feedback.create({
            data: {
                botId,
                rating: event.feedback.rating,
                comment: event.feedback.comment,
                messageId: event.feedback.messageId
            }
        });
    }
}

export const botService = new BotService();
