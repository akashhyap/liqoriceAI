import React, { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Button,
  Typography,
  Paper,
  LinearProgress,
  IconButton,
  CircularProgress
} from '@mui/material';
import { styled, alpha, keyframes } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../services/axios';
import { useTheme } from '@mui/material/styles';

interface FileStatus {
  file: File;
  content?: string;
  progress?: number;
  status: 'pending' | 'processing' | 'success' | 'error' | 'processed' | 'warning';
  error?: string;
  uploadedAt?: string;
  metadata?: {
    chunkCount: number;
    processingStartTime: number;
    processingEndTime: number;
  }
  chunkCount: number;
  processingStartTime: number;
  processingEndTime: number;
}

interface ExistingDocument {
  _id: string;
  type: string;
  fileType: string;
  metadata: {
    originalName: string;
    size: number;
    mimeType: string;
    createdAt: string;
    chunkCount?: number;
    url?: string;
  }
}

interface FileItemSecondaryProps {
  fileStatus: FileStatus;
  onProcess: (fileStatus: FileStatus) => Promise<void>;
}

const shimmer = `0% {
        transform: translateX(-100%);
    }
    100% {
        transform: translateX(100%);
    }`;

const FileItemSecondary: React.FC<FileItemSecondaryProps> = ({ fileStatus, onProcess }) => {
  const theme = useTheme();
  const [simulatedProgress, setSimulatedProgress] = useState(0);
  const [stage, setStage] = useState<string>('');

  type ProcessingStage = {
    start: number;
    end: number;
  };

  type ProcessingStages = {
    [key: string]: ProcessingStage;
  };

  // Define processing stages and their progress ranges
  const stages: ProcessingStages = {
    'Loading document': { start: 0, end: 20 },
    'Splitting content': { start: 20, end: 40 },
    'Creating embeddings': { start: 40, end: 70 },
    'Storing vectors': { start: 70, end: 90 },
    'Finalizing': { start: 90, end: 100 }
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (fileStatus.status === 'processing') {
      // Determine current stage based on progress
      const currentProgress = fileStatus.progress || 0;
      let currentStage = '';
      
      for (const [stageName, range] of Object.entries(stages)) {
        if (currentProgress >= range.start && currentProgress < range.end) {
          currentStage = stageName;
          break;
        }
      }
      
      // Update stage text
      setStage(currentStage || 'Processing...');

      // Start from current stage's start progress
      const currentStageRange = stages[currentStage] || stages['Loading document'];
      const targetProgress = Math.min(currentStageRange.end, (fileStatus.progress || 0));
      
      intervalId = setInterval(() => {
        setSimulatedProgress(prev => {
          if (prev >= targetProgress) {
            clearInterval(intervalId);
            return prev;
          }
          
          // Calculate increment based on current stage
          const increment = Math.max(0.1, (targetProgress - prev) * 0.05);
          return Math.min(prev + increment, targetProgress);
        });
      }, 50);
    } else if (fileStatus.status === 'success' || fileStatus.status === 'processed') {
      setStage('Completed');
      // Smoothly reach 100%
      const finalInterval = setInterval(() => {
        setSimulatedProgress(prev => {
          if (prev >= 100) {
            clearInterval(finalInterval);
            return 100;
          }
          return Math.min(prev + 0.5, 100);
        });
      }, 20);
      return () => clearInterval(finalInterval);
    } else {
      setSimulatedProgress(0);
      setStage('');
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [fileStatus.status, fileStatus.progress]);

  if (fileStatus.status === 'processing') {
    return (
      <Box sx={{ minWidth: 200 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ flexGrow: 1 }}>
            {stage}
          </Typography>
          <Typography variant="caption" color="primary">
            {Math.round(simulatedProgress)}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={simulatedProgress}
          sx={{
            height: 6,
            borderRadius: 3,
            backgroundColor: alpha(theme.palette.primary.main, 0.08),
            '& .MuiLinearProgress-bar': {
              borderRadius: 3,
              backgroundImage: `linear-gradient(
                45deg,
                rgba(255,255,255,.15) 25%,
                transparent 25%,
                transparent 50%,
                rgba(255,255,255,.15) 50%,
                rgba(255,255,255,.15) 75%,
                transparent 75%
              )`,
              backgroundSize: '40px 40px',
              animation: 'progress-bar-stripes 1s linear infinite',
              transition: 'transform 0.3s ease-out',
            },
            '@keyframes progress-bar-stripes': {
              '0%': {
                backgroundPosition: '40px 0'
              },
              '100%': {
                backgroundPosition: '0 0'
              }
            }
          }}
        />
      </Box>
    );
  }

  if (fileStatus.status === 'success' || fileStatus.status === 'processed') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box
          sx={{ 
            width: 24, 
            height: 24, 
            borderRadius: '50%', 
            backgroundColor: (theme) => alpha(theme.palette.success.main, 0.1),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'success.main'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13.3334 4L6.00008 11.3333L2.66675 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Box>
        <Typography 
          variant="body2" 
          sx={{ 
            color: 'success.main',
            fontWeight: 500
          }}
        >
          Successfully processed
        </Typography>
        {fileStatus.metadata?.processingEndTime && fileStatus.metadata?.processingStartTime && (
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'text.secondary',
              ml: 'auto'
            }}
          >
            Processed in {((fileStatus.metadata.processingEndTime - fileStatus.metadata.processingStartTime) / 1000).toFixed(1)}s
          </Typography>
        )}
      </Box>
    );
  }

  if (fileStatus.status === 'error') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{ 
            width: 20, 
            height: 20, 
            borderRadius: '50%', 
            backgroundColor: (theme) => alpha(theme.palette.error.main, 0.1),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 6L9 9" stroke="#FF1744" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6 6L3 3" stroke="#FF1744" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Box>
        <Typography variant="caption" color="error">
          {fileStatus.error}
        </Typography>
      </Box>
    );
  }

  return (
    <Button
      variant="contained"
      onClick={() => onProcess(fileStatus)}
      startIcon={<CloudUploadIcon />}
      size="small"
      sx={{ 
        borderRadius: 2,
        textTransform: 'none',
        px: 2
      }}
    >
      Process
    </Button>
  );
};

const UploadContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
  padding: theme.spacing(3),
  backgroundColor: '#fff',
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
}));

const DropzoneContainer = styled(Box)(({ theme }) => ({
  border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
  borderRadius: theme.shape.borderRadius * 2,
  padding: theme.spacing(4),
  backgroundColor: alpha(theme.palette.primary.main, 0.02),
  transition: 'all 0.2s ease',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.05),
    borderColor: theme.palette.primary.main
  }
}));

const FileContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: '#fff',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2)
}));

const SpinAnimation = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const LoadingSpinner = styled('div')`
  animation: ${SpinAnimation} 1s linear infinite;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const DocumentUpload: React.FC = () => {
  const [files, setFiles] = useState<FileStatus[]>([]);
  const [existingData, setExistingData] = useState<ExistingDocument[]>([]);
  const [showExisting, setShowExisting] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const { id: chatbotId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExistingData = async () => {
      try {
        const response = await axios.get(`/chatbot/${chatbotId}`);
        const documents = response.data.chatbot?.training?.documents || [];
        setExistingData(documents.map((doc: any) => {
          if (!doc) return null;
          return {
            _id: doc._id || '',
            type: doc.type || '',
            fileType: doc.fileType || '',
            metadata: {
              originalName: doc.originalName || 'Untitled',
              size: doc.size || 0,
              mimeType: doc.fileType || '',
              createdAt: doc.createdAt || new Date().toISOString(),
              chunkCount: doc.chunks || 0,
              url: doc.originalName || ''
            }
          };
        }).filter(Boolean));
      } catch (error) {
        console.error('Error fetching existing data:', error);
        setExistingData([]);
      }
    };
    fetchExistingData();
  }, [chatbotId]);

  const handleDeleteTrainingData = async () => {
    try {
      setIsDeleting(true);
      await axios.delete(`/chatbot/${chatbotId}/training/documents`);
      setExistingData([]);
      setShowExisting(false);
    } catch (error) {
      console.error('Error deleting training data:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    try {
      setDeletingIds(prev => [...prev, docId]);
      const response = await axios.delete(`/chatbot/${chatbotId}/training/documents/${docId}`);
      if (response.status === 200) {
        setExistingData(prev => prev.filter(doc => doc._id !== docId));
      } else {
        console.error('Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
    } finally {
      setDeletingIds(prev => prev.filter(id => id !== docId));
    }
  };

  const handleDeleteWebsite = async (url: string, docId: string) => {
    try {
      setDeletingIds(prev => [...prev, docId]);
      const response = await axios.delete(`/chatbot/${chatbotId}/training/website`, {
        data: { url }
      });
      if (response.status === 200) {
        setExistingData(prev => prev.filter(doc => 
          doc.type !== 'website' || doc.metadata.originalName !== url
        ));
      } else {
        console.error('Failed to delete website data');
      }
    } catch (error) {
      console.error('Error deleting website data:', error);
    } finally {
      setDeletingIds(prev => prev.filter(id => id !== docId));
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setShowExisting(false);
    const newFiles = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending' as const,
      chunkCount: 0,
      processingStartTime: 0,
      processingEndTime: 0
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls', '.xlsx']
    },
    maxSize: 10485760 // 10MB
  });

  const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB chunks
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB max file size

  interface ProcessingStats {
    startTime: number;
    processedChunks: number;
    totalChunks: number;
    currentSpeed: number;
  }

  const processFile = async (fileStatus: FileStatus) => {
    if (fileStatus.status === 'pending') {
      const updateProgress = (stage: string, progress: number) => {
        setFiles(prev =>
          prev.map(fs =>
            fs.file.name === fileStatus.file.name
              ? { 
                ...fs, 
                status: 'processing',
                processingStage: stage,
                progress
              }
              : fs
          )
        );
      };

      try {
        // Start processing
        updateProgress('Loading document', 5);
        
        // Read file as base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const base64Content = reader.result as string;
            // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
            const base64Data = base64Content.split(',')[1];
            resolve(base64Data);
          };
          reader.onerror = () => reject(reader.error);
        });
        
        reader.readAsDataURL(fileStatus.file);
        const base64Content = await base64Promise;
        
        updateProgress('Preparing document', 20);
        
        // Prepare document data
        const documentData = {
          files: [{
            content: base64Content,
            metadata: {
              name: fileStatus.file.name,
              type: fileStatus.file.type,
              size: fileStatus.file.size
            }
          }]
        };

        // Send to backend
        const response = await axios.post(`/chatbot/${chatbotId}/train/documents`, documentData, {
          headers: {
            'Content-Type': 'application/json',
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              const stage = progress < 20 ? 'Loading document' 
                : progress < 40 ? 'Splitting content'
                : progress < 70 ? 'Creating embeddings'
                : progress < 90 ? 'Storing vectors'
                : 'Finalizing';
              updateProgress(stage, progress);
            }
          }
        });

        // Update file status on success
        setFiles(prev =>
          prev.map(fs =>
            fs.file.name === fileStatus.file.name
              ? {
                ...fs,
                status: 'success',
                progress: 100,
                processingStage: 'Completed',
                ...response.data
              }
              : fs
          )
        );
      } catch (error: unknown) {
        console.error('Error processing file:', error);
        const errorMessage = error instanceof Error 
          ? error.message 
          : error instanceof Object && 'response' in error 
            ? (error.response as any)?.data?.message 
            : 'Error processing file';
        
        setFiles(prev =>
          prev.map(fs =>
            fs.file.name === fileStatus.file.name
              ? {
                ...fs,
                status: 'error',
                error: errorMessage
              }
              : fs
          )
        );
      }
    }
  };

  return (
    <UploadContainer>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h2">Document Training</Typography>
        {existingData.length > 0 && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDeleteTrainingData}
            disabled={isDeleting || existingData.length === 0}
          >
            DELETE ALL TRAINING DATA
          </Button>
        )}
      </Box>

      <DropzoneContainer {...getRootProps()}>
        <input {...getInputProps()} />
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          gap: 2
        }}>
          <Box sx={{ 
            width: 60, 
            height: 60, 
            borderRadius: '50%', 
            backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CloudUploadIcon sx={{ fontSize: 30, color: 'primary.main' }} />
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ mb: 1, color: 'text.primary' }}>
              Drop your documents here
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Support for PDF, DOCX, TXT files (max 10MB)
            </Typography>
          </Box>
        </Box>
      </DropzoneContainer>

      {files.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
            Uploaded Documents
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {files.map((fileStatus, index) => (
              <FileContainer key={index} elevation={0}>
                <Box sx={{ 
                  width: 40, 
                  height: 40, 
                  borderRadius: 1,
                  backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 3H6c-.55 0-1 .45-1 1v14c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V8l-5-5zm-2 10H7v-2h4v2zm0-4H7v-2h4v2zm0-4H7V7h4v2z" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                    {fileStatus.file.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatBytes(fileStatus.file.size)}
                  </Typography>
                </Box>
                <FileItemSecondary fileStatus={fileStatus} onProcess={processFile} />
              </FileContainer>
            ))}
          </Box>
        </Box>
      )}

      {existingData.length > 0 && showExisting && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
            Existing Training Data
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {existingData.map((doc) => {
              if (!doc || !doc.metadata) return null;
              const isDeleting = deletingIds.includes(doc._id);
              return (
                <Box key={doc._id} sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 2,
                  borderBottom: '1px solid',
                  borderColor: 'divider'
                }}>
                  <Box>
                    <Typography variant="subtitle1">
                      {doc.metadata.originalName || 'Untitled'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatBytes(doc.metadata.size)} • {new Date(doc.metadata.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                  <IconButton
                    onClick={() => doc.type === 'website' && doc.metadata.url
                      ? handleDeleteWebsite(doc.metadata.url, doc._id)
                      : handleDeleteDocument(doc._id)
                    }
                    disabled={isDeleting || deletingIds.includes(doc._id)}
                    sx={{ 
                      position: 'relative',
                      '&.Mui-disabled': {
                        color: 'text.disabled'
                      }
                    }}
                  >
                    {deletingIds.includes(doc._id) ? (
                      <CircularProgress
                        size={20}
                        sx={{
                          color: 'primary.main',
                        }}
                      />
                    ) : (
                      <DeleteIcon />
                    )}
                  </IconButton>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}
    </UploadContainer>
  );
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export default DocumentUpload;
