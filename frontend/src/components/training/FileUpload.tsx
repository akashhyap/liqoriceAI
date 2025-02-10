import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Typography,
  Paper,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  Fade,
  Grow,
  Zoom,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  CheckCircle as SuccessIcon,
} from '@mui/icons-material';
import axios from 'axios';

interface FileUploadProps {
  botId: string;
  onUploadComplete?: () => void;
}

interface UploadedFile {
  name: string;
  size: number;
  status: 'uploading' | 'completed' | 'error';
  progress: number;
}

export default function FileUpload({ botId, onUploadComplete }: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      name: file.name,
      size: file.size,
      status: 'uploading' as const,
      progress: 0,
    }));

    setFiles((prev) => [...prev, ...newFiles]);

    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i];
      const formData = new FormData();
      formData.append('file', file);

      try {
        await axios.post(`/api/bots/${botId}/train`, formData, {
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 100)
            );
            setFiles((prev) =>
              prev.map((f, index) =>
                f.name === file.name
                  ? { ...f, progress, status: progress === 100 ? 'completed' : 'uploading' }
                  : f
              )
            );
          },
        });

        if (onUploadComplete) {
          onUploadComplete();
        }
      } catch (error) {
        console.error('Upload error:', error);
        setError('Failed to upload file. Please try again.');
        setFiles((prev) =>
          prev.map((f) =>
            f.name === file.name ? { ...f, status: 'error' } : f
          )
        );
      }
    }
  }, [botId, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
        '.docx',
      ],
    },
  });

  const removeFile = (fileName: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== fileName));
  };

  return (
    <Box>
      <Paper
        {...getRootProps()}
        sx={{
          p: 3,
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'divider',
          transition: 'all 0.3s ease-in-out',
          transform: isDragActive ? 'scale(1.02)' : 'scale(1)',
          '&:hover': {
            backgroundColor: 'action.hover',
            transform: 'scale(1.02)',
          },
        }}
      >
        <input {...getInputProps()} />
        <Zoom in={true} timeout={500}>
          <UploadIcon
            sx={{
              fontSize: 48,
              color: 'action.active',
              mb: 2,
              transition: 'all 0.3s ease-in-out',
              animation: isDragActive ? 'bounce 1s ease infinite' : 'none',
              '@keyframes bounce': {
                '0%, 100%': {
                  transform: 'translateY(0)',
                },
                '50%': {
                  transform: 'translateY(-10px)',
                },
              },
            }}
          />
        </Zoom>
        <Fade in={true} timeout={700}>
          <Box>
            <Typography variant="h6" gutterBottom>
              {isDragActive
                ? 'Drop the files here'
                : 'Drag & drop files here, or click to select files'}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Supported formats: PDF, DOC, DOCX, TXT
            </Typography>
          </Box>
        </Fade>
      </Paper>

      {error && (
        <Grow in={true} timeout={300}>
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        </Grow>
      )}

      {files.length > 0 && (
        <List sx={{ mt: 2 }}>
          {files.map((file, index) => (
            <Grow
              in={true}
              key={file.name}
              timeout={300 + index * 100}
            >
              <ListItem
                sx={{
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                  mb: 1,
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    bgcolor: 'action.hover',
                    transform: 'translateX(8px)',
                  },
                }}
              >
                <ListItemText
                  primary={file.name}
                  secondary={
                    file.status === 'uploading' ? (
                      <Box sx={{ mt: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <LinearProgress
                            variant="determinate"
                            value={file.progress}
                            sx={{
                              flexGrow: 1,
                              height: 6,
                              borderRadius: 3,
                              bgcolor: 'rgba(0, 0, 0, 0.08)',
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 3,
                                backgroundImage: 'linear-gradient(90deg, #00C6FB 0%, #005BEA 100%)',
                                transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                              }
                            }}
                          />
                          <Typography variant="caption" color="textSecondary" sx={{ ml: 2, minWidth: 40 }}>
                            {file.progress}%
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="textSecondary">
                          Uploading...
                        </Typography>
                      </Box>
                    ) : null
                  }
                />
                <ListItemSecondaryAction>
                  {file.status === 'completed' ? (
                    <Zoom in={true} timeout={500}>
                      <SuccessIcon
                        color="success"
                        sx={{
                          animation: 'pop 0.3s ease-out',
                          '@keyframes pop': {
                            '0%': {
                              transform: 'scale(0)',
                            },
                            '50%': {
                              transform: 'scale(1.2)',
                            },
                            '100%': {
                              transform: 'scale(1)',
                            },
                          },
                        }}
                      />
                    </Zoom>
                  ) : (
                    <IconButton
                      edge="end"
                      onClick={() => removeFile(file.name)}
                      sx={{
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          color: 'error.main',
                          transform: 'scale(1.1)',
                        },
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </ListItemSecondaryAction>
              </ListItem>
            </Grow>
          ))}
        </List>
      )}
    </Box>
  );
}
