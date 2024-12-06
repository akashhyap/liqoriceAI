export interface User {
    _id: string;
    name: string;
    email: string;
    role: 'user' | 'admin';
    subscription: 'free' | 'starter' | 'pro';
    usage: {
        messages: number;
        storage: number;
    };
    settings: {
        language: string;
        timezone: string;
    };
    createdAt: string;
}

export interface Chatbot {
    _id: string;
    name: string;
    description: string;
    user: string;
    channels: Array<'web' | 'whatsapp' | 'facebook' | 'instagram'>;
    settings: {
        language: string;
        welcomeMessage: string;
        personality: string;
        modelSettings: {
            temperature: number;
            maxTokens: number;
        };
    };
    training: {
        documents: Array<{
            type: string;
            fileType: 'pdf' | 'docx' | 'txt' | 'csv' | 'xls';
        }>;
        websites: Array<{
            url: string;
            lastCrawled: string;
        }>;
        customResponses: Array<{
            pattern: string;
            response: string;
        }>;
    };
    analytics: {
        totalConversations: number;
        totalMessages: number;
        averageResponseTime: number;
        userSatisfactionScore: number;
    };
    widgetSettings: {
        theme: {
            primaryColor: string;
            fontFamily: string;
        };
        position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
        size: 'small' | 'medium' | 'large';
    };
    active: boolean;
    createdAt: string;
    deployment?: {
        status: 'draft' | 'deployed' | 'pending';
    };
}

export interface Message {
    _id: string;
    chatbotId: string;
    sessionId: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: string;
    metadata?: {
        sources?: string[];
        confidence?: number;
    };
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

export interface ChatbotState {
    chatbots: Chatbot[];
    selectedChatbot: Chatbot | null;
    isLoading: boolean;
    error: string | null;
}

export interface Plan {
    id: 'free' | 'starter' | 'pro';
    name: string;
    price: number;
    features: string[];
    recommended: boolean;
}

export interface SubscriptionPlan {
    id: string;
    name: string;
    price: number;
    features: string[];
    limits: {
        messages: number;
        storage: number;
        chatbots: number;
    };
}

export interface PasswordUpdateRequest {
    currentPassword: string;
    newPassword: string;
}
