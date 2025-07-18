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
  Fab,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
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
  ErrorOutline as ErrorOutlineIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { supabase, useUser } from '@/utils/supabaseClient';
import BackButton from '@/components/BackButton';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Container } from '@mui/material';
import { AccessTime, ErrorOutline, CheckCircle, Warning, Info } from '@mui/icons-material';

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
  const { user, loading: userLoading } = useUser();
  const [sessions, setSessions] = useState<PostureSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<PostureSession | null>(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [showProgressReport, setShowProgressReport] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('PostureHistory - User state changed:', { user, userLoading });
  }, [user, userLoading]);

  useEffect(() => {
    if (!userLoading) {
      loadPostureHistory();
    }
  }, [user, userLoading]);

  // Safety timeout to prevent infinite loading
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        console.log('Loading timeout - forcing loading to false');
        setLoading(false);
        setError('Loading took too long. Please refresh the page.');
      }, 15000); // 15 seconds timeout

      return () => clearTimeout(timeout);
    }
  }, [loading]);

  const loadPostureHistory = async () => {
    try {
      console.log('loadPostureHistory called with user:', user);
      setLoading(true);
      setError(null);

      if (user && supabase) {
        // Load from database for logged-in users
        try {
          console.log('Loading posture history from database for user:', user.id);
          
          const { data, error } = await supabase
            .from('posture_check_sessions')
            .select(`
              id,
              user_id,
              session_title,
              posture_score,
              analysis_data,
              image_urls,
              recommendations,
              duration_seconds,
              created_at
            `)
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
            console.log('Loaded sessions from database:', data);
            
            // Transform database data to match the expected format
            const transformedSessions = (data || []).map(session => ({
              id: session.id,
              user_id: session.user_id,
              session_title: session.session_title || 'Posture Check',
              posture_score: session.posture_score || 0,
              analysis_data: session.analysis_data || {},
              image_urls: session.image_urls || [],
              recommendations: session.recommendations || {},
              duration_seconds: session.duration_seconds || 0,
              created_at: session.created_at
            }));
            
            setSessions(transformedSessions);
            
            // Show success message if data was loaded
            if (transformedSessions.length > 0) {
              setSnackbarMessage(`Loaded ${transformedSessions.length} posture sessions`);
              setSnackbarOpen(true);
            }
          }
        } catch (dbError) {
          console.error('Database load error:', dbError);
          // If database fails, try to load from localStorage as fallback
          const savedReports = localStorage.getItem('postureProgressReports');
          console.log('localStorage fallback data:', savedReports);
          if (savedReports) {
            console.log('Loading from localStorage as fallback');
            try {
              const parsedReports = JSON.parse(savedReports);
              console.log('Parsed fallback reports:', parsedReports);
              setSessions(parsedReports.map((report: any) => {
                // Handle both old and new data formats
                if (report.posture_score !== undefined) {
                  // New format (from database or converted)
                  return {
                    id: report.id,
                    user_id: report.user_id || 'guest',
                    session_title: report.session_title || `${report.status?.charAt(0).toUpperCase() + report.status?.slice(1)} Posture Check`,
                    posture_score: report.posture_score,
                    analysis_data: report.analysis_data || report.analysis,
                    image_urls: report.image_urls || [report.imageUrl],
                    recommendations: report.recommendations || report.analysis?.recommendations || [],
                    duration_seconds: report.duration_seconds || 0,
                    created_at: report.created_at || report.timestamp
                  };
                } else {
                  // Old format (from localStorage)
                  return {
                    id: report.id,
                    user_id: 'guest',
                    session_title: `${report.status?.charAt(0).toUpperCase() + report.status?.slice(1)} Posture Check`,
                    posture_score: report.score,
                    analysis_data: report.analysis,
                    image_urls: [report.imageUrl],
                    recommendations: report.analysis?.recommendations || [],
                    duration_seconds: 0,
                    created_at: report.timestamp
                  };
                }
              }));
              
              setSnackbarMessage('Loaded data from local storage (database unavailable)');
              setSnackbarOpen(true);
            } catch (parseError) {
              console.error('Error parsing fallback localStorage data:', parseError);
              setSessions([]);
              setError('Failed to load posture history data.');
            }
          } else {
            console.log('No fallback localStorage data found');
            setSessions([]);
            setError('No posture history data found.');
          }
        }
      } else {
        // Load from localStorage for guests or when supabase is not available
        const savedReports = localStorage.getItem('postureProgressReports');
        console.log('localStorage data:', savedReports);
        if (savedReports) {
          console.log('Loading from localStorage for guest user');
          try {
            const parsedReports = JSON.parse(savedReports);
            console.log('Parsed reports:', parsedReports);
            setSessions(parsedReports.map((report: any) => {
              // Handle both old and new data formats
              if (report.posture_score !== undefined) {
                // New format (from database or converted)
                return {
                  id: report.id,
                  user_id: report.user_id || 'guest',
                  session_title: report.session_title || `${report.status?.charAt(0).toUpperCase() + report.status?.slice(1)} Posture Check`,
                  posture_score: report.posture_score,
                  analysis_data: report.analysis_data || report.analysis,
                  image_urls: report.image_urls || [report.imageUrl],
                  recommendations: report.recommendations || report.analysis?.recommendations || [],
                  duration_seconds: report.duration_seconds || 0,
                  created_at: report.created_at || report.timestamp
                };
              } else {
                // Old format (from localStorage)
                return {
                  id: report.id,
                  user_id: 'guest',
                  session_title: `${report.status?.charAt(0).toUpperCase() + report.status?.slice(1)} Posture Check`,
                  posture_score: report.score,
                  analysis_data: report.analysis,
                  image_urls: [report.imageUrl],
                  recommendations: report.analysis?.recommendations || [],
                  duration_seconds: 0,
                  created_at: report.timestamp
                };
              }
            }));
            
            setSnackbarMessage(`Loaded ${parsedReports.length} posture sessions from local storage`);
            setSnackbarOpen(true);
          } catch (parseError) {
            console.error('Error parsing localStorage data:', parseError);
            setSessions([]);
            setError('Failed to load posture history data.');
          }
        } else {
          console.log('No localStorage data found');
          setSessions([]);
          setError('No posture history data found. Try completing a posture check first.');
        }
      }
    } catch (error) {
      console.error('Error loading posture history:', error);
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

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getStatusColor = (score: number) => {
    if (score >= 80) return "#4CAF50";
    if (score >= 60) return "#FF9800";
    return "#F44336";
  };

  const getStatusLabel = (score: number) => {
    if (score >= 80) return "EXCELLENT";
    if (score >= 60) return "GOOD";
    if (score >= 40) return "FAIR";
    return "POOR";
  };

  const getStatusIcon = (score: number) => {
    if (score >= 80) return <CheckCircleIcon />;
    if (score >= 60) return <CheckCircleIcon />;
    if (score >= 40) return <WarningIcon />;
    return <ErrorOutlineIcon />;
  };

  const getTrendIcon = (currentScore: number, previousScore?: number) => {
    if (!previousScore) return <RemoveIcon />;
    if (currentScore > previousScore) return <TrendingUpIcon sx={{ color: '#4CAF50' }} />;
    if (currentScore < previousScore) return <TrendingDownIcon sx={{ color: '#F44336' }} />;
    return <RemoveIcon />;
  };

  const handleViewProgressReport = (session: PostureSession) => {
    setSelectedSession(session);
    setShowProgressReport(true);
  };

  const handleCloseProgressReport = () => {
    setShowProgressReport(false);
    setSelectedSession(null);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return;
    
    try {
      if (user && supabase) {
        // Delete from database
        const { error } = await supabase
          .from('posture_check_sessions')
          .delete()
          .eq('id', sessionId)
          .eq('user_id', user.id);
        
        if (error) throw error;
        
        // Remove from local state
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        setSnackbarMessage('Session deleted successfully');
        setSnackbarOpen(true);
      } else {
        // Delete from localStorage
        const savedReports = JSON.parse(localStorage.getItem('postureProgressReports') || '[]');
        const updatedReports = savedReports.filter((report: any) => report.id !== sessionId);
        localStorage.setItem('postureProgressReports', JSON.stringify(updatedReports));
        
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        setSnackbarMessage('Session deleted successfully');
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      setSnackbarMessage('Failed to delete session');
      setSnackbarOpen(true);
    }
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
    <Box sx={{ minHeight: "100vh", background: "#f8f9ff" }}>
      {/* Back Button for logged-out users */}
      {!user && (
        <Box sx={{ mb: 2 }}>
          <BackButton href="/health-tools" label="Back to Health Tools" />
        </Box>
      )}

      {/* Header */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #7B61FF, #4CAF50)",
          py: 4,
          mb: 3
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <img 
                src="/health-ai-logo.png" 
                alt="Health AI Logo" 
                width={40} 
                height={40} 
                style={{
                  borderRadius: '50%',
                  background: 'transparent',
                  display: 'block'
                }}
              />
              <Box sx={{ ml: 2 }}>
                <Typography
                  variant="h4"
                  sx={{
                    color: "white",
                    fontWeight: 700,
                    display: { xs: "none", sm: "block" }
                  }}
                >
                  Posture History
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    color: "white",
                    fontWeight: 400,
                    display: { xs: "block", sm: "none" }
                  }}
                >
                  Posture History
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <IconButton
                onClick={handleRefresh}
                disabled={refreshing}
                sx={{ color: "white" }}
              >
                <RefreshIcon />
              </IconButton>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Guest User Notice */}
        {!user && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Guest User Notice:</strong> As a guest, your posture checks are saved locally and cannot be viewed in the history page. 
              <Link href="/register" style={{ color: '#1976d2', textDecoration: 'none', marginLeft: '8px' }}>
                Sign up to unlock all features!
              </Link>
            </Typography>
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Empty State */}
        {!loading && sessions.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <ErrorOutlineIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" sx={{ mb: 2, color: 'text.secondary' }}>
              No Posture History Found
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
              Complete your first posture check to see your history here.
            </Typography>
            <Button
              variant="contained"
              href="/health-tools/posture-check"
              sx={{
                background: "linear-gradient(135deg, #7B61FF, #4CAF50)",
                px: 4,
                py: 1.5,
                "&:hover": {
                  background: "linear-gradient(135deg, #6B51EF, #45A049)",
                },
              }}
            >
              Start Posture Check
            </Button>
          </Box>
        )}

        {/* Sessions Grid */}
        {!loading && sessions.length > 0 && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, color: "#7B61FF" }}>
                Posture Sessions ({sessions.length})
              </Typography>
              <Chip
                label={`Average Score: ${Math.round(sessions.reduce((acc, s) => acc + s.posture_score, 0) / sessions.length)}`}
                color="primary"
                variant="outlined"
              />
            </Box>
            
            <Grid container spacing={3}>
              {sessions.map((session, index) => (
                <Grid item xs={12} sm={6} md={4} key={session.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 4,
                        }
                      }}
                      onClick={() => handleViewProgressReport(session)}
                    >
                      <CardContent sx={{ flexGrow: 1, p: 3 }}>
                        {/* Score Circle */}
                        <Box sx={{ textAlign: 'center', mb: 2 }}>
                          <Box
                            sx={{
                              width: 80,
                              height: 80,
                              borderRadius: "50%",
                              background: `conic-gradient(${getStatusColor(session.posture_score)} ${session.posture_score * 3.6}deg, #f0f0f0 0deg)`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              mx: "auto",
                              mb: 1,
                              position: "relative"
                            }}
                          >
                            <Box
                              sx={{
                                width: 60,
                                height: 60,
                                borderRadius: "50%",
                                background: "white",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexDirection: "column"
                              }}
                            >
                              <Typography variant="h6" sx={{ fontWeight: 700, color: getStatusColor(session.posture_score) }}>
                                {session.posture_score}
                              </Typography>
                            </Box>
                          </Box>
                          <Chip
                            label={getStatusLabel(session.posture_score)}
                            icon={getStatusIcon(session.posture_score)}
                            sx={{
                              background: `${getStatusColor(session.posture_score)}20`,
                              color: getStatusColor(session.posture_score),
                              fontWeight: 600,
                              fontSize: "0.75rem"
                            }}
                          />
                        </Box>

                        {/* Session Info */}
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, textAlign: 'center' }}>
                          {session.session_title || 'Posture Check'}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                          <CalendarIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(session.created_at)}
                          </Typography>
                        </Box>

                        {/* Image Preview */}
                        {session.image_urls && session.image_urls.length > 0 && (
                          <Box sx={{ textAlign: 'center', mb: 2 }}>
                            <img 
                              src={session.image_urls[0]} 
                              alt="Posture check" 
                              style={{
                                maxWidth: "100%",
                                maxHeight: "120px",
                                borderRadius: "8px",
                                border: "1px solid #e0e0e0"
                              }}
                            />
                          </Box>
                        )}

                        {/* Action Buttons */}
                        <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                          <Button
                            fullWidth
                            variant="outlined"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewProgressReport(session);
                            }}
                            startIcon={<VisibilityIcon />}
                          >
                            View Details
                          </Button>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSession(session.id);
                            }}
                            sx={{ color: 'error.main' }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Container>

      {/* Progress Report Dialog */}
      <Dialog
        open={showProgressReport}
        onClose={handleCloseProgressReport}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: "linear-gradient(135deg, #7B61FF, #4CAF50)",
          color: "white",
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Posture Analysis Report
          </Typography>
          <IconButton onClick={handleCloseProgressReport} sx={{ color: 'white' }}>
            <RemoveIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3 }}>
          {selectedSession && (
            <Box>
              {/* Score Display */}
              <Box sx={{ textAlign: "center", mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  Posture Score
                </Typography>
                <Box
                  sx={{
                    width: 140,
                    height: 140,
                    borderRadius: "50%",
                    background: `conic-gradient(${getStatusColor(selectedSession.posture_score)} ${selectedSession.posture_score * 3.6}deg, #f0f0f0 0deg)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mx: "auto",
                    mb: 2,
                    position: "relative"
                  }}
                >
                  <Box
                    sx={{
                      width: 120,
                      height: 120,
                      borderRadius: "50%",
                      background: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "column"
                    }}
                  >
                    <Typography variant="h2" sx={{ fontWeight: 700, color: getStatusColor(selectedSession.posture_score) }}>
                      {selectedSession.posture_score}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      / 100
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label={getStatusLabel(selectedSession.posture_score)}
                  icon={getStatusIcon(selectedSession.posture_score)}
                  sx={{
                    background: `${getStatusColor(selectedSession.posture_score)}20`,
                    color: getStatusColor(selectedSession.posture_score),
                    fontWeight: 600,
                    fontSize: "1rem",
                    px: 2,
                    py: 1
                  }}
                />
              </Box>

              {/* Session Details */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Session Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CalendarIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {formatDate(selectedSession.created_at)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <AccessTime sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {formatTime(selectedSession.created_at)}
                      </Typography>
                    </Box>
                  </Grid>
                  {selectedSession.duration_seconds && (
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <TimeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          Duration: {Math.round(selectedSession.duration_seconds / 60)}m
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Box>

              {/* Image Display */}
              {selectedSession.image_urls && selectedSession.image_urls.length > 0 && (
                <Box sx={{ mb: 4, textAlign: "center" }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Captured Image
                  </Typography>
                  <img 
                    src={selectedSession.image_urls[0]} 
                    alt="Posture analysis" 
                    style={{
                      maxWidth: "100%",
                      maxHeight: "300px",
                      borderRadius: "8px",
                      border: "2px solid #e0e0e0"
                    }}
                  />
                </Box>
              )}

              {/* Detailed Analysis */}
              {selectedSession.analysis_data?.detailedAnalysis && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Detailed Body Analysis
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                    {Object.entries(selectedSession.analysis_data.detailedAnalysis).map(([part, data]: [string, any]) => (
                      <Box key={part}>
                        <Card 
                          sx={{ 
                            p: 2, 
                            border: `2px solid ${data.score >= 80 ? '#4CAF50' : data.score >= 60 ? '#FF9800' : '#F44336'}`,
                            background: data.score >= 80 ? 'rgba(76, 175, 80, 0.05)' : data.score >= 60 ? 'rgba(255, 152, 0, 0.05)' : 'rgba(244, 67, 54, 0.05)'
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, textTransform: 'capitalize', flex: 1 }}>
                              {part.replace(/([A-Z])/g, ' $1').trim()}
                            </Typography>
                            <Chip 
                              label={`${data.score}/100`}
                              size="small"
                              sx={{
                                background: data.score >= 80 ? '#4CAF50' : data.score >= 60 ? '#FF9800' : '#F44336',
                                color: 'white',
                                fontWeight: 600
                              }}
                            />
                          </Box>
                          {data.issues && data.issues.length > 0 && (
                            <Box sx={{ mt: 1 }}>
                              {data.issues.map((issue: string, index: number) => (
                                <Typography 
                                  key={index} 
                                  variant="body2" 
                                  sx={{ 
                                    color: '#F44336', 
                                    fontSize: '0.75rem',
                                    mb: 0.5,
                                    display: 'flex',
                                    alignItems: 'flex-start'
                                  }}
                                >
                                  <ErrorOutline sx={{ fontSize: 14, mr: 0.5, mt: 0.1 }} />
                                  {issue}
                                </Typography>
                              ))}
                            </Box>
                          )}
                          {data.score >= 80 && (
                            <Typography variant="body2" sx={{ color: '#4CAF50', fontSize: '0.75rem', mt: 1 }}>
                              <CheckCircle sx={{ fontSize: 14, mr: 0.5 }} />
                              Good posture detected
                            </Typography>
                          )}
                        </Card>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Feedback */}
              {selectedSession.analysis_data?.feedback && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Analysis Feedback
                  </Typography>
                  <List>
                    {selectedSession.analysis_data.feedback.map((item: string, index: number) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          {item.includes('🚨') || item.includes('❌') || item.includes('💀') ? (
                            <ErrorOutline sx={{ color: "#F44336", fontSize: 20 }} />
                          ) : item.includes('⚠️') ? (
                            <Warning sx={{ color: "#FF9800", fontSize: 20 }} />
                          ) : item.includes('✅') ? (
                            <CheckCircle sx={{ color: "#4CAF50", fontSize: 20 }} />
                          ) : (
                            <Info sx={{ color: "#2196F3", fontSize: 20 }} />
                          )}
                        </ListItemIcon>
                        <ListItemText primary={item} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {/* Recommendations */}
              {selectedSession.analysis_data?.recommendations && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Recommendations
                  </Typography>
                  <List>
                    {selectedSession.analysis_data.recommendations.map((item: string, index: number) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              background: "#7B61FF",
                              mt: 0.5
                            }}
                          />
                        </ListItemIcon>
                        <ListItemText primary={item} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PostureHistory; 