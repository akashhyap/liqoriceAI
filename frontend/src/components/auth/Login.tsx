import React from 'react';
import {
    Box,
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    Container
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';

const validationSchema = Yup.object({
    email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
    password: Yup.string()
        .required('Password is required')
});

const Login: React.FC = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/';

    const formik = useFormik({
        initialValues: {
            email: '',
            password: ''
        },
        validationSchema,
        onSubmit: async (values) => {
            try {
                await login(values.email, values.password);
                navigate(from, { replace: true });
            } catch (error) {
                // Error handling is managed by the auth store
                console.error('Login failed:', error);
            }
        }
    });

    return (
        <Container component="main" maxWidth="xs">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                }}
            >
                <Card sx={{ width: '100%' }}>
                    <CardContent>
                        <Typography component="h1" variant="h5" align="center" gutterBottom>
                            Sign In
                        </Typography>
                        <form onSubmit={formik.handleSubmit}>
                            <TextField
                                fullWidth
                                id="email"
                                name="email"
                                label="Email"
                                value={formik.values.email}
                                onChange={formik.handleChange}
                                error={formik.touched.email && Boolean(formik.errors.email)}
                                helperText={formik.touched.email && formik.errors.email}
                                margin="normal"
                            />
                            <TextField
                                fullWidth
                                id="password"
                                name="password"
                                label="Password"
                                type="password"
                                value={formik.values.password}
                                onChange={formik.handleChange}
                                error={formik.touched.password && Boolean(formik.errors.password)}
                                helperText={formik.touched.password && formik.errors.password}
                                margin="normal"
                            />
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                sx={{ mt: 3, mb: 2 }}
                                disabled={formik.isSubmitting}
                            >
                                {formik.isSubmitting ? 'Signing in...' : 'Sign In'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </Box>
        </Container>
    );
};

export default Login;
