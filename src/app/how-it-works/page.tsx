"use client";

import { Box, Container, Typography, Paper, Card, CardContent, Chip } from '@mui/material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { 
  Psychology, 
  FitnessCenter, 
  Straighten, 
  CheckCircle, 
  Security,
  Speed,
  Public,
  Support
} from '@mui/icons-material';
import Navigation from '@/components/Navigation';
import ThemeProvider from '@/components/ThemeProvider';

const HeroSection = styled(Box)({
  background: 'linear-gradient(135deg, #0066CC 0%, #004499 100%)',
  padding: '120px 0 80px',
  color: 'white',
  textAlign: 'center',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'url("data:image/svg+xml,<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 1000 1000\\"><polygon fill=\\"rgba(255,255,255,0.05)\\" points=\\"0,1000 1000,0 1000,1000\\"/></svg>")',
    backgroundSize: 'cover',
  }
});

const ProcessStep = styled(Card)({
  height: '100%',
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(0, 102, 204, 0.1)',
  borderRadius: 20,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 20px 40px rgba(0, 102, 204, 0.2)',
  }
});

const FeatureCard = styled(Card)({
  background: 'linear-gradient(135deg, rgba(0, 102, 204, 0.1) 0%, rgba(51, 153, 255, 0.1) 100%)',
  border: '1px solid rgba(0, 102, 204, 0.2)',
  borderRadius: 16,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'scale(1.02)',
    boxShadow: '0 12px 32px rgba(0, 102, 204, 0.15)',
  }
});

const processSteps = [
  {
    step: 1,
    title: "Create Your Health Profile",
    description: "Start your wellness journey by creating a personalized health profile with your goals and preferences.",
    icon: <Psychology sx={{ fontSize: 40, color: '#0066CC' }} />,
    details: [
      "Sign up and create your health profile",
      "Set your wellness goals and preferences",
      "AI analyzes your health objectives",
      "Personalized recommendations begin"
    ]
  },
  {
    step: 2,
    title: "Access Health Tools",
    description: "Use our AI-powered tools for mental health, fitness, and posture improvement.",
    icon: <FitnessCenter sx={{ fontSize: 40, color: '#3399FF' }} />,
    details: [
      "AI therapist chat for mental wellness",
      "Posture checker for alignment",
      "90-day fitness planner for workouts",
      "Health conversations with AI assistant"
    ]
  },
  {
    step: 3,
    title: "Track Your Progress",
    description: "Monitor your health journey with detailed analytics and progress tracking.",
    icon: <Straighten sx={{ fontSize: 40, color: '#004499' }} />,
    details: [
      "Track fitness progress and goals",
      "Monitor therapy session insights",
      "Posture improvement analytics",
      "Health trend analysis"
    ]
  },
  {
    step: 4,
    title: "Get Personalized Insights",
    description: "Receive AI-powered recommendations and insights to optimize your wellness journey.",
    icon: <CheckCircle sx={{ fontSize: 40, color: '#000000' }} />,
    details: [
      "AI-generated health recommendations",
      "Personalized fitness adjustments",
      "Mental health insights and tips",
      "Progress reports and achievements"
    ]
  }
];

const keyFeatures = [
  {
    title: "AI-Powered Health Tools",
    description: "Advanced AI algorithms for personalized health recommendations and insights.",
    icon: <Security sx={{ fontSize: 32, color: '#0066CC' }} />
  },
  {
    title: "24/7 Availability",
    description: "Access your health tools anytime, anywhere with round-the-clock AI support.",
    icon: <Speed sx={{ fontSize: 32, color: '#3399FF' }} />
  },
  {
    title: "Comprehensive Wellness",
    description: "Mental health, physical fitness, and posture improvement in one platform.",
    icon: <Public sx={{ fontSize: 32, color: '#004499' }} />
  },
  {
    title: "Personalized Support",
    description: "Tailored recommendations and support based on your unique health goals.",
    icon: <Support sx={{ fontSize: 32, color: '#000000' }} />
  }
];

const benefits = [
  "No expensive gym memberships required",
  "24/7 mental health support",
  "Personalized fitness programs",
  "Real-time posture feedback",
  "Progress tracking and analytics",
  "AI-powered health insights",
  "Comprehensive wellness approach",
  "Easy-to-use interface"
];

