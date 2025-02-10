import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TextField,
    MenuItem,
    Pagination,
    Chip
} from '@mui/material';
import { useQuery } from 'react-query';
import axios from 'axios';
import { format } from 'date-fns';

interface AuditLog {
    _id: string;
    action: string;
    performedBy: {
        _id: string;
        name: string;
        email: string;
    };
    targetUser: {
        _id: string;
        name: string;
        email: string;
    };
    details: string;
    createdAt: string;
    ip: string;
    userAgent: string;
}

const actionColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
    user_create: 'success',
    user_update: 'info',
    user_delete: 'error',
    subscription_update: 'primary',
    subscription_cancel: 'warning',
    user_suspend: 'error'
};

const AuditLogs: React.FC = () => {
    const [page, setPage] = useState(1);
    const [action, setAction] = useState('');
    const [userId, setUserId] = useState('');

    const { data, isLoading } = useQuery(['auditLogs', page, action, userId], async () => {
        const response = await axios.get('/super-admin/audit-logs', {
            params: {
                page,
                limit: 10,
                action: action || undefined,
                userId: userId || undefined
            }
        });
        return response.data;
    });

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
                <TextField
                    select
                    label="Filter by Action"
                    value={action}
                    onChange={(e) => setAction(e.target.value)}
                    sx={{ minWidth: 200 }}
                >
                    <MenuItem value="">All Actions</MenuItem>
                    <MenuItem value="user_create">User Create</MenuItem>
                    <MenuItem value="user_update">User Update</MenuItem>
                    <MenuItem value="user_delete">User Delete</MenuItem>
                    <MenuItem value="subscription_update">Subscription Update</MenuItem>
                    <MenuItem value="subscription_cancel">Subscription Cancel</MenuItem>
                    <MenuItem value="user_suspend">User Suspend</MenuItem>
                </TextField>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Action</TableCell>
                            <TableCell>Performed By</TableCell>
                            <TableCell>Target User</TableCell>
                            <TableCell>Details</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>IP Address</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data?.data.map((log: AuditLog) => (
                            <TableRow key={log._id}>
                                <TableCell>
                                    <Chip
                                        label={log.action.replace('_', ' ').toUpperCase()}
                                        color={actionColors[log.action]}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">
                                        {log.performedBy.name}
                                        <br />
                                        <Typography variant="caption" color="textSecondary">
                                            {log.performedBy.email}
                                        </Typography>
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">
                                        {log.targetUser.name}
                                        <br />
                                        <Typography variant="caption" color="textSecondary">
                                            {log.targetUser.email}
                                        </Typography>
                                    </Typography>
                                </TableCell>
                                <TableCell>{log.details}</TableCell>
                                <TableCell>
                                    {format(new Date(log.createdAt), 'PPp')}
                                </TableCell>
                                <TableCell>
                                    <Typography variant="caption">
                                        {log.ip}
                                    </Typography>
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
                    onChange={(_, newPage) => setPage(newPage)}
                />
            </Box>
        </Box>
    );
};

export default AuditLogs;
