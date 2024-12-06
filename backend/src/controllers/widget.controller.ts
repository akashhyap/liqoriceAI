import { Request, Response } from 'express';
import { widgetService } from '@services/widget.service.js';

export const widgetController = {
    generateWidget(req: Request, res: Response) {
        try {
            const { botId, theme } = req.body;

            if (!botId) {
                return res.status(400).json({
                    error: 'Bot ID is required',
                });
            }

            const script = widgetService.generateWidgetScript({ botId, theme });
            const fullScreenLink = widgetService.generateFullScreenLink({ botId, theme });

            res.json({
                script,
                fullScreenLink,
                widgetId: widgetService.widgetId,
            });
        } catch (error: any) {
            console.error('Error generating widget:', error);
            res.status(500).json({
                error: error.message || 'Error generating widget',
            });
        }
    },
};
