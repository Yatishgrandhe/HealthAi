"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Card,
  CardContent,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Badge,
  Tooltip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  LinearProgress
} from "@mui/material";
import {
  CalendarToday,
  FitnessCenter,
  Psychology,
  CameraAlt,
  Restaurant,
  DirectionsRun,
  CheckCircle,
  Warning,
  Info,
  ArrowBack,
  ArrowForward,
  Today,
  Event,
  TrendingUp,
  LocalHospital,
  Spa,
  RestaurantMenu,
  Timer,
  Star,
  Visibility,
  VisibilityOff,
  Add,
  Edit,
  Delete,
  MoreVert,
  ExpandMore,
  ExpandLess
} from "@mui/icons-material";
import { motion } from "framer-motion";
import Link from "next/link";
import { useUser } from "@/utils/supabaseClient";
import HealthDataService from "@/utils/healthDataService";

interface CalendarEvent {
  id: string;
  date: string;
  type: 'fitness' | 'posture' | 'therapy' | 'meal' | 'workout' | 'progress';
  title: string;
  description: string;
  status: 'completed' | 'pending' | 'missed';
  data?: any;
  time?: string;
  duration?: number;
  score?: number;
}

interface DayData {
  date: string;
  events: CalendarEvent[];
  hasFitnessPlan: boolean;
  hasPostureCheck: boolean;
  hasTherapySession: boolean;
  completedWorkouts: number;
  totalWorkouts: number;
  moodScore?: number;
  energyLevel?: number;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarData, setCalendarData] = useState<DayData[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  const { user, loading: userLoading } = useUser();
  const healthDataService = new HealthDataService();

  // Get current month's calendar data
  const getCurrentMonthData = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    const days: DayData[] = [];
    
    // Add empty days for padding
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({
        date: '',
        events: [],
        hasFitnessPlan: false,
        hasPostureCheck: false,
        hasTherapySession: false,
        completedWorkouts: 0,
        totalWorkouts: 0
      });
    }
    
    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];
      
      days.push({
        date: dateString,
        events: [],
        hasFitnessPlan: false,
        hasPostureCheck: false,
        hasTherapySession: false,
        completedWorkouts: 0,
        totalWorkouts: 0
      });
    }
    
    return days;
  };

  // Load user's health data for the current month
  const loadCalendarData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

      // Load all health data for the month
      const [
        fitnessPlans,
        postureChecks,
        therapySessions,
        dailyFitnessPlans,
        fitnessProgress
      ] = await Promise.all([
        healthDataService.getFitnessPlans(),
        healthDataService.getPostureCheckSessions(),
        healthDataService.getTherapistChatSessions(),
        healthDataService.getDailyFitnessPlans(),
        healthDataService.getFitnessProgress()
      ]);

      // Create calendar data
      const calendarDays = getCurrentMonthData();
      
      // Process fitness plans and daily plans
      fitnessPlans?.forEach(plan => {
        if (plan.is_active) {
          // Get the plan start date (assuming it starts from the plan creation date)
          const planStartDate = new Date(plan.created_at || new Date());
          
          // Generate 90 days of fitness plans from the start date
          for (let day = 1; day <= 90; day++) {
            const currentDate = new Date(planStartDate);
            currentDate.setDate(planStartDate.getDate() + day - 1);
            const dateString = currentDate.toISOString().split('T')[0];
            
            // Check if this date is in the current month view
            const dayData = calendarDays.find(day => day.date === dateString);
            if (dayData) {
              dayData.hasFitnessPlan = true;
              
              // Check if we have a specific daily plan for this day
              const existingDailyPlan = dailyFitnessPlans?.find(dp => 
                dp.fitness_plan_id === plan.id && dp.day_number === day
              );
              
              if (existingDailyPlan) {
                // Use the existing daily plan
                dayData.events.push({
                  id: `fitness-${existingDailyPlan.id}`,
                  date: dateString,
                  type: 'fitness',
                  title: `Day ${day} - Fitness Plan`,
                  description: `Breakfast: ${existingDailyPlan.meals?.breakfast || 'N/A'}`,
                  status: existingDailyPlan.completed ? 'completed' : 'pending',
                  data: existingDailyPlan,
                  time: '09:00',
                  duration: 60
                });
              } else {
                // Create a placeholder daily plan
                const placeholderPlan = {
                  day_number: day,
                  meals: {
                    breakfast: "Oatmeal with berries and nuts",
                    lunch: "Quinoa salad with grilled vegetables", 
                    dinner: "Salmon with steamed broccoli",
                    snacks: ["Apple with almond butter", "Greek yogurt"]
                  },
                  exercises: {
                    cardio: "30 minutes brisk walking",
                    strength: "Push-ups and squats (3 sets each)",
                    flexibility: "10 minutes stretching routine"
                  },
                  tips: "Stay hydrated and get adequate rest for optimal results.",
                  completed: false
                };
                
                dayData.events.push({
                  id: `fitness-placeholder-${plan.id}-${day}`,
                  date: dateString,
                  type: 'fitness',
                  title: `Day ${day} - Fitness Plan`,
                  description: `Breakfast: ${placeholderPlan.meals.breakfast}`,
                  status: 'pending',
                  data: placeholderPlan,
                  time: '09:00',
                  duration: 60
                });
                
                // Add meal and workout events separately for better visibility
                dayData.events.push({
                  id: `meal-${plan.id}-${day}`,
                  date: dateString,
                  type: 'meal',
                  title: `Day ${day} - Meal Plan`,
                  description: `Breakfast, Lunch, Dinner & Snacks`,
                  status: 'pending',
                  data: placeholderPlan.meals,
                  time: '08:00',
                  duration: 30
                });
                
                dayData.events.push({
                  id: `workout-${plan.id}-${day}`,
                  date: dateString,
                  type: 'workout',
                  title: `Day ${day} - Workout`,
                  description: `Cardio, Strength & Flexibility`,
                  status: 'pending',
                  data: placeholderPlan.exercises,
                  time: '18:00',
                  duration: 45
                });
              }
              
              // Add meal and workout events for existing plans
              if (existingDailyPlan) {
                dayData.events.push({
                  id: `meal-${plan.id}-${day}`,
                  date: dateString,
                  type: 'meal',
                  title: `Day ${day} - Meal Plan`,
                  description: `Breakfast, Lunch, Dinner & Snacks`,
                  status: 'pending',
                  data: existingDailyPlan.meals,
                  time: '08:00',
                  duration: 30
                });
                
                dayData.events.push({
                  id: `workout-${plan.id}-${day}`,
                  date: dateString,
                  type: 'workout',
                  title: `Day ${day} - Workout`,
                  description: `Cardio, Strength & Flexibility`,
                  status: 'pending',
                  data: existingDailyPlan.exercises,
                  time: '18:00',
                  duration: 45
                });
              }
            }
          }
        }
      });

      // Process posture checks
      postureChecks?.forEach(check => {
        const checkDate = check.created_at?.split('T')[0];
        const dayData = calendarDays.find(day => day.date === checkDate);
        if (dayData) {
          dayData.hasPostureCheck = true;
          dayData.events.push({
            id: `posture-${check.id}`,
            date: checkDate || '',
            type: 'posture',
            title: 'Posture Check',
            description: `Score: ${check.score || 0}/100`,
            status: 'completed',
            data: check,
            time: check.created_at?.split('T')[1]?.substring(0, 5) || '12:00',
            duration: 5,
            score: check.score
          });
        }
      });

      // Process therapy sessions
      therapySessions?.forEach(session => {
        const sessionDate = session.created_at?.split('T')[0];
        const dayData = calendarDays.find(day => day.date === sessionDate);
        if (dayData) {
          dayData.hasTherapySession = true;
          dayData.events.push({
            id: `therapy-${session.id}`,
            date: sessionDate || '',
            type: 'therapy',
            title: 'Therapy Session',
            description: `Duration: ${session.messages?.length || 0} messages`,
            status: 'completed',
            data: session,
            time: session.created_at?.split('T')[1]?.substring(0, 5) || '14:00',
            duration: 30
          });
        }
      });

      // Process fitness progress
      fitnessProgress?.forEach(progress => {
        const progressDate = progress.recorded_at?.split('T')[0];
        const dayData = calendarDays.find(day => day.date === progressDate);
        if (dayData) {
          dayData.completedWorkouts = progress.completed_workouts || 0;
          dayData.totalWorkouts = 3; // Assuming 3 workouts per day
          dayData.moodScore = progress.mood_score;
          dayData.energyLevel = progress.energy_level;
          
          dayData.events.push({
            id: `progress-${progress.id}`,
            date: progressDate || '',
            type: 'progress',
            title: 'Daily Progress',
            description: `Workouts: ${progress.completed_workouts || 0}/3 completed`,
            status: progress.completed_workouts === 3 ? 'completed' : 'pending',
            data: progress,
            time: progress.recorded_at?.split('T')[1]?.substring(0, 5) || '18:00',
            duration: 15
          });
        }
      });

      setCalendarData(calendarDays);
    } catch (error) {
      console.error('Error loading calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userLoading && user) {
      loadCalendarData();
    }
  }, [user, currentDate, userLoading]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'fitness':
        return <FitnessCenter />;
      case 'posture':
        return <CameraAlt />;
      case 'therapy':
        return <Psychology />;
      case 'meal':
        return <Restaurant />;
      case 'workout':
        return <DirectionsRun />;
      case 'progress':
        return <TrendingUp />;
      default:
        return <Event />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'fitness':
        return '#FFD166';
      case 'posture':
        return '#06D6A0';
      case 'therapy':
        return '#7B61FF';
      case 'meal':
        return '#FF6B6B';
      case 'workout':
        return '#4ECDC4';
      case 'progress':
        return '#45B7D1';
      default:
        return '#95A5A6';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'missed':
        return '#F44336';
      default:
        return '#95A5A6';
    }
  };

  const handleDateClick = (date: string) => {
    if (date) {
      setSelectedDate(date);
      const dayData = calendarData.find(day => day.date === date);
      if (dayData && dayData.events.length > 0) {
        setSelectedEvent(dayData.events[0]);
        setEventDialogOpen(true);
      }
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setEventDialogOpen(true);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const renderCalendarHeader = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => navigateMonth('prev')}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Typography>
        <IconButton onClick={() => navigateMonth('next')}>
          <ArrowForward />
        </IconButton>
      </Box>
      <Button
        variant="outlined"
        startIcon={<Today />}
        onClick={goToToday}
        sx={{
          borderColor: '#FFD166',
          color: '#FFD166',
          '&:hover': {
            borderColor: '#FFC107',
            background: 'rgba(255, 209, 102, 0.05)',
          },
        }}
      >
        Today
      </Button>
    </Box>
  );

  const renderCalendarGrid = () => {
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    return (
      <Box>
        {/* Week day headers */}
        <Grid container sx={{ mb: 1 }}>
          {weekDays.map(day => (
            <Grid item xs={12/7} key={day}>
              <Box sx={{ 
                p: 1, 
                textAlign: 'center', 
                fontWeight: 600,
                color: 'text.secondary',
                fontSize: '0.9rem'
              }}>
                {day}
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Calendar days */}
        <Grid container spacing={0.5}>
          {calendarData.map((dayData, index) => (
            <Grid item xs={12/7} key={index}>
              <Paper
                elevation={dayData.date ? 1 : 0}
                sx={{
                  minHeight: 120,
                  p: 1,
                  cursor: dayData.date ? 'pointer' : 'default',
                  background: dayData.date ? 'white' : 'transparent',
                  border: dayData.date ? '1px solid rgba(0,0,0,0.1)' : 'none',
                  '&:hover': dayData.date ? {
                    background: 'rgba(255, 209, 102, 0.05)',
                    transform: 'scale(1.02)',
                  } : {},
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onClick={() => handleDateClick(dayData.date)}
              >
                {dayData.date && (
                  <>
                    {/* Date number */}
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        mb: 1,
                        color: dayData.date === new Date().toISOString().split('T')[0] 
                          ? '#FFD166' 
                          : 'text.primary'
                      }}
                    >
                      {new Date(dayData.date).getDate()}
                    </Typography>

                    {/* Event indicators */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {dayData.events.slice(0, 3).map((event, eventIndex) => (
                        <Tooltip
                          key={event.id}
                          title={`${event.title} - ${event.description}`}
                          placement="top"
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                              p: 0.5,
                              borderRadius: 1,
                              background: `${getEventColor(event.type)}20`,
                              border: `1px solid ${getEventColor(event.type)}`,
                              cursor: 'pointer',
                              '&:hover': {
                                background: `${getEventColor(event.type)}30`,
                              }
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEventClick(event);
                            }}
                          >
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: getEventColor(event.type),
                                flexShrink: 0
                              }}
                            />
                            <Typography
                              variant="caption"
                              sx={{
                                fontSize: '0.7rem',
                                fontWeight: 500,
                                color: getEventColor(event.type),
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {event.title.split(' - ')[0]}
                            </Typography>
                          </Box>
                        </Tooltip>
                      ))}
                      
                      {dayData.events.length > 3 && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'text.secondary',
                            fontSize: '0.7rem',
                            textAlign: 'center'
                          }}
                        >
                          +{dayData.events.length - 3} more
                        </Typography>
                      )}
                    </Box>

                    {/* Progress indicator */}
                    {dayData.totalWorkouts > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={(dayData.completedWorkouts / dayData.totalWorkouts) * 100}
                          sx={{
                            height: 4,
                            borderRadius: 2,
                            background: 'rgba(0,0,0,0.1)',
                            '& .MuiLinearProgress-bar': {
                              background: 'linear-gradient(135deg, #FFD166, #06D6A0)',
                            }
                          }}
                        />
                        <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
                          {dayData.completedWorkouts}/{dayData.totalWorkouts}
                        </Typography>
                      </Box>
                    )}
                  </>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  const renderEventDialog = () => (
    <Dialog
      open={eventDialogOpen}
      onClose={() => setEventDialogOpen(false)}
      maxWidth="md"
      fullWidth
    >
      {selectedEvent && (
        <>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: getEventColor(selectedEvent.type),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}
              >
                {getEventIcon(selectedEvent.type)}
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {selectedEvent.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {new Date(selectedEvent.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Typography>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              sx={{ mb: 2 }}
            >
              <Tab label="Details" />
              <Tab label="Data" />
            </Tabs>

            {activeTab === 0 && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Chip
                    label={selectedEvent.status}
                    sx={{
                      background: getStatusColor(selectedEvent.status),
                      color: 'white',
                      fontWeight: 600
                    }}
                  />
                  {selectedEvent.time && (
                    <Chip
                      icon={<Timer />}
                      label={selectedEvent.time}
                      variant="outlined"
                    />
                  )}
                  {selectedEvent.duration && (
                    <Chip
                      label={`${selectedEvent.duration} min`}
                      variant="outlined"
                    />
                  )}
                </Box>

                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedEvent.description}
                </Typography>

                {selectedEvent.score && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Score
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={selectedEvent.score}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        background: 'rgba(0,0,0,0.1)',
                        '& .MuiLinearProgress-bar': {
                          background: selectedEvent.score >= 80 
                            ? 'linear-gradient(135deg, #4CAF50, #45a049)'
                            : selectedEvent.score >= 60
                            ? 'linear-gradient(135deg, #FF9800, #F57C00)'
                            : 'linear-gradient(135deg, #F44336, #D32F2F)',
                        }
                      }}
                    />
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {selectedEvent.score}/100
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {activeTab === 1 && (
              <Box>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(selectedEvent.data, null, 2)}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEventDialogOpen(false)}>Close</Button>
            <Button
              variant="contained"
              sx={{
                background: 'linear-gradient(135deg, #FFD166, #06D6A0)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #FFC107, #00C853)',
                }
              }}
            >
              View Details
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );

  const renderLegend = () => (
    <Box sx={{ mt: 3, p: 2, background: 'rgba(255,255,255,0.8)', borderRadius: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        Legend
      </Typography>
      <Grid container spacing={2}>
        {[
          { type: 'fitness', label: 'Fitness Plans', icon: <FitnessCenter /> },
          { type: 'posture', label: 'Posture Checks', icon: <CameraAlt /> },
          { type: 'therapy', label: 'Therapy Sessions', icon: <Psychology /> },
          { type: 'meal', label: 'Meal Plans', icon: <Restaurant /> },
          { type: 'workout', label: 'Workouts', icon: <DirectionsRun /> },
          { type: 'progress', label: 'Progress Tracking', icon: <TrendingUp /> }
        ].map(item => (
          <Grid item xs={6} sm={4} key={item.type}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: getEventColor(item.type),
                  flexShrink: 0
                }}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {item.icon}
                <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                  {item.label}
                </Typography>
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  if (userLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ minHeight: "100vh", background: "#f8f9ff", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Container maxWidth="sm">
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
              Login Required
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Please log in to view your health calendar and track your progress.
            </Typography>
            <Button
              variant="contained"
              component={Link}
              href="/auth"
              sx={{
                background: "linear-gradient(135deg, #FFD166, #06D6A0)",
                "&:hover": {
                  background: "linear-gradient(135deg, #FFC107, #00C853)",
                }
              }}
            >
              Login
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", background: "#f8f9ff" }}>
      {/* Header */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #FFD166, #06D6A0)",
          py: 3,
          position: "sticky",
          top: 0,
          zIndex: 1000
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Link href="/dashboard" passHref>
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
                  <CalendarToday sx={{ fontSize: 24 }} />
                  Health Calendar
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "rgba(255, 255, 255, 0.8)",
                    fontSize: "0.8rem"
                  }}
                >
                  Track your health journey and progress
                </Typography>
              </Box>
            </Box>
            <Chip
              label="AI-Powered"
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Paper
            elevation={8}
            sx={{
              p: 4,
              borderRadius: 3,
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.2)"
            }}
          >
            {renderCalendarHeader()}

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                {renderCalendarGrid()}
                {renderLegend()}
              </>
            )}
          </Paper>
        </motion.div>
      </Container>

      {renderEventDialog()}
    </Box>
  );
} 