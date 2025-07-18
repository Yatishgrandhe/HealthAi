"use client";

import { Box, Typography, Paper, Avatar } from '@mui/material';
import { motion } from 'framer-motion';
import { Star } from '@mui/icons-material';
interface Testimonial {
  name: string;
  role: string;
  company: string;
  avatar: string;
  text: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    name: "Dr. Sarah Chen",
    role: "Mental Health Specialist",
    company: "Wellness Institute",
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face",
    text: "The AI therapist chat feature is incredibly effective. My patients love having 24/7 access to mental health support and the insights help me provide better care.",
    rating: 5
  },
  {
    name: "Marcus Rodriguez",
    role: "Fitness Coach",
    company: "Personal Training Studio",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    text: "The posture tracking feature is revolutionary. It helps clients maintain proper alignment and the progress tracking keeps them motivated to improve.",
    rating: 5
  },
  {
    name: "Dr. Emily Watson",
    role: "Physical Therapist",
    company: "Rehabilitation Center",
    avatar: "https://images.unsplash.com/photo-1594824475544-3d0c0b0c0b0b?w=150&h=150&fit=crop&crop=face",
    text: "The posture checker has been a game-changer for my patients. It helps them maintain proper alignment and prevents back and neck issues.",
    rating: 5
  },
  {
    name: "James Thompson",
    role: "Wellness Coach",
    company: "Health & Fitness Center",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    text: "Health AI combines mental wellness and physical fitness perfectly. The AI insights and personalized recommendations are spot-on for my clients.",
    rating: 5
  }
];

function StarRating({ rating }: { rating: number }) {
  return (
    <Box sx={{ display: 'flex', gap: 0.5, mb: 2 }}>
      {[...Array(5)].map((_, i) => (
        <Star 
          key={i} 
          sx={{ 
            color: i < rating ? '#0066CC' : '#E5E7EB',
            fontSize: 20
          }} 
        />
      ))}
    </Box>
  );
}

export default function TestimonialsSection() {
  return (
    <Box sx={{ py: 8, background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)' }}>
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
            Trusted by Healthcare Professionals
          </Typography>
          <Typography 
            variant="h6" 
            textAlign="center" 
            sx={{ mb: 8, color: 'text.secondary', maxWidth: 600, mx: 'auto' }}
          >
            See what medical professionals and organizations are saying about Health AI
          </Typography>
        </motion.div>

        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
          gap: 4 
        }}>
          {testimonials.map((testimonial, index) => (
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
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.1)',
                  }
                }}
              >
                <StarRating rating={testimonial.rating} />
                
                <Typography 
                  variant="body1" 
                  sx={{ 
                    mb: 3, 
                    color: 'text.secondary',
                    lineHeight: 1.7,
                    fontStyle: 'italic'
                  }}
                >
                  &ldquo;{testimonial.text}&rdquo;
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar 
                    src={testimonial.avatar} 
                    alt={testimonial.name}
                    sx={{ width: 56, height: 56 }}
                  />
                  <Box>
                    <Typography variant="h6" fontWeight={600} sx={{ color: 'text.primary' }}>
                      {testimonial.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {testimonial.role}, {testimonial.company}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </motion.div>
          ))}
        </Box>
      </Box>
    </Box>
  );
} 