import express from 'express';
import cors from 'cors';
import { protect as auth, subscriptionRateLimit } from '../middleware/auth.js';
import chatService from '../services/chatService.js';
import Chatbot from '../models/Chatbot.js';
import ChatHistory from '../models/ChatHistory.js';

const router = express.Router();

// Configure CORS for chat routes
const chatCors = cors({
    origin: function(origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if(!origin) return callback(null, true);
        
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:3001',
            'http://127.0.0.1:5500',
            'http://localhost:5500',
            'null'
        ];
        
        if (allowedOrigins.indexOf(origin) === -1) {
            console.log('Chat route blocked origin:', origin);
            return callback(new Error('CORS policy violation'), false);
        }
        callback(null, true);
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
    preflightContinue: true
});

// Apply CORS to all chat routes
router.use(chatCors);
router.options('*', chatCors);

// Public endpoint for widget chat
router.post('/:chatbotId', async (req, res) => {
    try {
        const { message } = req.body;
        const { chatbotId } = req.params;

        console.log('Received chat request:', {
            chatbotId,
            message,
            body: req.body
        });

        const chatbot = await Chatbot.findOne({
            _id: chatbotId,
            'deployment.status': 'deployed'  // Check deployment status
        });

        if (!chatbot) {
            console.log('Chatbot not found or not deployed:', chatbotId);
            return res.status(404).json({
                success: false,
                error: 'Chatbot not found or not deployed'
            });
        }

        console.log('Found chatbot:', {
            id: chatbot._id,
            deployment: chatbot.deployment,
            settings: chatbot.settings
        });

        const response = await chatService.generateResponse(chatbot, message);
        console.log('Generated response:', response);
        
        // Save chat history
        const chatHistory = new ChatHistory({
            chatbot: chatbotId,
            message,
            response: response.response, // Save only the response text
            timestamp: new Date(),
            metadata: {
                sources: response.sources.map(source => JSON.stringify(source)) // Convert source objects to strings
            }
        });
        await chatHistory.save();
        console.log('Saved chat history');

        res.json({
            success: true,
            message: response.response,
            sources: response.sources
        });
    } catch (error) {
        console.error('Error in chat endpoint:', {
            error: error.message,
            stack: error.stack,
            chatbotId: req.params.chatbotId,
            body: req.body
        });
        
        res.status(500).json({ 
            success: false,
            error: error.message || 'Error processing chat message'
        });
    }
});

// Protected routes for authenticated users
router.post('/session', auth, async (req, res) => {
    try {
        const { chatbotId } = req.body;
        const chatbot = await Chatbot.findOne({
            _id: chatbotId,
            user: req.user.id,
        });

        if (!chatbot) {
            return res.status(404).json({
                success: false,
                error: 'Chatbot not found',
            });
        }

        res.json({
            success: true,
            chatbot: {
                name: chatbot.name,
                settings: chatbot.settings,
            },
        });
    } catch (error) {
        console.error('Error starting chat session:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to start chat session'
        });
    }
});

router.post('/message', [auth, subscriptionRateLimit], async (req, res) => {
    try {
        const { chatbotId, message } = req.body;

        const chatbot = await Chatbot.findOne({
            _id: chatbotId,
            user: req.user.id,
        });

        if (!chatbot) {
            return res.status(404).json({
                success: false,
                error: 'Chatbot not found',
            });
        }

        const response = await chatService.generateResponse(chatbot, message);
        
        // Save chat history
        const chatHistory = new ChatHistory({
            chatbot: chatbotId,
            message,
            response: response.response, // Save only the response text
            timestamp: new Date(),
            metadata: {
                sources: response.sources.map(source => JSON.stringify(source)) // Convert source objects to strings
            }
        });
        await chatHistory.save();

        res.json({
            success: true,
            message: response.response,
            sources: response.sources
        });
    } catch (error) {
        console.error('Error processing message:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process message'
        });
    }
});

export default router;
