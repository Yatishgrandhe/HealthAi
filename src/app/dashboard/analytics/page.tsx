'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Paper,
  Divider
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Psychology as BrainIcon,
  FitnessCenter as DumbbellIcon,
  Straighten as PostureIcon,
  CalendarToday as CalendarIcon,
  Chat as ChatIcon
} from '@mui/icons-material';
import { useUser } from '@/utils/supabaseClient';
import HealthDataService from '@/utils/healthDataService';

export default function AnalyticsPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Get data from localStorage using the correct keys
      const localTherapistChats = localStorage.getItem('therapist-chats');
      const localPostureReports = localStorage.getItem('postureProgressReports');

      let therapistSessions: any[] = [];
      let postureSessions: any[] = [];

      // Parse therapist chat data
      if (localTherapistChats) {
        try {
          const parsed = JSON.parse(localTherapistChats);
          therapistSessions = Array.isArray(parsed) ? parsed : [];
          console.log('Analytics: Loaded therapist sessions from localStorage:', therapistSessions.length);
        } catch (e) {
          console.warn('Error parsing local therapist chat data:', e);
        }
      }

      // Parse posture check data
      if (localPostureReports) {
        try {
          const parsed = JSON.parse(localPostureReports);
          postureSessions = Array.isArray(parsed) ? parsed : [];
          console.log('Analytics: Loaded posture sessions from localStorage:', postureSessions.length);
        } catch (e) {
          console.warn('Error parsing local posture check data:', e);
        }
      }

      // Calculate analytics from local data
      const totalSessions = therapistSessions?.length || 0;
      const postureChecks = postureSessions?.length || 0;
      const totalMessages = therapistSessions?.reduce((acc: number, session: any) => acc + (session.messages?.length || 0), 0) || 0;
      
      // Calculate average posture score
      let averagePostureScore = 0;
      if (postureSessions && postureSessions.length > 0) {
        const totalScore = postureSessions.reduce((acc: number, session: any) => {
          const score = session.overall_score || session.posture_score || session.score || 0;
          return acc + score;
        }, 0);
        averagePostureScore = Math.round(totalScore / postureSessions.length);
      }

      // Calculate health score
      const baseScore = 50;
      const sessionScore = totalSessions * 5;
      const postureScore = averagePostureScore * 0.3;
      const activityScore = Math.min(20, (totalSessions + postureChecks) * 2);
      const healthScore = Math.min(100, Math.max(0, baseScore + sessionScore + postureScore + activityScore));

      // Create recent activities
      const recentActivities: any[] = [];

      // Add therapist sessions
      therapistSessions?.slice(0, 3).forEach((session: any) => {
        recentActivities.push({
          id: session.id || 'unknown',
          type: 'therapy',
          title: session.title || 'AI Therapy Session',
          date: session.createdAt || session.created_at || new Date().toISOString(),
          duration: session.messages?.length ? `${session.messages.length} messages` : '30 min'
        });
      });

      // Add posture checks
      postureSessions?.slice(0, 2).forEach((session: any) => {
        recentActivities.push({
          id: session.id || 'unknown',
          type: 'posture',
          title: session.session_title || 'Posture Check',
          date: session.created_at || session.timestamp || new Date().toISOString(),
          duration: session.duration_seconds ? `${Math.round(session.duration_seconds / 60)} min` : undefined
        });
      });

      // Sort by date and take the most recent 5
      const sortedActivities = recentActivities
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

      const analyticsData = {
        healthScore: Math.round(healthScore),
        totalSessions,
        fitnessWorkouts: 0, // No fitness workouts feature currently
        postureChecks,
        averagePostureScore,
        totalMessages,
        recentActivities: sortedActivities
      };

      setAnalytics(analyticsData);
      console.log('Analytics data loaded:', analyticsData);
      
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
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
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Health Analytics
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track your health and wellness progress over time
        </Typography>
      </Box>

      {/* Analytics Overview */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 3 }}>
        {/* Health Score */}
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" fontWeight="bold" color="primary">
                  {analytics?.healthScore || 0}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Overall Health Score
                </Typography>
              </Box>
              <TrendingUpIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            </Box>
          </CardContent>
        </Card>

        {/* Total Sessions */}
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" fontWeight="bold" color="secondary">
                  {analytics?.totalSessions || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Sessions
                </Typography>
              </Box>
              <BrainIcon sx={{ fontSize: 40, color: 'secondary.main' }} />
            </Box>
          </CardContent>
        </Card>

        {/* Total Messages */}
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  {analytics?.totalMessages || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Messages
                </Typography>
              </Box>
              <ChatIcon sx={{ fontSize: 40, color: 'success.main' }} />
            </Box>
          </CardContent>
        </Card>

        {/* Posture Checks */}
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" fontWeight="bold" color="warning.main">
                  {analytics?.postureChecks || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Posture Checks
                </Typography>
              </Box>
              <PostureIcon sx={{ fontSize: 40, color: 'warning.main' }} />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Recent Activities */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Recent Activities
        </Typography>
        <Paper sx={{ p: 3 }}>
          {analytics?.recentActivities && analytics.recentActivities.length > 0 ? (
            <Box>
              {analytics.recentActivities.slice(0, 5).map((activity: any, index: number) => (
                <Box key={activity.id || index}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" py={1}>
                    <Box display="flex" alignItems="center" gap={2}>
                      {activity.type === 'therapy' && <BrainIcon color="secondary" />}
                      {activity.type === 'fitness' && <DumbbellIcon color="success" />}
                      {activity.type === 'posture' && <PostureIcon color="warning" />}
                      <Box>
                        <Typography variant="body1" fontWeight={600}>
                          {activity.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(activity.date).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {activity.duration || '30 min'}
                    </Typography>
                  </Box>
                  {index < analytics.recentActivities.length - 1 && <Divider />}
                </Box>
              ))}
            </Box>
          ) : (
            <Typography variant="body1" color="text.secondary" textAlign="center" py={4}>
              No recent activities to display
            </Typography>
          )}
        </Paper>
      </Box>

      {/* Coming Soon */}
      <Box sx={{ mt: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Advanced Analytics Coming Soon
            </Typography>
            <Typography variant="body2" color="text.secondary">
              We're working on more detailed analytics including trends, progress charts, and personalized insights.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
} 