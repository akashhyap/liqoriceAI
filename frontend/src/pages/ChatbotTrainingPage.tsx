import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, Tab, Tabs, Button, Paper, Alert } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import WebsiteCrawler from '../components/training/WebsiteCrawler';
import DocumentUpload from '../components/training/DocumentUpload';
import CustomPrompt from '../components/training/CustomPrompt';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import axios from '../services/axios';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface TrainingData {
  summary: {
    totalDocuments: number;
    totalWebsites: number;
    totalChunks: number;
    lastTrainingDate: string | null;
  };
  routes: Array<{
    type: 'documents' | 'websites';
    items: Array<{
      type: string;
      name?: string;
      path?: string;
      url?: string;
      uploadDate?: string;
      crawledAt?: string;
      size?: number;
      pagesProcessed?: number;
      chunks?: number;
      status: string;
      error?: string;
    }>;
  }>;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`training-tabpanel-${index}`}
      aria-labelledby={`training-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `training-tab-${index}`,
    'aria-controls': `training-tabpanel-${index}`,
  };
}

const ChatbotTrainingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [value, setValue] = React.useState(0);
  const [trainingData, setTrainingData] = useState<TrainingData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrainingData = async () => {
      try {
        const response = await axios.get(`/chatbot/${id}/training`);
        setTrainingData(response.data);
        setError(null);
      } catch (error: any) {
        console.error('Error fetching training data:', error);
        setError(error.response?.data?.error || 'Failed to load training data');
      }
    };
    fetchTrainingData();
  }, [id]);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handleDeploy = () => {
    navigate(`/app/chatbot/${id}/deploy`);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(`/app/chatbot/${id}/settings`)}
        sx={{ mb: 2, color: "#13234d" }}
      >
        Back to Settings
      </Button>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Train Your Chatbot
        </Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={handleDeploy}
          sx={{ borderRadius: '8px', color: '#ffffff' }}
        >
          Deploy Chatbot
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}

      {trainingData && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Training Data Summary</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 3 }}>
            <Box>
              <Typography variant="subtitle1" gutterBottom>Documents</Typography>
              <Typography variant="body2" color="text.secondary">
                {trainingData.summary.totalDocuments} document{trainingData.summary.totalDocuments !== 1 ? 's' : ''} uploaded
              </Typography>
              {trainingData.routes.find(r => r.type === 'documents')?.items.map((doc, index) => (
                <Box component="ul" sx={{ mt: 1, pl: 2 }} key={index}>
                  <li>
                    <Typography variant="body2">
                      {doc.name} ({new Date(doc.uploadDate!).toLocaleDateString()})
                      {doc.chunks && ` - ${doc.chunks} chunks`}
                      {doc.status !== 'processed' && (
                        <Box component="span" sx={{ color: 'error.main' }}>
                          {` - ${doc.status}`}
                          {doc.error && `: ${doc.error}`}
                        </Box>
                      )}
                    </Typography>
                  </li>
                </Box>
              ))}
            </Box>
            <Box>
              <Typography variant="subtitle1" gutterBottom>Websites</Typography>
              <Typography variant="body2" color="text.secondary">
                {trainingData.summary.totalWebsites} website{trainingData.summary.totalWebsites !== 1 ? 's' : ''} crawled
              </Typography>
              {trainingData.routes.find(r => r.type === 'websites')?.items.map((site, index) => (
                <Box component="ul" sx={{ mt: 1, pl: 2 }} key={index}>
                  <li>
                    <Typography variant="body2">
                      {site.url} ({new Date(site.crawledAt!).toLocaleDateString()})
                      {site.pagesProcessed && ` - ${site.pagesProcessed} pages`}
                      {site.status !== 'processed' && (
                        <Box component="span" sx={{ color: 'error.main' }}>
                          {` - ${site.status}`}
                          {site.error && `: ${site.error}`}
                        </Box>
                      )}
                    </Typography>
                  </li>
                </Box>
              ))}
            </Box>
            <Box>
              <Typography variant="subtitle1" gutterBottom>Total Training Data</Typography>
              <Typography variant="body2" color="text.secondary">
                {trainingData.summary.totalChunks} chunk{trainingData.summary.totalChunks !== 1 ? 's' : ''} processed
              </Typography>
              {trainingData.summary.lastTrainingDate && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Last trained: {new Date(trainingData.summary.lastTrainingDate).toLocaleString()}
                </Typography>
              )}
            </Box>
          </Box>
          
          {trainingData.routes.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button 
                variant="outlined" 
                color="primary"
                onClick={() => navigate(`/app/chatbot/${id}/training/documents/details`)}
                sx={{ borderRadius: '8px'}}
              >
                View More
              </Button>
            </Box>
          )}
        </Paper>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} aria-label="training options">
          <Tab label="Website Training" {...a11yProps(0)} />
          <Tab label="Document Training" {...a11yProps(1)} />
          <Tab label="Custom Responses" {...a11yProps(2)} />
        </Tabs>
      </Box>

      <TabPanel value={value} index={0}>
        <WebsiteCrawler botId={id || ''} />
      </TabPanel>

      <TabPanel value={value} index={1}>
        <DocumentUpload />
      </TabPanel>

      <TabPanel value={value} index={2}>
        <CustomPrompt />
      </TabPanel>
    </Container>
  );
};

export default ChatbotTrainingPage;
