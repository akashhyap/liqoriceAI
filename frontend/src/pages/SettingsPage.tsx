import React from 'react';
import {
    Container,
    Box,
    Typography,
    Paper
} from '@mui/material';
import NotificationSettings from '../components/settings/NotificationSettings';

const SettingsPage: React.FC = () => {
    return (
        <Container maxWidth="lg">
            <Box sx={{ width: '100%', mt: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Settings
                </Typography>

                <Paper sx={{ width: '100%', mt: 3, p: 3 }}>
                    <NotificationSettings />
                </Paper>
            </Box>
        </Container>
    );
};

export default SettingsPage;
