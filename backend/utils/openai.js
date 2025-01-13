import { ChatOpenAI } from '@langchain/openai';

class OpenAIService {
    constructor() {
        this.modelCache = new Map();
    }

    getModel(settings = {}) {
        const modelName = settings.model || 'gpt-3.5-turbo';
        const temperature = settings.temperature || 0.7;
        const maxTokens = settings.maxTokens || 2000;

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
}

export default new OpenAIService();
