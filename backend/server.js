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
import { Server } from 'socket.io';
import { createServer } from 'http';
import logger from './services/loggerService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const server = createServer(app);

// Middleware
app.options('*', cors());

app.use(cors({
    origin: function(origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Allow localhost and your main frontend during development
        const trustedOrigins = [
            'http://localhost:3001',
            'http://localhost:5500',
            'http://127.0.0.1:5500',
            'https://liqoriceai-frontend.onrender.com',
            'https://liqorice-frontend.onrender.com',
            'https://liqoriceai.onrender.com',
            process.env.FRONTEND_URL
        ].filter(Boolean); // Remove any undefined values
        
        if (trustedOrigins.includes(origin)) {
            return callback(null, true);
        }

        // For dynamic origins (like customer websites), validate the origin
        try {
            const originUrl = new URL(origin);
            // You can add additional validation logic here if needed
            return callback(null, true);
        } catch (error) {
            return callback(new Error('Invalid origin'), false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

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

// Routes
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/training', trainingRoutes);

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
import {
    errorHandler,
    notFound,
    validationErrorHandler,
    databaseErrorHandler,
} from './middleware/errorHandler.js';
app.use(validationErrorHandler);
app.use(databaseErrorHandler);
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

export default app;
