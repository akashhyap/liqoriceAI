import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  Typography,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Container,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { styled } from '@mui/material/styles';

const validationSchema = Yup.object({
  email: Yup.string()
    .email('Enter a valid email')
    .required('Email is required'),
});

const MessageContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(2),
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

const MessageBubble = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'isUser',
})<{ isUser?: boolean }>(({ theme, isUser }) => ({
  padding: theme.spacing(2),
  maxWidth: '70%',
  alignSelf: isUser ? 'flex-end' : 'flex-start',
  backgroundColor: isUser ? theme.palette.primary.main : theme.palette.grey[100],
  color: isUser ? theme.palette.primary.contrastText : theme.palette.text.primary,
}));

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const DirectChat: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
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
        const response = await fetch('/api/v1/visitor/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: values.email,
            chatbotId: chatId
          }),
        });

        const data = await response.json();
        if (data.success) {
          setEmail(values.email);
          setSessionId(data.data.sessionId);
          localStorage.setItem('visitorEmail', values.email);
          setShowEmailModal(false);

          // Load chat history if returning user
          if (!data.data.isNewUser) {
            await loadChatHistory(values.email);
          }
        }
      } catch (error) {
        console.error('Error initializing session:', error);
      }
    },
  });

  const loadChatHistory = async (userEmail: string) => {
    try {
      const response = await fetch(`/api/v1/visitor/history?email=${userEmail}`);
      const data = await response.json();
      if (data.success && data.data.length > 0) {
        const latestSession = data.data[0];
        setSessionId(latestSession.sessionId);
        setMessages(latestSession.messages);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  useEffect(() => {
    const savedEmail = localStorage.getItem('visitorEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setShowEmailModal(false);
      loadChatHistory(savedEmail);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !sessionId) return;

    const newMessage: Message = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Save user message
      await fetch('/api/v1/visitor/message', {
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

      // Get bot response
      const response = await fetch(`/api/chat/${chatId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: inputMessage }),
      });

      const data = await response.json();
      if (data.success) {
        const botMessage: Message = {
          role: 'assistant',
          content: data.message,
          timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, botMessage]);

        // Save bot response
        await fetch('/api/v1/visitor/message', {
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

  return (
    <Container maxWidth="md" sx={{ height: '100vh', py: 2 }}>
      <Dialog 
        open={showEmailModal} 
        onClose={() => {
          if (email) setShowEmailModal(false);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h5" component="div" align="center">
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

      <Paper 
        elevation={3} 
        sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">Chat Support</Typography>
        </Box>

        <MessageContainer>
          {messages.map((message, index) => (
            <MessageBubble key={index} isUser={message.role === 'user'}>
              <Typography>{message.content}</Typography>
            </MessageBubble>
          ))}
          <div ref={messagesEndRef} />
        </MessageContainer>

        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Type your message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading || !email}
              size="small"
              multiline
              maxRows={4}
            />
            <IconButton
              color="primary"
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim() || !email}
            >
              {isLoading ? <CircularProgress size={24} /> : <SendIcon />}
            </IconButton>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default DirectChat;
