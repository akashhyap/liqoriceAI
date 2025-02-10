import express from 'express';
import { authService } from '../services/auth.service.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Auth routes
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        const result = await authService.register(email, password, name);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await authService.login(email, password);
        res.json(result);
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
});

// Protected routes
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await authService.getProfile(req.user.id);
        res.json(user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { name, currentPassword, newPassword } = req.body;
        const user = await authService.updateProfile(req.user.id, {
            name,
            currentPassword,
            newPassword,
        });
        res.json(user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

export default router;
