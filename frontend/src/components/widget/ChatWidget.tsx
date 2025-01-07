import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Avatar,
  CircularProgress,
} from '@mui/material';
import {
  Send as SendIcon,
  Close as CloseIcon,
  ChatBubble as ChatIcon,
} from '@mui/icons-material';
import axios from '../../services/axios';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatWidgetProps {
  botId: string;
  config?: {
    primaryColor?: string;
    fontFamily?: string;
    borderRadius?: string;
  };
}

// Function to generate a fingerprint-based user ID
const generateUserId = () => {
  const userAgent = navigator.userAgent;
  const screenResolution = `${window.screen.width}x${window.screen.height}`;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const language = navigator.language;
  
  // Combine these values and hash them
  const fingerprint = `${userAgent}-${screenResolution}-${timezone}-${language}`;
  return btoa(fingerprint).substring(0, 32); // Base64 encode and trim
};

// Function to generate a session ID with timestamp
const generateSessionId = () => {
  return `${Date.now()}-${Math.random().toString(36).substring(7)}`;
};

export default function ChatWidget({ botId, config }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

  useEffect(() => {
    // Get or generate persistent user ID
    const storedUserId = localStorage.getItem(`chat_user_${botId}`);
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      const newUserId = generateUserId();
      localStorage.setItem(`chat_user_${botId}`, newUserId);
      setUserId(newUserId);
    }
  }, [botId]);

  useEffect(() => {
    // Handle session management
    const checkAndUpdateSession = () => {
      const currentTime = Date.now();
      const storedSessionData = localStorage.getItem(`chat_session_${botId}`);
      
      if (storedSessionData) {
        const { id, timestamp } = JSON.parse(storedSessionData);
        
        // Check if session has expired
        if (currentTime - timestamp > SESSION_TIMEOUT) {
          // Create new session if expired
          const newSessionId = generateSessionId();
          localStorage.setItem(`chat_session_${botId}`, JSON.stringify({
            id: newSessionId,
            timestamp: currentTime
          }));
          setSessionId(newSessionId);
        } else {
          setSessionId(id);
        }
      } else {
        // Create new session if none exists
        const newSessionId = generateSessionId();
        localStorage.setItem(`chat_session_${botId}`, JSON.stringify({
          id: newSessionId,
          timestamp: currentTime
        }));
        setSessionId(newSessionId);
      }
    };

    // Check session when widget opens
    if (isOpen) {
      checkAndUpdateSession();
    }
  }, [botId, isOpen]);

  // Update last activity timestamp
  useEffect(() => {
    if (isOpen) {
      const updateActivity = () => {
        setLastActivity(Date.now());
        const sessionData = localStorage.getItem(`chat_session_${botId}`);
        if (sessionData) {
          const { id } = JSON.parse(sessionData);
          localStorage.setItem(`chat_session_${botId}`, JSON.stringify({
            id,
            timestamp: Date.now()
          }));
        }
      };

      // Update activity on user interaction
      window.addEventListener('mousemove', updateActivity);
      window.addEventListener('keypress', updateActivity);

      return () => {
        window.removeEventListener('mousemove', updateActivity);
        window.removeEventListener('keypress', updateActivity);
      };
    }
  }, [isOpen, botId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await axios.post(`/api/chatbot/${botId}/chat`, {
        message: input,
        sessionId,
        userId,
        timestamp: Date.now()
      });

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.data.message,
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      setLastActivity(Date.now());
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 1000,
        fontFamily: config?.fontFamily || 'Arial, sans-serif',
      }}
    >
      {isOpen ? (
        <Paper
          elevation={3}
          sx={{
            width: 350,
            height: 500,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: config?.borderRadius || '8px',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              p: 2,
              backgroundColor: config?.primaryColor || '#007bff',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant="h6">Chat Support</Typography>
            <IconButton size="small" onClick={() => setIsOpen(false)} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Messages */}
          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            {messages.map((message) => (
              <Box
                key={message.id}
                sx={{
                  display: 'flex',
                  justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                  mb: 1,
                }}
              >
                {message.sender === 'bot' && (
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      mr: 1,
                      bgcolor: config?.primaryColor || '#007bff',
                    }}
                  >
                    B
                  </Avatar>
                )}
                <Paper
                  sx={{
                    p: 1.5,
                    maxWidth: '70%',
                    backgroundColor:
                      message.sender === 'user'
                        ? config?.primaryColor || '#007bff'
                        : 'grey.100',
                    color: message.sender === 'user' ? 'white' : 'text.primary',
                  }}
                >
                  <Typography variant="body2">{message.content}</Typography>
                </Paper>
              </Box>
            ))}
            {isTyping && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: config?.primaryColor || '#007bff',
                  }}
                >
                  B
                </Avatar>
                <CircularProgress size={20} />
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>

          {/* Input */}
          <Box sx={{ p: 2, backgroundColor: 'background.paper' }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              size="small"
              InputProps={{
                endAdornment: (
                  <IconButton onClick={handleSend} disabled={!input.trim()}>
                    <SendIcon />
                  </IconButton>
                ),
              }}
            />
          </Box>
        </Paper>
      ) : (
        <IconButton
          onClick={() => setIsOpen(true)}
          sx={{
            width: 56,
            height: 56,
            backgroundColor: config?.primaryColor || '#007bff',
            color: 'white',
            '&:hover': {
              backgroundColor: config?.primaryColor || '#007bff',
              opacity: 0.9,
            },
          }}
        >
          <ChatIcon />
        </IconButton>
      )}
    </Box>
  );
}
