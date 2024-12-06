import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Box, 
  TextField, 
  Button, 
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';

const StandaloneChatPage: React.FC = () => {
  const { chatbotId } = useParams<{ chatbotId: string }>();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean }>>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { text: message, isUser: true }]);
    const userMessage = message;
    setMessage('');

    try {
      const response = await fetch(`${apiUrl}/chat/${chatbotId?.replace('$', '')}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setMessages(prev => [...prev, { text: data.message, isUser: false }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [{ 
        text: 'Sorry, I encountered an error. Please try again later.', 
        isUser: false 
      }]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const drawer = (
    <Box sx={{ width: 250 }}>
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between'
      }}>
        <Typography variant="h6">Chat History</Typography>
        {isMobile && (
          <IconButton onClick={() => setIsDrawerOpen(false)}>
            <CloseIcon />
          </IconButton>
        )}
      </Box>
      <List>
        <ListItem>
          <ListItemText 
            primary="New Chat" 
            secondary={new Date().toLocaleDateString()} 
          />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ 
      height: '100vh',
      display: 'flex',
      backgroundColor: theme.palette.mode === 'dark' ? '#343541' : '#ffffff'
    }}>
      {/* Sidebar */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: 250,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 250,
              boxSizing: 'border-box',
              backgroundColor: theme.palette.mode === 'dark' ? '#202123' : '#f7f7f8',
            },
          }}
        >
          {drawer}
        </Drawer>
      )}

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            width: 250,
            backgroundColor: theme.palette.mode === 'dark' ? '#202123' : '#f7f7f8',
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Main Chat Area */}
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        height: '100vh',
        position: 'relative'
      }}>
        {/* Mobile Header */}
        {isMobile && (
          <Box sx={{ 
            p: 1, 
            borderBottom: 1, 
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center'
          }}>
            <IconButton onClick={() => setIsDrawerOpen(true)}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ ml: 2 }}>Chat</Typography>
          </Box>
        )}

        {/* Messages */}
        <Box sx={{ 
          flex: 1, 
          overflowY: 'auto',
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 3
        }}>
          {messages.map((msg, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 2,
                backgroundColor: 'transparent',
                py: msg.isUser ? 0 : 4,
                px: { xs: 2, sm: 4, md: 8, lg: 12 },
                borderBottom: 'none',
                justifyContent: msg.isUser ? 'flex-end' : 'flex-start',
                maxWidth: '100%'
              }}
            >
              {!msg.isUser && (
                <Box
                  sx={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    backgroundColor: '#19C37D',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    flexShrink: 0
                  }}
                >
                  <SmartToyIcon />
                </Box>
              )}
              <Typography
                sx={{
                  maxWidth: '70%',
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'break-word',
                  fontSize: '1rem',
                  lineHeight: 1.7,
                  backgroundColor: msg.isUser ? (theme.palette.mode === 'dark' ? '#40414F' : '#f0f0f0') : 'transparent',
                  padding: msg.isUser ? '9px 25px' : 0,
                  borderRadius: msg.isUser ? '20px' : 0,
                }}
              >
                {msg.text}
              </Typography>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Box>

        {/* Input Area */}
        <Box sx={{ 
          p: { xs: 2, sm: 3 },
          backgroundColor: 'transparent',
          position: 'relative'
        }}>
          <Box sx={{ 
            maxWidth: '800px', 
            margin: '0 auto',
            position: 'relative',
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 0 15px rgba(0,0,0,0.2)' 
              : '0 0 15px rgba(0,0,0,0.1)',
            borderRadius: '12px',
          }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: theme.palette.mode === 'dark' ? '#40414F' : '#ffffff',
                  borderRadius: '12px',
                  pr: 5,
                  '& fieldset': {
                    border: 'none'
                  },
                  '&:hover fieldset': {
                    border: 'none'
                  },
                  '&.Mui-focused fieldset': {
                    border: 'none'
                  }
                }
              }}
            />
            <IconButton
              onClick={sendMessage}
              disabled={!message.trim()}
              sx={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                color: message.trim() ? 'primary.main' : 'text.disabled'
              }}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default StandaloneChatPage;
