import React from 'react';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';
import { ChatMessage } from './ChatHistorySidebar';

interface ChatMessagesProps {
  messages: ChatMessage[];
  loading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages, loading, messagesEndRef }) => {
  React.useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <Box sx={{ 
      flex: 1, 
      p: 2, 
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }}>
      {messages.map((msg, index) => (
        <Paper
          key={`${msg.timestamp}-${index}`}
          elevation={1}
          sx={{
            p: 2,
            maxWidth: '80%',
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            bgcolor: msg.role === 'user' ? 'primary.light' : 'background.paper',
            color: msg.role === 'user' ? 'primary.contrastText' : 'text.primary',
            position: 'relative',
          }}
        >
          <Typography sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {msg.content}
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              position: 'absolute',
              bottom: -20,
              right: msg.role === 'user' ? 0 : 'auto',
              left: msg.role === 'assistant' ? 0 : 'auto',
              color: 'text.secondary',
              fontSize: '0.7rem'
            }}
          >
            {new Date(msg.timestamp).toLocaleTimeString()}
          </Typography>
        </Paper>
      ))}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}
      <div ref={messagesEndRef} />
    </Box>
  );
};

export default ChatMessages;
