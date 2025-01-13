import React, { useState, useRef, useEffect } from 'react';
import { Box, Paper, Typography, TextField, IconButton, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { Send as SendIcon, Close as CloseIcon, Minimize as MinimizeIcon, OpenInFull as EnlargeIcon, CloseFullscreen as ShrinkIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useFormik } from 'formik';
import * as Yup from 'yup';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    sources?: any;
}

interface ChatWindowProps {
    botId: string;
    apiEndpoint: string;
    onClose?: () => void;
    onMinimize?: () => void;
    isFullScreen?: boolean;
    isEnlarged?: boolean;
    onToggleEnlarge?: () => void;
    theme?: {
        primaryColor: string;
        fontFamily: string;
        borderRadius: string;
        buttonColor: string;
        backgroundColor: string;
        headerColor: string;
    };
}

const defaultTheme = {
    primaryColor: '#1976d2',
    fontFamily: 'Arial, sans-serif',
    borderRadius: '10px',
    buttonColor: '#1976d2',
    backgroundColor: '#f7f7f7',
    headerColor: '#1976d2',
};

const StyledPaper = styled(Paper)<{ isFullScreen?: boolean }>(({ theme, isFullScreen }) => ({
    width: isFullScreen ? '100%' : '350px',
    height: isFullScreen ? '100%' : '600px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    backgroundColor: 'var(--fb-bg-color)',
    borderRadius: isFullScreen ? 0 : 'var(--fb-border-radius)',
}));

const Header = styled(Box)(({ theme }) => ({
    padding: theme.spacing(2),
    backgroundColor: 'var(--fb-header-color)',
    color: '#fff',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
}));

const MessageContainer = styled(Box)<{ isFullScreen?: boolean }>(({ theme, isFullScreen }) => ({
    flexGrow: 1,
    overflow: 'auto',
    padding: theme.spacing(2),
    backgroundColor: 'var(--fb-bg-color)',
    '& > *:not(:last-child)': {
        marginBottom: theme.spacing(1),
    },
    maxWidth: isFullScreen ? '800px' : '100%',
    margin: isFullScreen ? '0 auto' : 0,
}));

const MessageBubble = styled(Box)<{ isUser: boolean }>(({ theme, isUser }) => ({
    maxWidth: '80%',
    padding: theme.spacing(1, 2),
    borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
    backgroundColor: isUser ? 'var(--fb-primary-color)' : '#f3f4f6',
    color: isUser ? '#fff' : 'inherit',
    marginLeft: isUser ? 'auto' : 0,
    marginRight: isUser ? 0 : 'auto',
    marginBottom: theme.spacing(1),
    wordBreak: 'break-word',
}));

const InputContainer = styled(Box)(({ theme }) => ({
    padding: theme.spacing(2),
    borderTop: '1px solid #e5e7eb',
    backgroundColor: 'var(--fb-bg-color)',
}));

const validationSchema = Yup.object({
    email: Yup.string()
        .email('Enter a valid email')
        .required('Email is required'),
});

const generateId = () => {
    return window.crypto.randomUUID();
};

