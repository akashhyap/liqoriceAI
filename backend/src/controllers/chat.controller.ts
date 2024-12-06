import { Request, Response } from 'express';
import { openAIService } from '@services/openai.service.js';

export const chatController = {
    async streamChat(req: Request, res: Response) {
        const { question, botId, chatHistory } = req.body;

        if (!question || !botId) {
            return res.status(400).json({
                error: 'Missing required parameters',
            });
        }

        try {
            // Set headers for SSE
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            // Function to send SSE data
            const sendData = (data: string) => {
                res.write(`data: ${JSON.stringify({ token: data })}\n\n`);
            };

            // Stream the response
            const response = await openAIService.streamChatResponse(
                question,
                botId,
                chatHistory || [],
                sendData
            );

            // Send the final response with sources
            res.write(
                `data: ${JSON.stringify({
                    done: true,
                    sources: response.sources,
                })}\n\n`
            );

            res.end();
        } catch (error: any) {
            console.error('Error in streamChat:', error);
            res.write(
                `data: ${JSON.stringify({
                    error: error.message || 'An error occurred',
                })}\n\n`
            );
            res.end();
        }
    },
};
