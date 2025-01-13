import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  IconButton,
  Button,
  useTheme,
  useMediaQuery,
  Drawer,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatSession {
  _id: string;
  sessionId: string;
  startTime: string;
  endTime?: string;
  isActive: boolean;
  messages: ChatMessage[];
}

interface ChatHistorySidebarProps {
  open: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  currentSessionId: string;
  onSessionSelect: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
}

const drawerWidth = 240;

function getLastMessage(session: ChatSession): string {
  if (session.messages.length === 0) {
    return 'No messages';
  }
  const lastMessage = session.messages[session.messages.length - 1];
  return lastMessage.content.length > 60
    ? lastMessage.content.substring(0, 60) + '...'
    : lastMessage.content;
}

function formatSessionDate(dateStr: string | undefined) {
  if (!dateStr) return '';
  
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'less than a minute ago';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `about ${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }
}

const ChatHistorySidebar: React.FC<ChatHistorySidebarProps> = ({
  open,
  onClose,
  sessions,
  currentSessionId,
  onSessionSelect,
  onNewChat,
  onDeleteSession,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [sessionToDelete, setSessionToDelete] = React.useState<string | null>(null);

  const handleDeleteClick = (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSessionToDelete(sessionId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (sessionToDelete) {
      onDeleteSession(sessionToDelete);
    }
    setDeleteDialogOpen(false);
    setSessionToDelete(null);
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setSessionToDelete(null);
  };

  return (
    <>
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={open}
        onClose={onClose}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
          },
        }}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          height: '100%'
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            borderBottom: 1,
            borderColor: 'divider'
          }}>
            <Typography variant="h6" noWrap>
              Chat History
            </Typography>
            {isMobile && (
              <IconButton onClick={onClose} edge="end">
                <CloseIcon />
              </IconButton>
            )}
          </Box>

          <Button
            variant="contained"
            onClick={onNewChat}
            sx={{
              m: 2,
              py: 1.5,
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
              },
              display: 'flex',
              gap: 1,
            }}
          >
            <ChatBubbleOutlineIcon />
            New Chat
          </Button>

          {sessions.length === 0 ? (
            <Box sx={{ 
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              color: 'text.secondary',
              textAlign: 'center'
            }}>
              <ChatBubbleOutlineIcon sx={{ fontSize: 40, opacity: 0.5 }} />
              <Typography variant="body1">
                No chat history yet
              </Typography>
              <Typography variant="body2">
                Your conversations will appear here
              </Typography>
            </Box>
          ) : (
            <List sx={{ 
              overflow: 'auto', 
              flex: 1,
              '& .MuiListItem-root': {
                transition: 'background-color 0.2s ease',
              }
            }}>
              {sessions.map((session) => (
                <ListItem 
                  key={session.sessionId} 
                  disablePadding
                  sx={{ 
                    borderBottom: 1, 
                    borderColor: 'divider',
                    position: 'relative',
                    '&:hover .delete-button': {
                      opacity: 1,
                    },
                  }}
                >
                  <ListItemButton
                    selected={session.sessionId === currentSessionId}
                    onClick={() => onSessionSelect(session.sessionId)}
                    sx={{ 
                      py: 2,
                      px: 2,
                      transition: 'all 0.2s ease',
                      '&.Mui-selected': {
                        backgroundColor: 'primary.main',
                        color: 'primary.contrastText',
                        '&:hover': {
                          backgroundColor: 'primary.dark',
                        },
                      },
                      '&:hover': {
                        backgroundColor: session.sessionId === currentSessionId ? 'primary.dark' : 'action.hover',
                      },
                    }}
                  >
                    <ListItemText
                      primary={formatSessionDate(session.startTime)}
                      secondary={getLastMessage(session)}
                      primaryTypographyProps={{
                        variant: 'subtitle2',
                        color: session.sessionId === currentSessionId ? 'inherit' : 'text.primary',
                        sx: { 
                          mb: 0.5,
                          fontWeight: session.sessionId === currentSessionId ? 600 : 400
                        }
                      }}
                      secondaryTypographyProps={{
                        variant: 'body2',
                        color: session.sessionId === currentSessionId ? 'inherit' : 'text.secondary',
                        noWrap: true,
                        sx: { 
                          opacity: session.sessionId === currentSessionId ? 0.9 : 0.7,
                          fontWeight: session.sessionId === currentSessionId ? 500 : 400
                        }
                      }}
                    />
                    <IconButton
                      className="delete-button"
                      onClick={(e) => handleDeleteClick(session.sessionId, e)}
                      sx={{
                        opacity: 0,
                        transition: 'opacity 0.2s ease',
                        position: 'absolute',
                        right: 8,
                        color: session.sessionId === currentSessionId ? 'inherit' : 'text.secondary',
                        '&:hover': {
                          backgroundColor: session.sessionId === currentSessionId 
                            ? 'rgba(255, 255, 255, 0.1)' 
                            : 'rgba(0, 0, 0, 0.04)',
                        },
                      }}
                      size="small"
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Drawer>

      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">
          Delete Chat History
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this chat? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ChatHistorySidebar;
