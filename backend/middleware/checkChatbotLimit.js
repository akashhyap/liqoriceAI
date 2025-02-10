import User from '../models/User.js';
import Chatbot from '../models/Chatbot.js';

const CHATBOT_LIMITS = {
    free: 1,
    starter: 5,
    professional: Infinity
};

const checkChatbotLimit = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Only check limit when creating a new chatbot
        if (req.method === 'POST') {
            // Count user's existing chatbots
            const chatbotCount = await Chatbot.countDocuments({ user: user._id });
            const limit = CHATBOT_LIMITS[user.subscription] || CHATBOT_LIMITS.free;

            if (chatbotCount >= limit) {
                return res.status(403).json({
                    message: `You have reached the maximum number of chatbots allowed for your ${user.subscription} plan. Please upgrade to create more chatbots.`
                });
            }
        }

        next();
    } catch (error) {
        console.error('Error checking chatbot limit:', error);
        res.status(500).json({ message: 'Error checking chatbot limit' });
    }
};

export default checkChatbotLimit;
