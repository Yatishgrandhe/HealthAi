"use client";

import { useState } from "react";
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Button, 
  IconButton,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from "@mui/material";
import { 
  FitnessCenter, 
  ArrowBack, 
  PlayArrow,
  Delete,
  TrendingUp,
  CalendarToday,
  Restaurant,
  DirectionsRun,
  CheckCircle,
  Schedule
} from "@mui/icons-material";
import { motion } from "framer-motion";
import Link from "next/link";


interface SavedRoutine {
  id: string;
  name: string;
  type: "fitness" | "nutrition" | "wellness";
  duration: number;
  difficulty: string;
  progress: number;
  lastAccessed: Date;
  description: string;
  goals: string[];
  isActive: boolean;
}

const mockSavedRoutines: SavedRoutine[] = [
  {
    id: "1",
    name: "90-Day Wellness Journey",
    type: "fitness",
    duration: 90,
    difficulty: "Intermediate",
    progress: 65,
    lastAccessed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    description: "Comprehensive fitness and nutrition plan for overall wellness",
    goals: ["Weight Loss", "Muscle Tone", "Cardiovascular Health"],
    isActive: true
  },
  {
    id: "2", 
    name: "Vegetarian Meal Plan",
    type: "nutrition",
    duration: 30,
    difficulty: "Beginner",
    progress: 100,
    lastAccessed: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    description: "Balanced vegetarian meal plan with protein-rich alternatives",
    goals: ["Healthy Eating", "Weight Management"],
    isActive: false
  },
  {
    id: "3",
    name: "Morning Yoga Routine",
    type: "wellness", 
    duration: 7,
    difficulty: "Beginner",
    progress: 28,
    lastAccessed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    description: "Gentle morning yoga sequence for flexibility and mindfulness",
    goals: ["Flexibility", "Stress Relief", "Mindfulness"],
    isActive: true
  }
];

