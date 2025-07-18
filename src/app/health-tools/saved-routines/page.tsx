"use client";

import { useState, useEffect } from "react";
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Paper, 
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  LinearProgress
} from "@mui/material";
import { 
  FitnessCenter, 
  PlayArrow, 
  Edit, 
  Delete, 
  Save, 
  Timer,
  TrendingUp,
  Psychology,
  CameraAlt,
  CheckCircle,
  Warning,
  Info,
  ArrowBack,
  CalendarToday,
  Schedule
} from "@mui/icons-material";
import { motion } from "framer-motion";
import Link from "next/link";
import { useUser } from "@/utils/supabaseClient";
import { useRouter } from "next/navigation";
import HealthDataService from "@/utils/healthDataService";
import BackButton from "@/components/BackButton";

interface SavedRoutine {
  id: string;
  routine_name: string;
  routine_type: "workout" | "meditation" | "stretching" | "custom";
  routine_data: any;
  image_urls: string[] | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

function SavedRoutinesPageInner() {
  const [routines, setRoutines] = useState<SavedRoutine[]>([]);
  const [selectedRoutine, setSelectedRoutine] = useState<SavedRoutine | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const healthDataService = new HealthDataService();

  // Redirect if not logged in
  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  // Load saved routines from database
  useEffect(() => {
    const loadSavedRoutines = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const routines = await healthDataService.getSavedRoutines();
        setRoutines(routines || []);
      } catch (err) {
        console.error('Error loading saved routines:', err);
        setError('Failed to load routines');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadSavedRoutines();
    }
  }, [user]);

  const handleDeleteRoutine = async (id: string) => {
    if (!user) return;
    
    try {
      await healthDataService.deleteSavedRoutine(id);
      setRoutines(prev => prev.filter(routine => routine.id !== id));
    } catch (err) {
      console.error('Error deleting routine:', err);
      setError('Failed to delete routine');
    }
  };

  const handleToggleFavorite = async (id: string) => {
    if (!user) return;
    
    try {
      const routine = routines.find(r => r.id === id);
      if (!routine) return;
      
      await healthDataService.updateSavedRoutine(id, {
        is_favorite: !routine.is_favorite
      });
      
      setRoutines(prev => prev.map(routine => 
        routine.id === id ? { ...routine, is_favorite: !routine.is_favorite } : routine
      ));
    } catch (err) {
      console.error('Error updating routine:', err);
      setError('Failed to update routine');
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "workout": return "#FFD166";
      case "meditation": return "#06D6A0";
      case "stretching": return "#7B61FF";
      case "custom": return "#E573B7";
      default: return "#9E9E9E";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "workout": return <FitnessCenter />;
      case "meditation": return <Psychology />;
      case "stretching": return <CameraAlt />;
      case "custom": return <Schedule />;
      default: return <FitnessCenter />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  // Show loading state
  if (userLoading || loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: user ? "calc(100vh - 120px)" : "100vh", background: "#f8f9ff" }}>
      {/* Back Button for logged-out users */}
      {!user && (
        <Box sx={{ mb: 2 }}>
          <BackButton href="/health-tools" label="Back to Health Tools" />
        </Box>
      )}
      {/* Status Bar */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          py: 2,
          mb: 3
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <img 
              src="/health-ai-logo.png" 
              alt="Health AI Logo" 
              width={32} 
              height={32} 
              style={{
                borderRadius: '50%',
                background: 'transparent',
                display: 'block'
              }}
            />
              <Box sx={{ ml: 2 }}>
                <Typography
                  variant="h6"
                  sx={{
                    color: "white",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 1
                  }}
                >
                  <FitnessCenter sx={{ fontSize: 20 }} />
                  Saved Routines
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "rgba(255, 255, 255, 0.8)",
                    fontSize: "0.75rem"
                  }}
                >
                  Manage your fitness and wellness plans
                </Typography>
              </Box>
            </Box>
            <Chip
              label={`${routines.length} Routines`}
              size="small"
              sx={{
                background: "rgba(255, 255, 255, 0.2)",
                color: "white",
                fontWeight: 500
              }}
            />
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                Your Routines
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Track your progress and manage your saved fitness plans
              </Typography>
            </Box>
            <Button
              component={Link}
              href="/health-tools/fitness-planner"
              variant="contained"
              startIcon={<FitnessCenter />}
              sx={{
                background: "linear-gradient(135deg, #E573B7, #7B61FF)",
                "&:hover": {
                  background: "linear-gradient(135deg, #D563A7, #6B51EF)",
                },
                px: 3,
                py: 1.5,
                borderRadius: 3,
                fontWeight: 600,
                textTransform: "none"
              }}
            >
              Create New Plan
            </Button>
          </Box>
        </motion.div>

