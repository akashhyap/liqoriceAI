import express from 'express';
import {
    getVisitorsList,
    getVisitorChatHistory,
    getChatbotVisitorAnalytics,
    getVisitorAnalytics,
    getVisitorByEmail,
    initializeSession,
    addMessage,
    getChatHistory
} from '../controllers/visitorController.js';
import VisitorUser from '../models/VisitorUser.js';
import VisitorSession from '../models/VisitorSession.js';
import VisitorChatHistory from '../models/VisitorChatHistory.js';
import Chatbot from '../models/Chatbot.js';
import chatService from '../services/chatService.js';

const router = express.Router();

// Initialize or retrieve visitor session
router.post('/session', initializeSession);

// Delete a visitor session
router.delete('/session/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = await VisitorSession.findById(sessionId);
        
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }

        await session.deleteOne();

        res.json({
            success: true,
            message: 'Session deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting session:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Error deleting session'
        });
    }
});

// Add message to chat history
router.post('/message', addMessage);

// Get visitor by email
router.get('/user', getVisitorByEmail);

// Get all visitors for a chatbot
router.get('/list/:chatbotId', getVisitorsList);

// Get chat history for a visitor by email
router.get('/history', getChatHistory);

// Get chat history for a specific visitor
router.get('/history/:visitorId', getVisitorChatHistory);

// Get visitor analytics
router.get('/analytics/visitor/:visitorId', getVisitorAnalytics);

// Get chatbot visitor analytics
router.get('/analytics/chatbot/:chatbotId', getChatbotVisitorAnalytics);

// Chat with the bot
router.post('/chat/:chatbotId', async (req, res) => {
    try {
        const { message, sessionId } = req.body;
        const { chatbotId } = req.params;

        if (!message || !chatbotId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Message and chatbotId are required' 
            });
        }

        // Get the chatbot
        const chatbot = await Chatbot.findById(chatbotId);
        if (!chatbot) {
            return res.status(404).json({ 
                success: false, 
                message: 'Chatbot not found' 
            });
        }

        // Set headers for streaming response
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Transfer-Encoding', 'chunked');

        // Stream the response
        let accumulatedMessage = '';
        const onToken = (token) => {
            accumulatedMessage += token;
            res.write(token);
        };

        // Generate response using streaming
        await chatService.generateResponse(chatbot, message, sessionId, onToken);
        
        // Save to chat history
        if (sessionId) {
            const session = await VisitorSession.findById(sessionId);
            if (session) {
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
                    { role: 'user', content: message, timestamp: new Date() },
                    { role: 'assistant', content: accumulatedMessage, timestamp: new Date() }
                );
                await chatHistory.save();
            }
        }

        res.end();
    } catch (error) {
        console.error('Error in chat endpoint:', error);
        // Only send error if headers haven't been sent
        if (!res.headersSent) {
            res.status(500).json({ 
                success: false, 
                message: error.message || 'Internal server error'
            });
        } else {
            res.end();
        }
    }
});

export default router;
