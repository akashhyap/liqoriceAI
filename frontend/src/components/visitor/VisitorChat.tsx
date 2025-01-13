import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  IconButton,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Alert,
  Typography
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import axios from 'axios';
import ChatHistorySidebar, { ChatMessage, ChatSession } from './ChatHistorySidebar';
import ChatInput from './ChatInput';
import ChatMessages from './ChatMessages';
import EmailModal from './EmailModal';

interface VisitorChatProps {
  chatbotId: string;
  email: string;
  onEmailSubmit: (email: string) => void;
}

const VisitorChat: React.FC<VisitorChatProps> = ({ chatbotId, email, onEmailSubmit }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [showEmailModal, setShowEmailModal] = useState(true);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const apiUrl = process.env.REACT_APP_API_URL || '/api';

  useEffect(() => {
    const savedEmail = localStorage.getItem('visitorEmail');
    if (savedEmail) {
      setShowEmailModal(false);
      onEmailSubmit(savedEmail);
    }
  }, []);

  const handleStartNewChat = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(`${apiUrl}/v1/visitor/session`, {
        email,
        chatbotId
      });

      if (response.status === 200) {
        const newSession: ChatSession = {
          _id: response.data.data.sessionId,
          sessionId: response.data.data.sessionId,
          startTime: new Date().toISOString(),
          endTime: undefined,
          isActive: true,
          messages: []
        };

        setSessions(prev => [newSession, ...prev.map(session => ({
          ...session,
          isActive: false
        }))]);
        setCurrentSessionId(newSession.sessionId);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error starting new chat:', error);
      setError('Failed to start new chat');
    } finally {
      setLoading(false);
    }
  };

  const handleSessionSelect = async (selectedSessionId: string) => {
    try {
      setLoading(true);
      const selectedSession = sessions.find(session => session.sessionId === selectedSessionId);
      if (selectedSession) {
        setSessions(prev => prev.map(session => ({
          ...session,
          isActive: session.sessionId === selectedSessionId
        })));
        setCurrentSessionId(selectedSessionId);
        setMessages(selectedSession.messages);
        if (isMobile) {
          setSidebarOpen(false);
        }
      }
    } catch (error) {
      console.error('Error selecting session:', error);
      setError('Failed to select chat session');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.delete(`${apiUrl}/v1/visitor/session/${sessionId}`);

      if (response.data.success) {
        // Remove session from list
        setSessions(prev => prev.filter(session => session.sessionId !== sessionId));

        // If the deleted session was the current one, switch to the most recent session or clear messages
        if (currentSessionId === sessionId) {
          const remainingSessions = sessions.filter(session => session.sessionId !== sessionId);
          if (remainingSessions.length > 0) {
            const newCurrentSession = remainingSessions[0];
            setCurrentSessionId(newCurrentSession.sessionId);
            setMessages(newCurrentSession.messages);
          } else {
            setCurrentSessionId(null);
            setMessages([]);
          }
        }
      } else {
        setError(response.data.message || 'Failed to delete chat session');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      setError('Failed to delete chat session');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !currentSessionId) return;

    try {
      setLoading(true);
      const timestamp = new Date().toISOString();
      
      // Add user message to chat
      const userMessage: ChatMessage = {
        role: 'user',
        content: message.trim(),
        timestamp
      };
      
      setMessages(prev => [...prev, userMessage]);
      setMessage('');

      // Send message to backend
      const response = await axios.post(`${apiUrl}/v1/visitor/chat/${chatbotId}`, {
        message: userMessage.content,
        sessionId: currentSessionId
      });

      if (response.status === 200) {
        const botMessage: ChatMessage = {
          role: 'assistant',
          content: response.data.message,
          timestamp: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, botMessage]);
        
        // Update session messages
        setSessions(prev => prev.map(session => 
          session.sessionId === currentSessionId 
            ? { 
                ...session, 
                messages: [...session.messages, userMessage, botMessage]
              }
            : session
        ));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      height: '100vh',
      overflow: 'hidden',
      position: 'relative'
    }}>
      <ChatHistorySidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sessions={sessions}
        currentSessionId={currentSessionId || ''}
        onSessionSelect={handleSessionSelect}
        onNewChat={handleStartNewChat}
        onDeleteSession={handleDeleteSession}
      />

      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        height: '100%',
        ml: sidebarOpen && !isMobile ? `${240}px` : 0,
        transition: theme.transitions.create('margin', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        })
      }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          p: 2,
          borderBottom: 1,
          borderColor: 'divider'
        }}>
          <IconButton
            onClick={() => setSidebarOpen(!sidebarOpen)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6">Chat Session</Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        <ChatMessages
          messages={messages}
          loading={loading}
          messagesEndRef={messagesEndRef}
        />

        <ChatInput
          message={message}
          setMessage={setMessage}
          onSend={sendMessage}
          loading={loading}
          disabled={!currentSessionId}
        />

        <EmailModal
          open={showEmailModal}
          onSubmit={onEmailSubmit}
          onClose={() => setShowEmailModal(false)}
        />
      </Box>
    </Box>
  );
};

export default VisitorChat;
