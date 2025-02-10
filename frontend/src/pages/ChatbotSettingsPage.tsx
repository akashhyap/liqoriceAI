import React, { useState, useEffect, useCallback } from 'react';
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
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import HistoryIcon from '@mui/icons-material/History';
import ChatIcon from '@mui/icons-material/Chat';
import SettingsIcon from '@mui/icons-material/Settings';
import axios from 'axios';
import ChatbotForm from '../components/chatbot/ChatbotForm';
import VisitorsList from '../components/chatbot/VisitorsList';
import VisitorChatHistory from '../components/chatbot/VisitorChatHistory';
import VisitorAnalytics from '../components/chatbot/VisitorAnalytics';
import { Chatbot } from '../types';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { apiUrl } from '../config/constants';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

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

interface ChatbotAnalytics {
  totalSessions: number;
  activeSessions: number;
  totalMessages: number;
  avgDuration: number;
  responseRate: number;
  lastActive: string;
  topics: Array<{ topic: string; count: number }>;
  engagementByHour: Array<{ hour: number; count: number }>;
}

interface VisitorAnalytics {
  totalSessions: number;
  activeSessions: number;
  totalMessages: number;
  avgDuration: number;
  averageMessagesPerSession: number;
  responseRate: number;
  lastActive: string;
  topics: Array<{ topic: string; count: number }>;
  engagementByHour: Array<{ hour: number; count: number }>;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [chatbot, setChatbot] = useState<Chatbot | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('general');
  const [selectedVisitor, setSelectedVisitor] = useState<{ _id: string; email: string } | null>(null);
  const [chatbotAnalytics, setChatbotAnalytics] = useState<ChatbotAnalytics | null>(null);
  const [visitorAnalytics, setVisitorAnalytics] = useState<VisitorAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [visitorAnalyticsLoading, setVisitorAnalyticsLoading] = useState(false);

