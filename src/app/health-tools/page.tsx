"use client";

import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Button, 
  IconButton,
  Card,
  CardContent,
  Chip
} from "@mui/material";
import { 
  Psychology, 
  CameraAlt, 
  FitnessCenter, 
  ArrowForward,
  ArrowBack,
  HealthAndSafety,
  TrendingUp,
  Star
} from "@mui/icons-material";
import { motion } from "framer-motion";
import Link from "next/link";
import APIStatusChecker from "@/components/APIStatusChecker";



const healthTools = [
  {
          id: "therapist-chat",
      title: "Therapist Chat",
      description: "Talk to a caring friend who's here to listen and help",
    icon: <Psychology sx={{ fontSize: 40, color: "#E573B7" }} />,
    features: ["24/7 Support", "AI-Powered", "Private & Secure"],
    color: "linear-gradient(135deg, #E573B7, #7B61FF)",
    path: "/health-tools/therapist-chat",
    comingSoon: false
  },
  {
    id: "posture-check",
    title: "Posture Check",
    description: "Real-time camera-based posture analysis and improvement tips",
    icon: <CameraAlt sx={{ fontSize: 40, color: "#7B61FF" }} />,
    features: ["Real-time Analysis", "Visual Feedback", "Progress Tracking"],
    color: "linear-gradient(135deg, #7B61FF, #4CAF50)",
    path: "/health-tools/posture-check",
    comingSoon: false
  },
  {
    id: "fitness-planner",
    title: "90-Day Fitness Planner",
    description: "Personalized workout and nutrition plans based on your body analysis",
    icon: <FitnessCenter sx={{ fontSize: 40, color: "#FFD166" }} />,
    features: ["Body Analysis", "Meal Plans", "Workout Routines"],
    color: "linear-gradient(135deg, #FFD166, #06D6A0)",
    path: "/health-tools/fitness-planner",
    comingSoon: false
  }
];

const comingSoonTools = [
  {
    id: "meditation",
    title: "Meditation Guide",
    description: "Guided meditation sessions for stress relief and mindfulness",
    icon: <HealthAndSafety sx={{ fontSize: 40, color: "#9C27B0" }} />,
    features: ["Guided Sessions", "Stress Relief", "Mindfulness"],
    color: "linear-gradient(135deg, #9C27B0, #673AB7)"
  },
  {
    id: "sleep-tracker",
    title: "Sleep Tracker",
    description: "Monitor your sleep patterns and get personalized recommendations",
    icon: <TrendingUp sx={{ fontSize: 40, color: "#2196F3" }} />,
    features: ["Sleep Analysis", "Recommendations", "Progress Tracking"],
    color: "linear-gradient(135deg, #2196F3, #00BCD4)"
  },
  {
    id: "nutrition-ai",
    title: "Nutrition AI",
    description: "AI-powered meal planning and nutritional guidance",
    icon: <Star sx={{ fontSize: 40, color: "#FF9800" }} />,
    features: ["AI Planning", "Nutritional Guidance", "Diet Tracking"],
    color: "linear-gradient(135deg, #FF9800, #FF5722)"
  }
];

