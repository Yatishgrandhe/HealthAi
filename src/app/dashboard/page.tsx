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
} from "@mui/icons-material";
import { motion } from "framer-motion";
import DataMigrationModal from "@/components/DataMigrationModal";

interface HealthStats {
  totalSessions: number;
  fitnessWorkouts: number;
  postureChecks: number;
  healthScore: number;
  recentActivities: HealthActivity[];
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
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [stats, setStats] = useState<HealthStats>({
    totalSessions: 0,
    fitnessWorkouts: 0,
    postureChecks: 0,
    healthScore: 85,
    recentActivities: [],
  });
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);
      await fetchHealthData(user.id);
      setLoading(false);
      
      // Check if user should see migration modal
      const hasBrowserData = localStorage.getItem('healthAI_therapistChat') || 
                            localStorage.getItem('healthAI_postureCheck') || 
                            localStorage.getItem('healthAI_fitnessPlanner') || 
                            localStorage.getItem('healthAI_savedRoutines') || 
                            localStorage.getItem('healthAI_healthProgress');
      
      if (hasBrowserData) {
        setShowMigrationModal(true);
      }
    };
    fetchUser();
  }, [router]);

  const fetchHealthData = async (userId: string) => {
    try {
      // Fetch health sessions
      const { data: sessions } = await supabase
        .from('health_sessions')
        .select('*')
        .eq('user_id', userId);

      // Fetch fitness workouts
      const { data: workouts } = await supabase
        .from('fitness_workouts')
        .select('*')
        .eq('user_id', userId);

      // Fetch posture checks
      const { data: postureData } = await supabase
        .from('posture_checks')
        .select('*')
        .eq('user_id', userId);

      // Calculate stats
      const totalSessions = sessions?.length || 0;
      const fitnessWorkouts = workouts?.length || 0;
      const postureChecks = postureData?.length || 0;

      // Create recent activities
      const recentActivities: HealthActivity[] = [
        {
          id: '1',
          type: 'therapy',
          title: 'AI Therapy Session',
          date: new Date().toISOString(),
          status: 'completed',
          duration: '30 min'
        },
        {
          id: '2',
          type: 'fitness',
          title: 'Morning Workout',
          date: new Date(Date.now() - 86400000).toISOString(),
          status: 'completed',
          duration: '45 min'
        },
        {
          id: '3',
          type: 'posture',
          title: 'Posture Check',
          date: new Date(Date.now() - 172800000).toISOString(),
          status: 'completed'
        }
      ];

      setStats({
        totalSessions,
        fitnessWorkouts,
        postureChecks,
        healthScore: Math.min(100, 85 + (totalSessions * 2) + (fitnessWorkouts * 3) + (postureChecks * 1)),
        recentActivities,
      });
    } catch (error) {
      console.error('Error fetching health data:', error);
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

  const StatCard = ({ title, value, icon, color, subtitle, progress }: { 
    title: string; 
    value: string | number; 
    icon: React.ReactNode; 
    color: string; 
    subtitle?: string;
    progress?: number;
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
            {value}
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
          <Grid container spacing={3} sx={{ mb: 6 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Therapy Sessions"
                value={stats.totalSessions}
                icon={<BrainIcon />}
                color="#0066CC"
                subtitle="This month"
                progress={Math.min(100, (stats.totalSessions / 10) * 100)}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Workouts"
                value={stats.fitnessWorkouts}
                icon={<DumbbellIcon />}
                color="#3399FF"
                subtitle="Completed"
                progress={Math.min(100, (stats.fitnessWorkouts / 20) * 100)}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Posture Checks"
                value={stats.postureChecks}
                icon={<RulerIcon />}
                color="#004499"
                subtitle="This week"
                progress={Math.min(100, (stats.postureChecks / 7) * 100)}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Health Score"
                value={stats.healthScore}
                icon={<TrendingUpIcon />}
                color="#000000"
                subtitle="Overall wellness"
                progress={stats.healthScore}
              />
            </Grid>
          </Grid>

          {/* Main Content Grid */}
          <Grid container spacing={4}>
            {/* Recent Activities */}
            <Grid item xs={12} lg={8}>
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
                                    : "linear-gradient(45deg, #FF9800, #FFB74D)",
                                }}>
                                  {activity.status === "completed" ? <CheckCircleIcon /> : <WarningIcon />}
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
            </Grid>

            {/* Quick Actions */}
            <Grid item xs={12} lg={4}>
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
                        href="/health-tools/fitness-planner"
                        startIcon={<DumbbellIcon />}
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
                        View Fitness Plan
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
            </Grid>
          </Grid>
        </motion.div>
      </Container>
      
      {/* Data Migration Modal */}
      <DataMigrationModal
        open={showMigrationModal}
        onClose={() => setShowMigrationModal(false)}
        onComplete={() => {
          setShowMigrationModal(false);
          // Refresh data after migration
          if (user) {
            fetchHealthData(user.id);
          }
        }}
      />
    </Box>
  );
} 