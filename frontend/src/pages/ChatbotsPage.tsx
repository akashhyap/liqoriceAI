import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Grid,
  Typography,
  Alert,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  Chip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import ChatIcon from '@mui/icons-material/Chat';
import SettingsIcon from '@mui/icons-material/Settings';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import SchoolIcon from '@mui/icons-material/School';
import axios from 'axios';

interface Chatbot {
  _id: string;
  name: string;
  description: string;
  deployment?: {
    status: string;
  };
}

interface ChatbotStats {
  totalConversations: number;
  activeUsers: number;
}

const ChatbotCard: React.FC<{ chatbot: Chatbot }> = ({ chatbot }) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    navigate(`/app/chatbot/${chatbot._id}/settings`);
    handleClose();
  };

  const handleTrain = () => {
    // Add training logic here
    handleClose();
  };

  return (
    <Card sx={{
      height: '100%', display: 'flex', flexDirection: 'column', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      }
    }}>
      <CardContent sx={{ flexGrow: 1, position: 'relative' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h2">
            {chatbot.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: '4px' }}>
            <IconButton
              onClick={() => navigate(`/app/chatbot/${chatbot._id}/settings`)}
              size="small"
            >
              <SettingsIcon />
            </IconButton>
            <IconButton
              onClick={handleClick}
              size="small"
              aria-controls={open ? 'basic-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}
            >
              <MoreVertIcon />
            </IconButton>
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{
          display: 'flex',
          alignItems: 'center',
          '& span': { color: '#ff9800' }
        }}>
          Channels
        </Typography>

        <Box sx={{
          display: 'flex', alignItems: 'center', mt: 1
        }}>
          <Typography variant="body2" color="text.secondary" sx={{
            display: 'flex',
            alignItems: 'center',
            mr: 1,
            '& span': { color: '#ff9800' }
          }}>
            Status
          </Typography>
          <Chip
            label={chatbot.deployment?.status || 'Not Deployed'}
            size="small"
            sx={{
              backgroundColor: chatbot.deployment?.status === 'deployed' ? '#4caf50' : '#ccc',
              color: chatbot.deployment?.status === 'deployed' ? 'white' : 'black',
              textTransform: 'lowercase',
              height: '24px',
              borderRadius: '4px',
              fontSize: '0.75rem'
            }}
          />
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
        >
          <MenuItem onClick={handleEdit}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            Edit
          </MenuItem>
          <MenuItem onClick={handleTrain}>
            <ListItemIcon>
              <SchoolIcon fontSize="small" />
            </ListItemIcon>
            Train
          </MenuItem>
        </Menu>
      </CardContent>
    </Card>
  );
};

export default function ChatbotsPage() {
  const navigate = useNavigate();
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ChatbotStats>({
    totalConversations: 0,
    activeUsers: 0
  });

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/chatbot-stats/stats');
      setStats(response.data);
    } catch (err: any) {
      console.error('Failed to fetch chatbot statistics:', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [chatbotsResponse] = await Promise.all([
          axios.get('/api/chatbot'),
          fetchStats() // Fetch stats in parallel
        ]);
        setChatbots(chatbotsResponse.data.chatbots || []);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch chatbots');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up polling for stats every 5 minutes
    const statsInterval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(statsInterval);
  }, []);

  const handleCreateNew = () => {
    navigate('/app/chatbot/new');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          My Chatbots
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateNew}
        >
          Create New Chatbot
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ height: '100%', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h3" component="div" gutterBottom>
                {chatbots.length}
              </Typography>
              <Typography color="text.secondary">
                Total Chatbots
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Active bots in your account
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ height: '100%', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h3" component="div" gutterBottom>
                {stats.totalConversations.toLocaleString()}
              </Typography>
              <Typography color="text.secondary">
                Total Conversations
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Messages exchanged
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ height: '100%', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h3" component="div" gutterBottom>
                {stats.activeUsers.toLocaleString()}
              </Typography>
              <Typography color="text.secondary">
                Active Users
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Users interacting with bots
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {chatbots.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 8, px: 2 }}>
          <CardContent>
            <Box sx={{ mb: 3 }}>
              <ChatIcon sx={{ fontSize: 48, color: 'primary.main', opacity: 0.5 }} />
            </Box>
            <Typography variant="h6" gutterBottom>
              No Chatbots Yet
            </Typography>
            <Typography color="textSecondary" sx={{ mb: 3 }}>
              Create your first chatbot to get started with AI-powered conversations.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleCreateNew}
            >
              Create New Chatbot
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {chatbots.map((chatbot) => (
            <Grid item xs={12} sm={6} md={4} key={chatbot._id}>
              <ChatbotCard chatbot={chatbot} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
