import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import chatbotRoutes from './routes/chatbot.js';
import chatRoutes from './routes/chat.js';
import userRoutes from './routes/user.js';
import authRoutes from './routes/auth.js';
import analyticsRoutes from './routes/analytics.js';
import trainingRoutes from './routes/training.js';
import chatbotStatsRoutes from './routes/chatbot-stats.js';
import subscriptionRoutes from './routes/subscription.js';
import superAdminRoutes from './routes/superAdmin.js';
import { Server } from 'socket.io';
import { createServer } from 'http';
import logger from './services/loggerService.js';
import { errorHandler, validationErrorHandler, databaseErrorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const server = createServer(app);

// Middleware
// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true
}));

// Security middleware
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(logger.logApiRequest.bind(logger));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100
});
app.use('/api/', limiter);

// Basic route for API health check
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Liqorice API' });
});

// API routes
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/chatbot-stats', chatbotStatsRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/super-admin', superAdminRoutes);

// Handle duplicate /api prefix routes
app.use('/api/api/chat', chatRoutes);
app.use('/api/api/users', userRoutes);
app.use('/api/api/analytics', analyticsRoutes);
app.use('/api/api/auth', authRoutes);
app.use('/api/api/chatbot', chatbotRoutes);
app.use('/api/api/training', trainingRoutes);
app.use('/api/api/chatbot-stats', chatbotStatsRoutes);
app.use('/api/api/subscription', subscriptionRoutes);
app.use('/api/api/super-admin', superAdminRoutes);

// Serve uploads directory
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// MongoDB Connection
mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('Connected to MongoDB');
})
.catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
});

// WebSocket Setup
const io = new Server(server, {
    cors: {
        origin: function(origin, callback) {
            if(!origin) return callback(null, true);
            
            const allowedOrigins = [
                'http://localhost:3000',
                'http://localhost:3001',
                'http://127.0.0.1:3000',
                'http://127.0.0.1:3001'
            ];
            
            if (allowedOrigins.indexOf(origin) === -1) {
                return callback(new Error('CORS policy violation'), false);
            }
            return callback(null, true);
        },
        methods: ['GET', 'POST'],
        credentials: true
    }
});

io.on('connection', (socket) => {
    console.log('New client connected');
    
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
    
    socket.on('chat message', (msg) => {
        io.emit('chat message', msg);
    });
});

// Error handling middleware
app.use(validationErrorHandler);
app.use(databaseErrorHandler);
app.use(errorHandler);
app.use(notFound);

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

export default app;
