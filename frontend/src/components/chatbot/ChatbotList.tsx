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
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <CardContent sx={{ flexGrow: 1, position: 'relative' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" component="h2">
                                    {chatbot.name}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: '4px' }}>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleSettings(chatbot._id)}
                                    >
                                        <Settings />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={(e) => handleMenuClick(e, chatbot)}
                                        aria-controls={Boolean(anchorEl) ? 'chatbot-menu' : undefined}
                                        aria-haspopup="true"
                                        aria-expanded={Boolean(anchorEl) ? 'true' : undefined}
                                    >
                                        <MoreVert />
                                    </IconButton>
                                </Box>
                            </Box>

                            <Typography
                                color="textSecondary"
                                sx={{
                                    mb: 2,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                }}
                            >
                                {chatbot.description}
                            </Typography>

                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Channels
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    {(chatbot.channels || []).map((channel) => (
                                        <Chip
                                            key={channel}
                                            label={channel}
                                            size="small"
                                        />
                                    ))}
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Status
                                </Typography>
                                <Chip
                                    label={chatbot.deployment?.status || 'draft'}
                                    size="small"
                                    color={chatbot.deployment?.status === 'deployed' ? 'success' : 'default'}
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
