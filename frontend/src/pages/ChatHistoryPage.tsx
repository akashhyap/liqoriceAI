import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Button,
  Chip,
  TextField,
  InputAdornment,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SettingsIcon from '@mui/icons-material/Settings';
import FilterListIcon from '@mui/icons-material/FilterList';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from '../services/axios';

interface ChatMessage {
  _id: string;
  chatbot: string;
  message: string;
  response: string;
  timestamp: string;
  sessionId: string;
  metadata?: {
    sources?: string[];
  };
}

interface ChatHistoryResponse {
  success: boolean;
  sessions: ChatMessage[];
  pagination: any;
  metrics: any;
}

const ChatHistoryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatbotName, setChatbotName] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<ChatMessage | null>(null);

  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        setLoading(true);
        setError(null); // Reset any previous errors
        
        // Fetch chatbot name
        const chatbotResponse = await axios.get(`/chatbot/${id}`).catch(error => {
          if (error.response?.status === 500) {
            throw new Error(`Server error while fetching chatbot: ${error.response.data?.message || 'Internal server error'}`);
          }
          throw error;
        });
        
        setChatbotName(chatbotResponse.data.chatbot.name);

        // Fetch chat messages
        const response = await axios.get<ChatHistoryResponse>(`/chatbot/${id}/history`).catch(error => {
          if (error.response?.status === 500) {
            throw new Error(`Server error while fetching history: ${error.response.data?.message || 'Internal server error'}`);
          }
          throw error;
        });
        
        console.log('Chat history response:', response.data);
        
        if (response.data && Array.isArray(response.data.sessions)) {
          setChatMessages(response.data.sessions);
        } else {
          console.error('Unexpected response format:', response.data);
          setChatMessages([]);
        }
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to load chat history. Please try again.';
        setError(errorMessage);
        console.error('Error in fetchChatHistory:', err);
        setChatMessages([]);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchChatHistory();
    }
  }, [id]);

  const filteredMessages = useMemo(() => {
    if (!Array.isArray(chatMessages)) {
      console.error('chatMessages is not an array:', chatMessages);
      return [];
    }
    
    const searchLower = searchQuery.toLowerCase();
    return chatMessages.filter(msg => 
      msg?.message?.toLowerCase().includes(searchLower) ||
      msg?.response?.toLowerCase().includes(searchLower) ||
      msg?.sessionId?.toLowerCase().includes(searchLower)
    );
  }, [chatMessages, searchQuery]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleDeleteClick = (message: ChatMessage) => {
    setMessageToDelete(message);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!messageToDelete) return;

    try {
      const response = await axios.delete(`/chatbot/${id}/history/${messageToDelete._id}`);
      if (response.data.success) {
        setChatMessages(prev => prev.filter(msg => msg._id !== messageToDelete._id));
        setError(null);
      } else {
        setError('Failed to delete message');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete message');
    } finally {
      setDeleteDialogOpen(false);
      setMessageToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setMessageToDelete(null);
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
          onClick={() => navigate(`/app/chatbot/${id}`)}
          sx={{ color: "#13234d" }}
        >
          Back to Settings
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', padding: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/app/chatbot/${id}/settings`)}
          sx={{ mr: 2, color: "#13234d" }}
        >
          Back to Settings
        </Button>
        <Typography variant="h5" component="h1">
          Chat History - {chatbotName}
        </Typography>
      </Box>

      {/* Search and Filter Bar */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              placeholder="Search chat messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Tooltip title="Filter options">
              <IconButton>
                <FilterListIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </CardContent>
      </Card>

      {/* Chat Messages Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              <TableCell>User Message</TableCell>
              <TableCell>Bot Response</TableCell>
              <TableCell>Session ID</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredMessages.map((msg) => (
              <TableRow key={msg._id} hover>
                <TableCell>{formatDate(msg.timestamp)}</TableCell>
                <TableCell>{msg.message}</TableCell>
                <TableCell>{msg.response}</TableCell>
                <TableCell>
                  <Chip 
                    label={msg.sessionId} 
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Tooltip title="Delete message">
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteClick(msg)}
                      sx={{ color: 'error.main' }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {filteredMessages.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography color="textSecondary">
                    No chat messages found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">Delete Message</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this message? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChatHistoryPage;
