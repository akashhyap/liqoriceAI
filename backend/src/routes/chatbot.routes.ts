import { Router, Request, Response } from 'express';
import { protect } from '../middleware/auth.js';
import Chatbot from '../models/Chatbot.js';

const router = Router();

// Get a specific chatbot by ID
router.get('/:id', protect, async (req: Request, res: Response) => {
  try {
    const chatbot = await Chatbot.findById(req.params.id);
    
    if (!chatbot) {
      return res.status(404).json({ message: 'Chatbot not found' });
    }

    // Check if the chatbot belongs to the requesting user
    if (chatbot.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access this chatbot' });
    }

    res.json(chatbot);
  } catch (error) {
    console.error('Error fetching chatbot:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
