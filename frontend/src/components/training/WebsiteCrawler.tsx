import React, { useState, useEffect } from 'react';
import {
    Paper,
    TextField,
    Button,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    IconButton,
    CircularProgress,
    Alert,
    Box,
    Fade,
    Grow,
    Slide
} from '@mui/material';
import {
    Language as WebIcon,
    Delete as DeleteIcon,
    CheckCircle as SuccessIcon,
    Error as ErrorIcon
} from '@mui/icons-material';
import axios from '../../services/axios';

interface Props {
    botId: string;
}

interface CrawledUrl {
    url: string;
    status: 'pending' | 'crawling' | 'success' | 'error';
    error?: string;
    pagesProcessed?: number;
    crawledAt?: string;
    totalTokens?: number;
    _id?: string;
}

const WebsiteCrawler: React.FC<Props> = ({ botId }) => {
    const [url, setUrl] = useState('');
    const [crawledUrls, setCrawledUrls] = useState<CrawledUrl[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [deletingUrls, setDeletingUrls] = useState<string[]>([]);

    useEffect(() => {
        const fetchWebsites = async () => {
            try {
                const response = await axios.get(`/chatbot/${botId}`);
                const websites = response.data.chatbot?.training?.websites || [];
                setCrawledUrls(websites.map((site: any) => ({
                    url: site.url,
                    status: site.status || 'success',
                    pagesProcessed: site.pagesProcessed,
                    crawledAt: site.lastCrawled,
                    _id: site._id
                })));
            } catch (error) {
                console.error('Error fetching websites:', error);
            }
        };
        fetchWebsites();
    }, [botId]);

    const validateUrl = (url: string) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!validateUrl(url)) {
            setError('Please enter a valid URL');
            return;
        }

        // Check if URL is already in the list
        if (crawledUrls.some(item => item.url === url)) {
            setError('This URL has already been added');
            return;
        }

        const newUrl: CrawledUrl = {
            url,
            status: 'pending'
        };

        setCrawledUrls(prev => [...prev, newUrl]);
        setUrl('');
    };

    const startCrawling = async (urlItem: CrawledUrl) => {
        try {
            setCrawledUrls(prev =>
                prev.map(item =>
                    item.url === urlItem.url
                        ? { ...item, status: 'crawling' }
                        : item
                )
            );

            const response = await axios.post(`/training/website/${botId}`, {
                url: urlItem.url,
                maxDepth: 2 // Using default value
            });

            setCrawledUrls(prev =>
                prev.map(item =>
                    item.url === urlItem.url
                        ? {
                            ...item,
                            status: 'success',
                            pagesProcessed: response.data.documentsProcessed,
                            crawledAt: new Date().toISOString()
                        }
                        : item
                )
            );
        } catch (error: any) {
            setCrawledUrls(prev =>
                prev.map(item =>
                    item.url === urlItem.url
                        ? {
                            ...item,
                            status: 'error',
                            error: error.response?.data?.message || 'Website training failed'
                        }
                        : item
                )
            );
        }
    };

    const handleDelete = async (urlToRemove: CrawledUrl) => {
        try {
            setDeletingUrls(prev => [...prev, urlToRemove.url]);

            // Only make API call if the URL has been crawled (has _id and status is 'success')
            if (urlToRemove._id && urlToRemove.status === 'success') {
                await axios.delete(`/chatbot/${botId}/train/websites/${urlToRemove._id}`);
            }

            // Remove from frontend state regardless of API call
            setCrawledUrls(prev => prev.filter(item => item.url !== urlToRemove.url));
        } catch (error) {
            console.error('Error deleting website:', error);
            // Keep the URL in the list if API call fails
            if (urlToRemove._id && urlToRemove.status === 'success') {
                setError('Failed to delete website. Please try again.');
            }
        } finally {
            setDeletingUrls(prev => prev.filter(url => url !== urlToRemove.url));
        }
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
                Website Crawler
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
                Add websites to crawl and train your chatbot with their content.
            </Typography>

            <form onSubmit={handleSubmit}>
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <TextField
                        fullWidth
                        label="Website URL"
                        placeholder="https://example.com"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        error={!!error}
                        helperText={error}
                    />
                    <Button
                        variant="contained"
                        type="submit"
                        sx={{ minWidth: 120, borderRadius: '8px', color: '#ffffff' }}
                    >
                        Add URL
                    </Button>
                </Box>
            </form>

            {crawledUrls.length > 0 && (
                <List sx={{ mt: 3 }}>
                    {crawledUrls.map((crawledUrl, index) => (
                        <Grow
                            in={true}
                            key={index}
                            timeout={300 + index * 100}
                        >
                            <ListItem
                                sx={{
                                    bgcolor: 'background.paper',
                                    borderRadius: 1,
                                    mb: 1,
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                    transition: 'all 0.3s ease-in-out',
                                    '&:hover': {
                                        bgcolor: 'action.hover',
                                        transform: 'translateX(8px)'
                                    }
                                }}
                            >
                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    width: '100%',
                                    mb: crawledUrl.status === 'success' ? 1 : 0
                                }}>
                                    <ListItemIcon>
                                        <WebIcon />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={crawledUrl.url}
                                        secondaryTypographyProps={{
                                            component: 'div'
                                        }}
                                        secondary={
                                            <Fade in={true} timeout={500}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    {crawledUrl.status === 'pending' && (
                                                        <Button
                                                            size="small"
                                                            onClick={() => startCrawling(crawledUrl)}
                                                            sx={{
                                                                transition: 'all 0.2s ease-in-out',
                                                                '&:hover': {
                                                                    transform: 'scale(1.05)'
                                                                }
                                                            }}
                                                        >
                                                            Start Crawling
                                                        </Button>
                                                    )}
                                                    {crawledUrl.status === 'crawling' && (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <CircularProgress
                                                                size={16}
                                                                sx={{
                                                                    color: 'primary.main',
                                                                    '@keyframes shimmer': {
                                                                        '0%': {
                                                                            opacity: 0.5,
                                                                        },
                                                                        '50%': {
                                                                            opacity: 1,
                                                                        },
                                                                        '100%': {
                                                                            opacity: 0.5,
                                                                        },
                                                                    },
                                                                    animation: 'shimmer 1.5s ease-in-out infinite'
                                                                }}
                                                            />
                                                            <Typography
                                                                component="span"
                                                                variant="body2"
                                                                sx={{
                                                                    color: 'primary.main',
                                                                    animation: 'shimmer 1.5s ease-in-out infinite',
                                                                    '@keyframes shimmer': {
                                                                        '0%': {
                                                                            opacity: 0.5,
                                                                        },
                                                                        '50%': {
                                                                            opacity: 1,
                                                                        },
                                                                        '100%': {
                                                                            opacity: 0.5,
                                                                        },
                                                                    },
                                                                }}
                                                            >
                                                                Crawling website...
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                    {crawledUrl.status === 'success' && (
                                                        <span style={{ display: 'flex', alignItems: 'center' }}>
                                                            <SuccessIcon
                                                                color="success"
                                                                sx={{
                                                                    mr: 1,
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
                                                            Crawled successfully
                                                        </span>
                                                    )}
                                                    {crawledUrl.status === 'error' && (
                                                        <span style={{ display: 'flex', alignItems: 'center' }}>
                                                            <ErrorIcon
                                                                color="error"
                                                                sx={{
                                                                    mr: 1,
                                                                    animation: 'shake 0.5s ease-in-out',
                                                                    '@keyframes shake': {
                                                                        '0%, 100%': {
                                                                            transform: 'translateX(0)',
                                                                        },
                                                                        '25%': {
                                                                            transform: 'translateX(-4px)',
                                                                        },
                                                                        '75%': {
                                                                            transform: 'translateX(4px)',
                                                                        },
                                                                    },
                                                                }}
                                                            />
                                                            {crawledUrl.error}
                                                        </span>
                                                    )}
                                                </Box>
                                            </Fade>
                                        }
                                    />
                                    {crawledUrl.status === 'pending' && (
                                        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
                                            <IconButton
                                                onClick={() => handleDelete(crawledUrl)}
                                                disabled={deletingUrls.includes(crawledUrl.url)}
                                                sx={{ 
                                                    position: 'relative',
                                                    '&.Mui-disabled': {
                                                        color: 'text.disabled'
                                                    }
                                                }}
                                            >
                                                {deletingUrls.includes(crawledUrl.url) ? (
                                                    <CircularProgress
                                                        size={20}
                                                        sx={{
                                                            color: 'primary.main'
                                                        }}
                                                    />
                                                ) : (
                                                    <DeleteIcon />
                                                )}
                                            </IconButton>
                                        </Box>
                                    )}
                                </Box>
                                {crawledUrl.status === 'success' && (
                                    <Slide direction="right" in={true} timeout={500}>
                                        <Box sx={{ pl: 7, width: '100%' }}>
                                            <Typography variant="body2" color="text.secondary">
                                                Pages processed: {crawledUrl.pagesProcessed}
                                                {crawledUrl.totalTokens && ` • Total tokens: ${crawledUrl.totalTokens.toLocaleString()}`}
                                                {crawledUrl.crawledAt && ` • Crawled on ${new Date(crawledUrl.crawledAt).toLocaleDateString()}`}
                                            </Typography>
                                        </Box>
                                    </Slide>
                                )}
                            </ListItem>
                        </Grow>
                    ))}
                </List>
            )}

            {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                </Alert>
            )}
        </Paper>
    );
};

export default WebsiteCrawler;
