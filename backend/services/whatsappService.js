import WhatsappMessage from '../models/whatsappMessage.js';
import logger from './loggerService.js';

class WhatsappService {
    // Process incoming message
    static async processIncomingMessage(chatbotId, phoneNumber, content, messageType = 'text') {
        try {
            const message = new WhatsappMessage({
                messageId: `in_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                chatbotId,
                phoneNumber,
                direction: 'incoming',
                messageType,
                content,
                status: 'delivered'
            });

            await message.save();
            logger.info('Processed incoming WhatsApp message', { messageId: message.messageId });
            
            return message;
        } catch (error) {
            logger.error('Error processing incoming WhatsApp message', { error });
            throw error;
        }
    }

    // Send outgoing message (will be implemented with actual WhatsApp API later)
    static async sendMessage(chatbotId, phoneNumber, content, messageType = 'text') {
        try {
            const message = new WhatsappMessage({
                messageId: `out_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                chatbotId,
                phoneNumber,
                direction: 'outgoing',
                messageType,
                content,
                status: 'sent'
            });

            await message.save();
            logger.info('Sent WhatsApp message', { messageId: message.messageId });

            return message;
        } catch (error) {
            logger.error('Error sending WhatsApp message', { error });
            throw error;
        }
    }

    // Update message status
    static async updateMessageStatus(messageId, status) {
        try {
            const message = await WhatsappMessage.findOneAndUpdate(
                { messageId },
                { status },
                { new: true }
            );

            if (!message) {
                throw new Error('Message not found');
            }

            logger.info('Updated WhatsApp message status', { messageId, status });
            return message;
        } catch (error) {
            logger.error('Error updating WhatsApp message status', { error });
            throw error;
        }
    }

    // Get conversation history
    static async getConversationHistory(chatbotId, phoneNumber, limit = 50) {
        try {
            const messages = await WhatsappMessage.find({ chatbotId, phoneNumber })
                .sort({ timestamp: -1 })
                .limit(limit);

            return messages;
        } catch (error) {
            logger.error('Error fetching conversation history', { error });
            throw error;
        }
    }
}

export default WhatsappService;
