import React from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Divider
} from '@mui/material';
import {
    People as PeopleIcon,
    CreditCard as CreditCardIcon,
    TrendingUp as TrendingUpIcon,
    Person as PersonIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';

interface DashboardStats {
    totalUsers: number;
    activeSubscriptions: number;
    recentSignups: Array<{
        _id: string;
        name: string;
        email: string;
        subscription: string;
        createdAt: string;
    }>;
}

const Dashboard = () => {
    const { data: stats, isLoading } = useQuery<{ data: DashboardStats }>({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const response = await axios.get('/super-admin/dashboard-stats');
            return response.data;
        }
    });

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <Box sx={{ flexGrow: 1, p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Super Admin Dashboard
            </Typography>

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={4}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <PeopleIcon sx={{ mr: 1, color: 'primary.main' }} />
                                <Typography variant="h6">Total Users</Typography>
                            </Box>
                            <Typography variant="h3">{stats?.data.totalUsers || 0}</Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <CreditCardIcon sx={{ mr: 1, color: 'success.main' }} />
                                <Typography variant="h6">Active Subscriptions</Typography>
                            </Box>
                            <Typography variant="h3">{stats?.data.activeSubscriptions || 0}</Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <TrendingUpIcon sx={{ mr: 1, color: 'info.main' }} />
                                <Typography variant="h6">Conversion Rate</Typography>
                            </Box>
                            <Typography variant="h3">
                                {stats?.data.totalUsers
                                    ? Math.round((stats.data.activeSubscriptions / stats.data.totalUsers) * 100)
                                    : 0}%
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Recent Signups */}
            <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                    Recent Signups
                </Typography>
                <List>
                    {stats?.data.recentSignups.map((user, index) => (
                        <React.Fragment key={user._id}>
                            <ListItem>
                                <ListItemAvatar>
                                    <Avatar>
                                        <PersonIcon />
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={user.name}
                                    secondary={
                                        <>
                                            {user.email} • {user.subscription}
                                            <br />
                                            {format(new Date(user.createdAt), 'PPp')}
                                        </>
                                    }
                                />
                            </ListItem>
                            {index < stats.data.recentSignups.length - 1 && <Divider variant="inset" component="li" />}
                        </React.Fragment>
                    ))}
                </List>
            </Paper>
        </Box>
    );
};

export default Dashboard;