export default function SavedRoutinesPage() {
  const [routines, setRoutines] = useState<SavedRoutine[]>(mockSavedRoutines);
  const [selectedRoutine, setSelectedRoutine] = useState<SavedRoutine | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

  const handleDeleteRoutine = (id: string) => {
    setRoutines(prev => prev.filter(routine => routine.id !== id));
  };

  const handleToggleActive = (id: string) => {
    setRoutines(prev => prev.map(routine => 
      routine.id === id ? { ...routine, isActive: !routine.isActive } : routine
    ));
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "fitness": return "#FFD166";
      case "nutrition": return "#06D6A0";
      case "wellness": return "#7B61FF";
      default: return "#9E9E9E";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "fitness": return <DirectionsRun />;
      case "nutrition": return <Restaurant />;
      case "wellness": return <FitnessCenter />;
      default: return <FitnessCenter />;
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <Box sx={{ minHeight: "100vh", background: "#f8f9ff" }}>
      {/* Header */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          py: 3,
          position: "sticky",
          top: 0,
          zIndex: 1000
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Link href="/health-tools" passHref>
                <IconButton
                  sx={{
                    color: "white",
                    mr: 2,
                    "&:hover": {
                      background: "rgba(255, 255, 255, 0.1)",
                      transform: "translateX(-2px)",
                    },
                    transition: "all 0.3s ease"
                  }}
                >
                  <ArrowBack />
                </IconButton>
              </Link>
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
                  variant="h6"
                  sx={{
                    color: "white",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 1
                  }}
                >
                  <FitnessCenter sx={{ fontSize: 24 }} />
                  Saved Routines
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "rgba(255, 255, 255, 0.8)",
                    fontSize: "0.8rem"
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

        {/* Routines Grid */}
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
                            background: getTypeColor(routine.type),
                            borderRadius: "50%",
                            width: 40,
                            height: 40,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white"
                          }}
                        >
                          {getTypeIcon(routine.type)}
                        </Box>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                            {routine.name}
                          </Typography>
                          <Chip
                            label={routine.type.charAt(0).toUpperCase() + routine.type.slice(1)}
                            size="small"
                            sx={{
                              background: `${getTypeColor(routine.type)}20`,
                              color: getTypeColor(routine.type),
                              fontWeight: 500,
                              fontSize: "0.7rem"
                            }}
                          />
                        </Box>
                      </Box>
                      <Chip
                        label={routine.isActive ? "Active" : "Inactive"}
                        size="small"
                        sx={{
                          background: routine.isActive ? "rgba(76, 175, 80, 0.1)" : "rgba(158, 158, 158, 0.1)",
                          color: routine.isActive ? "#4CAF50" : "#9E9E9E",
                          fontWeight: 500
                        }}
                      />
                    </Box>

                    {/* Description */}
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.5 }}>
                      {routine.description}
                    </Typography>

                    {/* Goals */}
                    <Box sx={{ mb: 2 }}>
                      {routine.goals.slice(0, 2).map((goal) => (
                        <Chip
                          key={goal}
                          label={goal}
                          size="small"
                          sx={{
                            mr: 1,
                            mb: 1,
                            background: "rgba(123, 97, 255, 0.1)",
                            color: "#7B61FF",
                            fontWeight: 500,
                            fontSize: "0.7rem"
                          }}
                        />
                      ))}
                      {routine.goals.length > 2 && (
                        <Chip
                          label={`+${routine.goals.length - 2} more`}
                          size="small"
                          sx={{
                            background: "rgba(0, 0, 0, 0.08)",
                            color: "text.secondary",
                            fontWeight: 500,
                            fontSize: "0.7rem"
                          }}
                        />
                      )}
                    </Box>

                    {/* Progress */}
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          Progress
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {routine.progress}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={routine.progress}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          background: "rgba(0, 0, 0, 0.08)",
                          "& .MuiLinearProgress-bar": {
                            background: `linear-gradient(90deg, ${getTypeColor(routine.type)}, ${getTypeColor(routine.type)}80)`,
                            borderRadius: 4
                          }
                        }}
                      />
                    </Box>

                    {/* Stats */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
                      <Box sx={{ textAlign: "center" }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: getTypeColor(routine.type) }}>
                          {routine.duration}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Days
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: "center" }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: getTypeColor(routine.type) }}>
                          {routine.difficulty}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Level
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: "center" }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: getTypeColor(routine.type) }}>
                          {formatDate(routine.lastAccessed)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Last Used
                        </Typography>
                      </Box>
                    </Box>

                    {/* Actions */}
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<PlayArrow />}
                        onClick={() => {
                          setSelectedRoutine(routine);
                          setOpenDialog(true);
                        }}
                        sx={{
                          background: `linear-gradient(135deg, ${getTypeColor(routine.type)}, ${getTypeColor(routine.type)}80)`,
                          "&:hover": {
                            background: `linear-gradient(135deg, ${getTypeColor(routine.type)}80, ${getTypeColor(routine.type)})`,
                          },
                          borderRadius: 2,
                          textTransform: "none",
                          fontWeight: 600
                        }}
                      >
                        Continue
                      </Button>
                      <IconButton
                        onClick={() => handleToggleActive(routine.id)}
                        sx={{
                          background: routine.isActive ? "rgba(244, 67, 54, 0.1)" : "rgba(76, 175, 80, 0.1)",
                          color: routine.isActive ? "#F44336" : "#4CAF50",
                          "&:hover": {
                            background: routine.isActive ? "rgba(244, 67, 54, 0.2)" : "rgba(76, 175, 80, 0.2)",
                          }
                        }}
                      >
                        {routine.isActive ? <Schedule /> : <CheckCircle />}
                      </IconButton>
                      <IconButton
                        onClick={() => handleDeleteRoutine(routine.id)}
                        sx={{
                          background: "rgba(244, 67, 54, 0.1)",
                          color: "#F44336",
                          "&:hover": {
                            background: "rgba(244, 67, 54, 0.2)",
                          }
                        }}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Box>
          ))}
        </Box>

        {/* Empty State */}
        {routines.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Paper
              sx={{
                p: 6,
                textAlign: "center",
                borderRadius: 3,
                background: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.2)"
              }}
            >
              <FitnessCenter sx={{ fontSize: 64, color: "#7B61FF", mb: 3 }} />
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                No Saved Routines Yet
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Create your first fitness plan to get started on your wellness journey
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
                Create Your First Plan
              </Button>
            </Paper>
          </motion.div>
        )}
      </Container>

      {/* Routine Details Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedRoutine && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box
                  sx={{
                    background: getTypeColor(selectedRoutine.type),
                    borderRadius: "50%",
                    width: 48,
                    height: 48,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white"
                  }}
                >
                  {getTypeIcon(selectedRoutine.type)}
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {selectedRoutine.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedRoutine.description}
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 3 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Plan Details
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <CalendarToday sx={{ color: getTypeColor(selectedRoutine.type) }} />
                      </ListItemIcon>
                      <ListItemText
                        primary="Duration"
                        secondary={`${selectedRoutine.duration} days`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <TrendingUp sx={{ color: getTypeColor(selectedRoutine.type) }} />
                      </ListItemIcon>
                      <ListItemText
                        primary="Difficulty"
                        secondary={selectedRoutine.difficulty}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircle sx={{ color: getTypeColor(selectedRoutine.type) }} />
                      </ListItemIcon>
                      <ListItemText
                        primary="Progress"
                        secondary={`${selectedRoutine.progress}% completed`}
                      />
                    </ListItem>
                  </List>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Goals
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {selectedRoutine.goals.map((goal) => (
                      <Chip
                        key={goal}
                        label={goal}
                        sx={{
                          background: `${getTypeColor(selectedRoutine.type)}20`,
                          color: getTypeColor(selectedRoutine.type),
                          fontWeight: 500
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button
                onClick={() => setOpenDialog(false)}
                sx={{ color: "text.secondary" }}
              >
                Close
              </Button>
              <Button
                variant="contained"
                startIcon={<PlayArrow />}
                sx={{
                  background: `linear-gradient(135deg, ${getTypeColor(selectedRoutine.type)}, ${getTypeColor(selectedRoutine.type)}80)`,
                  "&:hover": {
                    background: `linear-gradient(135deg, ${getTypeColor(selectedRoutine.type)}80, ${getTypeColor(selectedRoutine.type)})`,
                  },
                }}
              >
                Start Routine
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
} 