  useEffect(() => {
    const fetchChatbot = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${apiUrl}/api/chatbot/${id}`);
        if (response.data && response.data.chatbot) {
          setChatbot(response.data.chatbot);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error('Error fetching chatbot:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
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
      const response = await axios.put(`${apiUrl}/api/chatbot/${id}`, data);
      if (response.data && response.data.chatbot) {
        setChatbot(response.data.chatbot);
      } else {
        throw new Error('Invalid response format');
      }
      setSuccess('Chatbot updated successfully');
    } catch (err) {
      console.error('Error updating chatbot:', err);
      setError(err instanceof Error ? err.message : 'Failed to update chatbot');
    }
  };

  const handleDeploy = () => {
    navigate(`/app/chatbot/${id}/deploy`);
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await axios.delete(`${apiUrl}/api/chatbot/${id}`);
      navigate('/app/dashboard');
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

  const handleVisitorSelect = (visitorId: string, email: string) => {
    setSelectedVisitor({ _id: visitorId, email });
  };

  const handleBackToVisitors = () => {
    setSelectedVisitor(null);
  };

  const fetchAnalytics = async () => {
    if (!chatbot?._id) return;

    setAnalyticsLoading(true);
    try {
      console.log('Fetching analytics for chatbot:', chatbot._id);
      const response = await axios.get(`${apiUrl}/api/v1/visitor/analytics/chatbot/${chatbot._id}`);
      console.log('Analytics response:', response.data);

      if (response.data?.success && response.data.data) {
        const data = response.data.data;
        const analyticsData: ChatbotAnalytics = {
          totalSessions: data.totalSessions || 0,
          activeSessions: data.activeSessions || 0,
          totalMessages: data.totalMessages || 0,
          avgDuration: Math.round(data.avgDuration || 0),
          responseRate: Math.round(data.responseRate || 0),
          lastActive: data.lastActive || new Date().toISOString(),
          topics: data.topics || [],
          engagementByHour: data.engagementByHour || Array(24).fill({ hour: 0, count: 0 })
        };
        console.log('Processed analytics data:', analyticsData);
        setChatbotAnalytics(analyticsData);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setChatbotAnalytics(null);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    if (chatbot?._id) {
      fetchAnalytics();
    }
  }, [chatbot?._id]);

  useEffect(() => {
    if (selectedTab === 'general') {
      fetchAnalytics();
    }
  }, [selectedTab]);

  const fetchVisitorAnalytics = useCallback(async (visitorId: string) => {
    try {
      setVisitorAnalyticsLoading(true);
      const response = await fetch(`${apiUrl}/api/v1/visitor/analytics/visitor/${visitorId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch visitor analytics');
      }
      const data = await response.json();
      setVisitorAnalytics(data.data);
    } catch (err) {
      console.error('Error fetching visitor analytics:', err);
    } finally {
      setVisitorAnalyticsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedVisitor) {
      fetchVisitorAnalytics(selectedVisitor._id);
    }
  }, [selectedVisitor, fetchVisitorAnalytics]);

  const handleSettingsSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!chatbot) return;

    const formData: Partial<Chatbot> = {
      name: chatbot.name,
      description: chatbot.description,
      deployment: chatbot.deployment,
      settings: chatbot.settings
    };

    handleSubmit(formData);
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
      <Card>
        <CardHeader
          title={
            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography variant="h3">Chatbot Settings</Typography>
              {loading && <CircularProgress size={20} />}
            </Stack>
          }
        />
        <CardContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
              <Tab label="General" value="general" />
              <Tab label="Training" value="training" />
              <Tab label="Visitors" value="visitors" />
              {chatbot.deployment?.status === 'deployed' && (
                <Tab label="Integration" value="integration" />
              )}
            </Tabs>
          </Box>

          {selectedTab === 'general' && (
            <>
              <Card sx={{ padding: 3, boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', borderRadius: '10px', mb: 4 }}>
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

              <Card sx={{ padding: 3, boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', borderRadius: '10px' }}>
                <CardHeader
                  title="Analytics Overview"
                  subheader="View your chatbot's performance metrics"
                />
                <CardContent>
                  {analyticsLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <CircularProgress />
                    </Box>
                  ) : chatbotAnalytics ? (
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6} lg={3}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 3,
                            height: '100%',
                            borderRadius: 2,
                            bgcolor: '#fff',
                            border: '1px solid',
                            borderColor: 'divider'
                          }}
                        >
                          <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
                            Total Sessions
                          </Typography>
                          <Typography
                            variant="h3"
                            sx={{
                              color: '#0288d1',
                              fontWeight: 400
                            }}
                          >
                            {chatbotAnalytics.totalSessions}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={6} lg={3}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 3,
                            height: '100%',
                            borderRadius: 2,
                            bgcolor: '#fff',
                            border: '1px solid',
                            borderColor: 'divider'
                          }}
                        >
                          <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
                            Avg. Session Duration
                          </Typography>
                          <Typography
                            variant="h3"
                            sx={{
                              color: '#0288d1',
                              fontWeight: 400
                            }}
                          >
                            {chatbotAnalytics.avgDuration}m
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={6} lg={3}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 3,
                            height: '100%',
                            borderRadius: 2,
                            bgcolor: '#fff',
                            border: '1px solid',
                            borderColor: 'divider'
                          }}
                        >
                          <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
                            Messages per Session
                          </Typography>
                          <Typography
                            variant="h3"
                            sx={{
                              color: '#0288d1',
                              fontWeight: 400
                            }}
                          >
                            {chatbotAnalytics.totalMessages && chatbotAnalytics.totalSessions
                              ? (chatbotAnalytics.totalMessages / chatbotAnalytics.totalSessions).toFixed(1)
                              : '0.0'
                            }
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={6} lg={3}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 3,
                            height: '100%',
                            borderRadius: 2,
                            bgcolor: '#fff',
                            border: '1px solid',
                            borderColor: 'divider'
                          }}
                        >
                          <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
                            Response Rate
                          </Typography>
                          <Typography
                            variant="h3"
                            sx={{
                              color: '#0288d1',
                              fontWeight: 400
                            }}
                          >
                            {chatbotAnalytics.responseRate}%
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 3,
                            height: '100%',
                            borderRadius: 2,
                            bgcolor: '#fff',
                            border: '1px solid',
                            borderColor: 'divider'
                          }}
                        >
                          <Typography variant="h6" sx={{ color: 'text.primary', mb: 2 }}>
                            Common Topics
                          </Typography>
                          {chatbotAnalytics.topics?.length > 0 ? (
                            <Stack spacing={1}>
                              {chatbotAnalytics.topics.map((topic, index) => (
                                <Box key={index} display="flex" justifyContent="space-between" alignItems="center">
                                  <Typography variant="body2">{topic.topic}</Typography>
                                  <Chip
                                    label={topic.count}
                                    size="small"
                                    sx={{
                                      bgcolor: '#0288d1',
                                      color: 'white',
                                      fontWeight: 500
                                    }}
                                  />
                                </Box>
                              ))}
                            </Stack>
                          ) : (
                            <Typography color="text.secondary" variant="body2">
                              No topics data available
                            </Typography>
                          )}
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 3,
                            height: '100%',
                            borderRadius: 2,
                            bgcolor: '#fff',
                            border: '1px solid',
                            borderColor: 'divider'
                          }}
                        >
                          <Typography variant="h6" sx={{ color: 'text.primary', mb: 2 }}>
                            Engagement by Hour
                          </Typography>
                          {chatbotAnalytics.engagementByHour?.length > 0 ? (
                            <Box sx={{ height: 200 }}>
                              {/* Add chart here if needed */}
                              <Typography variant="body2" color="text.secondary">
                                No engagement data recorded yet
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No engagement data recorded yet
                            </Typography>
                          )}
                        </Paper>
                      </Grid>
                    </Grid>
                  ) : (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <Typography color="text.secondary" variant="body2">
                        No analytics data available
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {selectedTab === 'training' && (
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
              </Box>
            </Box>
          )}

          {selectedTab === 'integration' && chatbot.deployment?.status === 'deployed' && (
            <>
              <Card sx={{ padding: 3, boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', borderRadius: '10px', mb: 3 }}>
                <CardHeader
                  title="Direct Chat Link"
                  subheader="Share this link to allow users to chat directly in a full-screen interface."
                />
                <CardContent>
                  <Box sx={{
                    bgcolor: 'grey.50',
                    p: 2,
                    borderRadius: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <Typography
                      component="code"
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        color: 'text.primary',
                        wordBreak: 'break-all'
                      }}
                    >
                      {`${window.location.origin}/chat/${chatbot._id}`}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/chat/${chatbot._id}`);
                        setSuccess('Link copied to clipboard!');
                      }}
                    >
                      <ContentCopyIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>

              <Card sx={{ padding: 3, boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', borderRadius: '10px' }}>
                <CardHeader
                  title="Embed Script"
                  subheader="Copy and paste this script into your website's HTML to add the chatbot widget."
                />
                <CardContent>
                  <Box sx={{
                    bgcolor: 'grey.50',
                    p: 2,
                    borderRadius: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                  }}>
                    <Typography
                      component="code"
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        color: 'text.primary',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all'
                      }}
                    >
                      {`
<script>
(function() {
    // Create widget container
    const container = document.createElement('div');
    container.id = 'liqorice-widget-${chatbot._id}';
    container.style.position = 'fixed';
    container.style.bottom = '20px';
    container.style.right = '20px';
    container.style.zIndex = '9999';
    document.body.appendChild(container);

    // Create chat button
    const button = document.createElement('button');
    button.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H6L4 18V4H20V16ZM20 16H6L4 18V4H20V16Z" fill="white"/></svg>';
    button.style.width = '56px';
    button.style.height = '56px';
    button.style.borderRadius = '50%';
    button.style.backgroundColor = '${chatbot.widgetSettings?.theme?.primaryColor || '#2563eb'}';
    button.style.border = 'none';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    button.style.color = 'white';
    button.style.cursor = 'pointer';
    button.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.16)';
    button.style.transition = 'all 0.2s ease';
    container.appendChild(button);

    button.onmouseover = () => {
        button.style.transform = 'scale(1.05)';
        button.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.2)';
    };
    button.onmouseout = () => {
        button.style.transform = 'scale(1)';
        button.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.16)';
    };

    // Create chat window
    const chatWindow = document.createElement('div');
    chatWindow.style.display = 'none';
    chatWindow.style.position = 'absolute';
    chatWindow.style.bottom = '0';
    chatWindow.style.right = '0';
    chatWindow.style.width = '380px';
    chatWindow.style.height = '600px';
    chatWindow.style.backgroundColor = 'white';
    chatWindow.style.borderRadius = '16px';
    chatWindow.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
    chatWindow.style.overflow = 'hidden';
    chatWindow.style.transition = 'all 0.3s ease';
    container.appendChild(chatWindow);

    // Create chat interface
    const header = document.createElement('div');
    header.style.padding = '16px 20px';
    header.style.backgroundColor = '${chatbot.widgetSettings?.theme?.primaryColor || '#2563eb'}';
    header.style.color = 'white';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.innerHTML = '<div style="font-weight: 600; font-size: 16px;">${chatbot.name || 'Chat'}</div>';
    
    // Add buttons container to header
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.gap = '8px';
    
    // Add enlarge button to header
    const enlargeButton = document.createElement('button');
    enlargeButton.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" fill="white"/></svg>';
    enlargeButton.style.background = 'none';
    enlargeButton.style.border = 'none';
    enlargeButton.style.padding = '4px';
    enlargeButton.style.cursor = 'pointer';
    enlargeButton.style.color = 'white';
    enlargeButton.style.display = 'flex';
    enlargeButton.style.alignItems = 'center';
    enlargeButton.style.justifyContent = 'center';
    enlargeButton.style.borderRadius = '50%';
    enlargeButton.style.transition = 'background-color 0.2s';
    enlargeButton.onmouseover = () => {
        enlargeButton.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    };
    enlargeButton.onmouseout = () => {
        enlargeButton.style.backgroundColor = 'transparent';
    };

    // Add close button to header
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="white"/></svg>';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.padding = '4px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.color = 'white';
    closeButton.style.display = 'flex';
    closeButton.style.alignItems = 'center';
    closeButton.style.justifyContent = 'center';
    closeButton.style.borderRadius = '50%';
    closeButton.style.transition = 'background-color 0.2s';
    closeButton.onmouseover = () => {
        closeButton.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    };
    closeButton.onmouseout = () => {
        closeButton.style.backgroundColor = 'transparent';
    };

    buttonsContainer.appendChild(enlargeButton);
    buttonsContainer.appendChild(closeButton);
    header.appendChild(buttonsContainer);
    chatWindow.appendChild(header);

    // Create messages container
    const messagesContainer = document.createElement('div');
    messagesContainer.style.height = 'calc(100% - 130px)';
    messagesContainer.style.overflowY = 'auto';
    messagesContainer.style.padding = '20px';
    chatWindow.appendChild(messagesContainer);

    // Create input container
    const inputContainer = document.createElement('div');
    inputContainer.style.padding = '16px 20px';
    inputContainer.style.borderTop = '1px solid #eee';
    inputContainer.style.display = 'flex';
    inputContainer.style.gap = '12px';
    inputContainer.style.backgroundColor = 'white';
    chatWindow.appendChild(inputContainer);

    // Create input field
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Type your message...';
    input.style.flex = '1';
    input.style.padding = '10px 16px';
    input.style.border = '1px solid #e5e7eb';
    input.style.borderRadius = '20px';
    input.style.outline = 'none';
    input.style.fontSize = '14px';
    input.style.transition = 'border-color 0.2s';
    input.onfocus = () => {
        input.style.borderColor = '${chatbot.widgetSettings?.theme?.primaryColor || '#2563eb'}';
    };
    input.onblur = () => {
        input.style.borderColor = '#e5e7eb';
    };
    inputContainer.appendChild(input);

    // Create send button
    const sendButton = document.createElement('button');
    sendButton.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="white"/></svg>';
    sendButton.style.width = '36px';
    sendButton.style.height = '36px';
    sendButton.style.borderRadius = '50%';
    sendButton.style.backgroundColor = '${chatbot.widgetSettings?.theme?.primaryColor || '#2563eb'}';
    sendButton.style.border = 'none';
    sendButton.style.color = 'white';
    sendButton.style.cursor = 'pointer';
    sendButton.style.display = 'flex';
    sendButton.style.alignItems = 'center';
    sendButton.style.justifyContent = 'center';
    sendButton.style.transition = 'all 0.2s';
    sendButton.style.flexShrink = '0';
    sendButton.onmouseover = () => {
        sendButton.style.transform = 'scale(1.05)';
        sendButton.style.backgroundColor = '#1d4ed8';
    };
    sendButton.onmouseout = () => {
        sendButton.style.transform = 'scale(1)';
        sendButton.style.backgroundColor = '${chatbot.widgetSettings?.theme?.primaryColor || '#2563eb'}';
    };
    inputContainer.appendChild(sendButton);

    // Toggle chat window
    let isEnlarged = false;
    button.onclick = () => {
        const isVisible = chatWindow.style.display === 'block';
        chatWindow.style.display = isVisible ? 'none' : 'block';
        chatWindow.style.opacity = isVisible ? '0' : '1';
        button.style.display = isVisible ? 'flex' : 'none';
    };

    // Close chat window
    closeButton.onclick = () => {
        chatWindow.style.display = 'none';
        chatWindow.style.opacity = '0';
        button.style.display = 'flex';
        if (isEnlarged) {
            toggleEnlarge();
        }
    };

    // Toggle enlarge window
    const toggleEnlarge = () => {
        isEnlarged = !isEnlarged;
        chatWindow.style.width = isEnlarged ? '600px' : '380px';
        chatWindow.style.height = isEnlarged ? '700px' : '600px';
        enlargeButton.innerHTML = isEnlarged 
            ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" fill="white"/></svg>'
            : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" fill="white"/></svg>';
    };

    enlargeButton.onclick = toggleEnlarge;

    // Handle sending messages
    const sendMessage = async () => {
        const message = input.value.trim();
        if (!message) return;

        // Add user message
        const userMessage = document.createElement('div');
        userMessage.style.marginBottom = '12px';
        userMessage.style.textAlign = 'right';
        const userText = document.createElement('span');
        userText.style.backgroundColor = '#f3f4f6';
        userText.style.color = '#1f2937';
        userText.style.padding = '9px 25px';
        userText.style.borderRadius = '20px';
        userText.style.display = 'inline-block';
        userText.style.maxWidth = '80%';
        userText.style.wordWrap = 'break-word';
        userText.style.fontSize = '14px';
        userText.textContent = message;
        userMessage.appendChild(userText);
        messagesContainer.appendChild(userMessage);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        input.value = '';

        try {
            const response = await fetch(\`${window.location.origin}/api/chat/${chatbot._id}\`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message })
            });

            if (!response.ok) {
                throw new Error(\`HTTP error! status: \${response.status}\`);
            }

            const data = await response.json();
            
            // Add bot message
            const botMessage = document.createElement('div');
            botMessage.style.marginBottom = '12px';
            botMessage.style.display = 'flex';
            botMessage.style.gap = '8px';
            botMessage.style.alignItems = 'flex-start';

            const botIcon = document.createElement('div');
            botIcon.style.width = '28px';
            botIcon.style.height = '28px';
            botIcon.style.borderRadius = '50%';
            botIcon.style.backgroundColor = '${chatbot.widgetSettings?.theme?.primaryColor || '#19C37D'}';
            botIcon.style.display = 'flex';
            botIcon.style.alignItems = 'center';
            botIcon.style.justifyContent = 'center';
            botIcon.style.flexShrink = '0';
            botIcon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM17 13H13V17H11V13H7V11H11V7H13V11H17V13Z" fill="white"/></svg>';
            
            const botText = document.createElement('div');
            botText.style.color = '#1f2937';
            botText.style.fontSize = '14px';
            botText.style.lineHeight = '1.5';
            botText.style.maxWidth = 'calc(80% - 36px)';
            botText.style.wordWrap = 'break-word';
            botText.textContent = data.message;

            botMessage.appendChild(botIcon);
            botMessage.appendChild(botText);
            messagesContainer.appendChild(botMessage);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage = document.createElement('div');
            errorMessage.style.marginBottom = '12px';
            errorMessage.style.textAlign = 'center';
            errorMessage.style.color = '#ef4444';
            errorMessage.style.fontSize = '14px';
            errorMessage.textContent = 'Failed to send message. Please try again.';
            messagesContainer.appendChild(errorMessage);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    };

    sendButton.onclick = sendMessage;
    input.onkeypress = (e) => {
        if (e.key === 'Enter') sendMessage();
    };
})();
</script>
`}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `<script>/* Widget code */</script>`
                        );
                        setSuccess('Script copied to clipboard!');
                      }}
                    >
                      <ContentCopyIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </>
          )}

          {selectedTab === 'visitors' && (
            <Box>
              {selectedVisitor ? (
                <VisitorChatHistory
                  visitorId={selectedVisitor._id}
                  visitorEmail={selectedVisitor.email}
                  onBack={() => setSelectedVisitor(null)}
                />
              ) : (
                <VisitorsList
                  chatbotId={chatbot._id}
                  onVisitorSelect={(id, email) => setSelectedVisitor({ _id: id, email })}
                />
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      <Box sx={{ mt: 4, borderTop: 1, pt: 3, borderColor: 'divider' }}>
        <Typography variant="h6" color="error" gutterBottom>
          Danger Zone
        </Typography>
        <Paper sx={{ p: 2, bgcolor: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="subtitle1" sx={{ color: '#000', fontWeight: 'medium' }}>
                Delete this chatbot
              </Typography>
              <Typography variant="body2" sx={{ color: '#000', opacity: 0.7 }}>
                Once you delete a chatbot, there is no going back. Please be certain.
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="error"
              onClick={handleDeleteClick}
              disabled={isDeleting}
            >
              {isDeleting ? <CircularProgress size={24} /> : 'Delete Chatbot'}
            </Button>
          </Box>
        </Paper>
      </Box>

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