export default function HealthToolsPage() {
  return (
    <Box sx={{ minHeight: "100vh", background: "#f8f9ff" }}>
      {/* Header with Back Navigation */}
              <Box
          sx={{
            background: "linear-gradient(135deg, #0066CC 0%, #004499 50%, #000000 100%)",
            py: 4,
            position: "relative",
            overflow: "hidden"
          }}
        >
        {/* Background Pattern */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
            background: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.4\"%3E%3Ccircle cx=\"30\" cy=\"30\" r=\"2\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')",
          }}
        />
        
        <Container maxWidth="lg">
          {/* API Status Checker */}
          <APIStatusChecker />
          
          <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
            <Link href="/" passHref>
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
              width={50} 
              height={50} 
              style={{
                borderRadius: '50%',
                background: 'transparent',
                display: 'block'
              }}
            />
            <Typography
              variant="h4"
              sx={{
                color: "white",
                fontWeight: 700,
                ml: 2,
                display: { xs: "none", sm: "block" }
              }}
            >
              Health & Wellness Tools
            </Typography>
          </Box>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Typography
              variant="h2"
              sx={{
                color: "white",
                fontWeight: 800,
                fontSize: { xs: "2.5rem", md: "3.5rem" },
                textAlign: "center",
                mb: 2,
                textShadow: "0 4px 8px rgba(0,0,0,0.3)"
              }}
            >
              Your Health Journey
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: "rgba(255, 255, 255, 0.9)",
                textAlign: "center",
                maxWidth: "800px",
                mx: "auto",
                fontWeight: 400,
                lineHeight: 1.6
              }}
            >
              Discover AI-powered tools designed to support your mental health, physical wellness, and overall well-being
            </Typography>
          </motion.div>
        </Container>
      </Box>

      {/* Featured Tools Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              textAlign: "center",
              mb: 1,
              background: "linear-gradient(90deg, #E573B7, #7B61FF)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}
          >
            Featured Tools
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ textAlign: "center", mb: 6, maxWidth: "600px", mx: "auto" }}
          >
            Start your wellness journey with our most popular health tools
          </Typography>
        </motion.div>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {healthTools.map((tool, index) => (
            <Box key={tool.id} sx={{ width: { xs: '100%', md: '33.333%' }, mb: 4 }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card
                  component={Link}
                  href={tool.path}
                  sx={{
                    height: "100%",
                    borderRadius: 4,
                    overflow: "hidden",
                    textDecoration: "none",
                    background: "rgba(255, 255, 255, 0.95)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&:hover": {
                      transform: "translateY(-8px)",
                      boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
                      "& .tool-icon": {
                        transform: "scale(1.1)",
                      },
                    },
                  }}
                >
                  {/* Tool Header */}
                  <Box
                    sx={{
                      background: tool.color,
                      p: 3,
                      textAlign: "center",
                      position: "relative",
                      overflow: "hidden"
                    }}
                  >
                    <Box
                      className="tool-icon"
                      sx={{
                        transition: "transform 0.3s ease",
                        mb: 2
                      }}
                    >
                      {tool.icon}
                    </Box>
                    <Typography
                      variant="h5"
                      sx={{
                        color: "white",
                        fontWeight: 700,
                        mb: 1
                      }}
                    >
                      {tool.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "rgba(255, 255, 255, 0.9)",
                        lineHeight: 1.5
                      }}
                    >
                      {tool.description}
                    </Typography>
                  </Box>

                  {/* Tool Content */}
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ mb: 3 }}>
                      {tool.features.map((feature, featureIndex) => (
                        <Chip
                          key={featureIndex}
                          label={feature}
                          size="small"
                          sx={{
                            mr: 1,
                            mb: 1,
                            background: "rgba(123, 97, 255, 0.1)",
                            color: "#7B61FF",
                            fontWeight: 500,
                            fontSize: "0.75rem"
                          }}
                        />
                      ))}
                    </Box>

                    <Button
                      fullWidth
                      variant="contained"
                      endIcon={<ArrowForward />}
                      sx={{
                        background: tool.color,
                        borderRadius: 3,
                        py: 1.5,
                        fontWeight: 600,
                        textTransform: "none",
                        fontSize: "1rem",
                        "&:hover": {
                          background: tool.color,
                          transform: "translateY(-2px)",
                          boxShadow: "0 8px 25px rgba(0, 0, 0, 0.2)",
                        },
                      }}
                    >
                      Get Started
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </Box>
          ))}
        </Box>
      </Container>

      {/* Coming Soon Section */}
      <Box sx={{ background: "rgba(123, 97, 255, 0.05)", py: 8 }}>
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                textAlign: "center",
                mb: 1,
                color: "#7B61FF"
              }}
            >
              More Tools Coming Soon
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ textAlign: "center", mb: 6, maxWidth: "600px", mx: "auto" }}
            >
              We&apos;re constantly developing new tools to support your health journey
            </Typography>
          </motion.div>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {comingSoonTools.map((tool, index) => (
              <Box key={tool.id} sx={{ width: { xs: '100%', md: '33.333%' }, mb: 4 }}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                >
                  <Paper
                    sx={{
                      p: 3,
                      borderRadius: 4,
                      background: "rgba(255, 255, 255, 0.8)",
                      backdropFilter: "blur(20px)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      textAlign: "center",
                      position: "relative",
                      opacity: 0.7,
                      "&:hover": {
                        opacity: 1,
                        transform: "translateY(-4px)",
                      },
                      transition: "all 0.3s ease"
                    }}
                  >
                    <Box
                      sx={{
                        background: tool.color,
                        width: 80,
                        height: 80,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mx: "auto",
                        mb: 2
                      }}
                    >
                      {tool.icon}
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        mb: 1,
                        color: "#232946"
                      }}
                    >
                      {tool.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2, lineHeight: 1.5 }}
                    >
                      {tool.description}
                    </Typography>
                    <Chip
                      label="Coming Soon"
                      size="small"
                      sx={{
                        background: "rgba(123, 97, 255, 0.1)",
                        color: "#7B61FF",
                        fontWeight: 500
                      }}
                    />
                  </Paper>
                </motion.div>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Call to Action */}
      <Box sx={{ py: 8, background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
        <Container maxWidth="md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Typography
              variant="h3"
              sx={{
                color: "white",
                fontWeight: 700,
                textAlign: "center",
                mb: 2
              }}
            >
              Ready to Start Your Health Journey?
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: "rgba(255, 255, 255, 0.9)",
                textAlign: "center",
                mb: 4,
                maxWidth: "600px",
                mx: "auto"
              }}
            >
              Choose a tool above to begin your personalized wellness experience
            </Typography>
            <Box sx={{ textAlign: "center" }}>
              <Button
                component={Link}
                href="/"
                variant="outlined"
                size="large"
                sx={{
                  color: "white",
                  borderColor: "white",
                  borderRadius: 3,
                  px: 4,
                  py: 1.5,
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  textTransform: "none",
                  "&:hover": {
                    borderColor: "white",
                    background: "rgba(255, 255, 255, 0.1)",
                    transform: "translateY(-2px)",
                  },
                }}
              >
                Back to PulsePay
              </Button>
            </Box>
          </motion.div>
        </Container>
      </Box>
    </Box>
  );
} 