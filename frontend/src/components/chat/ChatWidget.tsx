import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Paper,
    TextField,
    IconButton,
    Typography,
    Avatar,
    CircularProgress
} from '@mui/material';
import { Send as SendIcon, Close as CloseIcon } from '@mui/icons-material';
import { io, Socket } from 'socket.io-client';
import { Message } from '../../types';
import FeedbackDialog from './FeedbackDialog';
import axios from 'axios';

interface ChatWidgetProps {
    botId: string;
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    theme?: {
        primaryColor: string;
        fontFamily: string;
    };
}

const ChatWidget: React.FC<ChatWidgetProps> = ({
    botId,
    position = 'bottom-right',
    theme = {
        primaryColor: '#007bff',
        fontFamily: 'Arial, sans-serif'
    }
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [sessionId, setSessionId] = useState<string>('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const socketRef = useRef<Socket>();
    const inactivityTimerRef = useRef<NodeJS.Timeout>();

    // Reset inactivity timer when new messages are sent/received
    const resetInactivityTimer = () => {
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
        }
        inactivityTimerRef.current = setTimeout(() => {
            if (messages.length > 0) {
                setShowFeedback(true);
            }
        }, 60000); // Show feedback after 1 minute of inactivity
    };

    useEffect(() => {
        socketRef.current = io(process.env.REACT_APP_WS_URL || 'ws://localhost:5000', {
            query: { botId }
        });

        socketRef.current.on('connect', () => {
            // Get or create session ID
            setSessionId(socketRef.current?.id || '');
        });

        socketRef.current.on('message', (message: Message) => {
            setMessages(prev => [...prev, message]);
            setIsTyping(false);
            resetInactivityTimer();
        });

        socketRef.current.on('typing', () => {
            setIsTyping(true);
        });

        return () => {
            if (inactivityTimerRef.current) {
                clearTimeout(inactivityTimerRef.current);
            }
            socketRef.current?.disconnect();
        };
    }, [botId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmitFeedback = async (rating: number) => {
        try {
            await axios.patch(`/chatbot/${botId}/history/${sessionId}`, {
                userSatisfactionScore: (rating * 20) // Convert 1-5 rating to 0-100 score
            });
        } catch (error) {
            console.error('Error submitting feedback:', error);
        }
    };

    const handleSend = () => {
        if (!message.trim()) return;

        const newMessage: Partial<Message> = {
            content: message,
            role: 'user',
            chatbotId: botId,
            timestamp: new Date().toISOString()
        };

        socketRef.current?.emit('message', newMessage);
        setMessages(prev => [...prev, newMessage as Message]);
        setMessage('');
        resetInactivityTimer();
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleClose = () => {
        if (messages.length > 0) {
            setShowFeedback(true);
        }
        setIsOpen(false);
    };

    const positionStyles = {
        'bottom-right': { bottom: 20, right: 20 },
        'bottom-left': { bottom: 20, left: 20 },
        'top-right': { top: 20, right: 20 },
        'top-left': { top: 20, left: 20 }
    };

    return (
        <>
            <Box
                sx={{
                    position: 'fixed',
                    ...positionStyles[position],
                    zIndex: 1000,
                    fontFamily: theme.fontFamily
                }}
            >
                {isOpen ? (
                    <Paper
                        elevation={3}
                        sx={{
                            width: 350,
                            height: 500,
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        <Box
                            sx={{
                                p: 2,
                                bgcolor: theme.primaryColor,
                                color: 'white',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}
                        >
                            <Typography variant="h6">Chat Support</Typography>
                            <IconButton
                                size="small"
                                onClick={handleClose}
                                sx={{ color: 'white' }}
                            >
                                <CloseIcon />
                            </IconButton>
                        </Box>

                        <Box
                            sx={{
                                flex: 1,
                                overflowY: 'auto',
                                p: 2,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1
                            }}
                        >
                            {messages.map((msg, index) => (
                                <Box
                                    key={index}
                                    sx={{
                                        display: 'flex',
                                        justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                        mb: 1
                                    }}
                                >
                                    {msg.role === 'assistant' && (
                                        <Avatar
                                            sx={{
                                                bgcolor: theme.primaryColor,
                                                width: 32,
                                                height: 32,
                                                mr: 1
                                            }}
                                        />
                                    )}
                                    <Paper
                                        sx={{
                                            p: 1,
                                            maxWidth: '70%',
                                            bgcolor: msg.role === 'user' ? theme.primaryColor : 'grey.100',
                                            color: msg.role === 'user' ? 'white' : 'text.primary'
                                        }}
                                    >
                                        <Typography variant="body2">{msg.content}</Typography>
                                    </Paper>
                                </Box>
                            ))}
                            {isTyping && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CircularProgress size={16} />
                                    <Typography variant="body2">Bot is typing...</Typography>
                                </Box>
                            )}
                            <div ref={messagesEndRef} />
                        </Box>

                        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                            <TextField
                                fullWidth
                                variant="outlined"
                                placeholder="Type a message..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                InputProps={{
                                    endAdornment: (
                                        <IconButton onClick={handleSend} color="primary">
                                            <SendIcon />
                                        </IconButton>
                                    )
                                }}
                            />
                        </Box>
                    </Paper>
                ) : (
                    <IconButton
                        onClick={() => setIsOpen(true)}
                        sx={{
                            width: 60,
                            height: 60,
                            bgcolor: theme.primaryColor,
                            color: 'white',
                            '&:hover': {
                                bgcolor: theme.primaryColor
                            }
                        }}
                    >
                        <Typography variant="h5">💬</Typography>
                    </IconButton>
                )}
            </Box>
            <FeedbackDialog
                open={showFeedback}
                onClose={() => setShowFeedback(false)}
                onSubmit={handleSubmitFeedback}
                sessionId={sessionId}
            />
        </>
    );
};

export default ChatWidget;
