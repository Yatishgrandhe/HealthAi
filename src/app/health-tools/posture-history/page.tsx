'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogContent,
  DialogTitle,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Paper,
  Avatar,
  Stack,
  Badge,
  Tooltip,
  Fab
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as RemoveIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Score as ScoreIcon,
  Image as ImageIcon,
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  ErrorOutline as ErrorOutlineIcon
} from '@mui/icons-material';
import { supabase, useUser } from '@/utils/supabaseClient';
import BackButton from '@/components/BackButton';

interface PostureSession {
  id: string;
  user_id: string;
  session_title?: string;
  posture_score: number;
  analysis_data: any;
  image_urls?: string[];
  recommendations?: any;
  duration_seconds?: number;
  created_at: string;
}

const PostureHistory = () => {
  const { user } = useUser();
  const [sessions, setSessions] = useState<PostureSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<PostureSession | null>(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPostureHistory();
  }, [user]);

  const loadPostureHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      if (user && supabase) {
        // Load from database for logged-in users
        const { data, error } = await supabase
          .from('posture_check_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Database error:', error);
          // If table doesn't exist, show empty state
          if (error.code === '42P01') { // Table doesn't exist
            setSessions([]);
            setError('Posture history feature is not yet set up. Please try again later.');
          } else {
            throw error;
          }
        } else {
          setSessions(data || []);
        }
      } else {
        // Load from localStorage for guests or when supabase is not available
        const savedReports = localStorage.getItem('postureProgressReports');
        if (savedReports) {
          const parsedReports = JSON.parse(savedReports);
          setSessions(parsedReports.map((report: any) => ({
            id: report.id,
            user_id: 'guest',
            session_title: `${report.status.charAt(0).toUpperCase() + report.status.slice(1)} Posture Check`,
            posture_score: report.score,
            analysis_data: report.analysis,
            image_urls: [report.imageUrl],
            recommendations: report.analysis?.recommendations || [],
            duration_seconds: 0,
            created_at: report.timestamp
          })));
        } else {
          setSessions([]);
        }
      }
    } catch (err) {
      console.error('Error loading posture history:', err);
      setError('Failed to load posture history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPostureHistory();
    setRefreshing(false);
  };

  const handleViewImage = (session: PostureSession) => {
    setSelectedSession(session);
    setImageDialogOpen(true);
  };

  const handleCloseImageDialog = () => {
    setImageDialogOpen(false);
    setSelectedSession(null);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  const getTrendIcon = (currentScore: number, previousScore?: number) => {
    if (!previousScore) return <RemoveIcon color="action" />;
    if (currentScore > previousScore) return <TrendingUpIcon color="success" />;
    if (currentScore < previousScore) return <TrendingDownIcon color="error" />;
    return <RemoveIcon color="action" />;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

    if (diffInDays > 0) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    if (diffInHours > 0) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInMinutes > 0) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
        flexDirection="column"
        gap={2}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Loading your posture history...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: 3, 
      maxWidth: 1200, 
      mx: 'auto',
      minHeight: user ? "calc(100vh - 120px)" : "100vh"
    }}>
      {/* Back Button for logged-out users */}
      {!user && (
        <Box sx={{ mb: 2 }}>
          <BackButton href="/health-tools" label="Back to Health Tools" />
        </Box>
      )}
      
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
              <ImageIcon fontSize="large" />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Posture History
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Track your posture improvement journey
              </Typography>
            </Box>
          </Box>
          <Tooltip title="Refresh">
            <IconButton
              onClick={handleRefresh}
              disabled={refreshing}
              sx={{ bgcolor: 'background.paper', boxShadow: 1 }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Guest User Notice */}
        {!user && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <strong>Guest User Notice:</strong> As a guest, your posture checks are saved locally and cannot be viewed in the history page.
          </Alert>
        )}

        {/* Stats Summary */}
        {sessions.length > 0 && (
          <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, 1fr)' }, gap: 3 }}>
              <Box textAlign="center" color="white">
                <Typography variant="h4" fontWeight="bold">
                  {sessions.length}
                </Typography>
                <Typography variant="body2">Total Sessions</Typography>
              </Box>
              <Box textAlign="center" color="white">
                <Typography variant="h4" fontWeight="bold">
                  {Math.round(sessions.reduce((acc, session) => acc + session.posture_score, 0) / sessions.length)}
                </Typography>
                <Typography variant="body2">Average Score</Typography>
              </Box>
              <Box textAlign="center" color="white">
                <Typography variant="h4" fontWeight="bold">
                  {Math.max(...sessions.map(s => s.posture_score))}
                </Typography>
                <Typography variant="body2">Best Score</Typography>
              </Box>
              <Box textAlign="center" color="white">
                <Typography variant="h4" fontWeight="bold">
                  {formatDate(sessions[0]?.created_at || '')}
                </Typography>
                <Typography variant="body2">Latest Session</Typography>
              </Box>
            </Box>
          </Paper>
        )}
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <CardContent>
            <ImageIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              No Posture Sessions Yet
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Start your posture improvement journey by taking your first posture check!
            </Typography>
            <Button
              variant="contained"
              size="large"
              href="/health-tools/posture-check"
              sx={{ borderRadius: 2 }}
            >
              Take Posture Check
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 3 }}>
          {sessions.map((session, index) => (
            <Box key={session.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
              >
                <Box
                  sx={{
                    position: 'relative',
                    height: 200,
                    background: `linear-gradient(45deg, #f0f0f0 25%, transparent 25%), 
                                linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), 
                                linear-gradient(45deg, transparent 75%, #f0f0f0 75%), 
                                linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)`,
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                    cursor: 'pointer',
                    overflow: 'hidden'
                  }}
                  onClick={() => handleViewImage(session)}
                >
                  {session.image_urls?.[0] ? (
                    <img
                      src={session.image_urls[0]}
                      alt="Posture check"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.3s'
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        color: 'text.secondary'
                      }}
                    >
                      <ErrorOutlineIcon sx={{ fontSize: 48 }} />
                    </Box>
                  )}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      bgcolor: 'rgba(0,0,0,0.7)',
                      borderRadius: 1,
                      p: 0.5
                    }}
                  >
                    <Chip
                      label={`${session.posture_score}/100`}
                      size="small"
                      color={getScoreColor(session.posture_score) as any}
                      sx={{ color: 'white', fontWeight: 'bold' }}
                    />
                  </Box>
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 8,
                      left: 8,
                      bgcolor: 'rgba(0,0,0,0.7)',
                      borderRadius: 1,
                      p: 0.5
                    }}
                  >
                    <Tooltip title="View full image">
                      <IconButton size="small" sx={{ color: 'white' }}>
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Typography variant="h6" fontWeight="bold">
                      {getScoreLabel(session.posture_score)}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      {getTrendIcon(session.posture_score, sessions[index + 1]?.posture_score)}
                    </Box>
                  </Box>

                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <ScoreIcon fontSize="small" color="primary" />
                    <Typography variant="body2" color="text.secondary">
                      Score: {session.posture_score}/100
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <CalendarIcon fontSize="small" color="primary" />
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(session.created_at)}
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <TimeIcon fontSize="small" color="primary" />
                    <Typography variant="body2" color="text.secondary">
                      {formatTime(session.created_at)} • {getTimeAgo(session.created_at)}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 1 }} />

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      flexGrow: 1
                    }}
                  >
                    {typeof session.analysis_data === 'string' ? session.analysis_data : 'Analysis available'}
                  </Typography>

                  <Box mt={2}>
                    <Button
                      variant="outlined"
                      size="small"
                      fullWidth
                      onClick={() => handleViewImage(session)}
                      startIcon={<VisibilityIcon />}
                    >
                      View Details
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      )}

      {/* Image Dialog */}
      <Dialog
        open={imageDialogOpen}
        onClose={handleCloseImageDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedSession && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="h6">
                  Posture Analysis - {formatDate(selectedSession.created_at)}
                </Typography>
                <IconButton onClick={handleCloseImageDialog}>
                  <ArrowBackIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
                <Box>
                  {selectedSession.image_urls?.[0] ? (
                    <img
                      src={selectedSession.image_urls[0]}
                      alt="Posture check"
                      style={{
                        width: '100%',
                        height: 'auto',
                        borderRadius: 8,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: 200,
                        bgcolor: 'grey.100',
                        borderRadius: 2,
                        color: 'text.secondary'
                      }}
                    >
                      <ErrorOutlineIcon sx={{ fontSize: 64 }} />
                    </Box>
                  )}
                </Box>
                <Box>
                  <Stack spacing={2}>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="h6" gutterBottom>
                        Session Details
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <ScoreIcon color="primary" />
                        <Typography variant="body1">
                          <strong>Score:</strong> {selectedSession.posture_score}/100
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <CalendarIcon color="primary" />
                        <Typography variant="body1">
                          <strong>Date:</strong> {formatDate(selectedSession.created_at)}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <TimeIcon color="primary" />
                        <Typography variant="body1">
                          <strong>Time:</strong> {formatTime(selectedSession.created_at)}
                        </Typography>
                      </Box>
                    </Paper>

                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Analysis
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {typeof selectedSession.analysis_data === 'string' ? selectedSession.analysis_data : 'Analysis available'}
                      </Typography>
                    </Paper>

                    <Box display="flex" gap={1}>
                      <Chip
                        label={getScoreLabel(selectedSession.posture_score)}
                        color={getScoreColor(selectedSession.posture_score) as any}
                        size="medium"
                      />
                      <Chip
                        label={`${selectedSession.posture_score}/100`}
                        variant="outlined"
                        size="medium"
                      />
                    </Box>
                  </Stack>
                </Box>
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>

      {/* Floating Action Button for Quick Access */}
      <Fab
        color="primary"
        aria-label="Take new posture check"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000
        }}
        href="/health-tools/posture-check"
      >
        <ImageIcon />
      </Fab>
    </Box>
  );
};

export default PostureHistory; 