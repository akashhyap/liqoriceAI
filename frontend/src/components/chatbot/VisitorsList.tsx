import React, { useEffect, useState } from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Box,
  CircularProgress,
  Paper
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import { formatDistanceToNow } from 'date-fns';
import { apiUrl } from '../../config/constants';

interface Visitor {
  _id: string;
  email: string;
  lastLoginAt: string;
  totalSessions?: number;
  metadata?: Record<string, any>;
}

interface VisitorsListProps {
  chatbotId: string;
  onVisitorSelect: (id: string, email: string) => void;
}

const VisitorsList: React.FC<VisitorsListProps> = ({ chatbotId, onVisitorSelect }) => {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVisitors = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${apiUrl}/api/v1/visitor/list/${chatbotId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch visitors');
        }
        const data = await response.json();
        console.log('Visitors data:', data);
        setVisitors(data.data || []);
      } catch (err) {
        console.error('Error fetching visitors:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch visitors');
      } finally {
        setLoading(false);
      }
    };

    if (chatbotId) {
      fetchVisitors();
    }
  }, [chatbotId]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3} textAlign="center">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!visitors.length) {
    return (
      <Paper sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          No visitors yet
        </Typography>
        <Typography color="textSecondary">
          When people chat with your bot, they'll appear here
        </Typography>
      </Paper>
    );
  }

  return (
    <List>
      {visitors.map((visitor) => (
        <ListItem
          key={visitor._id}
          sx={{
            mb: 1,
            bgcolor: 'background.paper',
            borderRadius: 1,
            cursor: 'pointer',
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
          onClick={() => onVisitorSelect(visitor._id, visitor.email)}
        >
          <ListItemText
            primary={visitor.email}
            secondary={
              <>
                Last active: {formatDistanceToNow(new Date(visitor.lastLoginAt), { addSuffix: true })}
                {visitor.totalSessions && (
                  <> · {visitor.totalSessions} session{visitor.totalSessions !== 1 ? 's' : ''}</>
                )}
              </>
            }
          />
          <ListItemSecondaryAction>
            <IconButton 
              edge="end" 
              sx={{ color: 'primary.main' }}
            >
              <ChatIcon />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
      ))}
    </List>
  );
};

export default VisitorsList;
