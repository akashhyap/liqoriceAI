import React from 'react';
import { Box, TextField, IconButton, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

interface ChatInputProps {
  message: string;
  setMessage: (message: string) => void;
  onSend: () => void;
  loading: boolean;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  message, 
  setMessage, 
  onSend, 
  loading,
  disabled = false 
}) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (message.trim() && !loading && !disabled) {
        onSend();
      }
    }
  };

  return (
    <Box sx={{ 
      p: 2, 
      borderTop: 1, 
      borderColor: 'divider',
      bgcolor: 'background.paper'
    }}>
      <Box sx={{ 
        display: 'flex', 
        gap: 1,
        alignItems: 'center' 
      }}>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          disabled={loading || disabled}
          sx={{ 
            flex: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            }
          }}
        />
        <IconButton 
          color="primary" 
          onClick={onSend}
          disabled={!message.trim() || loading || disabled}
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            '&:hover': {
              bgcolor: 'primary.dark',
            },
            '&.Mui-disabled': {
              bgcolor: 'action.disabledBackground',
              color: 'action.disabled',
            }
          }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
        </IconButton>
      </Box>
    </Box>
  );
};

export default ChatInput;
