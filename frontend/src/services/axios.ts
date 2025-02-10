import axios, { AxiosError, AxiosResponse } from 'axios';

// Define the shape of our API error response
interface ApiErrorResponse {
    message?: string;
    error?: string;
    [key: string]: any; // Allow for other fields
}

// Custom error class
class ApiError extends Error {
    response?: AxiosResponse;
    constructor(message: string) {
        super(message);
        this.name = 'ApiError';
    }
}

// Set default base URL from environment variable
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
axios.defaults.baseURL = API_URL;
axios.defaults.withCredentials = true;

// Add request interceptor to handle tokens
axios.interceptors.request.use(
    (config) => {
        // Get the current token (could be regular or impersonation token)
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle errors
axios.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiErrorResponse>) => {
        if (error.response) {
            // The request was made and the server responded with a status code
            const message = error.response.data.message || error.response.data.error || 'An error occurred';
            const apiError = new ApiError(message);
            apiError.response = error.response;
            return Promise.reject(apiError);
        } else if (error.request) {
            // The request was made but no response was received
            return Promise.reject(new ApiError('No response received from server'));
        } else {
            // Something happened in setting up the request
            return Promise.reject(new ApiError(error.message || 'Request failed'));
        }
    }
);

export default axios;
