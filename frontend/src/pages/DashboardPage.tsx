import React, { useState } from 'react';
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
} from '@mui/material';
import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material';
import ChatbotForm from '../components/chatbot/ChatbotForm';
import ChatbotList from '../components/chatbot/ChatbotList';
import { useAuth } from '../context/AuthContext';
import { useChatbots } from '../hooks/useChatbots';
import axios from '../services/axios';
import { Chatbot } from '../types';

interface DashboardPageProps { }

const DashboardPage: React.FC<DashboardPageProps> = () => {
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const { chatbots = [], isLoading, error, fetchChatbots } = useChatbots();

  if (isLoading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Typography>Loading chatbots...</Typography>
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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h4" component="h1">
          My Chatbots
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setOpenCreateDialog(true)}
          sx={{ borderRadius: '8px', color: '#ffffff' }}
        >
          Create Chatbot
        </Button>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)', borderRadius: '8px' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Chatbots
              </Typography>
              <Typography variant="h5" component="div">
                {chatbots.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)', borderRadius: '8px' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Conversations
              </Typography>
              <Typography variant="h5" component="div">
                0
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)', borderRadius: '8px' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Users
              </Typography>
              <Typography variant="h5" component="div">
                0
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Chatbot List */}
      <ChatbotList
        chatbots={chatbots}
        onEdit={handleEdit}
      />

      {/* Create Bot Dialog */}
      <Dialog
        open={openCreateDialog}
        onClose={() => setOpenCreateDialog(false)}
        fullScreen={fullScreen}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            background: theme.palette.background.paper,
            maxHeight: '90vh',
            overflow: 'hidden',
          }
        }}
      >
        {/* Fixed Header */}
        <Box
          sx={{
            p: 3,
            background: theme.palette.primary.main,
            color: 'white',
            borderTopLeftRadius: '12px',
            borderTopRightRadius: '12px',
            position: 'sticky',
            top: 0,
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Close Button */}
          <IconButton
            onClick={() => setOpenCreateDialog(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'white',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        
          <Typography
            variant="h5"
            component="h2"
            sx={{
              fontWeight: 600,
              mb: 1,
              color: '#ffffff',
              textAlign: 'center'
            }}
          >
            Create New Chatbot
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8, textAlign: 'center' }}>
            Configure your chatbot's settings and behavior
          </Typography>
        </Box>

        {/* Scrollable Content Container */}
        <Box
          sx={{
            maxHeight: 'calc(90vh - 100px)', // Account for header height
            overflow: 'auto',
            '&::-webkit-scrollbar': {
              width: '6px',
              backgroundColor: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '3px',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
              },
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'transparent',
            },
          }}
        >
          {/* Error Message */}
          {createError && (
            <Box
              sx={{
                p: 2,
                mx: 3,
                mt: 2,
                bgcolor: 'error.light',
                borderRadius: 1,
                color: 'error.main',
              }}
            >
              <Typography variant="body2">{createError}</Typography>
            </Box>
          )}

          {/* Form Container */}
          <Box
            sx={{
              p: 3,
              boxSizing: 'border-box',
            }}
          >
            <ChatbotForm onSubmit={handleCreateBot} />
          </Box>
        </Box>
      </Dialog>
    </Container>
  );
};

export default DashboardPage;