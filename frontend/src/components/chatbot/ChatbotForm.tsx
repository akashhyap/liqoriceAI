import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Stack,
    Typography,
    Alert,
    Slider,
    FormControlLabel,
    Switch
} from '@mui/material';
import { Chatbot } from '../../types';

interface ChatbotFormProps {
    chatbot?: Chatbot;
    onSubmit: (data: Partial<Chatbot>) => Promise<void>;
}

const CHANNELS = [
    { value: 'web', label: 'Website Widget' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'facebook', label: 'Facebook Messenger' },
    { value: 'instagram', label: 'Instagram' }
];

const ChatbotForm: React.FC<ChatbotFormProps> = ({ chatbot, onSubmit }) => {
    const [formData, setFormData] = useState({
        name: chatbot?.name || '',
        description: chatbot?.description || '',
        channels: chatbot?.channels || ['web'],
        settings: {
            language: chatbot?.settings?.language || 'en',
            welcomeMessage: chatbot?.settings?.welcomeMessage || 'Hello! How can I help you today?',
            personality: chatbot?.settings?.personality || 'professional',
            modelSettings: {
                temperature: chatbot?.settings?.modelSettings?.temperature || 0.7,
                maxTokens: chatbot?.settings?.modelSettings?.maxTokens || 2048
            }
        },
        widgetSettings: {
            theme: {
                primaryColor: chatbot?.widgetSettings?.theme?.primaryColor || '#007AFF',
                fontFamily: chatbot?.widgetSettings?.theme?.fontFamily || 'Inter'
            },
            position: chatbot?.widgetSettings?.position || 'bottom-right',
            size: chatbot?.widgetSettings?.size || 'medium'
        },
        deployment: {
            status: chatbot?.deployment?.status || 'draft'
        }
    });
    const [error, setError] = useState<string | null>(null);

    const handleChange = (field: string, value: any) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSettingsChange = (field: string, value: any) => {
        setFormData((prev) => ({
            ...prev,
            settings: {
                ...prev.settings,
                [field]: value
            }
        }));
    };

    const handleModelSettingsChange = (field: string, value: any) => {
        setFormData((prev) => ({
            ...prev,
            settings: {
                ...prev.settings,
                modelSettings: {
                    ...prev.settings.modelSettings,
                    [field]: value
                }
            }
        }));
    };

    const handleWidgetSettingsChange = (field: string, value: any) => {
        setFormData((prev) => ({
            ...prev,
            widgetSettings: {
                ...prev.widgetSettings,
                [field]: value
            }
        }));
    };

    const handleDeploymentStatusChange = (field: string, value: any) => {
        setFormData((prev) => ({
            ...prev,
            deployment: {
                ...prev.deployment,
                [field]: value
            }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            await onSubmit(formData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    return (
        <Card>
            <CardContent>
                <Box component="form" onSubmit={handleSubmit}>
                    <Stack spacing={3}>
                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {error}
                            </Alert>
                        )}

                        <Typography variant="h6">Basic Information</Typography>
                        <TextField
                            fullWidth
                            label="Name"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            required
                        />
                        <TextField
                            fullWidth
                            label="Description"
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            multiline
                            rows={3}
                        />

                        <FormControl fullWidth>
                            <InputLabel sx={{ px: 1, backgroundColor: '#ffffff' }}>Channels</InputLabel>
                            <Select
                                multiple
                                value={formData.channels}
                                onChange={(e) => handleChange('channels', e.target.value)}
                                renderValue={(selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {selected.map((value: string) => (
                                            <Chip
                                                key={value}
                                                label={
                                                    CHANNELS.find((c) => c.value === value)?.label
                                                }
                                            />
                                        ))}
                                    </Box>
                                )}
                            >
                                {CHANNELS.map((channel) => (
                                    <MenuItem key={channel.value} value={channel.value}>
                                        {channel.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Typography variant="h6">Chatbot Settings</Typography>
                        <FormControl fullWidth>
                            <InputLabel sx={{ px: 1, backgroundColor: '#ffffff' }}>Language</InputLabel>
                            <Select
                                value={formData.settings.language}
                                onChange={(e) =>
                                    handleSettingsChange('language', e.target.value)
                                }
                            >
                                <MenuItem value="en">English</MenuItem>
                                <MenuItem value="es">Spanish</MenuItem>
                                <MenuItem value="fr">French</MenuItem>
                                <MenuItem value="de">German</MenuItem>
                                <MenuItem value="zh">Chinese</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            label="Welcome Message"
                            value={formData.settings.welcomeMessage}
                            onChange={(e) =>
                                handleSettingsChange('welcomeMessage', e.target.value)
                            }
                        />

                        <FormControl fullWidth>
                            <InputLabel sx={{ px: 1, backgroundColor: '#ffffff' }}>Personality</InputLabel>
                            <Select
                                value={formData.settings.personality}
                                onChange={(e) =>
                                    handleSettingsChange('personality', e.target.value)
                                }
                            >
                                <MenuItem value="professional">Professional</MenuItem>
                                <MenuItem value="friendly">Friendly</MenuItem>
                                <MenuItem value="casual">Casual</MenuItem>
                                <MenuItem value="formal">Formal</MenuItem>
                            </Select>
                        </FormControl>

                        <Typography variant="h6">Model Settings</Typography>
                        <Box>
                            <Typography gutterBottom>Temperature</Typography>
                            <Slider
                                value={formData.settings.modelSettings.temperature}
                                onChange={(_, value) =>
                                    handleModelSettingsChange('temperature', value)
                                }
                                min={0}
                                max={1}
                                step={0.1}
                                marks
                                valueLabelDisplay="auto"
                            />
                        </Box>

                        <Box>
                            <Typography gutterBottom>Max Tokens</Typography>
                            <Slider
                                value={formData.settings.modelSettings.maxTokens}
                                onChange={(_, value) =>
                                    handleModelSettingsChange('maxTokens', value)
                                }
                                min={256}
                                max={4096}
                                step={256}
                                marks
                                valueLabelDisplay="auto"
                            />
                        </Box>

                        <Typography variant="h6" sx={{ mt: 3 }}>Widget Settings</Typography>
                        <TextField
                            fullWidth
                            label="Primary Color"
                            type="color"
                            value={formData.widgetSettings.theme.primaryColor}
                            onChange={(e) =>
                                handleWidgetSettingsChange('theme', {
                                    ...formData.widgetSettings.theme,
                                    primaryColor: e.target.value
                                })
                            }
                            InputProps={{
                                sx: { height: 56 }
                            }}
                        />

                        <FormControl fullWidth>
                            <InputLabel sx={{ px: 1, backgroundColor: '#ffffff' }}>Font Family</InputLabel>
                            <Select
                                value={formData.widgetSettings.theme.fontFamily}
                                onChange={(e) =>
                                    handleWidgetSettingsChange('theme', {
                                        ...formData.widgetSettings.theme,
                                        fontFamily: e.target.value
                                    })
                                }
                            >
                                <MenuItem value="Inter">Inter</MenuItem>
                                <MenuItem value="Arial">Arial</MenuItem>
                                <MenuItem value="Roboto">Roboto</MenuItem>
                                <MenuItem value="Open Sans">Open Sans</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel sx={{ px: 1, backgroundColor: '#ffffff' }}>Widget Position</InputLabel>
                            <Select
                                value={formData.widgetSettings.position}
                                onChange={(e) =>
                                    handleWidgetSettingsChange('position', e.target.value)
                                }
                            >
                                <MenuItem value="bottom-right">Bottom Right</MenuItem>
                                <MenuItem value="bottom-left">Bottom Left</MenuItem>
                                <MenuItem value="top-right">Top Right</MenuItem>
                                <MenuItem value="top-left">Top Left</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel sx={{ px: 1, backgroundColor: '#ffffff' }}>Widget Size</InputLabel>
                            <Select
                                value={formData.widgetSettings.size}
                                onChange={(e) =>
                                    handleWidgetSettingsChange('size', e.target.value)
                                }
                            >
                                <MenuItem value="small">Small</MenuItem>
                                <MenuItem value="medium">Medium</MenuItem>
                                <MenuItem value="large">Large</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel sx={{ px: 1, backgroundColor: '#ffffff' }}>Deployment Status</InputLabel>
                            <Select
                                value={formData.deployment.status}
                                onChange={(e) =>
                                    handleDeploymentStatusChange('status', e.target.value)
                                }
                            >
                                <MenuItem value="draft">Draft</MenuItem>
                                <MenuItem value="training">Training</MenuItem>
                                <MenuItem value="trained">Trained</MenuItem>
                                <MenuItem value="deploying">Deploying</MenuItem>
                                <MenuItem value="deployed">Deployed</MenuItem>
                                <MenuItem value="error">Error</MenuItem>
                            </Select>
                        </FormControl>

                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            size="large"
                            fullWidth
                            sx={{ mt: 2 }}
                        >
                            {chatbot ? 'Save Changes' : 'Create Chatbot'}
                        </Button>
                    </Stack>
                </Box>
            </CardContent>
        </Card>
    );
};

export default ChatbotForm;
