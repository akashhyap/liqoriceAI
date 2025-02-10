import React from 'react';
import {
    Grid,
    Paper,
    Typography,
    Box,
    Card,
    CardContent,
    useTheme
} from '@mui/material';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Chatbot } from '../../types';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

interface AnalyticsDashboardProps {
    chatbot: Chatbot;
    timeRange?: 'day' | 'week' | 'month' | 'year';
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
    chatbot,
    timeRange = 'week'
}) => {
    const theme = useTheme();

    // Sample data - replace with real data from your API
    const conversationData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
            {
                label: 'Conversations',
                data: [12, 19, 3, 5, 2, 3, 7],
                borderColor: theme.palette.primary.main,
                backgroundColor: theme.palette.primary.main,
                tension: 0.4
            }
        ]
    };

    const responseTimeData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
            {
                label: 'Response Time (ms)',
                data: [500, 450, 600, 400, 550, 480, 520],
                borderColor: theme.palette.secondary.main,
                backgroundColor: theme.palette.secondary.main,
                tension: 0.4
            }
        ]
    };

    const satisfactionData = {
        labels: ['Satisfied', 'Neutral', 'Unsatisfied'],
        datasets: [
            {
                data: [70, 20, 10],
                backgroundColor: [
                    theme.palette.success.main,
                    theme.palette.warning.main,
                    theme.palette.error.main
                ]
            }
        ]
    };

    const channelData = {
        labels: ['Web', 'WhatsApp', 'Facebook', 'Instagram'],
        datasets: [
            {
                label: 'Messages by Channel',
                data: [300, 150, 100, 50],
                backgroundColor: [
                    theme.palette.primary.main,
                    theme.palette.secondary.main,
                    theme.palette.success.main,
                    theme.palette.warning.main
                ]
            }
        ]
    };

    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                Analytics Dashboard
            </Typography>

            {/* Key Metrics */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Total Conversations
                            </Typography>
                            <Typography variant="h4">
                                {chatbot.analytics.totalConversations}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Total Messages
                            </Typography>
                            <Typography variant="h4">
                                {chatbot.analytics.totalMessages}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Avg. Response Time
                            </Typography>
                            <Typography variant="h4">
                                {chatbot.analytics.averageResponseTime}ms
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Satisfaction Score
                            </Typography>
                            <Typography variant="h4">
                                {chatbot.analytics.userSatisfactionScore}%
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Charts */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Conversations Over Time
                        </Typography>
                        <Line
                            data={conversationData}
                            options={{
                                responsive: true,
                                plugins: {
                                    legend: {
                                        position: 'top' as const
                                    }
                                }
                            }}
                        />
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Response Time Trend
                        </Typography>
                        <Line
                            data={responseTimeData}
                            options={{
                                responsive: true,
                                plugins: {
                                    legend: {
                                        position: 'top' as const
                                    }
                                }
                            }}
                        />
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            User Satisfaction
                        </Typography>
                        <Box sx={{ maxWidth: 400, margin: '0 auto' }}>
                            <Doughnut
                                data={satisfactionData}
                                options={{
                                    responsive: true,
                                    plugins: {
                                        legend: {
                                            position: 'bottom' as const
                                        }
                                    }
                                }}
                            />
                        </Box>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Messages by Channel
                        </Typography>
                        <Bar
                            data={channelData}
                            options={{
                                responsive: true,
                                plugins: {
                                    legend: {
                                        display: false
                                    }
                                }
                            }}
                        />
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default AnalyticsDashboard;
