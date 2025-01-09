import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    FormGroup,
    FormControlLabel,
    Switch,
    Button,
    Alert,
    Stack,
    Divider
} from '@mui/material';
import { notificationService, NotificationSettings as INotificationSettings } from '../../services/notificationService';

const NotificationSettings: React.FC = () => {
    const [settings, setSettings] = useState<INotificationSettings>({
        email: {
            newMessages: true,
            weeklyReports: true,
            systemUpdates: true
        },
        push: {
            enabled: true
        }
    });
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNotificationSettings();
    }, []);

    const loadNotificationSettings = async () => {
        try {
            const data = await notificationService.getNotificationSettings();
            setSettings(data);
        } catch (err) {
            console.error('Error loading notification settings:', err);
            setError(err instanceof Error ? err.message : 'Failed to load notification settings');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (
        category: keyof INotificationSettings,
        setting: string,
        checked: boolean
    ) => {
        setSettings((prev) => ({
            ...prev,
            [category]: {
                ...prev[category],
                [setting]: checked
            }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccess(false);
        setError(null);

        try {
            await notificationService.updateNotificationSettings(settings);
            setSuccess(true);
        } catch (err) {
            console.error('Error updating notification settings:', err);
            setError(err instanceof Error ? err.message : 'An error occurred while updating notification settings');
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent>
                    <Typography>Loading notification settings...</Typography>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Notification Settings
                </Typography>

                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                    <Stack spacing={3}>
                        {success && (
                            <Alert severity="success" sx={{ mb: 2 }}>
                                Notification settings updated successfully
                            </Alert>
                        )}
                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                        <Box>
                            <Typography variant="subtitle1" gutterBottom>
                                Email Notifications
                            </Typography>
                            <FormGroup>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={settings.email.newMessages}
                                            onChange={(e) =>
                                                handleChange(
                                                    'email',
                                                    'newMessages',
                                                    e.target.checked
                                                )
                                            }
                                        />
                                    }
                                    label="New Messages"
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={settings.email.weeklyReports}
                                            onChange={(e) =>
                                                handleChange(
                                                    'email',
                                                    'weeklyReports',
                                                    e.target.checked
                                                )
                                            }
                                        />
                                    }
                                    label="Weekly Reports"
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={settings.email.systemUpdates}
                                            onChange={(e) =>
                                                handleChange(
                                                    'email',
                                                    'systemUpdates',
                                                    e.target.checked
                                                )
                                            }
                                        />
                                    }
                                    label="System Updates"
                                />
                            </FormGroup>
                        </Box>

                        <Divider />

                        <Box>
                            <Typography variant="subtitle1" gutterBottom>
                                Push Notifications
                            </Typography>
                            <FormGroup>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={settings.push.enabled}
                                            onChange={(e) =>
                                                handleChange(
                                                    'push',
                                                    'enabled',
                                                    e.target.checked
                                                )
                                            }
                                        />
                                    }
                                    label="Enable Push Notifications"
                                />
                            </FormGroup>
                        </Box>

                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            sx={{ mt: 2 }}
                        >
                            Save Changes
                        </Button>
                    </Stack>
                </Box>
            </CardContent>
        </Card>
    );
};

export default NotificationSettings;
