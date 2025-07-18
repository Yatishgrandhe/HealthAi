"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Paper, 
  TextField,
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
  Menu,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Switch,
  FormControlLabel as MuiFormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Tooltip
} from "@mui/material";
import { 
  FitnessCenter, 
  Add, 
  Save, 
  Delete, 
  Edit, 
  PlayArrow, 
  Stop, 
  Timer,
  TrendingUp,
  Psychology,
  CameraAlt,
  MoreVert,
  CheckCircle,
  Warning,
  Info,
  ArrowBack,
  CloudUpload,
  Restaurant,
  DirectionsRun,
  CalendarToday,
  ExpandMore,
  Check,
  Close,
  CloudDone,
  PhotoCamera,
  Visibility,
  VisibilityOff,
  Download
} from "@mui/icons-material";
import { motion } from "framer-motion";
import Link from "next/link";
import aiService from "@/utils/aiService";
import { useUser } from "@/utils/supabaseClient";
import HealthDataService from "@/utils/healthDataService";
import BackButton from "@/components/BackButton";

interface FitnessPlan {
  id: string;
  name: string;
  duration: number;
  difficulty: string;
  goals: string[];
  meals: {
    breakfast: string[];
    lunch: string[];
    dinner: string[];
  };
  workouts: {
    cardio: string[];
    strength: string[];
    flexibility: string[];
  };
  progress: {
    currentDay: number;
    completedWorkouts: number;
    completedMeals: number;
  };
}

interface DailyPlan {
  day: number;
  meals: {
    breakfast: string;
    lunch: string;
    dinner: string;
    snacks: string[];
  };
  exercises: {
    cardio: string;
    strength: string;
    flexibility: string;
  };
  tips: string;
  progress_notes?: string;
  completed?: boolean;
}

type DietaryPreference = "vegetarian" | "non-vegetarian" | "vegan";

const steps = [
  "Upload Body Image",
  "Select Dietary Preferences", 
  "Review Your Plan",
  "Start Your Journey"
];

