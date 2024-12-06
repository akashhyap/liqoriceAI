import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Button,
  IconButton,
  Snackbar,
} from '@mui/material';
import axios from 'axios';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EmbedScript from '../components/chatbot/EmbedScript';

interface Chatbot {
  _id: string;
  name: string;
  deployment?: {
    status: string;
  };
}

const ChatbotDeployPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [chatbot, setChatbot] = useState<Chatbot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentSuccess, setDeploymentSuccess] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    const fetchChatbot = async () => {
      try {
        const response = await axios.get(`/chatbot/${id}`);
        setChatbot(response.data.chatbot || response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load chatbot');
      } finally {
        setLoading(false);
      }
    };

    fetchChatbot();
  }, [id]);

  const handleDeploy = async () => {
    try {
      setIsDeploying(true);
      setError(null);
      await axios.post(`/chatbot/${id}/deploy`);
      setDeploymentSuccess(true);
      
      // Refresh chatbot data to get updated status
      const response = await axios.get(`/chatbot/${id}`);
      setChatbot(response.data.chatbot || response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to deploy chatbot');
    } finally {
      setIsDeploying(false);
    }
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
      <Box sx={{ maxWidth: 800, margin: '0 auto', padding: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/app/chatbot/${id}/settings`)}
          sx={{ color: "#13234d" }}
        >
          Back to Settings
        </Button>
      </Box>
    );
  }

  if (!chatbot) {
    return (
      <Box sx={{ maxWidth: 800, margin: '0 auto', padding: 3 }}>
        <Alert severity="error">
          Chatbot not found
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/app/chatbots')}
          sx={{ mt: 2 }}
        >
          Back to Chatbots
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, margin: '0 auto', padding: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/app/chatbot/${id}/settings`)}
          sx={{ color: "#13234d" }}
        >
          Back to Settings
        </Button>
      </Box>

      <Typography variant="h5" gutterBottom>
        Deploy {chatbot.name}
      </Typography>

      {chatbot.deployment?.status === 'deployed' && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Your chatbot is deployed and ready to be embedded in your website!
        </Alert>
      )}

      {chatbot.deployment?.status === 'deployed' && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Direct Chat Link
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Share this link to allow users to chat directly in a full-screen interface.
          </Typography>
          <Box sx={{ 
            p: 2, 
            backgroundColor: '#f5f7f9', 
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Typography 
              variant="body2" 
              sx={{ 
                fontFamily: 'monospace',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {`${window.location.origin}/chat/${chatbot._id}`}
            </Typography>
            <IconButton
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/chat/${chatbot._id}`);
                setLinkCopied(true);
              }}
              size="small"
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Box>
        </Paper>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        {chatbot.deployment?.status !== 'deployed' ? (
          <>
            <Typography sx={{ mb: 2 }}>
              Deploy your chatbot to get the embed code for your website.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleDeploy}
              disabled={isDeploying}
              sx={{ borderRadius: '8px', color: '#ffffff' }}
            >
              {isDeploying ? 'Deploying...' : 'Deploy Chatbot'}
            </Button>
          </>
        ) : (
          <EmbedScript chatbotId={chatbot._id} />
        )}
      </Paper>

      <Snackbar
        open={linkCopied}
        autoHideDuration={3000}
        onClose={() => setLinkCopied(false)}
        message="Direct chat link copied to clipboard"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default ChatbotDeployPage;
