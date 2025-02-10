import React, { useState, useEffect } from 'react';
import {
    Box,
    TextField,
    Button,
    Typography,
    Paper,
    Alert,
    CircularProgress
} from '@mui/material';
import axios from '../../services/axios';
import { useParams } from 'react-router-dom';

interface CustomPromptSettings {
    systemMessage: string;
}

const CustomPrompt: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [settings, setSettings] = useState<CustomPromptSettings>({
        systemMessage: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`/chatbot/${id}`);
                const settings = response.data.settings?.customPrompt || {
                    systemMessage: ''
                };
                setSettings({
                    systemMessage: settings.systemMessage || ''
                });
                setLoading(false);
            } catch (err) {
                setError('Failed to load custom prompt settings');
                setLoading(false);
            }
        };

        fetchSettings();
    }, [id]);

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            await axios.patch(`/chatbot/${id}/settings`, {
                customPrompt: {
                    systemMessage: settings.systemMessage
                }
            });
            setSuccess('Custom prompt settings saved successfully');
        } catch (err) {
            setError('Failed to save custom prompt settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
                Custom Prompt Settings
            </Typography>
            
            <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                    System Message
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Define your chatbot's expertise and purpose. This message guides how the AI understands and uses both its knowledge base and general capabilities.
                </Typography>
                <TextField
                    fullWidth
                    multiline
                    rows={6}
                    value={settings.systemMessage}
                    onChange={(e) => setSettings({ ...settings, systemMessage: e.target.value })}
                    placeholder="Example: You are a knowledgeable assistant specializing in pool services, with expertise in Pool Resurfacing, Pool Repairs, Pool Decks, and Pool Lighting in Las Vegas. Use the information from the uploaded documents to answer queries accurately. When a question isn't covered by the documents, offer general advice related to pool maintenance and improvement. Your goal is to help users enhance their pool's quality, safety, and aesthetics with practical steps."
                />
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {success}
                </Alert>
            )}

            <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving}
                sx={{ borderRadius: '8px', color: '#ffffff', mt: 2 }}
            >
                {saving ? <CircularProgress size={24} /> : 'Save Settings'}
            </Button>
        </Paper>
    );
};

export default CustomPrompt;