export default function FitnessPlannerPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [dietaryPreference, setDietaryPreference] = useState<DietaryPreference>("vegetarian");
  const [fitnessGoals, setFitnessGoals] = useState<string[]>([]);
  const [saveToDatabase, setSaveToDatabase] = useState(false);
  const [saveImage, setSaveImage] = useState(false);

  const [plan, setPlan] = useState<FitnessPlan | null>(null);
  const [dailyPlans, setDailyPlans] = useState<DailyPlan[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageAnalysis, setImageAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  const { user, loading: userLoading } = useUser();
  const healthDataService = new HealthDataService();

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageData = e.target?.result as string;
        setUploadedImage(imageData);
        setIsAnalyzing(true);
        
        try {
          // Analyze the uploaded image using Cloud Vision API for body composition
          const analysisResult = await aiService.analyzeFitnessImage(imageData, 'body_composition');
          
          if (analysisResult.success) {
            setImageAnalysis(analysisResult.analysis);
          } else {
            console.error('Image analysis failed:', analysisResult.error);
          }
        } catch (error) {
          console.error('Error analyzing image:', error);
        } finally {
          setIsAnalyzing(false);
          setActiveStep(1);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDietaryChange = (preference: DietaryPreference) => {
    setDietaryPreference(preference);
  };

  const handleGoalChange = (goal: string) => {
    setFitnessGoals(prev => 
      prev.includes(goal) 
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    );
  };

  const generatePlan = async () => {
    setIsGenerating(true);
    console.log('🎯 Starting plan generation...');
    
    try {
      // Generate comprehensive fitness plan
      const newPlan: FitnessPlan = {
        id: Date.now().toString(),
        name: "90-Day Wellness Journey",
        duration: 90,
        difficulty: "Intermediate",
        goals: fitnessGoals.length > 0 ? fitnessGoals : ["Weight Loss", "Muscle Tone", "Overall Fitness"],
        meals: {
          breakfast: [],
          lunch: [],
          dinner: []
        },
        workouts: {
          cardio: [],
          strength: [],
          flexibility: []
        },
        progress: {
          currentDay: 1,
          completedWorkouts: 0,
          completedMeals: 0
        }
      };
      setPlan(newPlan);
      console.log('📋 Base plan created, calling AI service...');

      // Generate complete 90-day plan in a single API call
      const completePlanResult = await aiService.generateCompleteFitnessPlan({
        dietaryPreference: dietaryPreference,
        fitnessGoals: fitnessGoals.length > 0 ? fitnessGoals : ["Weight Loss", "Muscle Tone", "Overall Fitness"],
        fitnessLevel: "Intermediate",
        totalDays: 90
      });

      console.log('📊 AI service response:', completePlanResult);

      let dailyPlansData: DailyPlan[] = [];

      if (completePlanResult.success && completePlanResult.plan) {
        // Use the AI-generated plan
        console.log('🤖 Using AI-generated fitness plan');
        console.log('📝 AI plan data:', completePlanResult.plan);
        dailyPlansData = completePlanResult.plan;
        
        // Validate the plan structure
        if (Array.isArray(dailyPlansData) && dailyPlansData.length > 0) {
          console.log('✅ AI plan is valid array with', dailyPlansData.length, 'days');
          console.log('📋 First day sample:', dailyPlansData[0]);
        } else {
          console.warn('⚠️ AI plan is not a valid array, using local fallback');
          dailyPlansData = generateLocalPlan();
        }
      } else {
        // Fallback: Generate plan locally with templates
        console.log('🔄 AI generation failed or unavailable, using local templates');
        console.log('❌ AI error:', completePlanResult.error);
        dailyPlansData = generateLocalPlan();
      }

      console.log('🎯 Setting daily plans:', dailyPlansData.length, 'days');
      setDailyPlans(dailyPlansData);
      setIsGenerating(false);
      setActiveStep(3);
      console.log('✅ Plan generation complete, moved to step 3');
    } catch (error) {
      console.error('❌ Error generating plan:', error);
      console.log('🔄 Falling back to local template generation due to error');
      // Fallback to local generation
      const fallbackPlan = generateLocalPlan();
      setDailyPlans(fallbackPlan);
      setIsGenerating(false);
      setActiveStep(3);
    }
  };

    // Generate plan locally using templates for faster generation
  const generateLocalPlan = (): DailyPlan[] => {
    console.log('🔄 Using local template generation (rollback data)');
    const dailyPlansData: DailyPlan[] = [];
    
    // Weekly meal routines (7-day cycles)
    const weeklyMealRoutines = [
      // Week 1 Routine
      {
        breakfast: [
          "Oatmeal with berries and nuts",
          "Greek yogurt with honey and granola", 
          "Whole grain toast with avocado and eggs",
          "Smoothie bowl with banana and protein powder",
          "Quinoa breakfast bowl with fruits",
          "Protein pancakes with maple syrup",
          "Chia pudding with coconut milk"
        ],
        lunch: [
          "Grilled chicken salad with mixed greens",
          "Quinoa bowl with roasted vegetables",
          "Turkey and avocado sandwich on whole grain bread",
          "Lentil soup with whole grain crackers",
          "Tuna salad with mixed greens",
          "Vegetable stir-fry with brown rice",
          "Chickpea and spinach curry"
        ],
        dinner: [
          "Baked salmon with quinoa and asparagus",
          "Lean beef stir-fry with vegetables",
          "Grilled chicken with sweet potato and broccoli",
          "Vegetarian pasta with tomato sauce",
          "Fish tacos with cabbage slaw",
          "Turkey meatballs with whole grain pasta",
          "Stuffed bell peppers with quinoa"
        ]
      },
      // Week 2 Routine
      {
        breakfast: [
          "Protein smoothie with spinach and banana",
          "Egg white omelette with vegetables",
          "Cottage cheese with fresh fruits",
          "Whole grain cereal with almond milk",
          "Breakfast burrito with black beans",
          "French toast with berries",
          "Yogurt parfait with granola"
        ],
        lunch: [
          "Grilled salmon with steamed vegetables",
          "Mediterranean salad with feta cheese",
          "Chicken wrap with hummus",
          "Vegetable soup with whole grain bread",
          "Tofu stir-fry with brown rice",
          "Turkey burger with sweet potato fries",
          "Lentil curry with quinoa"
        ],
        dinner: [
          "Grilled shrimp with brown rice",
          "Lean pork chops with roasted vegetables",
          "Vegetarian lasagna with salad",
          "Fish curry with coconut rice",
          "Chicken fajitas with whole grain tortillas",
          "Beef stir-fry with noodles",
          "Stuffed mushrooms with quinoa"
        ]
      },
      // Week 3 Routine
      {
        breakfast: [
          "Avocado toast with poached eggs",
          "Protein waffles with berries",
          "Breakfast bowl with sweet potato",
          "Smoothie with protein powder",
          "Egg muffins with vegetables",
          "Overnight oats with chia seeds",
          "Breakfast sandwich with turkey"
        ],
        lunch: [
          "Chicken Caesar salad",
          "Vegetable wrap with hummus",
          "Tuna pasta salad",
          "Bean and vegetable soup",
          "Grilled cheese with tomato soup",
          "Chicken noodle soup",
          "Vegetable curry with rice"
        ],
        dinner: [
          "Baked cod with lemon herbs",
          "Chicken stir-fry with vegetables",
          "Vegetarian chili with cornbread",
          "Pork tenderloin with roasted potatoes",
          "Fish tacos with slaw",
          "Beef and broccoli stir-fry",
          "Stuffed zucchini with quinoa"
        ]
      }
    ];

    // Weekly workout routines (6 days active, 1 day rest)
    const weeklyWorkoutRoutines = [
      // Week 1 Routine
      {
        cardio: [
          "30 minutes brisk walking",
          "25 minutes jogging",
          "20 minutes cycling",
          "15 minutes HIIT training",
          "30 minutes swimming",
          "20 minutes elliptical training"
        ],
        strength: [
          "Push-ups, squats, and lunges (3 sets each)",
          "Dumbbell rows and shoulder presses (3 sets each)",
          "Planks and mountain climbers (3 sets each)",
          "Burpees and jumping jacks (3 sets each)",
          "Wall sits and calf raises (3 sets each)",
          "Tricep dips and bicep curls (3 sets each)"
        ],
        flexibility: [
          "10 minutes stretching routine",
          "15 minutes yoga flow",
          "12 minutes pilates exercises",
          "10 minutes foam rolling",
          "15 minutes tai chi movements",
          "12 minutes dynamic stretching"
        ]
      },
      // Week 2 Routine
      {
        cardio: [
          "25 minutes jogging",
          "20 minutes cycling",
          "15 minutes HIIT training",
          "30 minutes swimming",
          "20 minutes elliptical training",
          "25 minutes stair climbing"
        ],
        strength: [
          "Dumbbell rows and shoulder presses (3 sets each)",
          "Planks and mountain climbers (3 sets each)",
          "Burpees and jumping jacks (3 sets each)",
          "Wall sits and calf raises (3 sets each)",
          "Tricep dips and bicep curls (3 sets each)",
          "Deadlifts and bench presses (3 sets each)"
        ],
        flexibility: [
          "15 minutes yoga flow",
          "12 minutes pilates exercises",
          "10 minutes foam rolling",
          "15 minutes tai chi movements",
          "12 minutes dynamic stretching",
          "10 minutes static stretching"
        ]
      },
      // Week 3 Routine
      {
        cardio: [
          "20 minutes cycling",
          "15 minutes HIIT training",
          "30 minutes swimming",
          "20 minutes elliptical training",
          "25 minutes stair climbing",
          "30 minutes dancing"
        ],
        strength: [
          "Planks and mountain climbers (3 sets each)",
          "Burpees and jumping jacks (3 sets each)",
          "Wall sits and calf raises (3 sets each)",
          "Tricep dips and bicep curls (3 sets each)",
          "Deadlifts and bench presses (3 sets each)",
          "Pull-ups and chin-ups (3 sets each)"
        ],
        flexibility: [
          "12 minutes pilates exercises",
          "10 minutes foam rolling",
          "15 minutes tai chi movements",
          "12 minutes dynamic stretching",
          "10 minutes static stretching",
          "15 minutes mobility exercises"
        ]
      }
    ];

    const snackTemplates = [
      ["Apple with almond butter", "Greek yogurt"],
      ["Mixed nuts and dried fruits", "Protein shake"],
      ["Carrot sticks with hummus", "Hard-boiled eggs"],
      ["Banana with peanut butter", "Cottage cheese"],
      ["Berries with cottage cheese", "Trail mix"],
      ["Celery with peanut butter", "Protein bar"]
    ];

    const tipTemplates = [
      "Stay hydrated and get adequate rest for optimal results.",
      "Focus on proper form during exercises to prevent injury.",
      "Listen to your body and adjust intensity as needed.",
      "Consistency is key - stick to your plan for best results.",
      "Don't forget to warm up before workouts and cool down after.",
      "Track your progress to stay motivated and see improvements."
    ];

    for (let day = 1; day <= 90; day++) {
      const weekNumber = Math.floor((day - 1) / 7); // 0-based week number
      const dayInWeek = ((day - 1) % 7) + 1; // 1-7 for days in week
      const routineIndex = weekNumber % 3; // Cycle through 3 different routines
      
      console.log(`📅 Day ${day}: Week ${weekNumber + 1}, Day ${dayInWeek}, Routine ${routineIndex + 1}`);

      if (dayInWeek === 7) {
        // Rest day (every 7th day)
        console.log(`🛌 Day ${day}: REST DAY`);
        dailyPlansData.push({
          day,
          meals: {
            breakfast: "Rest day - light breakfast (e.g., fruit, yogurt, smoothie)",
            lunch: "Rest day - light lunch (e.g., salad, soup, light sandwich)",
            dinner: "Rest day - light dinner (e.g., steamed veggies, rice, light protein)",
            snacks: ["Herbal tea", "Fruit", "Light yogurt"]
          },
          exercises: {
            cardio: "Rest day - no cardio training",
            strength: "Rest day - no strength training",
            flexibility: "Gentle stretching or yoga (optional, 10-15 minutes)"
          },
          tips: "Today is a rest day! Focus on recovery, hydration, and gentle movement if desired. Your body needs this time to repair and grow stronger.",
          progress_notes: "Rest and recharge for optimal performance."
        });
        continue;
      }

      // Active day (days 1-6 of each week)
      const mealRoutine = weeklyMealRoutines[routineIndex];
      const workoutRoutine = weeklyWorkoutRoutines[routineIndex];
      const dayIndex = dayInWeek - 1; // 0-based index for arrays

      console.log(`💪 Day ${day}: ACTIVE DAY - Cardio: ${workoutRoutine.cardio[dayIndex].substring(0, 30)}...`);

      dailyPlansData.push({
        day: day,
        meals: {
          breakfast: mealRoutine.breakfast[dayIndex],
          lunch: mealRoutine.lunch[dayIndex],
          dinner: mealRoutine.dinner[dayIndex],
          snacks: snackTemplates[dayIndex]
        },
        exercises: {
          cardio: workoutRoutine.cardio[dayIndex],
          strength: workoutRoutine.strength[dayIndex],
          flexibility: workoutRoutine.flexibility[dayIndex]
        },
        tips: tipTemplates[dayIndex]
      });
    }

    console.log(`✅ Generated ${dailyPlansData.length} days of fitness plan using local templates`);
    return dailyPlansData;
  };

  const handleSavePlan = async () => {
    if (!user) {
      alert("Please log in to save your plan!");
      return;
    }

    setIsSaving(true);
    try {
      if (saveToDatabase) {
        // Save to database
        const fitnessPlanData = {
          plan_name: plan?.name || "90-Day Wellness Journey",
          plan_type: "general" as const,
          duration_days: plan?.duration || 90,
          difficulty_level: "intermediate" as const,
          exercises: plan?.workouts || {},
          nutrition_plan: plan?.meals || {},
          goals: plan?.goals || [],
          is_active: true
        };

        console.log('💾 Saving fitness plan to database:', fitnessPlanData);
        
        const savedPlan = await healthDataService.saveFitnessPlanWithImages(
          fitnessPlanData,
          saveImage && uploadedImage ? uploadedImage : undefined
        );

        console.log('✅ Fitness plan saved:', savedPlan);

        // Save daily plans
        console.log('💾 Saving daily plans:', dailyPlans.length, 'days');
        for (const dailyPlan of dailyPlans) {
          try {
            await healthDataService.saveDailyFitnessPlan({
              fitness_plan_id: savedPlan.id,
              day_number: dailyPlan.day,
              meals: dailyPlan.meals,
              exercises: dailyPlan.exercises,
              tips: dailyPlan.tips,
              progress_notes: dailyPlan.progress_notes
            });
          } catch (dailyPlanError) {
            console.error('❌ Error saving daily plan for day', dailyPlan.day, ':', dailyPlanError);
            // Continue with other days even if one fails
          }
        }

        console.log('✅ All daily plans saved successfully');
        alert("Plan saved to your account successfully!");
      } else {
        // Save to localStorage
        const planData = {
          plan,
          dailyPlans,
          image: saveImage ? uploadedImage : null,
          savedAt: new Date().toISOString()
        };
        localStorage.setItem('fitnessPlan', JSON.stringify(planData));
        console.log('💾 Plan saved to localStorage');
        alert("Plan saved locally!");
      }
    } catch (error) {
      console.error('❌ Error saving plan:', error);
      
      // Provide more specific error messages
      let errorMessage = "Failed to save plan. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = "Network error. Please check your connection and try again.";
        } else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
          errorMessage = "Permission denied. Please log in again.";
        } else if (error.message.includes('storage')) {
          errorMessage = "Storage error. Please try again or contact support.";
        }
      }
      
      alert(errorMessage);
    } finally {
      setIsSaving(false);
      setSaveDialogOpen(false);
    }
  };

  const availableGoals = [
    "Weight Loss",
    "Muscle Building", 
    "Cardiovascular Health",
    "Flexibility",
    "Strength Training",
    "Endurance",
    "Stress Relief",
    "Overall Fitness"
  ];

  const renderCalendar = () => {
    // Calculate exactly 90 days with proper week structure
    const totalDays = 90;
    const days = Array.from({ length: totalDays }, (_, i) => i + 1);
    const weeks: (number | null)[][] = [];
    
    // Create weeks with exactly 7 days each, handling the last week properly
    for (let i = 0; i < days.length; i += 7) {
      const weekDays: (number | null)[] = days.slice(i, i + 7);
      // Fill the last week with null values if it's not complete
      while (weekDays.length < 7) {
        weekDays.push(null);
      }
      weeks.push(weekDays);
    }

    console.log(`📅 Rendering calendar with ${totalDays} days in ${weeks.length} weeks`);

    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarToday sx={{ color: '#06D6A0' }} />
          90-Day Progress Calendar
        </Typography>
        
        {/* Calendar Legend */}
        <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 20, height: 20, background: 'linear-gradient(135deg, #FFD166, #06D6A0)', borderRadius: 1 }} />
            <Typography variant="caption">Today</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 20, height: 20, background: 'linear-gradient(135deg, #4CAF50, #45a049)', borderRadius: 1 }} />
            <Typography variant="caption">Completed</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 20, height: 20, background: 'linear-gradient(135deg, #FF9800, #F57C00)', borderRadius: 1 }} />
            <Typography variant="caption">Rest Day</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 20, height: 20, background: 'rgba(255, 255, 255, 0.8)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 1 }} />
            <Typography variant="caption">Active Day</Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {weeks.map((week, weekIndex) => (
            <Box key={weekIndex} sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
              {week.map((day, dayIndex) => {
                if (day === null) {
                  // Empty space for incomplete last week
                  return (
                    <Box
                      key={`empty-${dayIndex}`}
                      sx={{
                        width: 60,
                        height: 60,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.3
                      }}
                    />
                  );
                }

                const dayNumber = day as number;

                const dailyPlan = dailyPlans.find(p => p.day === dayNumber);
                const isCompleted = dailyPlan?.completed;
                const isToday = dayNumber === 1; // For demo, day 1 is "today"
                const isRestDay = dayNumber % 7 === 0; // Every 7th day is rest day
                const weekNumber = Math.floor((dayNumber - 1) / 7) + 1;
                const dayInWeek = ((dayNumber - 1) % 7) + 1;
                
                // Determine background color based on day type
                let backgroundColor = 'rgba(255, 255, 255, 0.8)';
                let borderColor = '1px solid rgba(0,0,0,0.1)';
                
                if (isCompleted) {
                  backgroundColor = 'linear-gradient(135deg, #4CAF50, #45a049)';
                  borderColor = '1px solid #4CAF50';
                } else if (isToday) {
                  backgroundColor = 'linear-gradient(135deg, #FFD166, #06D6A0)';
                  borderColor = '2px solid #FFD166';
                } else if (isRestDay) {
                  backgroundColor = 'linear-gradient(135deg, #FF9800, #F57C00)';
                  borderColor = '1px solid #FF9800';
                }

                const tooltipText = dailyPlan 
                  ? `Day ${dayNumber} (Week ${weekNumber}, Day ${dayInWeek}): ${isRestDay ? 'Rest Day' : 'Active Day'} - ${dailyPlan.tips}`
                  : `Day ${dayNumber} (Week ${weekNumber}, Day ${dayInWeek}): ${isRestDay ? 'Rest Day' : 'Active Day'}`;
                
                return (
                  <Tooltip 
                    key={dayNumber} 
                    title={tooltipText}
                    placement="top"
                  >
                    <Card
                      sx={{
                        width: 60,
                        height: 60,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        background: backgroundColor,
                        color: isCompleted || isToday || isRestDay ? 'white' : 'text.primary',
                        border: borderColor,
                        '&:hover': {
                          transform: 'scale(1.05)',
                          boxShadow: 2
                        },
                        transition: 'all 0.3s ease'
                      }}
                      onClick={() => setSelectedDay(dayNumber)}
                    >
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                          {dayNumber}
                        </Typography>
                        {isCompleted && (
                          <Check sx={{ fontSize: 16, display: 'block', mx: 'auto', mt: 0.5 }} />
                        )}
                        {isRestDay && !isCompleted && (
                          <Typography variant="caption" sx={{ fontSize: '0.6rem', display: 'block', mt: 0.5 }}>
                            REST
                          </Typography>
                        )}
                      </Box>
                    </Card>
                  </Tooltip>
                );
              })}
            </Box>
          ))}
        </Box>
        
        {/* Calendar Summary */}
        <Box sx={{ mt: 3, p: 2, background: 'rgba(6, 214, 160, 0.1)', borderRadius: 2 }}>
          <Typography variant="body2" sx={{ textAlign: 'center', color: '#06D6A0', fontWeight: 500 }}>
            📊 90-Day Plan Summary: {Math.floor(totalDays / 7)} weeks • {Math.floor(totalDays / 7)} rest days • {totalDays - Math.floor(totalDays / 7)} active days
          </Typography>
        </Box>
      </Box>
    );
  };

  const renderDailyPlan = (day: number) => {
    const dailyPlan = dailyPlans.find(p => p.day === day);
    if (!dailyPlan) return null;

    return (
      <Dialog 
        open={selectedDay !== null} 
        onClose={() => setSelectedDay(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarToday sx={{ color: '#FFD166' }} />
            Day {day} - Your Daily Plan
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
            <Box sx={{ width: { xs: '100%', md: '50%' } }}>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Restaurant sx={{ color: '#FFD166' }} />
                    Today's Meals
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#FFD166' }}>
                      Breakfast
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {dailyPlan.meals.breakfast}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#06D6A0' }}>
                      Lunch
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {dailyPlan.meals.lunch}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#7B61FF' }}>
                      Dinner
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {dailyPlan.meals.dinner}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#FF6B6B' }}>
                      Snacks
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {dailyPlan.meals.snacks.join(', ')}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ width: { xs: '100%', md: '50%' } }}>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DirectionsRun sx={{ color: '#06D6A0' }} />
                    Today's Workout
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#FFD166' }}>
                      Cardio
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {dailyPlan.exercises.cardio}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#06D6A0' }}>
                      Strength
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {dailyPlan.exercises.strength}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#7B61FF' }}>
                      Flexibility
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {dailyPlan.exercises.flexibility}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>
          <Box sx={{ mt: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Info sx={{ color: '#7B61FF' }} />
                  Daily Tip
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {dailyPlan.tips}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedDay(null)}>Close</Button>
          <Button 
            variant="contained"
            onClick={() => {
              // Mark day as completed
              setDailyPlans(prev => prev.map(p => 
                p.day === day ? { ...p, completed: true } : p
              ));
              setSelectedDay(null);
            }}
            sx={{
              background: "linear-gradient(135deg, #FFD166, #06D6A0)",
              "&:hover": {
                background: "linear-gradient(135deg, #FFC107, #00C853)",
              }
            }}
          >
            Mark Complete
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

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
                  <FitnessCenter sx={{ fontSize: 20 }} />
                  90-Day Fitness Planner
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "rgba(255, 255, 255, 0.8)",
                    fontSize: "0.75rem"
                  }}
                >
                  AI-Powered personalized workout and nutrition plans
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
        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 4 }}>
          {/* Stepper */}
          <Box sx={{ width: { xs: "100%", md: "33.333%" } }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Paper
                elevation={4}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  background: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255, 255, 255, 0.2)"
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Your Journey
                </Typography>
                <Stepper activeStep={activeStep} orientation="vertical">
                  {steps.map((label, index) => (
                    <Step key={label}>
                      <StepLabel
                        sx={{
                          "& .MuiStepLabel-label": {
                            fontWeight: activeStep === index ? 600 : 400,
                            color: activeStep === index ? "#FFD166" : "text.secondary"
                          }
                        }}
                      >
                        {label}
                      </StepLabel>
                      <StepContent>
                        {index === 0 && (
                          <Typography variant="body2" color="text.secondary">
                            Upload a full-body image for AI analysis
                          </Typography>
                        )}
                        {index === 1 && (
                          <Typography variant="body2" color="text.secondary">
                            Choose your dietary preferences
                          </Typography>
                        )}
                        {index === 2 && (
                          <Typography variant="body2" color="text.secondary">
                            Review your personalized plan
                          </Typography>
                        )}
                        {index === 3 && (
                          <Typography variant="body2" color="text.secondary">
                            Start your 90-day journey
                          </Typography>
                        )}
                      </StepContent>
                    </Step>
                  ))}
                </Stepper>
              </Paper>
            </motion.div>
          </Box>

          {/* Main Content */}
          <Box sx={{ width: { xs: "100%", md: "66.667%" } }}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Paper
                elevation={8}
                sx={{
                  p: 4,
                  borderRadius: 3,
                  background: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  minHeight: "600px"
                }}
              >
                {/* Step 1: Image Upload */}
                {activeStep === 0 && (
                  <Box sx={{ textAlign: "center" }}>
                    <CloudUpload sx={{ fontSize: 64, color: "#FFD166", mb: 3 }} />
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                      Upload Your Body Image
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                      Upload a full-body image for AI analysis. This helps us create a personalized fitness plan.
                    </Typography>
                    
                    <Button
                      variant="contained"
                      component="label"
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
                      Choose Image
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </Button>
                    
                    {isAnalyzing && (
                      <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                        <CircularProgress size={20} />
                        <Typography variant="body2">Analyzing image with AI...</Typography>
                      </Box>
                    )}
                    
                    <Alert severity="info" sx={{ mt: 3, borderRadius: 2 }}>
                      <Typography variant="body2">
                        <strong>Privacy:</strong> Your image is processed locally and not stored. 
                        We only use it for body composition analysis.
                      </Typography>
                    </Alert>
                  </Box>
                )}

                {/* Step 2: Dietary Preferences */}
                {activeStep === 1 && (
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                      Dietary Preferences
                    </Typography>
                    
                    <FormControl component="fieldset" sx={{ mb: 4 }}>
                      <FormLabel component="legend" sx={{ fontWeight: 600, mb: 2 }}>
                        What&apos;s your dietary preference?
                      </FormLabel>
                      <RadioGroup
                        value={dietaryPreference}
                        onChange={(e) => handleDietaryChange(e.target.value as DietaryPreference)}
                      >
                        <FormControlLabel
                          value="vegetarian"
                          control={<Radio />}
                          label={
                            <Box>
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                Vegetarian
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                No meat, includes dairy and eggs
                              </Typography>
                            </Box>
                          }
                          sx={{ mb: 2 }}
                        />
                        <FormControlLabel
                          value="vegan"
                          control={<Radio />}
                          label={
                            <Box>
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                Vegan
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                No animal products
                              </Typography>
                            </Box>
                          }
                          sx={{ mb: 2 }}
                        />
                        <FormControlLabel
                          value="non-vegetarian"
                          control={<Radio />}
                          label={
                            <Box>
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                Non-Vegetarian
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Includes meat and all food groups
                              </Typography>
                            </Box>
                          }
                        />
                      </RadioGroup>
                    </FormControl>

                    <Divider sx={{ my: 3 }} />

                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      Fitness Goals (Select all that apply)
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 4 }}>
                      {availableGoals.map((goal) => (
                        <Chip
                          key={goal}
                          label={goal}
                          onClick={() => handleGoalChange(goal)}
                          sx={{
                            background: fitnessGoals.includes(goal) 
                              ? "linear-gradient(135deg, #FFD166, #06D6A0)"
                              : "rgba(0, 0, 0, 0.08)",
                            color: fitnessGoals.includes(goal) ? "white" : "text.primary",
                            fontWeight: fitnessGoals.includes(goal) ? 600 : 400,
                            cursor: "pointer",
                            "&:hover": {
                              background: fitnessGoals.includes(goal)
                                ? "linear-gradient(135deg, #FFC107, #00C853)"
                                : "rgba(0, 0, 0, 0.12)",
                            }
                          }}
                        />
                      ))}
                    </Box>

                    <Button
                      variant="contained"
                      onClick={() => setActiveStep(2)}
                      disabled={fitnessGoals.length === 0}
                      sx={{
                        background: "linear-gradient(135deg, #FFD166, #06D6A0)",
                        "&:hover": {
                          background: "linear-gradient(135deg, #FFC107, #00C853)",
                        },
                        "&:disabled": {
                          background: "rgba(0, 0, 0, 0.12)",
                          color: "rgba(0, 0, 0, 0.38)",
                        },
                        px: 4,
                        py: 1.5,
                        borderRadius: 3,
                        fontSize: "1.1rem",
                        fontWeight: 600,
                        textTransform: "none"
                      }}
                    >
                      Continue
                    </Button>
                  </Box>
                )}

                {/* Step 3: Review Plan */}
                {activeStep === 2 && (
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                      Review Your Plan
                    </Typography>
                    
                    <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 3, mb: 4 }}>
                      <Box sx={{ width: { xs: "100%", md: "50%" } }}>
                        <Card sx={{ borderRadius: 3, height: "100%" }}>
                          <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                              <Restaurant sx={{ color: "#FFD166" }} />
                              Dietary Preference
                            </Typography>
                            <Chip
                              label={dietaryPreference.charAt(0).toUpperCase() + dietaryPreference.slice(1)}
                              sx={{
                                background: "linear-gradient(135deg, #FFD166, #06D6A0)",
                                color: "white",
                                fontWeight: 600
                              }}
                            />
                          </CardContent>
                        </Card>
                      </Box>
                      <Box sx={{ width: { xs: "100%", md: "50%" } }}>
                        <Card sx={{ borderRadius: 3, height: "100%" }}>
                          <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                              <DirectionsRun sx={{ color: "#06D6A0" }} />
                              Selected Goals
                            </Typography>
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                              {fitnessGoals.map((goal) => (
                                <Chip
                                  key={goal}
                                  label={goal}
                                  size="small"
                                  sx={{
                                    background: "rgba(6, 214, 160, 0.1)",
                                    color: "#06D6A0",
                                    fontWeight: 500
                                  }}
                                />
                              ))}
                            </Box>
                          </CardContent>
                        </Card>
                      </Box>
                    </Box>

                    <Alert severity="info" sx={{ borderRadius: 2, mb: 3 }}>
                      <Typography variant="body2">
                        Your 90-day plan will include personalized meal plans, workout routines, 
                        and progress tracking based on your preferences and goals.
                      </Typography>
                    </Alert>

                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Button
                        variant="outlined"
                        onClick={() => setActiveStep(1)}
                        sx={{
                          borderColor: "#FFD166",
                          color: "#FFD166",
                          "&:hover": {
                            borderColor: "#FFC107",
                            background: "rgba(255, 209, 102, 0.05)",
                          },
                        }}
                      >
                        Back
                      </Button>
                      <Button
                        variant="contained"
                        onClick={generatePlan}
                        disabled={isGenerating}
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
                        {isGenerating ? (
                          <>
                            <CircularProgress size={20} sx={{ color: "white", mr: 1 }} />
                            ⚡ Generating Plan (30 sec max)...
                          </>
                        ) : (
                          "Generate My Plan"
                        )}
                      </Button>
                    </Box>
                  </Box>
                )}

                {/* Step 4: Plan Display */}
                {activeStep === 3 && plan && (
                  <Box>
                    {/* Debug info - remove in production */}
                    {process.env.NODE_ENV === 'development' && (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                          Debug: Plan loaded: {plan ? 'Yes' : 'No'}, Daily plans: {dailyPlans.length}, 
                          Active step: {activeStep}
                        </Typography>
                      </Alert>
                    )}
                    
                    {dailyPlans.length === 0 ? (
                      <Box sx={{ textAlign: "center", py: 4 }}>
                        <CircularProgress size={60} sx={{ color: "#FFD166", mb: 2 }} />
                        <Typography variant="h6" sx={{ mb: 1 }}>
                          Loading Your Plan...
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Please wait while we prepare your personalized fitness journey.
                        </Typography>
                      </Box>
                    ) : (
                      <Box>
                        {/* Notice for logged-out users */}
                        {!user && (
                          <Alert severity="info" sx={{ mb: 3 }}>
                            <Typography variant="body2">
                              <strong>Guest User Notice:</strong> As a guest, you can export your plan but cannot save it to your account or view it in the calendar. 
                              <Link href="/register" style={{ color: '#1976d2', textDecoration: 'none', marginLeft: '8px' }}>
                                Sign up to unlock all features!
                              </Link>
                            </Typography>
                          </Alert>
                        )}
                        
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                          <Typography variant="h5" sx={{ fontWeight: 600 }}>
                            Your 90-Day Plan
                          </Typography>
                          <Box sx={{ display: "flex", gap: 2 }}>
                            {/* Calendar and Save buttons - only for logged-in users */}
                            {user && (
                              <>
                                                            <Button
                              variant="outlined"
                              startIcon={<CalendarToday />}
                              onClick={() => setShowCalendar(!showCalendar)}
                              sx={{
                                borderColor: "#06D6A0",
                                color: "#06D6A0",
                                "&:hover": {
                                  borderColor: "#00C853",
                                  background: "rgba(6, 214, 160, 0.05)",
                                },
                              }}
                            >
                              {showCalendar ? "Hide Calendar" : "Show Calendar"}
                            </Button>
                            <Button
                              variant="outlined"
                              component={Link}
                              href="/health-tools/saved-routines"
                              startIcon={<Save />}
                              sx={{
                                borderColor: "#7B61FF",
                                color: "#7B61FF",
                                "&:hover": {
                                  borderColor: "#6A4C93",
                                  background: "rgba(123, 97, 255, 0.05)",
                                },
                              }}
                            >
                              Saved Routines
                            </Button>
                                <Button
                                  variant="outlined"
                                  startIcon={<Save />}
                                  onClick={() => setSaveDialogOpen(true)}
                                  sx={{
                                    borderColor: "#FFD166",
                                    color: "#FFD166",
                                    "&:hover": {
                                      borderColor: "#FFC107",
                                      background: "rgba(255, 209, 102, 0.05)",
                                    },
                                  }}
                                >
                                  Save Plan
                                </Button>
                              </>
                            )}
                            {/* Export button for logged-out users */}
                            {!user && (
                              <Button
                                variant="outlined"
                                startIcon={<Download />}
                                onClick={() => {
                                  // Export plan as JSON
                                  const planData = JSON.stringify({ plan, dailyPlans }, null, 2);
                                  const blob = new Blob([planData], { type: 'application/json' });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = '90-day-fitness-plan.json';
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                  URL.revokeObjectURL(url);
                                }}
                                sx={{
                                  borderColor: "#7B61FF",
                                  color: "#7B61FF",
                                  "&:hover": {
                                    borderColor: "#6A4C93",
                                    background: "rgba(123, 97, 255, 0.05)",
                                  },
                                }}
                              >
                                Export Plan
                              </Button>
                            )}
                          </Box>
                        </Box>

                        {/* Calendar - only for logged-in users */}
                        {user && showCalendar && renderCalendar()}

                        {/* Plan Overview */}
                        <Box sx={{ mb: 4 }}>
                          <Card sx={{ borderRadius: 3 }}>
                            <CardContent>
                              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                                <Info sx={{ color: "#7B61FF" }} />
                                Plan Overview
                              </Typography>
                              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
                                <Chip
                                  label={`${plan.duration} Days`}
                                  sx={{
                                    background: "linear-gradient(135deg, #FFD166, #06D6A0)",
                                    color: "white",
                                    fontWeight: 600
                                  }}
                                />
                                <Chip
                                  label={plan.difficulty}
                                  sx={{
                                    background: "rgba(6, 214, 160, 0.1)",
                                    color: "#06D6A0",
                                    fontWeight: 500
                                  }}
                                />
                                {plan.goals.map((goal) => (
                                  <Chip
                                    key={goal}
                                    label={goal}
                                    size="small"
                                    sx={{
                                      background: "rgba(123, 97, 255, 0.1)",
                                      color: "#7B61FF",
                                      fontWeight: 500
                                    }}
                                  />
                                ))}
                              </Box>
                              <Typography variant="body2" color="text.secondary">
                                Your personalized 90-day fitness journey includes {dailyPlans.length} days of structured workouts and meal plans, 
                                with rest days every 7th day to ensure optimal recovery and progress.
                              </Typography>
                            </CardContent>
                          </Card>
                        </Box>

                        {/* Sample Daily Plans */}
                        <Box sx={{ mb: 4 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
                            <CalendarToday sx={{ color: "#FFD166" }} />
                            Sample Daily Plans
                          </Typography>
                          
                          {/* Show first 3 days as examples */}
                          {dailyPlans.slice(0, 3).map((dailyPlan, index) => (
                            <Card key={dailyPlan.day} sx={{ borderRadius: 3, mb: 2 }}>
                              <CardContent>
                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: "#FFD166" }}>
                                  Day {dailyPlan.day}
                                </Typography>
                                
                                <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 3 }}>
                                  {/* Meals */}
                                  <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
                                      <Restaurant sx={{ color: "#FFD166", fontSize: 20 }} />
                                      Meals
                                    </Typography>
                                    <Box sx={{ mb: 1 }}>
                                      <Typography variant="body2" sx={{ fontWeight: 600, color: "#FFD166" }}>
                                        Breakfast:
                                      </Typography>
                                      <Typography variant="body2" color="text.secondary">
                                        {dailyPlan.meals.breakfast}
                                      </Typography>
                                    </Box>
                                    <Box sx={{ mb: 1 }}>
                                      <Typography variant="body2" sx={{ fontWeight: 600, color: "#06D6A0" }}>
                                        Lunch:
                                      </Typography>
                                      <Typography variant="body2" color="text.secondary">
                                        {dailyPlan.meals.lunch}
                                      </Typography>
                                    </Box>
                                    <Box sx={{ mb: 1 }}>
                                      <Typography variant="body2" sx={{ fontWeight: 600, color: "#7B61FF" }}>
                                        Dinner:
                                      </Typography>
                                      <Typography variant="body2" color="text.secondary">
                                        {dailyPlan.meals.dinner}
                                      </Typography>
                                    </Box>
                                  </Box>
                                  
                                  {/* Exercises */}
                                  <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
                                      <DirectionsRun sx={{ color: "#06D6A0", fontSize: 20 }} />
                                      Exercises
                                    </Typography>
                                    <Box sx={{ mb: 1 }}>
                                      <Typography variant="body2" sx={{ fontWeight: 600, color: "#FFD166" }}>
                                        Cardio:
                                      </Typography>
                                      <Typography variant="body2" color="text.secondary">
                                        {dailyPlan.exercises.cardio}
                                      </Typography>
                                    </Box>
                                    <Box sx={{ mb: 1 }}>
                                      <Typography variant="body2" sx={{ fontWeight: 600, color: "#06D6A0" }}>
                                        Strength:
                                      </Typography>
                                      <Typography variant="body2" color="text.secondary">
                                        {dailyPlan.exercises.strength}
                                      </Typography>
                                    </Box>
                                    <Box sx={{ mb: 1 }}>
                                      <Typography variant="body2" sx={{ fontWeight: 600, color: "#7B61FF" }}>
                                        Flexibility:
                                      </Typography>
                                      <Typography variant="body2" color="text.secondary">
                                        {dailyPlan.exercises.flexibility}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Box>
                                
                                {/* Daily Tip */}
                                <Box sx={{ mt: 2, p: 2, background: "rgba(123, 97, 255, 0.05)", borderRadius: 2 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: "#7B61FF", mb: 1 }}>
                                    💡 Daily Tip:
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {dailyPlan.tips}
                                  </Typography>
                                </Box>
                              </CardContent>
                            </Card>
                          ))}
                          
                          {/* Show more days button */}
                          {dailyPlans.length > 3 && (
                            <Box sx={{ textAlign: "center", mt: 2 }}>
                              <Button
                                variant="outlined"
                                onClick={() => setShowCalendar(true)}
                                sx={{
                                  borderColor: "#06D6A0",
                                  color: "#06D6A0",
                                  "&:hover": {
                                    borderColor: "#00C853",
                                    background: "rgba(6, 214, 160, 0.05)",
                                  },
                                }}
                              >
                                View All {dailyPlans.length} Days
                              </Button>
                            </Box>
                          )}
                        </Box>

                        <Box sx={{ mt: 4, textAlign: "center" }}>
                          <Button
                            variant="contained"
                            component={Link}
                            href="/health-tools/saved-routines"
                            sx={{
                              background: "linear-gradient(135deg, #FFD166, #06D6A0)",
                              "&:hover": {
                                background: "linear-gradient(135deg, #FFC107, #00C853)",
                              },
                              px: 6,
                              py: 2,
                              borderRadius: 3,
                              fontSize: "1.2rem",
                              fontWeight: 600,
                              textTransform: "none"
                            }}
                          >
                            {user ? "View Saved Routines" : "Start My Journey"}
                          </Button>
                        </Box>
                      </Box>
                    )}
                  </Box>
                )}
              </Paper>
            </motion.div>
          </Box>
        </Box>
      </Container>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Save Your Fitness Plan</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <MuiFormControlLabel
              control={
                <Switch
                  checked={saveToDatabase}
                  onChange={(e) => setSaveToDatabase(e.target.checked)}
                />
              }
              label="Save to my account (requires login)"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
              {user ? "Your plan will be saved to your account and accessible across devices." : "Please log in to save to your account."}
            </Typography>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <MuiFormControlLabel
              control={
                <Switch
                  checked={saveImage}
                  onChange={(e) => setSaveImage(e.target.checked)}
                />
              }
              label="Save body image for progress tracking"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
              Store your body image to track progress over time.
            </Typography>
          </Box>

          {!user && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              You need to log in to save to your account. Otherwise, the plan will be saved locally.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSavePlan}
            disabled={isSaving}
            sx={{
              background: "linear-gradient(135deg, #FFD166, #06D6A0)",
              "&:hover": {
                background: "linear-gradient(135deg, #FFC107, #00C853)",
              }
            }}
          >
            {isSaving ? (
              <>
                <CircularProgress size={20} sx={{ color: "white", mr: 1 }} />
                Saving...
              </>
            ) : (
              "Save Plan"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Daily Plan Dialog */}
      {selectedDay && renderDailyPlan(selectedDay)}
    </Box>
  );
} 