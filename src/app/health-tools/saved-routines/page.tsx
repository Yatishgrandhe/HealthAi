"use client";

import { useState, useEffect } from "react";
import { 
  Box, 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Badge,
  Tooltip
} from "@mui/material";
import { 
  FitnessCenter, 
  Restaurant, 
  DirectionsRun, 
  CalendarToday,
  MoreVert,
  Delete,
  Edit,
  PlayArrow,
  Save,
  Download,
  Share,
  Favorite,
  FavoriteBorder,
  AccessTime,
  TrendingUp,
  CheckCircle,
  ArrowBack,
  Add,
  Refresh
} from "@mui/icons-material";
import { motion } from "framer-motion";
import Link from "next/link";
import { useUser } from "@/utils/supabaseClient";
import HealthDataService from "@/utils/healthDataService";
import BackButton from "@/components/BackButton";

interface SavedRoutine {
  id: string;
  routine_name: string;
  routine_type: 'workout' | 'meditation' | 'stretching' | 'custom';
  routine_data: any;
  image_urls?: string[];
  is_favorite?: boolean;
  created_at: string;
  updated_at: string;
}

interface FitnessPlan {
  id: string;
  plan_name: string;
  plan_type: string;
  duration_days: number;
  difficulty_level: string;
  exercises: any;
  nutrition_plan: any;
  goals: any;
  is_active: boolean;
  created_at: string;
}

