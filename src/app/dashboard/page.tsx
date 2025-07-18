"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabaseClient";
import { useRouter } from "next/navigation";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Divider,
  CircularProgress,
  Avatar,
  LinearProgress,
} from "@mui/material";
import {
  Psychology as BrainIcon,
  FitnessCenter as DumbbellIcon,
  Straighten as RulerIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  ArrowForward as ArrowForwardIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Flag as FlagIcon,
  Bookmark as BookmarkIcon,
  Straighten as PostureIcon,
  TrendingUp as StreakIcon,
  Chat as ChatIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import HealthDataService from "@/utils/healthDataService";

interface HealthStats {
  totalSessions: number;
  postureChecks: number;
  healthScore: number;
  recentActivities: HealthActivity[];
  savedRoutinesCount?: number;
  averagePostureScore?: number;
  progressStreak?: number;
  totalMessages?: number;
}

interface HealthActivity {
  id: string;
  type: string;
  title: string;
  date: string;
  status: string;
  duration?: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<HealthStats>({
    totalSessions: 0,
    postureChecks: 0,
    healthScore: 85,
    recentActivities: [],
  });
  const router = useRouter();
  const healthDataService = new HealthDataService();

  useEffect(() => {
    const fetchUser = async () => {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return;
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);
      await fetchHealthData(user.id);
      setLoading(false);
    };
    fetchUser();
  }, [router]);

  const fetchHealthData = async (userId: string) => {
    try {
      console.log('Fetching health data for user:', userId);
      
      // Get data from user-specific localStorage keys
      const therapistStorageKey = `therapist-chats-${userId}`;
      const postureStorageKey = `postureProgressReports-${userId}`;
      
      const localTherapistChats = localStorage.getItem(therapistStorageKey);
      const localPostureReports = localStorage.getItem(postureStorageKey);

      let therapistSessions: any[] = [];
      let postureSessions: any[] = [];
      let savedRoutines: any[] = [];
      let healthProgress: any[] = [];

      // Parse therapist chat data
      if (localTherapistChats) {
        try {
          const parsed = JSON.parse(localTherapistChats);
          console.log('Raw therapist chat data:', parsed);
          
          // Handle different data structures
          if (Array.isArray(parsed)) {
            therapistSessions = parsed;
          } else if (parsed && parsed.chats && Array.isArray(parsed.chats)) {
            therapistSessions = parsed.chats;
          } else if (parsed && typeof parsed === 'object') {
            // Single session object
            therapistSessions = [parsed];
          }
          
          console.log('Processed therapist sessions:', therapistSessions.length);
        } catch (e) {
          console.warn('Error parsing local therapist chat data:', e);
        }
      }

      // Parse posture check data
      if (localPostureReports) {
        try {
          const parsed = JSON.parse(localPostureReports);
          console.log('Raw posture reports data:', parsed);
          
          // Handle different data structures
          if (Array.isArray(parsed)) {
            postureSessions = parsed;
          } else if (parsed && parsed.data && Array.isArray(parsed.data)) {
            postureSessions = parsed.data;
          } else if (parsed && typeof parsed === 'object') {
            // Single session object
            postureSessions = [parsed];
          }
          
          console.log('Processed posture sessions:', postureSessions.length);
        } catch (e) {
          console.warn('Error parsing local posture check data:', e);
        }
      }

      // If no local data, try to fetch from database as fallback
      if (therapistSessions.length === 0 && postureSessions.length === 0) {
        if (supabase) {
          try {
            console.log('No local data found, trying database fallback...');
            const [
              dbTherapistSessions,
              dbPostureSessions
            ] = await Promise.all([
              healthDataService.getTherapistChatSessions(),
              healthDataService.getPostureCheckSessions()
            ]);

            therapistSessions = dbTherapistSessions || [];
            postureSessions = dbPostureSessions || [];
            console.log('Loaded from database - therapist:', therapistSessions.length, 'posture:', postureSessions.length);
          } catch (dbError) {
            console.warn('Error fetching from database, using local data only:', dbError);
          }
        }
      }

      // Calculate stats from actual data
      const totalSessions = therapistSessions?.length || 0;
      const postureChecks = postureSessions?.length || 0;
      
      // Calculate average posture score from actual posture data
      let averagePostureScore = 0;
      if (postureSessions && postureSessions.length > 0) {
        const totalScore = postureSessions.reduce((acc: number, session: any) => {
          // Handle different possible score formats
          const score = session.overall_score || session.posture_score || session.score || 0;
          return acc + score;
        }, 0);
        averagePostureScore = Math.round(totalScore / postureSessions.length);
      }

      // Calculate health score based on actual data
      const baseScore = 50;
      const sessionScore = totalSessions * 5; // Each therapy session adds 5 points
      const postureScore = averagePostureScore * 0.3; // Posture score contributes up to 30 points
      const activityScore = Math.min(20, (totalSessions + postureChecks) * 2); // Activity bonus
      
      const healthScore = Math.min(100, Math.max(0, baseScore + sessionScore + postureScore + activityScore));

      // Create recent activities from actual data
      const recentActivities: HealthActivity[] = [];

      // Add therapist sessions
      therapistSessions?.slice(0, 3).forEach((session: any) => {
        recentActivities.push({
          id: session.id || 'unknown',
          type: 'therapy',
          title: session.title || 'AI Therapy Session',
          date: session.createdAt || session.created_at || new Date().toISOString(),
          status: 'completed',
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
          status: 'completed',
          duration: session.duration_seconds ? `${Math.round(session.duration_seconds / 60)} min` : undefined
        });
      });

      // Sort by date and take the most recent 5
      const sortedActivities = recentActivities
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

      // If no real activities, add some encouraging placeholder activities
      if (sortedActivities.length === 0) {
        sortedActivities.push(
          {
            id: 'welcome',
            type: 'welcome',
            title: 'Welcome to Health AI!',
            date: new Date().toISOString(),
            status: 'active'
          },
          {
            id: 'get-started',
            type: 'tip',
            title: 'Try our Posture Check tool',
            date: new Date(Date.now() - 86400000).toISOString(),
            status: 'pending'
          },
          {
            id: 'therapy',
            type: 'tip',
            title: 'Start a conversation with our AI therapist',
            date: new Date(Date.now() - 172800000).toISOString(),
            status: 'pending'
          }
        );
      }

      // Calculate total messages from therapist sessions
      const totalMessages = therapistSessions?.reduce((acc: number, session: any) => acc + (session.messages?.length || 0), 0) || 0;

      setStats({
        totalSessions,
        postureChecks,
        healthScore: Math.round(healthScore),
        recentActivities: sortedActivities,
        savedRoutinesCount: 0, // No saved routines feature currently
        averagePostureScore: postureSessions?.length ? averagePostureScore : undefined,
        progressStreak: 0, // No progress streak feature currently
        totalMessages
      });

    } catch (error) {
      console.error('Error fetching health data:', error);
      // Set default stats if there's an error
      setStats({
        totalSessions: 0,
        postureChecks: 0,
        healthScore: 50,
        recentActivities: [
          {
            id: 'welcome',
            type: 'welcome',
            title: 'Welcome to Health AI!',
            date: new Date().toISOString(),
            status: 'active'
          }
        ]
      });
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #f8f9ff 0%, #e3f2fd 100%)",
        }}
      >
        <CircularProgress size={60} sx={{ color: "#0066CC" }} />
      </Box>
    );
  }

  const StatCard = ({ title, value, icon, color, subtitle, progress, valueSuffix }: { 
    title: string; 
    value: string | number; 
    icon: React.ReactNode; 
    color: string; 
    subtitle?: string;
    progress?: number;
    valueSuffix?: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card
        sx={{
          height: '100%',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 102, 204, 0.1)',
          borderRadius: 3,
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 32px rgba(0, 102, 204, 0.15)',
          }
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Avatar sx={{ 
              background: `linear-gradient(135deg, ${color}, ${color}dd)`,
              width: 48,
              height: 48
            }}>
              {icon}
            </Avatar>
            {progress !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {progress}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={progress} 
                  sx={{ 
                    width: 40, 
                    height: 6, 
                    borderRadius: 3,
                    backgroundColor: 'rgba(0, 102, 204, 0.1)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: color,
                      borderRadius: 3,
                    }
                  }} 
                />
              </Box>
            )}
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: '#000000' }}>
            {value}{valueSuffix || ''}
          </Typography>
          <Typography variant="body2" sx={{ color: '#666666', mb: 1 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color: '#999999' }}>
              {subtitle}
            </Typography>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f8f9ff 0%, #e3f2fd 100%)",
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Header */}
          <Box sx={{ mb: 6 }}>
            <Typography
              variant="h3"
              fontWeight={700}
              sx={{ mb: 2, color: "#000000" }}
            >
              Welcome back! 👋
            </Typography>
            <Typography
              variant="h6"
              sx={{ color: "#666666", maxWidth: 600 }}
            >
              Here&#39;s your health overview for today. Keep up the great work on your wellness journey!
            </Typography>
          </Box>

          {/* Stats Cards */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 6 }}>
            <StatCard
              title="Therapy Sessions"
              value={stats.totalSessions}
              icon={<BrainIcon />}
              color="#0066CC"
              subtitle="This month"
              progress={Math.min(100, (stats.totalSessions / 10) * 100)}
            />

            <StatCard
              title="Posture Score"
              value={stats.averagePostureScore || 0}
              icon={<RulerIcon />}
              color="#3399FF"
              subtitle="Average score"
              progress={stats.averagePostureScore || 0}
            />

            <StatCard
              title="Posture Checks"
              value={stats.postureChecks}
              icon={<RulerIcon />}
              color="#004499"
              subtitle="This week"
              progress={Math.min(100, (stats.postureChecks / 7) * 100)}
            />

            <StatCard
              title="Health Score"
              value={stats.healthScore}
              icon={<TrendingUpIcon />}
              color="#000000"
              subtitle="Overall wellness"
              progress={stats.healthScore}
            />
          </Box>

          {/* Additional Stats Row */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(2, 1fr)' }, gap: 3, mb: 6 }}>
            <StatCard
              title="Total Messages"
              value={stats.totalMessages || 0}
              icon={<ChatIcon />}
              color="#FF9800"
              subtitle="Therapy conversations"
              progress={Math.min(100, ((stats.totalMessages || 0) / 100) * 100)}
            />

            <StatCard
              title="Progress Streak"
              value={stats.progressStreak || 0}
              valueSuffix=" days"
              icon={<StreakIcon />}
              color="#E91E63"
              subtitle="Current streak"
              progress={Math.min(100, ((stats.progressStreak || 0) / 30) * 100)}
            />
          </Box>

          {/* Main Content Grid */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 4 }}>
            {/* Recent Activities */}
            <Box>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card
                  sx={{
                    background: "rgba(255, 255, 255, 0.9)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(0, 102, 204, 0.1)",
                    borderRadius: 3,
                    height: '100%',
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                      <Typography variant="h5" fontWeight={600} sx={{ color: "#000000" }}>
                        Recent Activities
                      </Typography>
                      <Button
                        variant="outlined"
                        href="/health-tools"
                        endIcon={<ArrowForwardIcon />}
                        sx={{
                          borderColor: "#0066CC",
                          color: "#0066CC",
                          "&:hover": {
                            borderColor: "#004499",
                            backgroundColor: "rgba(0, 102, 204, 0.05)",
                          },
                        }}
                      >
                        View All
                      </Button>
                    </Box>
                    
                    {stats.recentActivities.length > 0 ? (
                      <List sx={{ p: 0 }}>
                        {stats.recentActivities.slice(0, 3).map((activity, index) => (
                          <Box key={activity.id}>
                            <ListItem sx={{ px: 0, py: 1.5 }}>
                              <ListItemIcon>
                                <Avatar sx={{ 
                                  width: 40, 
                                  height: 40,
                                  background: activity.status === "completed"
                                    ? "linear-gradient(45deg, #4CAF50, #66BB6A)"
                                    : activity.status === "active"
                                    ? "linear-gradient(45deg, #0066CC, #3399FF)"
                                    : "linear-gradient(45deg, #FF9800, #FFB74D)",
                                }}>
                                  {activity.type === 'therapy' && <BrainIcon />}
                                  {activity.type === 'posture' && <RulerIcon />}
                                  {activity.type === 'fitness' && <DumbbellIcon />}
                                  {activity.type === 'routine' && <BookmarkIcon />}
                                  {activity.type === 'suggestion' && <WarningIcon />}
                                  {activity.type === 'welcome' && <PersonIcon />}
                                  {!['therapy', 'posture', 'fitness', 'routine', 'suggestion', 'welcome'].includes(activity.type) && 
                                    (activity.status === "completed" ? <CheckCircleIcon /> : <WarningIcon />)
                                  }
                                </Avatar>
                              </ListItemIcon>
                              <ListItemText
                                primary={activity.title}
                                secondary={`${new Date(activity.date).toLocaleDateString()}${activity.duration ? ` • ${activity.duration}` : ""}`}
                                sx={{
                                  "& .MuiListItemText-primary": {
                                    fontWeight: 600,
                                    color: "#000000",
                                  },
                                  "& .MuiListItemText-secondary": {
                                    color: "#666666",
                                  },
                                }}
                              />
                              <Chip
                                label={activity.status}
                                size="small"
                                color={activity.status === "completed" ? "success" : "warning"}
                                sx={{ fontWeight: 600 }}
                              />
                            </ListItem>
                            {index < Math.min(2, stats.recentActivities.length - 1) && (
                              <Divider sx={{ my: 1 }} />
                            )}
                          </Box>
                        ))}
                      </List>
                    ) : (
                      <Box sx={{ textAlign: "center", py: 6 }}>
                        <FlagIcon sx={{ fontSize: 60, color: "#ccc", mb: 2 }} />
                        <Typography sx={{ color: "#666666", mb: 2 }}>
                          No activities yet
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#999999" }}>
                          Start your wellness journey by trying our health tools
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </Box>

            {/* Quick Actions */}
            <Box>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Card
                  sx={{
                    background: "rgba(255, 255, 255, 0.9)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(0, 102, 204, 0.1)",
                    borderRadius: 3,
                    height: '100%',
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h5" fontWeight={600} sx={{ mb: 3, color: "#000000" }}>
                      Quick Actions
                    </Typography>
                    
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <Button
                        variant="contained"
                        href="/health-tools/therapist-chat"
                        startIcon={<BrainIcon />}
                        sx={{
                          background: "linear-gradient(45deg, #0066CC, #3399FF)",
                          color: "white",
                          py: 1.5,
                          "&:hover": {
                            background: "linear-gradient(45deg, #004499, #0066CC)",
                          },
                        }}
                      >
                        Start Therapy Session
                      </Button>
                      
                      <Button
                        variant="outlined"
                        href="/health-tools/posture-history"
                        startIcon={<RulerIcon />}
                        sx={{
                          borderColor: "#0066CC",
                          color: "#0066CC",
                          py: 1.5,
                          "&:hover": {
                            borderColor: "#004499",
                            backgroundColor: "rgba(0, 102, 204, 0.05)",
                          },
                        }}
                      >
                        View Posture History
                      </Button>
                      
                      <Button
                        variant="outlined"
                        href="/health-tools/posture-check"
                        startIcon={<RulerIcon />}
                        sx={{
                          borderColor: "#0066CC",
                          color: "#0066CC",
                          py: 1.5,
                          "&:hover": {
                            borderColor: "#004499",
                            backgroundColor: "rgba(0, 102, 204, 0.05)",
                          },
                        }}
                      >
                        Check Posture
                      </Button>

                      <Button
                        variant="outlined"
                        href="/dashboard/calendar"
                        startIcon={<CalendarIcon />}
                        sx={{
                          borderColor: "#0066CC",
                          color: "#0066CC",
                          py: 1.5,
                          "&:hover": {
                            borderColor: "#004499",
                            backgroundColor: "rgba(0, 102, 204, 0.05)",
                          },
                        }}
                      >
                        View Calendar
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Box>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
} 