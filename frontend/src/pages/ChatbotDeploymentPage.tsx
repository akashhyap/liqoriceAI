import React, { useState, useEffect } from 'react';
import {
    Container,
    Box,
    Typography,
    Button,
    Paper,
    Alert,
    CircularProgress,
    TextField,
    Snackbar
} from '@mui/material';
import { useParams, Link } from 'react-router-dom';
import axios from '../services/axios';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const ChatbotDeploymentPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [deploying, setDeploying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [widgetCode, setWidgetCode] = useState<string>('');
    const [copySuccess, setCopySuccess] = useState(false);
    const [chatbot, setChatbot] = useState<any>(null);

    useEffect(() => {
        fetchChatbotStatus();
    }, [id]);

    const fetchChatbotStatus = async () => {
        try {
            const response = await axios.get(`/chatbot/${id}`);
            setChatbot(response.data);
            if (response.data.deployment.status === 'deployed') {
                fetchWidgetCode();
            }
            setLoading(false);
        } catch (err) {
            setError('Failed to load chatbot status');
            setLoading(false);
        }
    };

    const fetchWidgetCode = async () => {
        try {
            const response = await axios.get(`/chatbot/${id}/widget`);
            setWidgetCode(response.data.script);
        } catch (err) {
            setError('Failed to load widget code');
        }
    };

    const handleDeploy = async () => {
        setDeploying(true);
        setError(null);
        setSuccess(null);

        try {
            await axios.post(`/chatbot/${id}/deploy`);
            setSuccess('Chatbot deployed successfully');
            await fetchChatbotStatus();
        } catch (err) {
            setError('Failed to deploy chatbot');
        } finally {
            setDeploying(false);
        }
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(widgetCode);
        setCopySuccess(true);
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Deploy Your Chatbot
            </Typography>

            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Deployment Status
                </Typography>

                <Box sx={{ mb: 3 }}>
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                        Current Status: <strong>{chatbot?.deployment?.status || 'Not Deployed'}</strong>
                    </Typography>
                    {chatbot?.deployment?.lastDeployedAt && (
                        <Typography variant="body2" color="text.secondary">
                            Last Deployed: {new Date(chatbot.deployment.lastDeployedAt).toLocaleString()}
                        </Typography>
                    )}
                </Box>

                {chatbot?.deployment?.status !== 'deployed' && (
                    <Button
                        variant="contained"
                        onClick={handleDeploy}
                        disabled={deploying}
                    >
                        {deploying ? <CircularProgress size={24} /> : 'Deploy Chatbot'}
                    </Button>
                )}
            </Paper>

            {chatbot?.deployment?.status === 'deployed' && (
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Widget Embed Code
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Copy and paste this code into your website where you want the chat widget to appear.
                    </Typography>

                    <TextField
                        fullWidth
                        multiline
                        rows={8}
                        value={widgetCode}
                        variant="outlined"
                        InputProps={{
                            readOnly: true,
                        }}
                        sx={{ mb: 2, fontFamily: 'monospace' }}
                    />

                    <Button
                        variant="outlined"
                        startIcon={<ContentCopyIcon />}
                        onClick={handleCopyCode}
                    >
                        Copy Code
                    </Button>
                </Paper>
            )}

            {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mt: 2 }}>
                    {success}
                </Alert>
            )}
            
            <Snackbar
                open={copySuccess}
                autoHideDuration={3000}
                onClose={() => setCopySuccess(false)}
                message="Code copied to clipboard"
            />
        </Container>
    );
};

export default ChatbotDeploymentPage;
