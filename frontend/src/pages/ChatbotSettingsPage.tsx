import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import HistoryIcon from '@mui/icons-material/History';
import ChatIcon from '@mui/icons-material/Chat';
import SettingsIcon from '@mui/icons-material/Settings';
import axios from 'axios';
import ChatbotForm from '../components/chatbot/ChatbotForm';
import { Chatbot } from '../types';

interface ChatbotSettings {
  _id: string;
  name: string;
  description: string;
  user: string;
  channels: Array<'web' | 'whatsapp' | 'facebook' | 'instagram'>;
  settings: {
    language: string;
    welcomeMessage: string;
    personality: string;
    modelSettings: {
      temperature: number;
      maxTokens: number;
    };
  };
  training: {
    documents: Array<{
      type: string;
      fileType: 'pdf' | 'docx' | 'txt' | 'csv' | 'xls';
    }>;
    websites: Array<{
      url: string;
      lastCrawled: string;
    }>;
    customResponses: Array<{
      pattern: string;
      response: string;
    }>;
  };
  analytics: {
    totalConversations: number;
    totalMessages: number;
    averageResponseTime: number;
    userSatisfactionScore: number;
  };
  widgetSettings: {
    theme: {
      primaryColor: string;
      fontFamily: string;
    };
    position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    size: 'small' | 'medium' | 'large';
  };
  active: boolean;
  createdAt: string;
  customInstructions?: string;
}

interface TrainingStats {
  documents: number;
  websites: number;
  lastTrainingDate: string;
}

