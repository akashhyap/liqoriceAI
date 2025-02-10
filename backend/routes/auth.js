import express from 'express';
import {
    register,
    login,
    getMe,
    generateApiKey,
    updateMe,
    updatePassword,
    updateNotificationSettings,
    getNotificationSettings
} from '../controllers/auth.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.put('/update-password', protect, updatePassword);
router.post('/apikey', protect, generateApiKey);
router.put('/notification-settings', protect, updateNotificationSettings);
router.get('/notification-settings', protect, getNotificationSettings);

export default router;
