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
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
          Ch<span>a</span>nnels
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ 
            display: 'flex',
            alignItems: 'center',
            mr: 1,
            '& span': { color: '#ff9800' }
          }}>
            St<span>a</span>tus
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

  useEffect(() => {
    const fetchChatbots = async () => {
      try {
        const response = await axios.get('/chatbot');
        setChatbots(response.data.chatbots);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch chatbots');
      } finally {
        setLoading(false);
      }
    };

    fetchChatbots();
  }, []);

  const handleCreateNew = () => {
    navigate('/app/dashboard');
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
