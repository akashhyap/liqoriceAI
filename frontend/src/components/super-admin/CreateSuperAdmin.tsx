import React from 'react';
import {
    Box,
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    Alert
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useMutation } from 'react-query';
import superAdminService from '../../services/superAdminService';
import { useSnackbar } from 'notistack';

const validationSchema = Yup.object({
    name: Yup.string()
        .required('Name is required')
        .min(2, 'Name should be at least 2 characters'),
    email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
    password: Yup.string()
        .required('Password is required')
        .min(8, 'Password should be at least 8 characters')
        .matches(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
            'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        ),
    confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), undefined], 'Passwords must match')
        .required('Confirm password is required')
});

const CreateSuperAdmin: React.FC = () => {
    const { enqueueSnackbar } = useSnackbar();

    const createMutation = useMutation(
        async (values: { name: string; email: string; password: string }) => {
            return await superAdminService.createSuperAdmin(values);
        },
        {
            onSuccess: () => {
                enqueueSnackbar('Super admin created successfully', { variant: 'success' });
                formik.resetForm();
            },
            onError: (error: any) => {
                enqueueSnackbar(error.response?.data?.error || 'Error creating super admin', { 
                    variant: 'error' 
                });
            }
        }
    );

    const formik = useFormik({
        initialValues: {
            name: '',
            email: '',
            password: '',
            confirmPassword: ''
        },
        validationSchema,
        onSubmit: (values) => {
            const { confirmPassword, ...submitData } = values;
            createMutation.mutate(submitData);
        }
    });

    return (
        <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
            <Card>
                <CardContent>
                    <Typography variant="h5" gutterBottom>
                        Create Super Admin
                    </Typography>
                    <Alert severity="warning" sx={{ mb: 3 }}>
                        Please note: Creating a super admin user grants full system access. 
                        Use this feature with caution.
                    </Alert>
                    <form onSubmit={formik.handleSubmit}>
                        <TextField
                            fullWidth
                            id="name"
                            name="name"
                            label="Name"
                            value={formik.values.name}
                            onChange={formik.handleChange}
                            error={formik.touched.name && Boolean(formik.errors.name)}
                            helperText={formik.touched.name && formik.errors.name}
                            margin="normal"
                        />
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
                        <TextField
                            fullWidth
                            id="confirmPassword"
                            name="confirmPassword"
                            label="Confirm Password"
                            type="password"
                            value={formik.values.confirmPassword}
                            onChange={formik.handleChange}
                            error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                            helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                            margin="normal"
                        />
                        <Box sx={{ mt: 3 }}>
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                disabled={createMutation.isLoading}
                            >
                                {createMutation.isLoading ? 'Creating...' : 'Create Super Admin'}
                            </Button>
                        </Box>
                    </form>
                </CardContent>
            </Card>
        </Box>
    );
};

export default CreateSuperAdmin;
