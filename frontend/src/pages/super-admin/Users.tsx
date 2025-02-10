import React, { useEffect, useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    CircularProgress,
    SelectChangeEvent
} from '@mui/material';
import api from '../../services/api';

interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    subscription: string;
    status: string;
    createdAt: string;
}

const Users = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [subscriptionUpdate, setSubscriptionUpdate] = useState('');
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/super-admin/users');
            console.log('Users API Response:', response.data);
            
            if (response.data.success) {
                setUsers(response.data.data);
                setError('');
            } else {
                setError('Failed to fetch users');
            }
        } catch (err: any) {
            console.error('Error fetching users:', err);
            setError(err.response?.data?.message || 'Error loading users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [pageNumber, pageSize]);

    const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
        setPageSize(Number(event.target.value));
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box p={3}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    return (
        <Box p={3}>
            <Typography variant="h5" gutterBottom>
                Users Management
            </Typography>
            {users.length === 0 ? (
                <Alert severity="info">No users found</Alert>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Role</TableCell>
                                <TableCell>Subscription</TableCell>
                                <TableCell>Created At</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user._id}>
                                    <TableCell>{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user.role}</TableCell>
                                    <TableCell>{user.subscription}</TableCell>
                                    <TableCell>
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() => {
                                                setSelectedUser(user);
                                                setSubscriptionUpdate(user.subscription);
                                                setOpenDialog(true);
                                            }}
                                        >
                                            Manage
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
            
            {/* User Management Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                {selectedUser && (
                    <>
                        <DialogTitle>Manage User: {selectedUser.name}</DialogTitle>
                        <DialogContent>
                            <Box p={2}>
                                <FormControl fullWidth margin="normal">
                                    <InputLabel>Subscription</InputLabel>
                                    <Select
                                        value={subscriptionUpdate}
                                        onChange={(e) => setSubscriptionUpdate(e.target.value)}
                                    >
                                        <MenuItem value="free">Free</MenuItem>
                                        <MenuItem value="starter">Starter</MenuItem>
                                        <MenuItem value="professional">Professional</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                            <Button 
                                variant="contained" 
                                color="primary"
                                onClick={async () => {
                                    try {
                                        await api.put(`/super-admin/users/${selectedUser._id}`, {
                                            subscription: subscriptionUpdate
                                        });
                                        setOpenDialog(false);
                                        fetchUsers(); // Refresh the users list
                                    } catch (err) {
                                        console.error('Error updating user:', err);
                                    }
                                }}
                            >
                                Save Changes
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
            <Box p={2} display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setPageNumber(pageNumber - 1)}
                        disabled={pageNumber === 1}
                        sx={{ mr: 1 }}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setPageNumber(pageNumber + 1)}
                    >
                        Next
                    </Button>
                </Box>
                <FormControl sx={{ minWidth: 120 }}>
                    <InputLabel>Page Size</InputLabel>
                    <Select
                        value={pageSize}
                        onChange={handlePageSizeChange}
                        label="Page Size"
                    >
                        <MenuItem value={10}>10</MenuItem>
                        <MenuItem value={20}>20</MenuItem>
                        <MenuItem value={50}>50</MenuItem>
                    </Select>
                </FormControl>
            </Box>
        </Box>
    );
};

export default Users;
