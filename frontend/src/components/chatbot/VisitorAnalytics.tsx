import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  LinearProgress,
  Tooltip,
  IconButton,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { format } from 'date-fns';
import { DATE_FORMATS } from '../../config/constants';

interface AnalyticMetric {
  label: string;
  value: string | number;
  tooltip: string;
  trend?: number; // Percentage change
}

interface SessionMetrics {
  totalSessions: number;
  averageDuration: number;
  totalMessages: number;
  averageMessagesPerSession: number;
  responseRate: number;
  lastActive: string;
  commonTopics: Array<{
    topic: string;
    count: number;
  }>;
  engagementByHour: Array<{
    hour: number;
    count: number;
  }>;
}

interface VisitorAnalyticsProps {
  metrics: SessionMetrics;
}

const MetricCard: React.FC<AnalyticMetric> = ({ label, value, tooltip, trend }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Typography variant="subtitle2" color="textSecondary">
          {label}
        </Typography>
        <Tooltip title={tooltip}>
          <IconButton size="small">
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      <Typography variant="h4" sx={{ my: 1 }}>
        {value}
      </Typography>
      {trend !== undefined && (
        <Box display="flex" alignItems="center">
          <Typography
            variant="body2"
            color={trend >= 0 ? 'success.main' : 'error.main'}
          >
            {trend >= 0 ? '+' : ''}{trend}%
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ ml: 1 }}>
            vs last period
          </Typography>
        </Box>
      )}
    </CardContent>
  </Card>
);

interface TopicsListProps {
  topics: Array<{ topic: string; count: number }>;
}

const TopicsList: React.FC<TopicsListProps> = ({ topics }) => (
  <Card>
    <CardContent>
      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
        Common Topics
      </Typography>
      {topics.map((topic, index: number) => (
        <Box key={index} sx={{ mt: 1 }}>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2">{topic.topic}</Typography>
            <Typography variant="body2" color="textSecondary">
              {topic.count}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={(topic.count / Math.max(...topics.map(t => t.count))) * 100}
            sx={{ mt: 0.5 }}
          />
        </Box>
      ))}
    </CardContent>
  </Card>
);

interface EngagementChartProps {
  data: Array<{ hour: number; count: number }>;
}

const EngagementChart: React.FC<EngagementChartProps> = ({ data }) => (
  <Card>
    <CardContent>
      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
        Engagement by Hour
      </Typography>
      <Box sx={{ height: 200, mt: 2 }}>
        {data.map((hour, index: number) => (
          <Box
            key={index}
            sx={{
              height: (hour.count / Math.max(...data.map(h => h.count))) * 100 + '%',
              width: '4%',
              backgroundColor: 'primary.main',
              display: 'inline-block',
              mx: 0.5,
              position: 'relative',
              '&:hover': {
                backgroundColor: 'primary.dark',
              }
            }}
          >
            <Tooltip title={`${hour.hour}:00 - ${hour.count} sessions`}>
              <Box sx={{ width: '100%', height: '100%' }} />
            </Tooltip>
          </Box>
        ))}
      </Box>
    </CardContent>
  </Card>
);

const VisitorAnalytics: React.FC<VisitorAnalyticsProps> = ({ metrics }) => {
  const {
    totalSessions,
    averageDuration,
    totalMessages,
    averageMessagesPerSession,
    responseRate,
    lastActive,
    commonTopics,
    engagementByHour,
  } = metrics;

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const analyticsMetrics: AnalyticMetric[] = [
    {
      label: 'Total Sessions',
      value: totalSessions,
      tooltip: 'Total number of chat sessions',
    },
    {
      label: 'Avg. Session Duration',
      value: formatDuration(averageDuration),
      tooltip: 'Average length of chat sessions',
    },
    {
      label: 'Messages per Session',
      value: averageMessagesPerSession.toFixed(1),
      tooltip: 'Average number of messages exchanged per session',
    },
    {
      label: 'Response Rate',
      value: `${responseRate}%`,
      tooltip: 'Percentage of user messages that received a response',
    },
  ];

  return (
    <Box sx={{ mt: 3 }}>
      <Grid container spacing={3}>
        {analyticsMetrics.map((metric: AnalyticMetric, index: number) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <MetricCard {...metric} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={4}>
          <TopicsList topics={commonTopics} />
        </Grid>
        <Grid item xs={12} md={8}>
          <EngagementChart data={engagementByHour} />
        </Grid>
      </Grid>

      <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
        Last active: {format(new Date(lastActive), DATE_FORMATS.FULL)}
      </Typography>
    </Box>
  );
};

export default VisitorAnalytics;
