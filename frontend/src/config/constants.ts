// API URL based on environment
export const apiUrl = 'http://localhost:5000';

// Other constants
export const DEFAULT_PAGINATION_LIMIT = 10;
export const DEFAULT_CHAT_MESSAGE_LIMIT = 50;

// Chat message types
export const MESSAGE_TYPES = {
    USER: 'user',
    ASSISTANT: 'assistant'
} as const;

// Date formats
export const DATE_FORMATS = {
    SHORT: 'MMM d, yyyy',
    FULL: 'MMM d, yyyy HH:mm:ss',
    TIME: 'HH:mm:ss'
} as const;

// Local storage keys
export const STORAGE_KEYS = {
    VISITOR_EMAIL: 'visitorEmail',
    SESSION_ID: 'sessionId',
    AUTH_TOKEN: 'authToken'
} as const;

// Chat refresh interval in milliseconds
export const CHAT_REFRESH_INTERVAL = 3000; // 3 seconds

// Maximum allowed file size in bytes
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

// Allowed file types for upload
export const ALLOWED_FILE_TYPES = [
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
];
