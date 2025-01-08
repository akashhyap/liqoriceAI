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
            const response = await axios.put(`/api/super-admin/users/${user?._id}`, data);
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

const UsersManagement: React.FC = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery<ApiResponse>({
        queryKey: ['users', page, search],
        queryFn: async () => {
            const response = await axios.get<ApiResponse>('/api/super-admin/users', {
                params: { page, limit: 10, search }
            });
            return response.data;
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (userId: string) => {
            const response = await axios.delete(`/api/super-admin/users/${userId}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setDeleteDialogOpen(false);
            setUserToDelete(null);
        }
    });

    const handleDeleteClick = (userId: string) => {
        setUserToDelete(userId);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (userToDelete) {
            deleteMutation.mutate(userToDelete);
        }
    };

    const handleEdit = (user: User) => {
        setSelectedUser(user);
        setEditDialogOpen(true);
    };

    const handlePageChange = (_event: React.ChangeEvent<unknown>, newPage: number) => {
        setPage(newPage);
    };

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(event.target.value);
        setPage(1); // Reset to first page when searching
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error loading users</div>;
    }

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ mb: 3 }}>
                <TextField
                    fullWidth
                    label="Search users"
                    value={search}
                    onChange={handleSearchChange}
                    sx={{ mb: 2 }}
                />
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Subscription</TableCell>
                            <TableCell>Joined</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data?.data.map((user: User) => (
                            <TableRow key={user._id}>
                                <TableCell>{user.name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={user.status}
                                        color={user.status === 'active' ? 'success' : user.status === 'suspended' ? 'error' : 'default'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={user.subscription}
                                        color={user.subscription === 'free' ? 'default' : 'primary'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    {format(new Date(user.createdAt), 'PP')}
                                </TableCell>
                                <TableCell>
                                    <IconButton onClick={() => handleEdit(user)}>
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleDeleteClick(user._id)}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                <Pagination
                    count={Math.ceil((data?.pagination?.total || 0) / 10)}
                    page={page}
                    onChange={handlePageChange}
                />
            </Box>

            <EditUserDialog
                user={selectedUser}
                open={editDialogOpen}
                onClose={() => {
                    setEditDialogOpen(false);
                    setSelectedUser(null);
                }}
            />

            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
            >
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this user? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleDeleteConfirm}
                        color="error"
                        disabled={deleteMutation.status === 'pending'}
                    >
                        {deleteMutation.status === 'pending' ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default UsersManagement;
