import React, { useState } from 'react';
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

interface NotificationSettings {
    email: {
        newMessages: boolean;
        weeklyReport: boolean;
        systemUpdates: boolean;
    };
    web: {
        newMessages: boolean;
        chatbotStatus: boolean;
    };
    mobile: {
        pushNotifications: boolean;
        messageAlerts: boolean;
    };
}

interface NotificationSettingsProps {
    settings: {
        emailNotifications: boolean;
        pushNotifications: boolean;
        weeklyDigest: boolean;
    };
    onSettingChange: (setting: string, value: boolean) => void;
}

const NotificationSettingsComponent: React.FC<NotificationSettingsProps> = ({
    settings,
    onSettingChange,
}) => {
    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Notification Settings
                </Typography>
                <Box sx={{ mt: 2 }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={settings.emailNotifications}
                                onChange={(e) => onSettingChange('emailNotifications', e.target.checked)}
                            />
                        }
                        label="Email Notifications"
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={settings.pushNotifications}
                                onChange={(e) => onSettingChange('pushNotifications', e.target.checked)}
                            />
                        }
                        label="Push Notifications"
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={settings.weeklyDigest}
                                onChange={(e) => onSettingChange('weeklyDigest', e.target.checked)}
                            />
                        }
                        label="Weekly Digest"
                    />
                </Box>
            </CardContent>
        </Card>
    );
};

const NotificationSettings: React.FC = () => {
    const [settings, setSettings] = useState<NotificationSettings>({
        email: {
            newMessages: true,
            weeklyReport: true,
            systemUpdates: true
        },
        web: {
            newMessages: true,
            chatbotStatus: true
        },
        mobile: {
            pushNotifications: true,
            messageAlerts: true
        }
    });
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (
        category: keyof NotificationSettings,
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
            const response = await fetch(`${process.env.REACT_APP_API_URL}/user/notification-settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(settings)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update notification settings');
            }

            setSuccess(true);
        } catch (err) {
            console.error('Error updating notification settings:', err);
            setError(err instanceof Error ? err.message : 'An error occurred while updating notification settings');
        }
    };

    const handleSettingChange = (setting: string, value: boolean) => {
        if (setting === 'emailNotifications') {
            handleChange('email', 'newMessages', value);
        } else if (setting === 'pushNotifications') {
            handleChange('mobile', 'pushNotifications', value);
        } else if (setting === 'weeklyDigest') {
            handleChange('email', 'weeklyReport', value);
        }
    };

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Notification Settings
                </Typography>

                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                    <Stack spacing={3}>
                        {success && (
                            <Alert severity="success">
                                Notification settings updated successfully
                            </Alert>
                        )}
                        {error && <Alert severity="error">{error}</Alert>}

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
                                            checked={settings.email.weeklyReport}
                                            onChange={(e) =>
                                                handleChange(
                                                    'email',
                                                    'weeklyReport',
                                                    e.target.checked
                                                )
                                            }
                                        />
                                    }
                                    label="Weekly Report"
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
                                Web Notifications
                            </Typography>
                            <FormGroup>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={settings.web.newMessages}
                                            onChange={(e) =>
                                                handleChange(
                                                    'web',
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
                                            checked={settings.web.chatbotStatus}
                                            onChange={(e) =>
                                                handleChange(
                                                    'web',
                                                    'chatbotStatus',
                                                    e.target.checked
                                                )
                                            }
                                        />
                                    }
                                    label="Chatbot Status Changes"
                                />
                            </FormGroup>
                        </Box>

                        <Divider />

                        <Box>
                            <Typography variant="subtitle1" gutterBottom>
                                Mobile Notifications
                            </Typography>
                            <FormGroup>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={settings.mobile.pushNotifications}
                                            onChange={(e) =>
                                                handleChange(
                                                    'mobile',
                                                    'pushNotifications',
                                                    e.target.checked
                                                )
                                            }
                                        />
                                    }
                                    label="Push Notifications"
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={settings.mobile.messageAlerts}
                                            onChange={(e) =>
                                                handleChange(
                                                    'mobile',
                                                    'messageAlerts',
                                                    e.target.checked
                                                )
                                            }
                                        />
                                    }
                                    label="Message Alerts"
                                />
                            </FormGroup>
                        </Box>

                        <NotificationSettingsComponent
                            settings={{
                                emailNotifications: settings.email.newMessages,
                                pushNotifications: settings.mobile.pushNotifications,
                                weeklyDigest: settings.email.weeklyReport,
                            }}
                            onSettingChange={handleSettingChange}
                        />

                        <Button type="submit" variant="contained" color="primary">
                            Save Changes
                        </Button>
                    </Stack>
                </Box>
            </CardContent>
        </Card>
    );
};

export default NotificationSettings;
