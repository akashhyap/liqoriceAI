import React, { useState, useEffect } from 'react';
import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    TextField,
    MenuItem,
    Chip,
    Select,
    SelectChangeEvent,
    Pagination
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';

type UserStatus = 'active' | 'suspended' | 'deleted';
type SubscriptionType = 'free' | 'starter' | 'professional';

interface User {
    _id: string;
    name: string;
    email: string;
    role: 'user' | 'admin' | 'super_admin';
    status: UserStatus;
    subscription: SubscriptionType;
    createdAt: string;
    subscriptionDetails?: {
        status: string;
        currentPeriodEnd: string;
        cancelAtPeriodEnd: boolean;
    };
    address?: {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        zipCode?: string;
    };
}

interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

interface ApiResponse {
    success: boolean;
    data: User[];
    pagination: PaginationInfo;
}

interface EditUserDialogProps {
    user: User | null;
    open: boolean;
    onClose: () => void;
}

interface EditUserFormData {
    name: string;
    email: string;
    status: UserStatus;
    subscription: SubscriptionType;
}

const EditUserDialog: React.FC<EditUserDialogProps> = ({ user, open, onClose }) => {
    const [formData, setFormData] = useState<EditUserFormData>({
        name: user?.name || '',
        email: user?.email || '',
        status: user?.status || 'active',
        subscription: user?.subscription || 'free'
    });

    const queryClient = useQueryClient();

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                status: user.status || 'active',
                subscription: user.subscription || 'free'
            });
        }
    }, [user]);

    const updateMutation = useMutation({
        mutationFn: async (data: Partial<User>) => {
            const response = await axios.put(`/super-admin/users/${user?._id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            onClose();
        }
    });

    const handleSubmit = () => {
        updateMutation.mutate(formData);
    };

    const handleStatusChange = (event: SelectChangeEvent) => {
        setFormData({ ...formData, status: event.target.value as UserStatus });
    };

    const handleSubscriptionChange = (event: SelectChangeEvent) => {
        setFormData({ ...formData, subscription: event.target.value as SubscriptionType });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Edit User</DialogTitle>
            <DialogContent>
                <TextField
                    fullWidth
                    label="Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    margin="normal"
                />
                <TextField
                    fullWidth
                    label="Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    margin="normal"
                />
                <Select
                    fullWidth
                    label="Status"
                    value={formData.status}
                    onChange={handleStatusChange}
                    margin="dense"
                >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="suspended">Suspended</MenuItem>
                    <MenuItem value="deleted">Deleted</MenuItem>
                </Select>
                <Select
                    fullWidth
                    label="Subscription"
                    value={formData.subscription}
                    onChange={handleSubscriptionChange}
                    margin="dense"
                >
                    <MenuItem value="free">Free</MenuItem>
                    <MenuItem value="starter">Starter</MenuItem>
                    <MenuItem value="professional">Professional</MenuItem>
                </Select>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button 
                    onClick={handleSubmit}
                    disabled={updateMutation.status === 'pending'}
                >
                    {updateMutation.status === 'pending' ? 'Saving...' : 'Save'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

const UsersManagement = () => {
    const [page, setPage] = useState(1);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery<ApiResponse>({
        queryKey: ['users', page],
        queryFn: async () => {
            const response = await axios.get('/super-admin/users', {
                params: { page, limit: 10 }
            });
            return response.data;
        }
    });

    const impersonateUserMutation = useMutation({
        mutationFn: async (userId: string) => {
            const response = await axios.post(`/super-admin/users/${userId}/impersonate`);
            return response.data;
        },
        onSuccess: (data) => {
            // Store the impersonation token and original admin token
            const currentToken = localStorage.getItem('token');
            localStorage.setItem('originalAdminToken', currentToken || '');
            localStorage.setItem('token', data.data.token);
            localStorage.setItem('isImpersonating', 'true');
            
            // Redirect to the user dashboard
            window.location.href = '/app/dashboard';
        },
        onError: (error: any) => {
            console.error('Error impersonating user:', error);
            alert(error.response?.data?.message || 'Failed to impersonate user');
        }
    });

    const handleImpersonateUser = (user: User) => {
        if (window.confirm(`Are you sure you want to access ${user.name}'s account?`)) {
            impersonateUserMutation.mutate(user._id);
        }
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <Box sx={{ width: '100%', p: 3 }}>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Subscription</TableCell>
                            <TableCell>Created At</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data?.data.map((user) => (
                            <TableRow key={user._id}>
                                <TableCell>{user.name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <Chip 
                                        label={user.status} 
                                        color={user.status === 'active' ? 'success' : 'error'} 
                                        size="small" 
                                    />
                                </TableCell>
                                <TableCell>
                                    <Chip 
                                        label={user.subscription} 
                                        color="primary" 
                                        variant="outlined" 
                                        size="small" 
                                    />
                                </TableCell>
                                <TableCell>
                                    {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                                </TableCell>
                                <TableCell>
                                    <Button
                                        variant="contained"
                                        size="small"
                                        onClick={() => handleImpersonateUser(user)}
                                        sx={{ mr: 1 }}
                                    >
                                        Access Account
                                    </Button>
                                    <IconButton 
                                        size="small" 
                                        onClick={() => {
                                            setSelectedUser(user);
                                            setEditDialogOpen(true);
                                        }}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {data?.pagination && (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                    <Pagination
                        count={data.pagination.pages}
                        page={page}
                        onChange={(_, newPage) => setPage(newPage)}
                        color="primary"
                    />
                </Box>
            )}

            <EditUserDialog
                user={selectedUser}
                open={editDialogOpen}
                onClose={() => {
                    setEditDialogOpen(false);
                    setSelectedUser(null);
                }}
            />
        </Box>
    );
};

export default UsersManagement;