export default function SavedRoutinesPage() {
  const [routines, setRoutines] = useState<SavedRoutine[]>([]);
  const [fitnessPlans, setFitnessPlans] = useState<FitnessPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoutine, setSelectedRoutine] = useState<SavedRoutine | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<FitnessPlan | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'routine' | 'plan', id: string, name: string } | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedItem, setSelectedItem] = useState<{ type: 'routine' | 'plan', item: any } | null>(null);

  const { user, loading: userLoading } = useUser();
  const healthDataService = new HealthDataService();

  useEffect(() => {
    if (user && !userLoading) {
      loadSavedData();
    }
  }, [user, userLoading]);

  const loadSavedData = async () => {
    try {
      setLoading(true);
      
      // Load saved routines
      const savedRoutines = await healthDataService.getSavedRoutines();
      setRoutines(savedRoutines);
      
      // Load fitness plans
      const plans = await healthDataService.getFitnessPlans();
      setFitnessPlans(plans);
      
    } catch (error) {
      console.error('Error loading saved data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      if (itemToDelete.type === 'routine') {
        await healthDataService.deleteSavedRoutine(itemToDelete.id);
        setRoutines(prev => prev.filter(r => r.id !== itemToDelete.id));
      } else {
        // For fitness plans, we'll just mark as inactive
        await healthDataService.updateFitnessPlan(itemToDelete.id, { is_active: false });
        setFitnessPlans(prev => prev.filter(p => p.id !== itemToDelete.id));
      }
      
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete. Please try again.');
    }
  };

  const handleToggleFavorite = async (routineId: string) => {
    try {
      const routine = routines.find(r => r.id === routineId);
      if (!routine) return;
      
      const updatedRoutine = await healthDataService.updateSavedRoutine(routineId, {
        is_favorite: !routine.is_favorite
      });
      
      setRoutines(prev => prev.map(r => 
        r.id === routineId ? { ...r, is_favorite: updatedRoutine.is_favorite } : r
      ));
    } catch (error) {
      console.error('Error updating favorite status:', error);
    }
  };

  const handleExport = (item: any, type: 'routine' | 'plan') => {
    const data = JSON.stringify(item, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_${item.routine_name || item.plan_name}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getRoutineTypeIcon = (type: string) => {
    switch (type) {
      case 'workout': return <FitnessCenter />;
      case 'meditation': return <TrendingUp />;
      case 'stretching': return <DirectionsRun />;
      default: return <FitnessCenter />;
    }
  };

  const getRoutineTypeColor = (type: string) => {
    switch (type) {
      case 'workout': return '#FFD166';
      case 'meditation': return '#06D6A0';
      case 'stretching': return '#7B61FF';
      default: return '#FFD166';
    }
  };

  if (userLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ minHeight: "100vh", background: "#f8f9ff" }}>
        <BackButton href="/health-tools" label="Back to Health Tools" />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ textAlign: "center", py: 8 }}>
            <FitnessCenter sx={{ fontSize: 64, color: "#FFD166", mb: 3 }} />
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 2 }}>
              Saved Routines
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Please log in to view and manage your saved fitness routines and plans.
            </Typography>
            <Button
              variant="contained"
              component={Link}
              href="/login"
              sx={{
                background: "linear-gradient(135deg, #FFD166, #06D6A0)",
                "&:hover": {
                  background: "linear-gradient(135deg, #FFC107, #00C853)",
                },
                px: 4,
                py: 1.5,
                borderRadius: 3,
                fontSize: "1.1rem",
                fontWeight: 600,
                textTransform: "none"
              }}
            >
              Log In
            </Button>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", background: "#f8f9ff" }}>
      {/* Back Button */}
      <Box sx={{ mb: 2 }}>
        <BackButton href="/health-tools" label="Back to Health Tools" />
      </Box>

      {/* Status Bar */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #FFD166, #06D6A0)",
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
                  <Save sx={{ fontSize: 20 }} />
                  Saved Routines & Plans
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "rgba(255, 255, 255, 0.8)",
                    fontSize: "0.75rem"
                  }}
                >
                  Manage your fitness routines and workout plans
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={loadSavedData}
                disabled={loading}
                sx={{
                  borderColor: "rgba(255, 255, 255, 0.3)",
                  color: "white",
                  "&:hover": {
                    borderColor: "white",
                    background: "rgba(255, 255, 255, 0.1)",
                  },
                }}
              >
                Refresh
              </Button>
              <Chip
                label={`${routines.length + fitnessPlans.length} Total`}
                size="small"
                sx={{
                  background: "rgba(255, 255, 255, 0.2)",
                  color: "white",
                  fontWeight: 500
                }}
              />
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={60} sx={{ color: "#FFD166" }} />
          </Box>
        ) : (
          <Box>
            {/* Saved Routines Section */}
            <Box sx={{ mb: 6 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
                <FitnessCenter sx={{ color: "#FFD166" }} />
                Saved Routines
                <Badge badgeContent={routines.length} color="primary" sx={{ ml: 1 }} />
              </Typography>

              {routines.length === 0 ? (
                <Card sx={{ p: 4, textAlign: "center", background: "rgba(255, 255, 255, 0.8)" }}>
                  <Typography variant="h6" sx={{ mb: 2, color: "text.secondary" }}>
                    No saved routines yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Create and save your favorite workout routines to access them anytime.
                  </Typography>
                  <Button
                    variant="outlined"
                    component={Link}
                    href="/health-tools/fitness-planner"
                    startIcon={<Add />}
                    sx={{
                      borderColor: "#FFD166",
                      color: "#FFD166",
                      "&:hover": {
                        borderColor: "#FFC107",
                        background: "rgba(255, 209, 102, 0.05)",
                      },
                    }}
                  >
                    Create New Routine
                  </Button>
                </Card>
              ) : (
                <Grid container spacing={3}>
                  {routines.map((routine) => (
                    <Grid item xs={12} sm={6} md={4} key={routine.id}>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        <Card 
                          sx={{ 
                            height: "100%",
                            cursor: "pointer",
                            "&:hover": {
                              transform: "translateY(-4px)",
                              boxShadow: 4
                            },
                            transition: "all 0.3s ease"
                          }}
                          onClick={() => setSelectedRoutine(routine)}
                        >
                          <CardContent>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Box sx={{ 
                                  color: getRoutineTypeColor(routine.routine_type),
                                  display: "flex",
                                  alignItems: "center"
                                }}>
                                  {getRoutineTypeIcon(routine.routine_type)}
                                </Box>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                  {routine.routine_name}
                                </Typography>
                              </Box>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedItem({ type: 'routine', item: routine });
                                  setAnchorEl(e.currentTarget);
                                }}
                              >
                                <MoreVert />
                              </IconButton>
                            </Box>

                            <Chip
                              label={routine.routine_type}
                              size="small"
                              sx={{
                                background: `${getRoutineTypeColor(routine.routine_type)}20`,
                                color: getRoutineTypeColor(routine.routine_type),
                                fontWeight: 500,
                                mb: 2
                              }}
                            />

                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                              <AccessTime sx={{ fontSize: 16, color: "text.secondary" }} />
                              <Typography variant="caption" color="text.secondary">
                                {new Date(routine.created_at).toLocaleDateString()}
                              </Typography>
                            </Box>

                            <Box sx={{ display: "flex", gap: 1 }}>
                              <Button
                                size="small"
                                startIcon={<PlayArrow />}
                                variant="outlined"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Handle start routine
                                }}
                                sx={{
                                  borderColor: getRoutineTypeColor(routine.routine_type),
                                  color: getRoutineTypeColor(routine.routine_type),
                                  "&:hover": {
                                    borderColor: getRoutineTypeColor(routine.routine_type),
                                    background: `${getRoutineTypeColor(routine.routine_type)}10`,
                                  },
                                }}
                              >
                                Start
                              </Button>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleFavorite(routine.id);
                                }}
                                sx={{ color: routine.is_favorite ? "#FFD166" : "text.secondary" }}
                              >
                                {routine.is_favorite ? <Favorite /> : <FavoriteBorder />}
                              </IconButton>
                            </Box>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>

            {/* Fitness Plans Section */}
            <Box sx={{ mb: 6 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
                <CalendarToday sx={{ color: "#06D6A0" }} />
                Fitness Plans
                <Badge badgeContent={fitnessPlans.length} color="primary" sx={{ ml: 1 }} />
              </Typography>

              {fitnessPlans.length === 0 ? (
                <Card sx={{ p: 4, textAlign: "center", background: "rgba(255, 255, 255, 0.8)" }}>
                  <Typography variant="h6" sx={{ mb: 2, color: "text.secondary" }}>
                    No fitness plans yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Generate a personalized fitness plan to get started on your journey.
                  </Typography>
                  <Button
                    variant="outlined"
                    component={Link}
                    href="/health-tools/fitness-planner"
                    startIcon={<Add />}
                    sx={{
                      borderColor: "#06D6A0",
                      color: "#06D6A0",
                      "&:hover": {
                        borderColor: "#00C853",
                        background: "rgba(6, 214, 160, 0.05)",
                      },
                    }}
                  >
                    Create Fitness Plan
                  </Button>
                </Card>
              ) : (
                <Grid container spacing={3}>
                  {fitnessPlans.map((plan) => (
                    <Grid item xs={12} sm={6} md={4} key={plan.id}>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                      >
                        <Card 
                          sx={{ 
                            height: "100%",
                            cursor: "pointer",
                            "&:hover": {
                              transform: "translateY(-4px)",
                              boxShadow: 4
                            },
                            transition: "all 0.3s ease"
                          }}
                          onClick={() => setSelectedPlan(plan)}
                        >
                          <CardContent>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <CalendarToday sx={{ color: "#06D6A0" }} />
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                  {plan.plan_name}
                                </Typography>
                              </Box>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedItem({ type: 'plan', item: plan });
                                  setAnchorEl(e.currentTarget);
                                }}
                              >
                                <MoreVert />
                              </IconButton>
                            </Box>

                            <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
                              <Chip
                                label={`${plan.duration_days} Days`}
                                size="small"
                                sx={{
                                  background: "linear-gradient(135deg, #FFD166, #06D6A0)",
                                  color: "white",
                                  fontWeight: 500
                                }}
                              />
                              <Chip
                                label={plan.difficulty_level}
                                size="small"
                                sx={{
                                  background: "rgba(6, 214, 160, 0.1)",
                                  color: "#06D6A0",
                                  fontWeight: 500
                                }}
                              />
                              {plan.is_active && (
                                <Chip
                                  label="Active"
                                  size="small"
                                  icon={<CheckCircle />}
                                  sx={{
                                    background: "rgba(76, 175, 80, 0.1)",
                                    color: "#4CAF50",
                                    fontWeight: 500
                                  }}
                                />
                              )}
                            </Box>

                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                              <AccessTime sx={{ fontSize: 16, color: "text.secondary" }} />
                              <Typography variant="caption" color="text.secondary">
                                {new Date(plan.created_at).toLocaleDateString()}
                              </Typography>
                            </Box>

                            <Box sx={{ display: "flex", gap: 1 }}>
                              <Button
                                size="small"
                                startIcon={<PlayArrow />}
                                variant="outlined"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Handle start plan
                                }}
                                sx={{
                                  borderColor: "#06D6A0",
                                  color: "#06D6A0",
                                  "&:hover": {
                                    borderColor: "#00C853",
                                    background: "rgba(6, 214, 160, 0.05)",
                                  },
                                }}
                              >
                                Start Plan
                              </Button>
                              <Button
                                size="small"
                                startIcon={<CalendarToday />}
                                variant="outlined"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Handle view calendar
                                }}
                                sx={{
                                  borderColor: "#FFD166",
                                  color: "#FFD166",
                                  "&:hover": {
                                    borderColor: "#FFC107",
                                    background: "rgba(255, 209, 102, 0.05)",
                                  },
                                }}
                              >
                                Calendar
                              </Button>
                            </Box>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          </Box>
        )}
      </Container>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => {
          if (selectedItem) {
            handleExport(selectedItem.item, selectedItem.type);
          }
          setAnchorEl(null);
        }}>
          <ListItemIcon>
            <Download fontSize="small" />
          </ListItemIcon>
          Export
        </MenuItem>
        <MenuItem onClick={() => {
          setAnchorEl(null);
        }}>
          <ListItemIcon>
            <Share fontSize="small" />
          </ListItemIcon>
          Share
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => {
          if (selectedItem) {
            setItemToDelete({
              type: selectedItem.type,
              id: selectedItem.item.id,
              name: selectedItem.item.routine_name || selectedItem.item.plan_name
            });
            setDeleteDialogOpen(true);
          }
          setAnchorEl(null);
        }} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <Delete fontSize="small" sx={{ color: 'error.main' }} />
          </ListItemIcon>
          Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete {itemToDelete?.type === 'routine' ? 'Routine' : 'Plan'}</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{itemToDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Routine Detail Dialog */}
      <Dialog 
        open={Boolean(selectedRoutine)} 
        onClose={() => setSelectedRoutine(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedRoutine && (
          <>
            <DialogTitle>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {getRoutineTypeIcon(selectedRoutine.routine_type)}
                {selectedRoutine.routine_name}
              </Box>
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {JSON.stringify(selectedRoutine.routine_data, null, 2)}
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedRoutine(null)}>Close</Button>
              <Button 
                variant="contained"
                startIcon={<PlayArrow />}
                sx={{
                  background: "linear-gradient(135deg, #FFD166, #06D6A0)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #FFC107, #00C853)",
                  }
                }}
              >
                Start Routine
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Plan Detail Dialog */}
      <Dialog 
        open={Boolean(selectedPlan)} 
        onClose={() => setSelectedPlan(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedPlan && (
          <>
            <DialogTitle>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CalendarToday sx={{ color: "#06D6A0" }} />
                {selectedPlan.plan_name}
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>Plan Details</Typography>
                <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                  <Chip label={`${selectedPlan.duration_days} Days`} />
                  <Chip label={selectedPlan.difficulty_level} />
                  <Chip label={selectedPlan.plan_type} />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Created: {new Date(selectedPlan.created_at).toLocaleDateString()}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>Goals</Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {selectedPlan.goals?.map((goal: string, index: number) => (
                    <Chip key={index} label={goal} size="small" />
                  ))}
                </Box>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>Exercises</Typography>
                <Typography variant="body2" color="text.secondary">
                  {JSON.stringify(selectedPlan.exercises, null, 2)}
                </Typography>
              </Box>

              <Box>
                <Typography variant="h6" sx={{ mb: 1 }}>Nutrition Plan</Typography>
                <Typography variant="body2" color="text.secondary">
                  {JSON.stringify(selectedPlan.nutrition_plan, null, 2)}
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedPlan(null)}>Close</Button>
              <Button 
                variant="contained"
                startIcon={<PlayArrow />}
                sx={{
                  background: "linear-gradient(135deg, #FFD166, #06D6A0)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #FFC107, #00C853)",
                  }
                }}
              >
                Start Plan
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
} 