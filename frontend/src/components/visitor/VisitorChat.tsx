import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, IconButton, useTheme } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface VisitorChatProps {
  chatbotId: string;
  sessionId: string;
  apiUrl: string;
}

const VisitorChat: React.FC<VisitorChatProps> = ({ chatbotId, sessionId, apiUrl }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);
    setStreamingMessage('');

    try {
      const response = await fetch(`${apiUrl}/chat/${chatbotId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          sessionId
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

      const botMessage: Message = {
        role: 'assistant',
        content: accumulatedMessage,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      // Handle error appropriately
    } finally {
      setIsTyping(false);
      setStreamingMessage('');
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: 'grey.50' }}>
        {messages.map((message, index) => (
          <ChatMessage
            key={index}
            role={message.role}
            content={message.content}
            timestamp={message.timestamp}
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
        <div ref={messagesEndRef} />
      </Box>
      <Box sx={{ p: 2, bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider' }}>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message... (Shift + Enter for new line)"
          variant="outlined"
          size="small"
          InputProps={{
            endAdornment: (
              <IconButton 
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                color="primary"
              >
                <SendIcon />
              </IconButton>
            ),
            sx: {
              bgcolor: 'background.paper',
              '&:hover': {
                bgcolor: 'background.paper'
              }
            }
          }}
        />
      </Box>
    </Box>
  );
};

export default VisitorChat;
