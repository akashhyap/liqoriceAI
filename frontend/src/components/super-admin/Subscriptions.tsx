import React, { useState } from 'react';
import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    Chip,
    TextField,
    MenuItem,
    Pagination,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';

interface Subscription {
    _id: string;
    userId: {
        _id: string;
        name: string;
        email: string;
    };
    plan: 'free' | 'starter' | 'professional';
    status: 'active' | 'cancelled' | 'expired';
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    createdAt: string;
}

interface ApiResponse {
    success: boolean;
    data: Subscription[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

const Subscriptions = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [planFilter, setPlanFilter] = useState('');
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery<ApiResponse>({
        queryKey: ['subscriptions', page, search, statusFilter, planFilter],
        queryFn: async () => {
            const response = await axios.get('/super-admin/subscriptions', {
                params: {
                    page,
                    limit: 10,
                    search,
                    status: statusFilter || undefined,
                    plan: planFilter || undefined
                }
            });
            return response.data;
        }
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'success';
            case 'cancelled':
                return 'error';
            case 'expired':
                return 'warning';
            default:
                return 'default';
        }
    };

    const getPlanColor = (plan: string) => {
        switch (plan) {
            case 'professional':
                return 'primary';
            case 'starter':
                return 'info';
            case 'free':
                return 'default';
            default:
                return 'default';
        }
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <Box sx={{ width: '100%', p: 3 }}>
            <Typography variant="h5" gutterBottom>
                Subscription Management
            </Typography>

            {/* Filters */}
            <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
                <TextField
                    label="Search by user"
                    variant="outlined"
                    size="small"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{ minWidth: 200 }}
                />
                <TextField
                    select
                    label="Status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    size="small"
                    sx={{ minWidth: 150 }}
                >
                    <MenuItem value="">All Status</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                    <MenuItem value="expired">Expired</MenuItem>
                </TextField>
                <TextField
                    select
                    label="Plan"
                    value={planFilter}
                    onChange={(e) => setPlanFilter(e.target.value)}
                    size="small"
                    sx={{ minWidth: 150 }}
                >
                    <MenuItem value="">All Plans</MenuItem>
                    <MenuItem value="free">Free</MenuItem>
                    <MenuItem value="starter">Starter</MenuItem>
                    <MenuItem value="professional">Professional</MenuItem>
                </TextField>
            </Box>

            {/* Subscriptions Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>User</TableCell>
                            <TableCell>Plan</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Current Period End</TableCell>
                            <TableCell>Created At</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data?.data.map((subscription) => (
                            <TableRow key={subscription._id}>
                                <TableCell>
                                    <Box>
                                        <Typography variant="body2">{subscription.userId.name}</Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            {subscription.userId.email}
                                        </Typography>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={subscription.plan}
                                        color={getPlanColor(subscription.plan) as any}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={subscription.status}
                                        color={getStatusColor(subscription.status) as any}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    {format(new Date(subscription.currentPeriodEnd), 'MMM dd, yyyy')}
                                </TableCell>
                                <TableCell>
                                    {format(new Date(subscription.createdAt), 'MMM dd, yyyy')}
                                </TableCell>
                                <TableCell>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        color={subscription.status === 'active' ? 'error' : 'primary'}
                                    >
                                        {subscription.status === 'active' ? 'Cancel' : 'Reactivate'}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Pagination */}
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
        </Box>
    );
};

export default Subscriptions;