const ChatWindow = ({
    botId,
    apiEndpoint,
    onClose,
    onMinimize,
    isFullScreen = false,
    isEnlarged = false,
    onToggleEnlarge,
    theme = defaultTheme,
}: ChatWindowProps) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(true);
    const [email, setEmail] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const formik = useFormik({
        initialValues: {
            email: '',
        },
        validationSchema: validationSchema,
        onSubmit: async (values) => {
            try {
                const response = await fetch(`${apiEndpoint}/api/v1/visitor/session`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: values.email,
                        chatbotId: botId
                    }),
                });

                const data = await response.json();
                if (data.success) {
                    setEmail(values.email);
                    setSessionId(data.data.sessionId);
                    localStorage.setItem('visitorEmail', values.email);
                    setShowEmailModal(false);
                }
            } catch (error) {
                console.error('Error initializing session:', error);
            }
        },
    });

    useEffect(() => {
        const savedEmail = localStorage.getItem('visitorEmail');
        if (savedEmail) {
            setEmail(savedEmail);
            setShowEmailModal(false);
            // Initialize session with saved email
            initializeSession(savedEmail);
        }
    }, []);

    const initializeSession = async (userEmail: string) => {
        try {
            const response = await fetch(`${apiEndpoint}/api/v1/visitor/session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: userEmail,
                    chatbotId: botId
                }),
            });

            const data = await response.json();
            if (data.success) {
                setSessionId(data.data.sessionId);
            }
        } catch (error) {
            console.error('Error initializing session:', error);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || !sessionId) return;

        const newMessage: Message = {
            id: generateId(),
            role: 'user',
            content: inputMessage,
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, newMessage]);
        setInputMessage('');
        setIsLoading(true);

        try {
            // Save message to visitor chat history
            await fetch(`${apiEndpoint}/api/v1/visitor/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sessionId,
                    role: 'user',
                    content: newMessage.content
                }),
            });

            // Original chat processing
            const response = await fetch(`${apiEndpoint}/api/chat/${botId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: inputMessage }),
            });

            const data = await response.json();
            
            if (data.success) {
                const botMessage: Message = {
                    id: generateId(),
                    role: 'assistant',
                    content: data.message,
                    timestamp: new Date().toISOString(),
                    sources: data.sources
                };

                setMessages(prev => [...prev, botMessage]);

                // Save bot response to visitor chat history
                await fetch(`${apiEndpoint}/api/v1/visitor/message`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        sessionId,
                        role: 'assistant',
                        content: botMessage.content
                    }),
                });
            }
        } catch (error) {
            console.error('Error processing message:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    useEffect(() => {
        // Apply theme variables
        document.documentElement.style.setProperty('--fb-primary-color', theme.primaryColor);
        document.documentElement.style.setProperty('--fb-header-color', theme.headerColor);
        document.documentElement.style.setProperty('--fb-bg-color', theme.backgroundColor);
        document.documentElement.style.setProperty('--fb-border-radius', theme.borderRadius);
    }, [theme]);

    return (
        <>
            <Dialog open={showEmailModal} onClose={() => {
                if (email) setShowEmailModal(false);
            }}>
                <DialogTitle>
                    <Typography variant="h6" component="div" align="center">
                        Welcome to Chat
                    </Typography>
                </DialogTitle>
                <form onSubmit={formik.handleSubmit}>
                    <DialogContent>
                        <Box sx={{ my: 2 }}>
                            <Typography variant="body1" sx={{ mb: 2 }}>
                                Please enter your email to continue. This will help us save your chat history.
                            </Typography>
                            <TextField
                                fullWidth
                                id="email"
                                name="email"
                                label="Email Address"
                                variant="outlined"
                                value={formik.values.email}
                                onChange={formik.handleChange}
                                error={formik.touched.email && Boolean(formik.errors.email)}
                                helperText={formik.touched.email && formik.errors.email}
                                autoFocus
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 3 }}>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={!formik.isValid || formik.isSubmitting}
                        >
                            Start Chat
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            <StyledPaper isFullScreen={isFullScreen}>
                <Header>
                    <Typography variant="h6">Chat Support</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                            size="small"
                            onClick={onToggleEnlarge}
                            sx={{ color: '#fff' }}
                        >
                            {isEnlarged ? <ShrinkIcon /> : <EnlargeIcon />}
                        </IconButton>
                        <IconButton
                            size="small"
                            onClick={onClose}
                            sx={{ color: '#fff' }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </Header>
                
                <MessageContainer isFullScreen={isFullScreen}>
                    {messages.map((message) => (
                        <MessageBubble key={message.id} isUser={message.role === 'user'}>
                            <Typography>{message.content}</Typography>
                            {message.sources && (
                                <Typography variant="body2" color="textSecondary">
                                    Sources: {message.sources}
                                </Typography>
                            )}
                        </MessageBubble>
                    ))}
                    <div ref={messagesEndRef} />
                </MessageContainer>

                <InputContainer>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="Type your message..."
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={isLoading}
                            size="small"
                            multiline
                            maxRows={4}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '20px',
                                },
                            }}
                        />
                        <IconButton
                            color="primary"
                            onClick={handleSendMessage}
                            disabled={isLoading || !inputMessage.trim()}
                            sx={{
                                backgroundColor: 'var(--fb-primary-color)',
                                color: 'white',
                                '&:hover': {
                                    backgroundColor: 'var(--fb-primary-color)',
                                    opacity: 0.9,
                                },
                                '&.Mui-disabled': {
                                    backgroundColor: '#e0e0e0',
                                    color: '#9e9e9e',
                                },
                            }}
                        >
                            {isLoading ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
                        </IconButton>
                    </Box>
                </InputContainer>
            </StyledPaper>
        </>
    );
};

export default ChatWindow;
