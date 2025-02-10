import { Router, Request, Response } from 'express';
import { chatController } from '../controllers/chat.controller.js';

const router = Router();

router.post('/stream', async (req: Request, res: Response) => {
  await chatController.streamChat(req, res);
});

export default router;
