import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    IconButton,
    Chip,
    Menu,
    MenuItem,
    ListItemIcon,
} from '@mui/material';
import {
    Settings,
    MoreVert,
    Edit,
    School
} from '@mui/icons-material';
import { Chatbot } from '../../types';
import { useNavigate } from 'react-router-dom';

interface ChatbotListProps {
    chatbots: Chatbot[];
    onEdit: (chatbot: Chatbot) => void;
}

const ChatbotList: React.FC<ChatbotListProps> = ({ chatbots, onEdit }) => {
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedChatbot, setSelectedChatbot] = useState<Chatbot | null>(null);

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>, chatbot: Chatbot) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
        setSelectedChatbot(chatbot);
    };

    const handleClose = () => {
        setAnchorEl(null);
        setSelectedChatbot(null);
    };

    const handleEdit = () => {
        if (selectedChatbot) {
            navigate(`/app/chatbot/${selectedChatbot._id}/settings`);
            handleClose();
        }
    };

    const handleTrain = () => {
        if (selectedChatbot) {
            navigate(`/app/chatbot/${selectedChatbot._id}/train`);
            handleClose();
        }
    };

    const handleSettings = (chatbotId: string) => {
        navigate(`/app/chatbot/${chatbotId}/settings`);
    };

    if (!Array.isArray(chatbots)) {
        return null;
    }

    if (chatbots.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="textSecondary">
                    No chatbots found. Create your first chatbot to get started!
                </Typography>
            </Box>
        );
    }

    return (
        <Grid container spacing={3}>
            {chatbots.map((chatbot) => (
                <Grid item xs={12} sm={6} md={4} key={chatbot._id}>
                    <Card
                        onClick={() => handleSettings(chatbot._id)}
                        sx={{
                            height: '100%',
                            display: 'flex',
                            cursor: 'pointer',
                            p: 3,
                            flexDirection: 'column',
                            borderRadius: '16px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            }
                        }}
                    >
                        <CardContent sx={{ flexGrow: 1, position: 'relative', p: 0 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
                                    {chatbot.name}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: '4px' }}>
                                    {/* <IconButton
                                        size="small"
                                        onClick={() => handleSettings(chatbot._id)}
                                    >
                                        <Settings fontSize="small" />
                                    </IconButton> */}
                                    <IconButton
                                        size="small"
                                        onClick={(e) => handleMenuClick(e, chatbot)}
                                        aria-controls={Boolean(anchorEl) ? 'chatbot-menu' : undefined}
                                        aria-haspopup="true"
                                        aria-expanded={Boolean(anchorEl) ? 'true' : undefined}
                                    >
                                        <MoreVert fontSize="small" />
                                    </IconButton>
                                </Box>
                            </Box>

                            {chatbot.description && (
                                <Typography
                                    color="textSecondary"
                                    sx={{
                                        mb: 2,
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        fontSize: '0.875rem'
                                    }}
                                >
                                    {chatbot.description}
                                </Typography>
                            )}

                            {chatbot.channels && chatbot.channels.length > 0 && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography
                                        variant="subtitle2"
                                        sx={{
                                            mb: 1,
                                            fontSize: '0.875rem',
                                            fontWeight: 500
                                        }}
                                    >
                                        Channels
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                        {chatbot.channels.map((channel) => (
                                            <Chip
                                                key={channel}
                                                label={channel}
                                                size="small"
                                                sx={{
                                                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                                    borderRadius: '6px',
                                                    height: '24px',
                                                    fontSize: '0.75rem'
                                                }}
                                            />
                                        ))}
                                    </Box>
                                </Box>
                            )}

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 'auto' }}>
                                <Typography
                                    variant="subtitle2"
                                    sx={{
                                        fontSize: '0.875rem',
                                        fontWeight: 500
                                    }}
                                >
                                    Status
                                </Typography>
                                <Chip
                                    label={chatbot.deployment?.status || 'draft'}
                                    size="small"
                                    color={chatbot.deployment?.status === 'deployed' ? 'success' : 'default'}
                                    sx={{
                                        height: '24px',
                                        fontSize: '0.75rem',
                                        fontWeight: 500,
                                        borderRadius: '6px',
                                        backgroundColor: chatbot.deployment?.status === 'deployed'
                                            ? 'rgba(84, 214, 44, 0.16)'
                                            : 'rgba(145, 158, 171, 0.16)',
                                        color: chatbot.deployment?.status === 'deployed'
                                            ? '#229A16'
                                            : '#637381',
                                        '& .MuiChip-label': {
                                            px: 1
                                        }
                                    }}
                                />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            ))}

            <Menu
                id="chatbot-menu"
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                PaperProps={{
                    elevation: 2,
                    sx: {
                        borderRadius: 2,
                        minWidth: 180
                    }
                }}
            >
                <MenuItem onClick={handleEdit}>
                    <ListItemIcon>
                        <Edit fontSize="small" />
                    </ListItemIcon>
                    Edit
                </MenuItem>
                <MenuItem onClick={handleTrain}>
                    <ListItemIcon>
                        <School fontSize="small" />
                    </ListItemIcon>
                    Train
                </MenuItem>
            </Menu>
        </Grid>
    );
};

export default ChatbotList;
