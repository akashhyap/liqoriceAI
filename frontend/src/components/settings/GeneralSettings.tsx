import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Stack
} from '@mui/material';
import { useAuth } from '../../hooks/useAuth';

const LANGUAGE_OPTIONS = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'zh', label: 'Chinese' }
];

const TIMEZONE_OPTIONS = [
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'Eastern Time' },
    { value: 'America/Chicago', label: 'Central Time' },
    { value: 'America/Denver', label: 'Mountain Time' },
    { value: 'America/Los_Angeles', label: 'Pacific Time' },
    { value: 'Asia/Shanghai', label: 'China Time' },
    { value: 'Europe/London', label: 'British Time' },
    { value: 'Europe/Paris', label: 'Central European Time' }
];

const GeneralSettings: React.FC = () => {
    const { user, updateUser } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [language, setLanguage] = useState(user?.settings?.language || 'en');
    const [timezone, setTimezone] = useState(user?.settings?.timezone || 'UTC');
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccess(false);
        setError(null);

        try {
            const response = await fetch('/api/user/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    email,
                    settings: {
                        language,
                        timezone
                    }
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update settings');
            }

            const updatedUser = await response.json();
            updateUser(updatedUser);
            setSuccess(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    General Settings
                </Typography>

                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                    <Stack spacing={3}>
                        {success && (
                            <Alert severity="success" sx={{ mb: 2 }}>
                                Settings updated successfully
                            </Alert>
                        )}
                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {error}
                            </Alert>
                        )}

                        <TextField
                            fullWidth
                            label="Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />

                        <TextField
                            fullWidth
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />

                        <FormControl fullWidth>
                            <InputLabel>Language</InputLabel>
                            <Select
                                value={language}
                                label="Language"
                                onChange={(e) => setLanguage(e.target.value)}
                            >
                                {LANGUAGE_OPTIONS.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel>Timezone</InputLabel>
                            <Select
                                value={timezone}
                                label="Timezone"
                                onChange={(e) => setTimezone(e.target.value)}
                            >
                                {TIMEZONE_OPTIONS.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

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

export default GeneralSettings;
