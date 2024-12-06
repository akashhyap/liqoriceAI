import React, { useState, useRef, useEffect } from 'react';
import { Box, Paper, Typography, TextField, IconButton, CircularProgress } from '@mui/material';
import { Send as SendIcon, Close as CloseIcon, Minimize as MinimizeIcon, OpenInFull as EnlargeIcon, CloseFullscreen as ShrinkIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

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

const generateId = () => {
    return window.crypto.randomUUID();
};

const ChatWindow: React.FC<ChatWindowProps> = ({
    botId,
    apiEndpoint,
    onClose,
    onMinimize,
    isFullScreen = false,
    isEnlarged = false,
    onToggleEnlarge,
    theme = defaultTheme,
}) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Apply theme variables
        document.documentElement.style.setProperty('--fb-primary-color', theme.primaryColor);
        document.documentElement.style.setProperty('--fb-header-color', theme.headerColor);
        document.documentElement.style.setProperty('--fb-bg-color', theme.backgroundColor);
        document.documentElement.style.setProperty('--fb-border-radius', theme.borderRadius);
    }, [theme]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (content: string) => {
        if (!content.trim()) return;

        setIsLoading(true);
        setError(null);

        // Add user message
        const userMessage: Message = {
            id: generateId(),
            role: 'user',
            content,
            timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, userMessage]);

        try {
            // Create EventSource for streaming
            const eventSource = new EventSource(
                `${apiEndpoint}/chat/stream?botId=${botId}&question=${encodeURIComponent(
                    content
                )}`
            );

            let assistantMessage = '';

            eventSource.onmessage = (event) => {
                const data = JSON.parse(event.data);

                if (data.error) {
                    setError(data.error);
                    eventSource.close();
                    return;
                }

                if (data.done) {
                    // Final message with sources
                    setMessages(prev => [
                        ...prev.slice(0, -1),
                        {
                            id: generateId(),
                            role: 'assistant',
                            content: assistantMessage,
                            timestamp: new Date().toISOString(),
                            sources: data.sources,
                        },
                    ]);
                    eventSource.close();
                    return;
                }

                // Accumulate tokens
                assistantMessage += data.token;
                
                // Update the message in real-time
                setMessages(prev => [
                    ...prev.slice(0, -1),
                    {
                        id: generateId(),
                        role: 'assistant',
                        content: assistantMessage,
                        timestamp: new Date().toISOString(),
                    },
                ]);
            };

            eventSource.onerror = (error) => {
                console.error('EventSource error:', error);
                setError('Connection error. Please try again.');
                eventSource.close();
            };
        } catch (err: any) {
            setError(err.message || 'An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(input);
            setInput('');
        }
    };

    return (
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
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
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
                        onClick={() => handleSendMessage(input)}
                        disabled={isLoading || !input.trim()}
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
                {error && (
                    <Typography variant="body2" color="error">
                        {error}
                    </Typography>
                )}
            </InputContainer>
        </StyledPaper>
    );
};

export default ChatWindow;
