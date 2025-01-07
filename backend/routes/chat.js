import express from 'express';
import cors from 'cors';
import { protect as auth, subscriptionRateLimit } from '../middleware/auth.js';
import chatService from '../services/chatService.js';
import Chatbot from '../models/Chatbot.js';
import ChatHistory from '../models/ChatHistory.js';

const router = express.Router();

// Configure CORS for chat routes
const allowedOrigins = [
    'http://localhost:3001',                          // Local development
    'https://liqoriceai-frontend.onrender.com',       // Production frontend
    'https://liqorice-frontend.onrender.com'          // Alternative production frontend
];

const chatCors = cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
});

// Apply CORS to all chat routes
router.use(chatCors);
router.options('*', chatCors);

// Public endpoint for widget chat
router.post('/:chatbotId', async (req, res) => {
    try {
        const { message, sessionId, userId } = req.body;
        const { chatbotId } = req.params;

        console.log('Received chat request:', {
            chatbotId,
            message,
            sessionId,
            userId,
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
        
        // Generate sessionId if not provided
        const currentSessionId = sessionId || Math.random().toString(36).substring(7);
        
        // Save chat history with session and user info
        const chatHistory = new ChatHistory({
            chatbot: chatbotId,
            message,
            response: response.response,
            sessionId: currentSessionId,
            userId: userId || currentSessionId, // Use sessionId as userId if not provided
            timestamp: new Date(),
            metadata: {
                sources: response.sources.map(source => JSON.stringify(source))
            }
        });
        await chatHistory.save();
        console.log('Saved chat history with session:', currentSessionId);

        res.json({
            success: true,
            message: response.response,
            sources: response.sources,
            sessionId: currentSessionId // Return sessionId to client
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