        {/* Empty State */}
        {routines.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Paper
              sx={{
                p: 6,
                textAlign: "center",
                background: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: 3
              }}
            >
              <FitnessCenter sx={{ fontSize: 64, color: "#7B61FF", mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                No Saved Routines Yet
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Start your fitness journey by creating your first routine
              </Typography>
              <Button
                component={Link}
                href="/health-tools/fitness-planner"
                variant="contained"
                startIcon={<FitnessCenter />}
                sx={{
                  background: "linear-gradient(135deg, #E573B7, #7B61FF)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #D563A7, #6B51EF)",
                  },
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
                  fontWeight: 600,
                  textTransform: "none"
                }}
              >
                Create Your First Routine
              </Button>
            </Paper>
          </motion.div>
        )}

        {/* Routines Grid */}
        {routines.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {routines.map((routine, index) => (
              <Box key={routine.id} sx={{ width: { xs: '100%', md: '50%', lg: '33.333%' }, mb: 3 }}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card
                    sx={{
                      borderRadius: 3,
                      height: "100%",
                      background: "rgba(255, 255, 255, 0.95)",
                      backdropFilter: "blur(20px)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: "0 12px 40px rgba(0, 0, 0, 0.15)",
                      }
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      {/* Header */}
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Box
                            sx={{
                              background: getTypeColor(routine.routine_type),
                              borderRadius: "50%",
                              width: 40,
                              height: 40,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white"
                            }}
                          >
                            {getTypeIcon(routine.routine_type)}
                          </Box>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                              {routine.routine_name}
                            </Typography>
                            <Chip
                              label={routine.routine_type}
                              size="small"
                              sx={{
                                background: getTypeColor(routine.routine_type),
                                color: "white",
                                fontWeight: 500,
                                textTransform: "capitalize"
                              }}
                            />
                          </Box>
                        </Box>
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleFavorite(routine.id)}
                            sx={{
                              color: routine.is_favorite ? "#FFD700" : "#9E9E9E",
                              "&:hover": {
                                color: routine.is_favorite ? "#FFC700" : "#FFD700"
                              }
                            }}
                          >
                            <CheckCircle />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteRoutine(routine.id)}
                            sx={{
                              color: "#9E9E9E",
                              "&:hover": {
                                color: "#F44336"
                              }
                            }}
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                      </Box>

                      {/* Routine Data Preview */}
                      {routine.routine_data && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Routine Details:
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            background: "#f5f5f5", 
                            p: 1, 
                            borderRadius: 1,
                            fontFamily: "monospace",
                            fontSize: "0.75rem"
                          }}>
                            {JSON.stringify(routine.routine_data, null, 2).substring(0, 100)}...
                          </Typography>
                        </Box>
                      )}

                      {/* Images */}
                      {routine.image_urls && routine.image_urls.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Images ({routine.image_urls.length}):
                          </Typography>
                          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                            {routine.image_urls.slice(0, 3).map((url, idx) => (
                              <Box
                                key={idx}
                                component="img"
                                src={url}
                                alt={`Routine ${idx + 1}`}
                                sx={{
                                  width: 60,
                                  height: 60,
                                  borderRadius: 1,
                                  objectFit: "cover"
                                }}
                              />
                            ))}
                            {routine.image_urls.length > 3 && (
                              <Box
                                sx={{
                                  width: 60,
                                  height: 60,
                                  borderRadius: 1,
                                  background: "#f0f0f0",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "#666"
                                }}
                              >
                                +{routine.image_urls.length - 3}
                              </Box>
                            )}
                          </Box>
                        </Box>
                      )}

                      {/* Footer */}
                      <Box sx={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center",
                        pt: 2,
                        borderTop: "1px solid #f0f0f0"
                      }}>
                        <Typography variant="caption" color="text.secondary">
                          Created {formatDate(routine.created_at)}
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<PlayArrow />}
                          sx={{
                            borderColor: getTypeColor(routine.routine_type),
                            color: getTypeColor(routine.routine_type),
                            "&:hover": {
                              background: getTypeColor(routine.routine_type),
                              color: "white"
                            }
                          }}
                        >
                          Start
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Box>
            ))}
          </Box>
        )}

        {/* Routine Details Dialog */}
        <Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {selectedRoutine?.routine_name}
          </DialogTitle>
          <DialogContent>
            {selectedRoutine && (
              <Box>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  <strong>Type:</strong> {selectedRoutine.routine_type}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  <strong>Created:</strong> {formatDate(selectedRoutine.created_at)}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  <strong>Updated:</strong> {formatDate(selectedRoutine.updated_at)}
                </Typography>
                {selectedRoutine.routine_data && (
                  <Box>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>Routine Data:</strong>
                    </Typography>
                    <Paper
                      sx={{
                        p: 2,
                        background: "#f5f5f5",
                        fontFamily: "monospace",
                        fontSize: "0.75rem",
                        maxHeight: 300,
                        overflow: "auto"
                      }}
                    >
                      <pre>{JSON.stringify(selectedRoutine.routine_data, null, 2)}</pre>
                    </Paper>
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}

export default function SavedRoutinesPage() {
  return <SavedRoutinesPageInner />;
} 