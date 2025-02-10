import { Router, Request, Response, NextFunction } from 'express';
import { widgetController } from '@controllers/widget.controller.js';

const router = Router();

router.post('/generate', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await widgetController.generateWidget(req, res);
    } catch (error) {
        next(error);
    }
});

export default router;
