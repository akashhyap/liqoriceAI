import cors from 'cors';
import { Express } from 'express';

export const setupCors = (app: Express) => {
    // List of allowed origins
    const allowedOrigins = [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        // Add other allowed origins here
    ];

    // CORS options
    const corsOptions = {
        origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin) {
                return callback(null, true);
            }

            if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
            'Origin',
            'X-Requested-With',
            'Content-Type',
            'Accept',
            'Authorization',
        ],
    };

    // Apply CORS middleware
    app.use(cors(corsOptions));

    // Handle preflight requests
    app.options('*', cors(corsOptions));
};
