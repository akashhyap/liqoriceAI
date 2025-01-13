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
        const { chatbotId } = req.params;
        const { message, sessionId } = req.body;

        // Get the chatbot
        const chatbot = await Chatbot.findById(chatbotId);
        if (!chatbot) {
            return res.status(404).json({ 
                success: false, 
                error: 'Chatbot not found' 
            });
        }

        // Get the session
        const session = await VisitorSession.findById(sessionId);
        if (!session) {
            return res.status(400).json({
                success: false,
                error: 'Session not found'
            });
        }

        try {
            // Generate response
            const response = await chatbot.generateResponse(message, sessionId);

            // Add messages to chat history
            let chatHistory = await VisitorChatHistory.findOne({ visitorSession: sessionId });
            if (!chatHistory) {
                chatHistory = await VisitorChatHistory.create({
                    visitorSession: sessionId,
                    messages: []
                });

                // Update session with chat history reference
                session.chatHistory = chatHistory._id;
                await session.save();
            }

            // Add user message and bot response to history
            chatHistory.messages.push(
                { role: 'user', content: message, timestamp: new Date() },
                { role: 'assistant', content: response, timestamp: new Date() }
            );
            await chatHistory.save();

            res.json({
                success: true,
                message: response
            });
        } catch (error) {
            console.error('Error generating response:', error);
            return res.status(500).json({
                success: false,
                error: error.message || 'Error generating response'
            });
        }
    } catch (error) {
        console.error('Error in chat:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Error processing chat request'
        });
    }
});

export default router;
