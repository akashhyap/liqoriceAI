import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  IconButton,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab
} from '@mui/material';
import { 
  Description as FileIcon,
  Delete as DeleteIcon,
  Language as WebsiteIcon
} from '@mui/icons-material';
import axios from '../services/axios';

interface TrainingDocument {
  _id: string;
  type: string;
  fileType: string;
  status: string;
  chunks?: number;
  originalName?: string;
  size?: number;
  createdAt?: string;
}

interface TrainingWebsite {
  _id: string;
  url: string;
  lastCrawled: string;
  pagesProcessed: number;
  status: string;
  error?: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
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
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const TrainingDetailsPage: React.FC = () => {
  const [documents, setDocuments] = useState<TrainingDocument[]>([]);
  const [websites, setWebsites] = useState<TrainingWebsite[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<TrainingDocument | null>(null);
  const [selectedWebsite, setSelectedWebsite] = useState<TrainingWebsite | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const { id: chatbotId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTrainingData();
  }, [chatbotId]);

  const fetchTrainingData = async () => {
    try {
      // Fetch documents
      const docsResponse = await axios.get(`/chatbot/${chatbotId}/training/documents`);
      console.log('Documents response:', docsResponse.data);
      if (docsResponse.data.success) {
        const docs = docsResponse.data.documents || [];
        console.log('Processed documents:', docs);
        setDocuments(docs);
      }

      // Fetch websites
      const websitesResponse = await axios.get(`/chatbot/${chatbotId}/training`);
      if (websitesResponse.data.routes) {
        const websiteRoute = websitesResponse.data.routes.find((r: any) => r.type === 'websites');
        setWebsites(websiteRoute?.items || []);
      }
    } catch (error) {
      console.error('Error fetching training data:', error);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleDeleteClick = (item: TrainingDocument | TrainingWebsite, type: 'document' | 'website') => {
    if (type === 'document') {
      setSelectedDocument(item as TrainingDocument);
    } else {
      setSelectedWebsite(item as TrainingWebsite);
    }
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      if (selectedDocument) {
        const response = await axios.delete(`/chatbot/${chatbotId}/train/documents/${selectedDocument._id}`);
        if (response.data.success) {
          setDocuments(prevDocs => prevDocs.filter(doc => doc._id !== selectedDocument._id));
        }
      } else if (selectedWebsite) {
        const response = await axios.delete(`/chatbot/${chatbotId}/train/websites/${selectedWebsite._id}`);
        if (response.data.success) {
          setWebsites(prevSites => prevSites.filter(site => site._id !== selectedWebsite._id));
        }
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
    setDeleteDialogOpen(false);
    setSelectedDocument(null);
    setSelectedWebsite(null);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedDocument(null);
    setSelectedWebsite(null);
  };

  return (
    <Paper sx={{ p: 3, m: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Training Data Details</Typography>
        <Button
          variant="outlined"
          onClick={() => navigate(`/app/chatbot/${chatbotId}/train`)}
          sx={{ borderRadius: '8px' }}
        >
          Back to Training
        </Button>
      </Box>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Documents" />
          <Tab label="Websites" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <List>
          {documents.map((doc, index) => {
            // Skip rendering if document is missing required data
            if (!doc) {
              console.warn('Invalid document data:', doc);
              return null;
            }

            return (
              <ListItem key={doc._id || index}>
                <ListItemIcon>
                  <FileIcon />
                </ListItemIcon>
                <ListItemText 
                  primary={doc.originalName || 'Unnamed File'}
                  secondaryTypographyProps={{ component: 'div' }}
                  secondary={
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        {doc.chunks ? `${doc.chunks} chunks • ` : ''}
                        {doc.size ? `${(doc.size / 1024).toFixed(2)} KB • ` : ''}
                        {doc.fileType ? doc.fileType.toUpperCase() : 'Unknown Type'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {doc.createdAt ? 
                          `Uploaded on ${new Date(doc.createdAt).toLocaleDateString()}` :
                          'Recently uploaded'
                        }
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton 
                    edge="end" 
                    aria-label="delete"
                    onClick={() => handleDeleteClick(doc, 'document')}
                    sx={{ color: 'error.main' }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            );
          })}
          {documents.length === 0 && (
            <ListItem>
              <ListItemText 
                primary="No documents uploaded yet"
                secondary="Upload documents to train your chatbot"
              />
            </ListItem>
          )}
        </List>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <List>
          {websites.map((site, index) => (
            <ListItem key={site._id || index}>
              <ListItemIcon>
                <WebsiteIcon />
              </ListItemIcon>
              <ListItemText 
                primary={site.url}
                secondaryTypographyProps={{ component: 'div' }}
                secondary={
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      {site.pagesProcessed} pages processed • Status: {site.status}
                    </Typography>
                    {site.error && (
                      <Typography variant="body2" color="error">
                        Error: {site.error}
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary">
                      Last crawled: {new Date(site.lastCrawled).toLocaleDateString()}
                    </Typography>
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <IconButton 
                  edge="end" 
                  aria-label="delete"
                  onClick={() => handleDeleteClick(site, 'website')}
                  sx={{ color: 'error.main' }}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </TabPanel>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete {selectedDocument ? 'Document' : 'Website'}</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this {selectedDocument ? 'document' : 'website'}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default TrainingDetailsPage;