export default function HowItWorksPage() {
  return (
    <ThemeProvider>
      <Box>
        <Navigation />
        
        {/* Hero Section */}
        <HeroSection>
          <Container maxWidth="lg">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Typography 
                variant="h1" 
                fontWeight={800}
                sx={{ 
                  mb: 3,
                  fontSize: { xs: '2.5rem', md: '4rem' },
                  textShadow: '0 4px 20px rgba(0,0,0,0.3)'
                }}
              >
                How Health AI Works
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ 
                  mb: 4,
                  maxWidth: 800,
                  mx: 'auto',
                  opacity: 0.9,
                  textShadow: '0 2px 10px rgba(0,0,0,0.2)'
                }}
              >
                Transform your health and wellness journey with AI-powered tools for mental health, 
                fitness, and posture improvement.
              </Typography>
            </motion.div>
          </Container>
        </HeroSection>

        {/* Process Steps */}
        <Box sx={{ py: 10, background: '#f8f9ff' }}>
          <Container maxWidth="lg">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Typography 
                variant="h2" 
                fontWeight={700}
                textAlign="center"
                sx={{ mb: 6, color: '#000000' }}
              >
                Your Wellness Journey
              </Typography>
              
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                gap: 4 
              }}>
                {processSteps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.2 }}
                  >
                    <ProcessStep>
                      <CardContent sx={{ p: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            width: 60,
                            height: 60,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, rgba(0, 102, 204, 0.1), rgba(51, 153, 255, 0.1))',
                            mr: 2
                          }}>
                            {step.icon}
                          </Box>
                          <Box>
                            <Chip 
                              label={`Step ${step.step}`} 
                              sx={{ 
                                background: 'linear-gradient(45deg, #0066CC, #3399FF)',
                                color: 'white',
                                fontWeight: 600,
                                mb: 1
                              }} 
                            />
                            <Typography variant="h5" fontWeight={600} sx={{ color: '#000000' }}>
                              {step.title}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Typography variant="body1" sx={{ mb: 3, color: '#666666', lineHeight: 1.6 }}>
                          {step.description}
                        </Typography>
                        
                        <Box component="ul" sx={{ pl: 2 }}>
                          {step.details.map((detail, detailIndex) => (
                            <Typography 
                              key={detailIndex}
                              component="li" 
                              variant="body2" 
                              sx={{ 
                                mb: 1, 
                                color: '#666666',
                                '&::marker': { color: '#0066CC' }
                              }}
                            >
                              {detail}
                            </Typography>
                          ))}
                        </Box>
                      </CardContent>
                    </ProcessStep>
                  </motion.div>
                ))}
              </Box>
            </motion.div>
          </Container>
        </Box>

        {/* Key Features */}
        <Box sx={{ py: 10, background: 'white' }}>
          <Container maxWidth="lg">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Typography 
                variant="h2" 
                fontWeight={700}
                textAlign="center"
                sx={{ mb: 6, color: '#000000' }}
              >
                Why Choose Health AI?
              </Typography>
              
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
                gap: 4 
              }}>
                {keyFeatures.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <FeatureCard>
                      <CardContent sx={{ p: 3, textAlign: 'center' }}>
                        <Box sx={{ mb: 2 }}>
                          {feature.icon}
                        </Box>
                        <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: '#000000' }}>
                          {feature.title}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#666666', lineHeight: 1.5 }}>
                          {feature.description}
                        </Typography>
                      </CardContent>
                    </FeatureCard>
                  </motion.div>
                ))}
              </Box>
            </motion.div>
          </Container>
        </Box>

        {/* Benefits */}
        <Box sx={{ py: 10, background: 'linear-gradient(135deg, #f8f9ff 0%, #e3f2fd 100%)' }}>
          <Container maxWidth="lg">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Typography 
                variant="h2" 
                fontWeight={700}
                textAlign="center"
                sx={{ mb: 6, color: '#000000' }}
              >
                Benefits of Health AI
              </Typography>
              
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
                gap: 3 
              }}>
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        textAlign: 'center',
                        background: 'rgba(255, 255, 255, 0.8)',
                        borderRadius: 3,
                        border: '1px solid rgba(0, 102, 204, 0.1)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 25px rgba(0, 102, 204, 0.15)',
                        }
                      }}
                    >
                      <Typography variant="body1" sx={{ color: '#000000', fontWeight: 500 }}>
                        {benefit}
                      </Typography>
                    </Paper>
                  </motion.div>
                ))}
              </Box>
            </motion.div>
          </Container>
        </Box>

        {/* CTA Section */}
        <Box sx={{ py: 10, background: 'linear-gradient(135deg, #0066CC 0%, #004499 100%)', color: 'white' }}>
          <Container maxWidth="lg">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              style={{ textAlign: 'center' }}
            >
              <Typography 
                variant="h2" 
                fontWeight={700}
                sx={{ mb: 3 }}
              >
                Ready to Transform Your Health?
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ 
                  mb: 4,
                  maxWidth: 600,
                  mx: 'auto',
                  opacity: 0.9
                }}
              >
                Join thousands of users who are already improving their mental health, 
                fitness, and posture with AI-powered tools.
              </Typography>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Box
                  component="a"
                  href="/register"
                  sx={{
                    display: 'inline-block',
                    px: 6,
                    py: 2,
                    background: 'white',
                    color: '#0066CC',
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    borderRadius: 3,
                    textTransform: 'none',
                    textDecoration: 'none',
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.9)',
                      transform: 'translateY(-2px)',
                    }
                  }}
                >
                  Get Started Today
                </Box>
              </motion.div>
            </motion.div>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
} 