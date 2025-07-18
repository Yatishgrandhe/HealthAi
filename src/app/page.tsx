"use client";

import { useEffect, useState } from "react";
import { Box, Container, Typography, Button, Stack } from "@mui/material";
import { styled } from "@mui/material/styles";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

import FeaturesSection from "@/components/FeaturesSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import StatsSection from "@/components/StatsSection";
import ThemeProvider from "@/components/ThemeProvider";
import Navigation from "@/components/Navigation";
import CustomLoader from '@/components/CustomLoader';

const HeroBox = styled(Box)({
  minHeight: "60vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, #0066CC 0%, #004499 50%, #000000 100%)",
  position: "relative",
  overflow: "hidden",
  paddingTop: "80px",
  paddingBottom: "60px",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1000 1000\"><polygon fill=\"rgba(255,255,255,0.05)\" points=\"0,1000 1000,0 1000,1000\"/></svg>')",
    backgroundSize: "cover",
  },
  "&::after": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "radial-gradient(circle at 20% 80%, rgba(0, 102, 204, 0.4) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(0, 68, 153, 0.4) 0%, transparent 50%)",
    pointerEvents: "none",
  }
});

const AnimatedText = [
  "AI-powered health tools for mental wellness and fitness.",
  "Therapist chat, posture checker, and personalized health insights.",
  "Revolutionizing personal health with artificial intelligence.",
  "24/7 AI support for your mental and physical wellness.",
  "Health AI: Your personal wellness companion."
];

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [heroIdx, setHeroIdx] = useState(0);

  useEffect(() => {
    // Simulate loading for a short time for effect
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIdx((idx) => (idx + 1) % AnimatedText.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ThemeProvider>
      <CustomLoader loading={loading} />
      <Box sx={{ 
        opacity: loading ? 0 : 1, 
        transition: 'opacity 0.5s',
        position: 'relative',
        zIndex: 1,
        pointerEvents: loading ? 'none' : 'auto'
      }}>
        <Navigation />
        {/* HERO SECTION */}
        <HeroBox>
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <Box sx={{ textAlign: "center", position: "relative", zIndex: 2 }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
              >
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  mb: 4,
                  position: 'relative',
                }}>
                  <img 
                    src="/health-ai-logo.png" 
                    alt="Health AI Logo" 
                    width={160} 
                    height={160} 
                    style={{
                      borderRadius: '50%',
                      background: 'transparent',
                      display: 'block',
                      cursor: 'pointer',
                      transition: 'transform 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  />
                </Box>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                <Typography 
                  variant="h1" 
                  fontWeight={800} 
                  sx={{ 
                    mb: 2, 
                    color: "white",
                    textShadow: "0 4px 20px rgba(0,0,0,0.3)",
                    fontSize: { xs: "2.5rem", md: "3.5rem" }
                  }}
                >
                  Health AI
                </Typography>
              </motion.div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={heroIdx}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.7 }}
                >
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      mb: 4, 
                      maxWidth: 800, 
                      mx: "auto",
                      color: "rgba(255,255,255,0.9)",
                      textShadow: "0 2px 10px rgba(0,0,0,0.2)",
                      fontSize: { xs: "1.25rem", md: "1.5rem" }
                    }}
                  >
                    {AnimatedText[heroIdx]}
                  </Typography>
                </motion.div>
              </AnimatePresence>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                style={{ position: 'relative', zIndex: 10 }}
              >
                <Stack 
                  direction={{ xs: "column", sm: "row" }} 
                  spacing={3} 
                  sx={{ 
                    justifyContent: "center",
                    alignItems: "center",
                    position: 'relative',
                    zIndex: 10,
                  }}
                >
                  <Button 
                    component={Link}
                    href="/register"
                    variant="contained" 
                    size="large" 
                    onClick={() => console.log('Get Started clicked')}
                    sx={{ 
                      borderRadius: 50, 
                      fontWeight: 700, 
                      background: "linear-gradient(45deg, #0066CC, #3399FF)",
                      color: "white",
                      px: 6,
                      py: 2,
                      fontSize: "1.1rem",
                      boxShadow: "0 8px 32px rgba(0, 102, 204, 0.4)",
                      position: 'relative',
                      zIndex: 10,
                      cursor: 'pointer',
                      "&:hover": {
                        background: "linear-gradient(45deg, #004499, #0066CC)",
                        boxShadow: "0 12px 40px rgba(0, 102, 204, 0.6)",
                        transform: "translateY(-2px)",
                      },
                      "&:active": {
                        transform: "translateY(0px)",
                      },
                      transition: "all 0.3s ease"
                    }}
                  >
                    Get Started
                  </Button>
                  
                  <Button 
                    component={Link}
                    href="/login"
                    variant="outlined" 
                    size="large" 
                    onClick={() => console.log('Login clicked')}
                    sx={{ 
                      borderRadius: 50, 
                      fontWeight: 700, 
                      color: "white",
                      borderColor: "rgba(255,255,255,0.5)",
                      px: 6,
                      py: 2,
                      fontSize: "1.1rem",
                      position: 'relative',
                      zIndex: 10,
                      cursor: 'pointer',
                      "&:hover": {
                        borderColor: "white",
                        background: "rgba(255,255,255,0.1)",
                        transform: "translateY(-2px)",
                      },
                      "&:active": {
                        transform: "translateY(0px)",
                      },
                      transition: "all 0.3s ease"
                    }}
                  >
                    Login
                  </Button>
                </Stack>
              </motion.div>
            </Box>
          </motion.div>
        </Container>
        </HeroBox>

        {/* Rest of the sections */}
        <FeaturesSection />
        <StatsSection />
        <HowItWorksSection />
        <TestimonialsSection />
      </Box>
    </ThemeProvider>
  );
}
