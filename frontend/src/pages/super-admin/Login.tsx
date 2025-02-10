import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Alert,
    Container
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const SuperAdminLogin = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        // Clear error when user starts typing
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post(
                'http://localhost:5000/api/super-admin/login',
                formData,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.success && response.data.token) {
                // Store token and user data
                localStorage.setItem('superAdminToken', response.data.token);
                localStorage.setItem('superAdminUser', JSON.stringify(response.data.user));
                
                // Set default authorization header for future requests
                axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
                
                // Redirect to dashboard
                navigate('/super-admin/dashboard');
            } else {
                setError('Login failed. Please check your credentials.');
            }
        } catch (err: any) {
            console.error('Login error:', err.response?.data || err.message);
            
            if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else if (err.response?.status === 401) {
                setError('Invalid email or password');
            } else if (err.response?.status === 403) {
                setError('You do not have super admin access');
            } else {
                setError('Unable to connect to the server. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
                    <Typography component="h1" variant="h5" align="center" gutterBottom>
                        Super Admin Login
                    </Typography>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    <form onSubmit={handleSubmit}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="email"
                            label="Email Address"
                            name="email"
                            autoComplete="email"
                            autoFocus
                            value={formData.email}
                            onChange={handleChange}
                            error={!!error}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Password"
                            type="password"
                            id="password"
                            autoComplete="current-password"
                            value={formData.password}
                            onChange={handleChange}
                            error={!!error}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                            disabled={loading}
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </Button>
                    </form>
                </Paper>
            </Box>
        </Container>
    );
};

export default SuperAdminLogin;
