"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Dumbbell, Ruler, Shield, Rocket } from 'lucide-react';

const slides = [
  {
    title: 'AI Therapist Chat',
    description: '24/7 mental health support with AI-powered therapy sessions. Get help whenever you need it.',
    icon: <Brain className="text-blue-600" size={48} aria-label="AI Therapist" />,
    bg: 'from-blue-600 to-blue-800',
  },
  {
    title: 'Posture Checker',
    description: 'Advanced AI-powered posture analysis to help you maintain proper alignment and prevent issues.',
    icon: <Ruler className="text-blue-500" size={48} aria-label="Posture Check" />,
    bg: 'from-blue-500 to-blue-700',
  },
  {
    title: '90-Day Fitness Planner',
    description: 'Personalized fitness programs with AI-generated workouts and progress tracking.',
    icon: <Dumbbell className="text-blue-700" size={48} aria-label="Fitness" />,
    bg: 'from-blue-700 to-blue-900',
  },
  {
    title: 'Health Analytics',
    description: 'Comprehensive health insights and progress tracking to optimize your wellness journey.',
    icon: <Shield className="text-blue-600" size={48} aria-label="Analytics" />,
    bg: 'from-blue-600 to-blue-800',
  },
  {
    title: '24/7 AI Support',
    description: 'Round-the-clock health assistance and personalized recommendations for your wellness goals.',
    icon: <Rocket className="text-blue-500" size={48} aria-label="Support" />,
    bg: 'from-blue-500 to-blue-700',
  },
];

export default function Slideshow() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full max-w-2xl h-72 flex items-center justify-center overflow-hidden rounded-3xl shadow-xl">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
          className={`absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br ${slides[index].bg} text-white p-8`}
        >
          <div className="mb-4">{slides[index].icon}</div>
          <h2 className="text-3xl font-heading font-bold mb-2 drop-shadow-lg animate-pulse">
            {slides[index].title}
          </h2>
          <p className="text-lg font-body text-white/90 max-w-md text-center animate-fadein">
            {slides[index].description}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
} 