import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  TextField,
  IconButton,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Avatar,
  Typography,
  Button
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import MenuIcon from '@mui/icons-material/Menu';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ChatHistorySidebar from '../components/visitor/ChatHistorySidebar';
import EmailModal from '../components/visitor/EmailModal';
import ChatMessage from '../components/visitor/ChatMessage';
import TypingIndicator from '../components/visitor/TypingIndicator';
import VoiceControls from '../components/visitor/VoiceControls';

// Use the types from ChatHistorySidebar
import type { ChatSession as IChatSession, ChatMessage as IChatMessage } from '../components/visitor/ChatHistorySidebar';

const StandaloneChatPage: React.FC = () => {
  const { chatbotId } = useParams<{ chatbotId: string }>();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [sessions, setSessions] = useState<IChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<IChatSession | null>(null);
  const [email, setEmail] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [lastAiMessage, setLastAiMessage] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Get API URL from environment or window location
  const getApiUrl = () => {
    // For production deployment
    if (window.location.hostname === 'liqoriceai-frontend.onrender.com') {
      return 'https://liqoriceai-backend.onrender.com/api';
    }
    
    // For local development
    if (process.env.REACT_APP_API_URL) {
      return process.env.REACT_APP_API_URL.replace(/\/+$/, '');
    }
    
    // Fallback for local development
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = hostname === 'localhost' ? ':5000' : '';
    return `${protocol}//${hostname}${port}/api`;
  };

  const apiUrl = getApiUrl();

  useEffect(() => {
    console.log('Current API URL:', apiUrl); // Debug log
  }, [apiUrl]);

  // Add error boundary for fetch calls
  const fetchWithErrorHandling = async (url: string, options: RequestInit = {}) => {
    try {
      console.log('Fetching URL:', url); // Debug log
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        credentials: 'include', // Add this to handle cookies if needed
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText); // Debug log
        try {
          // Try to parse as JSON
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || `HTTP error! status: ${response.status}`);
        } catch (e) {
          // If not JSON, use text
          throw new Error(`HTTP error! status: ${response.status}. ${errorText}`);
        }
      }

      const data = await response.json();
      console.log('API Response:', data); // Debug log
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };

  useEffect(() => {
    // Check if chatbotId is available
    if (!chatbotId) {
      setError('Invalid chatbot ID');
      return;
    }

    // Check for saved email
    const savedEmail = localStorage.getItem('visitorEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setShowEmailModal(false);
      setIsFirstVisit(false);
      handleEmailSubmit(savedEmail); // Initialize session with saved email
    }
  }, [chatbotId]);

  const handleEmailSubmit = async (submittedEmail: string) => {
    try {
      setLoading(true);
      setError(null);

      // First, try to get existing sessions
      const historyResponse = await fetchWithErrorHandling(
        `${apiUrl}/v1/visitor/history?email=${encodeURIComponent(submittedEmail)}`
      );

      // Initialize new session
      const sessionResponse = await fetchWithErrorHandling(`${apiUrl}/v1/visitor/session`, {
        method: 'POST',
        body: JSON.stringify({
          email: submittedEmail,
          chatbotId
        })
      });

      if (sessionResponse.success) {
        setEmail(submittedEmail);
        localStorage.setItem('visitorEmail', submittedEmail);
        
        const newSession = {
          _id: sessionResponse.data.sessionId,
          sessionId: sessionResponse.data.sessionId,
          startTime: new Date().toISOString(),
          endTime: undefined,
          isActive: true,
          messages: []
        };

        // If we have history, add the new session to it
        if (historyResponse.success && historyResponse.data.length > 0) {
          const existingSessions = historyResponse.data.map((session: any) => ({
            _id: session.sessionId,
            sessionId: session.sessionId,
            startTime: session.startTime,
            endTime: session.endTime || session.startTime,
            isActive: false,
            messages: (session.messages || []).map((msg: any) => ({
              role: msg.role as 'user' | 'assistant',
              content: msg.content,
              timestamp: msg.timestamp || session.startTime
            }))
          }));
          setSessions([newSession, ...existingSessions]);
        } else {
          setSessions([newSession]);
        }

        setCurrentSession(newSession);
        setMessages([]);
        setShowEmailModal(false);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error initializing session:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize chat session');
    } finally {
      setLoading(false);
    }
  };

  const loadChatHistory = async () => {
    try {
      if (!email) return;
      
      const data = await fetchWithErrorHandling(
        `${apiUrl}/v1/visitor/history?email=${encodeURIComponent(email)}`
      );
      
      if (data.success) {
        // Transform sessions to match our interface and filter out empty sessions
        const transformedSessions = data.data
          .map((session: any) => {
            // Ensure messages array exists and has proper format
            const messages = session.messages || [];
            
            return {
              _id: session.sessionId,
              sessionId: session.sessionId,
              startTime: session.startTime,
              endTime: session.endTime || session.startTime,
              isActive: session.isActive,
              messages: messages.map((msg: any) => ({
                role: msg.role as 'user' | 'assistant',
                content: msg.content,
                timestamp: msg.timestamp || session.startTime
              }))
            };
          })
          .filter((session: IChatSession) => session.messages.length > 0); // Filter out empty sessions
        
        console.log('Transformed sessions:', transformedSessions); // Debug log
        
        setSessions(transformedSessions);
        
        // Set current session to the most recent active session or create new one
        const activeSession = transformedSessions.find((s: IChatSession) => s.isActive) || transformedSessions[0];
        if (activeSession) {
          setCurrentSession(activeSession);
          setMessages(activeSession.messages);
        }
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      setError(error instanceof Error ? error.message : 'Failed to load chat history');
    }
  };

  const initializeSession = async () => {
    try {
      if (!email || !chatbotId) return;

      const response = await fetchWithErrorHandling(`${apiUrl}/v1/visitor/session`, {
        method: 'POST',
        body: JSON.stringify({
          email,
          chatbotId
        })
      });

      if (response.success) {
        setIsAuthenticated(true);
        // Load chat history after initializing session
        await loadChatHistory();
      }
    } catch (error) {
      console.error('Error initializing session:', error);
      setError('Failed to initialize chat session');
    }
  };

  const sendMessage = async (message: string) => {
    if (!message.trim() || !currentSession) return;

    const userMessage: IChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsTyping(true);
    setStreamingMessage('');

    try {
      const isGreeting = /^(hi|hello|hey|greetings|howdy|hi there)$/i.test(message.trim());

      const response = await fetch(`${apiUrl}/v1/visitor/chat/${chatbotId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          sessionId: currentSession._id,
          email,
          useKnowledgeBase: true,
          formatResponse: true,
          responseStyle: {
            tone: isGreeting ? 'friendly' : 'professional',
            format: isGreeting ? 'text' : 'markdown',
            structure: isGreeting ? 'simple' : 'organized',
            detailLevel: isGreeting ? 'minimal' : 'comprehensive',
            includeIntroduction: !isGreeting,
            includeSummary: !isGreeting,
            formatVersion: 2,
            responseLength: isGreeting ? 'brief' : 'detailed',
            linkStyle: {
              calendly: 'text',
              phone: 'formatted',
              email: 'formatted',
              url: 'direct'
            },
            listStyle: {
              numbered: true,
              detailed: true,
              groupByCategory: true,
              includeDescriptions: true
            },
            contentPreferences: {
              includeExamples: true,
              includeDetails: true,
              minimumParagraphLength: isGreeting ? 0 : 100,
              minimumSectionsCount: isGreeting ? 1 : 3,
              expandedInformation: !isGreeting
            }
          },
          conversationContext: {
            previousMessages: messages.slice(-5),
            currentIntent: isGreeting ? 'greeting' : 'detailed_response',
            requireStructuredResponse: !isGreeting,
            preserveFormatting: !isGreeting,
            requireDetailedResponse: !isGreeting,
            minimumResponseLength: isGreeting ? 50 : 300,
            contextRetention: {
              keepPreviousContext: true,
              contextDepth: 5
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

      let accumulatedMessage = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = new TextDecoder().decode(value);
        accumulatedMessage += chunk;
        setStreamingMessage(accumulatedMessage);
      }

      const botMessage: IChatMessage = {
        role: 'assistant',
        content: accumulatedMessage,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, botMessage]);
      setLastAiMessage('');
      setTimeout(() => {
        setLastAiMessage(accumulatedMessage);
      }, 100);

      setSessions(prev => prev.map(session =>
        session._id === currentSession._id
          ? {
              ...session,
              messages: [...session.messages, userMessage, botMessage]
            }
          : session
      ));
    } catch (error) {
      console.error('Error in sendMessage:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsTyping(false);
      setStreamingMessage('');
    }
  };

  const handleSessionSelect = (selectedSessionId: string) => {
    try {
      setLoading(true);
      const selectedSession = sessions.find(session => session.sessionId === selectedSessionId);
      if (selectedSession) {
        // Update sessions to reflect the new active state
        setSessions(prev => prev.map(session => ({
          ...session,
          isActive: session.sessionId === selectedSessionId
        })));

        // Update current session and messages
        setCurrentSession(selectedSession);
        setMessages(selectedSession.messages);
        
        // Close mobile drawer if needed
        if (isMobile) {
          setIsDrawerOpen(false);
        }
      }
    } catch (error) {
      console.error('Error switching session:', error);
      setError('Failed to switch chat session');
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create new session
      const response = await fetchWithErrorHandling(`${apiUrl}/v1/visitor/session`, {
        method: 'POST',
        body: JSON.stringify({
          email,
          chatbotId
        })
      });

      if (response.success) {
        const newSession = {
          _id: response.data.sessionId,
          sessionId: response.data.sessionId,
          startTime: new Date().toISOString(),
          endTime: undefined,
          isActive: true,
          messages: []
        };

        // Update sessions list with the new session
        setSessions(prev => [newSession, ...prev.map(s => ({ ...s, isActive: false }))]);
        
        // Set current session to the new one
        setCurrentSession(newSession);
        setMessages([]);
        
        // Close mobile drawer if needed
        if (isMobile) {
          setIsDrawerOpen(false);
        }
      }
    } catch (error) {
      console.error('Error creating new chat:', error);
      setError('Failed to create new chat session');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchWithErrorHandling(
        `${apiUrl}/v1/visitor/session/${sessionId}`,
        { method: 'DELETE' }
      );

      if (response.success) {
        // Remove session from list
        setSessions(prev => prev.filter(session => session.sessionId !== sessionId));

        // If the deleted session was the current one, switch to the most recent session or clear messages
        if (currentSession?.sessionId === sessionId) {
          const remainingSessions = sessions.filter(session => session.sessionId !== sessionId);
          if (remainingSessions.length > 0) {
            const newCurrentSession = remainingSessions[0];
            setCurrentSession(newCurrentSession);
            setMessages(newCurrentSession.messages);
          } else {
            setCurrentSession(null);
            setMessages([]);
          }
        }
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      setError('Failed to delete chat session');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(message);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('visitorEmail');
    setEmail('');
    setIsAuthenticated(false);
    setShowEmailModal(true);
    setIsFirstVisit(true);
    setSessions([]);
    setMessages([]);
  };

  const handleSignIn = () => {
    setShowEmailModal(true);
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <EmailModal 
        open={showEmailModal && (isFirstVisit || !isAuthenticated)}
        onClose={() => {
          if (!email || !isAuthenticated) {
            return;
          }
          setShowEmailModal(false);
        }}
        onSubmit={handleEmailSubmit}
      />
      
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 1000,
        }}
      >
        {isAuthenticated ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {email}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={handleSignOut}
              sx={{ ml: 1 }}
            >
              Sign Out
            </Button>
          </Box>
        ) : (
          <Button
            variant="contained"
            size="small"
            onClick={handleSignIn}
          >
            Sign In
          </Button>
        )}
      </Box>

      <ChatHistorySidebar
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        sessions={sessions}
        currentSessionId={currentSession?._id || ''}
        onSessionSelect={handleSessionSelect}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
      />
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.default'
        }}
      >
        <Box sx={{ 
          p: 2, 
          display: 'flex', 
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper'
        }}>
          {isMobile && (
            <IconButton 
              edge="start" 
              onClick={() => setIsDrawerOpen(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" noWrap>
            Chat Session
          </Typography>
        </Box>

        <Box sx={{ 
          flex: 1,
          p: 2,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {messages.length === 0 ? (
            <Box sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.secondary',
              gap: 2
            }}>
              <ChatBubbleOutlineIcon sx={{ fontSize: 48, opacity: 0.5 }} />
              <Typography variant="h6">
                No messages yet
              </Typography>
              <Typography variant="body2">
                Start a conversation by typing a message below
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {messages.map((msg, index) => (
                <ChatMessage
                  key={`${msg.timestamp}-${index}`}
                  role={msg.role}
                  content={msg.content}
                  timestamp={msg.timestamp}
                />
              ))}
              {streamingMessage && (
                <ChatMessage
                  role="assistant"
                  content={streamingMessage}
                  timestamp={new Date().toISOString()}
                />
              )}
              {isTyping && !streamingMessage && <TypingIndicator />}
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Box>

        <Box
          component="form"
          onSubmit={(e) => e.preventDefault()}
          sx={{
            p: 2,
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper'
          }}
        >
          <Box sx={{ 
            display: 'flex',
            gap: 1,
            alignItems: 'center',
            p: 2
          }}>
            <TextField
              fullWidth
              multiline
              minRows={1}
              maxRows={4}
              name="message"
              placeholder="Type a message... (Press Enter to send, Shift+Enter for new line)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (message.trim() && !loading) {
                    sendMessage(message);
                  }
                }
              }}
              disabled={loading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  '& textarea': {
                    resize: 'none',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'break-word'
                  }
                }
              }}
            />
            <VoiceControls
              onVoiceInput={setMessage}
              textToSpeak={lastAiMessage}
              disabled={loading}
            />
            <IconButton 
              color="primary"
              onClick={() => {
                if (message.trim() && !loading) {
                  sendMessage(message);
                }
              }}
              disabled={!message.trim() || loading}
            >
              {loading ? <CircularProgress size={24} /> : <SendIcon />}
            </IconButton>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default StandaloneChatPage;
