# Liquorice - AI Chatbot Platform

Liquorice is a powerful AI-powered chatbot platform that allows businesses to create, train, and deploy custom chatbots using advanced language models and natural language processing.

## Features

### Chatbot Management
- Create and manage multiple chatbots
- Customize chatbot settings and behavior
- Monitor chatbot performance and analytics
- Deploy chatbots to websites or applications

### Training Capabilities
- Document Upload: Train chatbots using various document formats
- Website Crawler: Extract and use website content for training
- Custom Training: Fine-tune chatbot responses
- Real-time Training Updates

### Chat Interface
- Real-time chat functionality
- Chat history tracking
- Full-screen chat mode
- Standalone chat deployment

### Analytics & Monitoring
- Usage analytics and insights
- Performance metrics
- User interaction tracking
- Response quality monitoring

### User Management
- User authentication and authorization
- Profile management
- Role-based access control
- Subscription management

### Subscription & Billing
- Stripe integration for payments
- Subscription plan management
- Usage-based billing
- Payment history

## Tech Stack

### Frontend
- React 18 with TypeScript
- Material-UI (MUI) for UI components
- Redux Toolkit for state management
- React Query for data fetching
- Chart.js for analytics visualization
- Socket.IO for real-time communication
- Formik & Yup for form handling

### Backend
- Node.js with Express
- LangChain for AI/ML integration
- OpenAI integration
- Pinecone for vector database
- MongoDB with Mongoose
- Socket.IO for real-time features
- JWT authentication
- Stripe for payment processing

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- OpenAI API key
- Pinecone API key
- Stripe account (for payments)

### Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/akashhyap/liqoriceAI.git
cd liqoriceAI
```

2. Set up environment variables:

Create `.env` files in both frontend and backend directories using the provided `.env.example` templates.

#### Backend Environment Variables
```
PORT=8000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_key
PINECONE_API_KEY=your_pinecone_key
STRIPE_SECRET_KEY=your_stripe_secret
```

#### Frontend Environment Variables
```
REACT_APP_API_URL=http://localhost:8000
REACT_APP_STRIPE_PUBLIC_KEY=your_stripe_public_key
PORT=3001
```

### Installation

1. Install backend dependencies:
```bash
cd backend
npm install
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

### Running the Application

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. Start the frontend development server:
```bash
cd frontend
npm start
```

The application will be available at `http://localhost:3001`

## Project Structure

```
liqorice/
├── frontend/                # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── store/         # Redux store
│   └── public/            # Static files
│
└── backend/               # Node.js backend server
    ├── config/           # Configuration files
    ├── controllers/      # Request handlers
    ├── middleware/       # Custom middleware
    ├── models/          # Database models
    ├── routes/          # API routes
    └── services/        # Business logic
```

## API Documentation

The backend provides RESTful APIs for:
- Authentication (/api/auth)
- User Management (/api/users)
- Chatbot Operations (/api/chatbot)
- Training Management (/api/training)
- Analytics (/api/analytics)
- Subscription Management (/api/subscription)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is proprietary software. All rights reserved.

## Support

For support, email [support@email.com] or join our Slack channel.