const CHANNELS = [
  { value: 'web', label: 'Web' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
];

const ChatbotSettingsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [chatbot, setChatbot] = useState<Chatbot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const fetchChatbot = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/chatbot/${id}`);
        if (response.data && response.data.chatbot) {
          setChatbot(response.data.chatbot);
        } else {
          setChatbot(response.data);
        }
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Failed to load chatbot settings. Please try again.';
        setError(errorMessage);
        console.error('Error fetching chatbot:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchChatbot();
    }
  }, [id]);

  const handleSubmit = async (data: Partial<Chatbot>) => {
    try {
      setError(null);
      const response = await axios.put(`/chatbot/${id}`, data);
      if (response.data && response.data.chatbot) {
        setChatbot(response.data.chatbot);
      } else {
        setChatbot(response.data);
      }
      setSuccessMessage('Chatbot settings updated successfully!');
      setIsEditing(false);

      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update chatbot settings. Please try again.';
      setError(errorMessage);
      console.error('Error updating chatbot:', err);
    }
  };

  const handleDeploy = () => {
    navigate(`/app/chatbot/${id}/deploy`);
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await axios.delete(`/chatbot/${id}`);
      navigate('/app/chatbots');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete chatbot. Please try again.';
      setError(errorMessage);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 1200, margin: '0 auto', padding: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          onClick={() => navigate('/app/chatbots')}
          sx={{ mt: 2 }}
        >
          Back to Chatbots
        </Button>
      </Box>
    );
  }

  if (!chatbot) {
    return (
      <Box sx={{ maxWidth: 1200, margin: '0 auto', padding: 3 }}>
        <Alert severity="error">
          Chatbot not found
        </Alert>
        <Button
          variant="contained"
          onClick={() => navigate('/app/chatbots')}
          sx={{ mt: 2 }}
        >
          Back to Chatbots
        </Button>
      </Box>
    );
  }

  const isNewChatbot = chatbot.deployment?.status === 'draft';

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', padding: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate(`/app/chatbot/${id}/train`)}
            startIcon={<AddIcon />}
            sx={{ borderRadius: '8px', color: '#ffffff' }}
          >
            {isNewChatbot ? 'Train Chatbot' : 'Update Training'}
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleDeploy}
            sx={{ borderRadius: '8px', color: '#ffffff' }}
          >
            Deploy
          </Button>
        </Box>
      </Box>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      <Stack spacing={3}>
        {/* Basic Information Card */}
        <Card sx={{ padding: 3, boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', borderRadius: '10px' }}>
          <CardHeader
            title="Basic Information"
            subheader="View and modify your chatbot's configuration"
            action={
              !isEditing ? (
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => setIsEditing(true)}
                  sx={{ borderRadius: '8px' }}
                  startIcon={<SettingsIcon />}
                >
                  Edit
                </Button>
              ) : null
            }
          />
          <CardContent>
            {!isEditing ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 2 }}>
                  <Typography color="textSecondary">Name:</Typography>
                  <Typography>{chatbot.name}</Typography>

                  <Typography color="textSecondary">Description:</Typography>
                  <Typography>{chatbot.description}</Typography>

                  <Typography color="textSecondary">Status:</Typography>
                  <Typography>{chatbot.deployment?.status || 'Not deployed'}</Typography>
                </Box>
              </Box>
            ) : (
              <ChatbotForm chatbot={chatbot} onSubmit={handleSubmit} />
            )}
          </CardContent>
        </Card>

        {/* Chat History Card */}
        <Card sx={{ padding: 3, boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', borderRadius: '10px' }}>
          <CardHeader
            title="Chat History"
            subheader="View recent chat interactions"
            action={
              <Button
                variant="outlined"
                color="primary"
                onClick={() => navigate(`/app/chatbot/${id}/history`)}
                sx={{ borderRadius: '8px' }}
                startIcon={<HistoryIcon />}
              >
                View All
              </Button>
            }
          />
          <CardContent>
            {/* Chat history content */}
          </CardContent>
        </Card>

        {/* Danger Zone Card */}
        <Card 
          sx={{ 
            padding: 3, 
            borderRadius: '10px',
            border: '1px solid rgba(211, 47, 47, 0.5)',
            bgcolor: 'transparent',
            '&:hover': {
              borderColor: 'error.main',
            }
          }}
        >
          <CardHeader
            title={
              <Typography variant="h6" color="error" sx={{ fontWeight: 600 }}>
                Danger Zone
              </Typography>
            }
          />
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
                  Delete this chatbot
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Once you delete a chatbot, there is no going back. This action cannot be undone.
                </Typography>
              </Box>
              <Button
                variant="outlined"
                color="error"
                onClick={handleDeleteClick}
                disabled={isDeleting}
                sx={{ 
                  minWidth: '120px',
                  borderRadius: '6px',
                  borderColor: 'error.main',
                  '&:hover': {
                    backgroundColor: 'error.main',
                    color: 'white'
                  }
                }}
              >
                {isDeleting ? (
                  <CircularProgress size={20} color="error" />
                ) : (
                  'Delete'
                )}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Stack>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !isDeleting && setDeleteDialogOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        PaperProps={{
          sx: {
            borderRadius: '10px',
            maxWidth: '450px'
          }
        }}
      >
        <DialogTitle id="alert-dialog-title" sx={{ pb: 1 }}>
          <Typography variant="h6" component="span" sx={{ fontWeight: 600, color: 'error.main' }}>
            Delete Chatbot?
          </Typography>
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description" sx={{ color: 'text.primary', mb: 2 }}>
            This will permanently delete <strong>{chatbot.name}</strong> and all of its data:
          </DialogContentText>
          <Box sx={{ color: 'text.primary' }}>
            <Typography component="ul" sx={{ pl: 2 }}>
              <li>All training documents and embeddings</li>
              <li>Chat history and conversations</li>
              <li>Settings and configurations</li>
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={isDeleting}
            variant="outlined"
            sx={{ borderRadius: '6px' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={isDeleting}
            variant="contained"
            color="error"
            sx={{ borderRadius: '6px' }}
          >
            {isDeleting ? (
              <CircularProgress size={20} sx={{ color: 'white' }} />
            ) : (
              'Yes, delete chatbot'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChatbotSettingsPage;
