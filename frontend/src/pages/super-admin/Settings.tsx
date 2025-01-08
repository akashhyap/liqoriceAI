import React from 'react';
import {
    Box,
    Paper,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Switch,
    Divider
} from '@mui/material';

const Settings = () => {
    const [settings, setSettings] = React.useState({
        emailNotifications: true,
        auditLogging: true,
        userRegistration: true
    });

    const handleToggle = (setting: keyof typeof settings) => {
        setSettings(prev => ({
            ...prev,
            [setting]: !prev[setting]
        }));
    };

    return (
        <Box p={3}>
            <Typography variant="h5" gutterBottom>
                System Settings
            </Typography>

            <Paper sx={{ mt: 2 }}>
                <List>
                    <ListItem>
                        <ListItemText
                            primary="Email Notifications"
                            secondary="Receive email notifications for important system events"
                        />
                        <ListItemSecondaryAction>
                            <Switch
                                edge="end"
                                checked={settings.emailNotifications}
                                onChange={() => handleToggle('emailNotifications')}
                            />
                        </ListItemSecondaryAction>
                    </ListItem>
                    <Divider />
                    <ListItem>
                        <ListItemText
                            primary="Audit Logging"
                            secondary="Keep detailed logs of all system activities"
                        />
                        <ListItemSecondaryAction>
                            <Switch
                                edge="end"
                                checked={settings.auditLogging}
                                onChange={() => handleToggle('auditLogging')}
                            />
                        </ListItemSecondaryAction>
                    </ListItem>
                    <Divider />
                    <ListItem>
                        <ListItemText
                            primary="User Registration"
                            secondary="Allow new users to register"
                        />
                        <ListItemSecondaryAction>
                            <Switch
                                edge="end"
                                checked={settings.userRegistration}
                                onChange={() => handleToggle('userRegistration')}
                            />
                        </ListItemSecondaryAction>
                    </ListItem>
                </List>
            </Paper>

            <Typography variant="body2" color="textSecondary" sx={{ mt: 4 }}>
                Note: Settings functionality is currently in development. Changes made here will not be saved.
            </Typography>
        </Box>
    );
};

export default Settings;
