import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  IconButton,
  Stack,
  Card,
  Chip,
  Drawer,
} from '@mui/material';
import { format } from 'date-fns';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import { apiUrl, DATE_FORMATS } from '../../config/constants';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface Session {
  sessionId: string;
  startTime: string;
  endTime?: string;
  isActive: boolean;
  messages: Message[];
}

interface VisitorChatHistoryProps {
  visitorId: string;
  visitorEmail: string;
  onBack: () => void;
}

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.role === 'user';
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        mb: 2,
      }}
    >
      <Box
        sx={{
          maxWidth: '70%',
          bgcolor: isUser ? 'primary.main' : 'grey.100',
          color: isUser ? 'white' : 'text.primary',
          p: 2,
          borderRadius: 2,
          position: 'relative',
        }}
      >
        <Typography sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {message.content}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mt: 1,
            opacity: 0.8,
            color: isUser ? 'inherit' : 'text.secondary',
          }}
        >
          {format(new Date(message.timestamp), DATE_FORMATS.TIME)}
        </Typography>
      </Box>
    </Box>
  );
};

const SessionChatView: React.FC<{
  session: Session;
  onClose: () => void;
}> = ({ session, onClose }) => {
  const hasMessages = session.messages && session.messages.length > 0;

  // Safely parse and format the date
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return format(date, DATE_FORMATS.FULL);
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box 
        sx={{ 
          p: 2, 
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box>
          <Typography variant="subtitle1" fontWeight={500}>
            Chat Session
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formatDate(session.startTime)}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ p: 3, flexGrow: 1, bgcolor: theme => theme.palette.grey[50], overflowY: 'auto' }}>
        {hasMessages ? (
          session.messages.map((message, index) => (
            <MessageBubble key={index} message={message} />
          ))
        ) : (
          <Box 
            display="flex" 
            alignItems="center" 
            justifyContent="center" 
            height="100%"
          >
            <Typography color="text.secondary">
              No messages in this session
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

const SessionCard: React.FC<{
  session: Session;
  onClick: () => void;
}> = ({ session, onClick }) => {
  const hasMessages = session.messages && session.messages.length > 0;
  
  // Safely parse and format the date
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'No date';
    
    try {
      const date = new Date(dateStr);
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateStr);
        return 'Invalid date';
      }
      return format(date, DATE_FORMATS.FULL);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  return (
    <Card 
      onClick={onClick}
      sx={{ 
        mb: 2,
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: theme => `0 2px 4px ${theme.palette.divider}`,
        cursor: 'pointer',
        '&:hover': { 
          bgcolor: 'action.hover',
          transition: 'background-color 0.2s'
        },
      }}
    >
      <Box sx={{ p: 2.5 }}>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <Typography variant="subtitle1" color="text.primary" fontWeight={500}>
            {formatDate(session.startTime)}
          </Typography>
          <Chip 
            label={session.isActive ? "Active" : "Ended"}
            size="small"
            color={session.isActive ? "primary" : "default"}
            sx={{ height: 24 }}
          />
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <ChatIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {hasMessages ? `${session.messages.length} messages` : 'No messages'}
          </Typography>
        </Box>
      </Box>
    </Card>
  );
};

const VisitorChatHistory: React.FC<VisitorChatHistoryProps> = ({
  visitorId,
  visitorEmail,
  onBack,
}) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${apiUrl}/api/v1/visitor/history/${visitorId}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Chat history data:', data);
        
        if (data.success && Array.isArray(data.data)) {
          setSessions(data.data);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error('Error fetching chat history:', err);
        setError(err instanceof Error ? err.message : 'Error loading chat history');
      } finally {
        setLoading(false);
      }
    };

    if (visitorId) {
      fetchChatHistory();
    }
  }, [visitorId]);

  return (
    <Box sx={{ maxWidth: '800px', mx: 'auto', pt: 2, px: 3 }}>
      <Box 
        sx={{ 
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 3,
          cursor: 'pointer',
          color: 'primary.main',
          '&:hover': {
            color: 'primary.dark',
          }
        }}
        onClick={onBack}
      >
        <ArrowBackIcon sx={{ fontSize: 20 }} />
        <Typography 
          variant="body2" 
          sx={{ 
            color: 'primary.main',
            '&:hover': {
              color: 'primary.dark',
            }
          }}
        >
          Back to Visitors List
        </Typography>
      </Box>

      <Typography variant="h5" sx={{ mb: 4, fontWeight: 500 }}>
        Chat History - {visitorEmail}
      </Typography>

      {loading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Paper 
          sx={{ 
            p: 3, 
            bgcolor: 'error.light', 
            color: 'error.contrastText',
            borderRadius: 2
          }}
        >
          <Typography>{error}</Typography>
        </Paper>
      ) : sessions.length === 0 ? (
        <Paper 
          sx={{ 
            p: 4, 
            textAlign: 'center',
            borderRadius: 2,
            bgcolor: theme => theme.palette.grey[50]
          }}
        >
          <Typography variant="h6" gutterBottom fontWeight={500}>
            No Chat History
          </Typography>
          <Typography color="text.secondary">
            This visitor hasn't had any conversations yet.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {sessions.map((session) => (
            <SessionCard
              key={session.sessionId}
              session={session}
              onClick={() => setSelectedSession(session)}
            />
          ))}
        </Stack>
      )}

      <Drawer
        anchor="right"
        open={selectedSession !== null}
        onClose={() => setSelectedSession(null)}
        PaperProps={{
          sx: { 
            width: '100%',
            maxWidth: '600px',
            bgcolor: 'background.paper'
          }
        }}
      >
        {selectedSession && (
          <SessionChatView 
            session={selectedSession}
            onClose={() => setSelectedSession(null)}
          />
        )}
      </Drawer>
    </Box>
  );
};

export default VisitorChatHistory;
