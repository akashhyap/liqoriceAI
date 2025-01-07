import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Dialog,
  DialogContent,
  Grid,
  Typography,
  useTheme,
  useMediaQuery,
  CircularProgress,
  IconButton,
  Paper,
} from '@mui/material';
import { Add as AddIcon, Close as CloseIcon, Message as MessageIcon, People as PeopleIcon } from '@mui/icons-material';
import ChatbotForm from '../components/chatbot/ChatbotForm';
import ChatbotList from '../components/chatbot/ChatbotList';
import { useAuth } from '../context/AuthContext';
import { useChatbots } from '../hooks/useChatbots';
import axios from '../services/axios';
import { Chatbot } from '../types';

interface DashboardPageProps { }

interface DashboardStats {
  totalConversations: number;
  activeUsers: number;
}

const DashboardPage: React.FC<DashboardPageProps> = () => {
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalConversations: 0,
    activeUsers: 0
  });
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const { chatbots = [], isLoading, error, fetchChatbots } = useChatbots();

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/analytics/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    }
  };

  useEffect(() => {
    fetchStats();
    // Refresh stats every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Typography color="error">{error}</Typography>
        </Box>
      </Container>
    );
  }

  const handleCreateBot = async (data: any) => {
    try {
      setCreateError(null);
      const { deployment, ...createData } = data;
      await axios.post('/chatbot', {
        ...createData,
        userId: user?._id
      });
      setOpenCreateDialog(false);
      fetchChatbots();
    } catch (error: any) {
      console.error('Error creating bot:', error);
      setCreateError(error?.response?.data?.message || error?.message || 'Failed to create chatbot');
    }
  };

  const handleEdit = (chatbot: Chatbot) => {
    console.log('Editing chatbot:', chatbot);
  };

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.1)' : '#f8fafc',
        minHeight: 'calc(100vh - 64px)',
        width: '100%',
        py: 4,
        px: { xs: 2, sm: 3, md: 4 }
      }}
    >
      <Box sx={{ maxWidth: 'lg', mx: 'auto', px: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 600,
              color: theme.palette.mode === 'dark' ? '#fff' : '#1a2027'
            }}
          >
            Chatbots
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreateDialog(true)}
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              px: 3,
              py: 1,
              backgroundColor: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
              },
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            }}
          >
            CREATE CHATBOT
          </Button>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '16px',
                backgroundColor: '#fff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                },
              }}
            >
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
                Total Chatbots
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 600, mb: 1 }}>
                {chatbots.length}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Active bots in your account
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '16px',
                backgroundColor: '#fff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                },
              }}
            >
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
                Total Conversations
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 600, mb: 1 }}>
                {stats.totalConversations.toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Messages exchanged
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '16px',
                backgroundColor: '#fff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                },
              }}
            >
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
                Active Users
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 600, mb: 1 }}>
                {stats.activeUsers.toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Users interacting with bots
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Chatbots List */}
        {chatbots.length > 0 ? (
          <ChatbotList chatbots={chatbots} onEdit={handleEdit} />
        ) : (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              px: 3,
              backgroundColor: '#fff',
              borderRadius: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
              No chatbots yet
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
              Create your first chatbot to get started
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenCreateDialog(true)}
              sx={{
                borderRadius: '12px',
                textTransform: 'none',
                px: 4,
                py: 1.5,
              }}
            >
              Create Chatbot
            </Button>
          </Box>
        )}

        {/* Create Chatbot Dialog */}
        <Dialog
          fullScreen={fullScreen}
          open={openCreateDialog}
          onClose={() => setOpenCreateDialog(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }
          }}
        >
          <DialogContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" component="h2">
                Create New Chatbot
              </Typography>
              <IconButton onClick={() => setOpenCreateDialog(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
            {createError && (
              <Typography color="error" sx={{ mb: 2 }}>
                {createError}
              </Typography>
            )}
            <ChatbotForm onSubmit={handleCreateBot} />
          </DialogContent>
        </Dialog>
      </Box>
    </Box>
  );
};

export default DashboardPage;