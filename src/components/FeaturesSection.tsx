"use client";

import { Box, Typography, Paper } from '@mui/material';
import { motion } from 'framer-motion';
import { 
  Psychology, 
  FitnessCenter, 
  Straighten, 
  Chat,
  Support,
  Analytics
} from '@mui/icons-material';

interface FeatureItem {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const features: FeatureItem[] = [
  {
    icon: <Psychology sx={{ fontSize: 48 }} />,
    title: "AI Therapist Chat",
    description: "24/7 AI therapy sessions providing mental health support, stress relief, and emotional guidance whenever you need it.",
    color: "#0066CC"
  },
  {
    icon: <Straighten sx={{ fontSize: 48 }} />,
    title: "Posture Checker",
    description: "Advanced AI-powered posture analysis to help you maintain proper alignment and prevent back and neck issues.",
    color: "#3399FF"
  },
  {
    icon: <FitnessCenter sx={{ fontSize: 48 }} />,
    title: "90-Day Fitness Planner",
    description: "Personalized 90-day fitness programs with AI-generated workouts, progress tracking, and adaptive recommendations.",
    color: "#004499"
  },
  {
    icon: <Chat sx={{ fontSize: 48 }} />,
    title: "Health Conversations",
    description: "Interactive AI health assistant for answering medical questions and providing personalized health advice.",
    color: "#000000"
  },
  {
    icon: <Support sx={{ fontSize: 48 }} />,
    title: "24/7 Health Support",
    description: "Round-the-clock AI health assistants and human medical experts ready to provide guidance and support.",
    color: "#666666"
  },
  {
    icon: <Analytics sx={{ fontSize: 48 }} />,
    title: "Progress Analytics",
    description: "Comprehensive health reports, fitness tracking, and progress insights to help you achieve your health goals.",
    color: "#1A1A1A"
  }
];

export default function FeaturesSection() {
  return (
    <Box sx={{ py: 8, background: 'white' }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: 3 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <Typography 
            variant="h3" 
            textAlign="center" 
            fontWeight={700} 
            sx={{ mb: 2, color: 'text.primary' }}
          >
            Why Choose Health AI?
          </Typography>
          <Typography 
            variant="h6" 
            textAlign="center" 
            sx={{ mb: 6, color: 'text.secondary', maxWidth: 600, mx: 'auto' }}
          >
            Revolutionary AI-powered health tools for mental wellness, fitness, and posture improvement
          </Typography>
        </motion.div>

        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
          gap: 4 
        }}>
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  height: '100%',
                  background: 'white',
                  borderRadius: 4,
                  border: '1px solid rgba(0,0,0,0.04)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                    borderColor: feature.color,
                  }
                }}
              >
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${feature.color}15, ${feature.color}30)`,
                    color: feature.color,
                    mb: 3,
                    transition: 'all 0.3s ease',
                  }}
                >
                  {feature.icon}
                </Box>
                
                <Typography 
                  variant="h5" 
                  fontWeight={600}
                  sx={{ mb: 2, color: 'text.primary' }}
                >
                  {feature.title}
                </Typography>
                
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: 'text.secondary',
                    lineHeight: 1.6
                  }}
                >
                  {feature.description}
                </Typography>
              </Paper>
            </motion.div>
          ))}
        </Box>
      </Box>
    </Box>
  );
} 