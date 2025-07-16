"use client";

import { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  TextField, 
  Button, 
  Chip, 
  Rating, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { styled } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LocationOn, 
  Phone, 
  Email, 
  Language, 
  Search, 
  MyLocation,
  Directions
} from '@mui/icons-material';
import Navigation from '@/components/Navigation';
import ThemeProvider from '@/components/ThemeProvider';

const HeroSection = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  padding: theme.spacing(15, 0, 10),
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
}));

const HospitalCard = styled(Card)(() => ({
  height: '100%',
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(123, 97, 255, 0.1)',
  borderRadius: 20,
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 20px 40px rgba(123, 97, 255, 0.2)',
  }
}));

const MapContainer = styled(Box)(() => ({
  height: 500,
  background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
  borderRadius: 20,
  border: '2px solid rgba(123, 97, 255, 0.2)',
  position: 'relative',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'url("data:image/svg+xml,<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 100 100\\"><circle cx=\\"20\\" cy=\\"20\\" r=\\"2\\" fill=\\"%237B61FF\\" opacity=\\"0.3\\"/><circle cx=\\"80\\" cy=\\"30\\" r=\\"1.5\\" fill=\\"%23E573B7\\" opacity=\\"0.3\\"/><circle cx=\\"40\\" cy=\\"70\\" r=\\"2.5\\" fill=\\"%23FFD166\\" opacity=\\"0.3\\"/><circle cx=\\"70\\" cy=\\"80\\" r=\\"1\\" fill=\\"%237B61FF\\" opacity=\\"0.3\\"/></svg>")',
    backgroundSize: '200px 200px',
    opacity: 0.1,
  }
}));

// Fake hospital data
const hospitals = [
  {
    id: 1,
    name: "Metropolitan General Hospital",
    address: "123 Healthcare Blvd, Downtown",
    city: "New York",
    state: "NY",
    phone: "+1 (555) 123-4567",
    email: "info@metropolitanhospital.com",
    website: "https://metropolitanhospital.com",
    rating: 4.8,
    distance: "0.5 miles",
    coordinates: { lat: 40.7128, lng: -74.0060 },
    specialties: ["Emergency Medicine", "Cardiology", "Neurology"],
    services: ["24/7 Emergency", "ICU", "Surgery", "Radiology"],
    amenities: ["WiFi", "Parking", "Cafeteria", "Wheelchair Access"],
    description: "A leading medical center providing comprehensive emergency and specialized care with state-of-the-art facilities.",
    image: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=400&h=300&fit=crop"
  },
  {
    id: 2,
    name: "St. Mary's Medical Center",
    address: "456 Wellness Avenue, Midtown",
    city: "New York",
    state: "NY",
    phone: "+1 (555) 234-5678",
    email: "contact@stmarys.com",
    website: "https://stmarys.com",
    rating: 4.6,
    distance: "1.2 miles",
    coordinates: { lat: 40.7589, lng: -73.9851 },
    specialties: ["Pediatrics", "Maternity", "Orthopedics"],
    services: ["Emergency Care", "Labor & Delivery", "Rehabilitation"],
    amenities: ["WiFi", "Parking", "Gift Shop", "Chapel"],
    description: "Compassionate care for families with specialized pediatric and maternity services in a welcoming environment.",
    image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop"
  },
  {
    id: 3,
    name: "City Emergency Hospital",
    address: "789 Emergency Lane, Uptown",
    city: "New York",
    state: "NY",
    phone: "+1 (555) 345-6789",
    email: "emergency@cityhospital.com",
    website: "https://cityemergency.com",
    rating: 4.9,
    distance: "2.1 miles",
    coordinates: { lat: 40.7505, lng: -73.9934 },
    specialties: ["Trauma", "Emergency Surgery", "Critical Care"],
    services: ["Trauma Center", "Helipad", "Burn Unit", "Emergency Surgery"],
    amenities: ["WiFi", "Parking", "Cafeteria", "Family Waiting Area"],
    description: "Level 1 trauma center with advanced emergency care capabilities and rapid response teams.",
    image: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=400&h=300&fit=crop"
  },
  {
    id: 4,
    name: "Community Health Center",
    address: "321 Care Street, Brooklyn",
    city: "Brooklyn",
    state: "NY",
    phone: "+1 (555) 456-7890",
    email: "info@communityhealth.com",
    website: "https://communityhealth.com",
    rating: 4.4,
    distance: "3.5 miles",
    coordinates: { lat: 40.6782, lng: -73.9442 },
    specialties: ["Primary Care", "Mental Health", "Dental"],
    services: ["Primary Care", "Mental Health", "Dental Care", "Pharmacy"],
    amenities: ["WiFi", "Parking", "Pharmacy", "Counseling"],
    description: "Comprehensive community health services focusing on preventive care and mental health support.",
    image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop"
  },
  {
    id: 5,
    name: "University Medical Center",
    address: "654 Academic Drive, Queens",
    city: "Queens",
    state: "NY",
    phone: "+1 (555) 567-8901",
    email: "contact@universitymed.com",
    website: "https://universitymed.com",
    rating: 4.7,
    distance: "4.2 miles",
    coordinates: { lat: 40.7282, lng: -73.7949 },
    specialties: ["Research", "Teaching", "Specialized Care"],
    services: ["Research Trials", "Teaching Hospital", "Specialized Care", "Telemedicine"],
    amenities: ["WiFi", "Parking", "Library", "Research Labs"],
    description: "Academic medical center combining cutting-edge research with exceptional patient care and medical education.",
    image: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=400&h=300&fit=crop"
  }
];

interface Hospital {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  website: string;
  rating: number;
  distance: string;
  coordinates: { lat: number; lng: number };
  specialties: string[];
  services: string[];
  amenities: string[];
  description: string;
  image: string;
}

export default function HospitalsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showMap, setShowMap] = useState(true);

  useEffect(() => {
    // Request user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Location access denied:', error);
        }
      );
    }
  }, []);

  const filteredHospitals = hospitals.filter(hospital =>
    hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hospital.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hospital.specialties.some(specialty => 
      specialty.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleHospitalClick = (hospital: Hospital) => {
    setSelectedHospital(hospital);
  };

  const handleCloseDialog = () => {
    setSelectedHospital(null);
  };

  const getDirections = (hospital: Hospital) => {
    const { lat, lng } = hospital.coordinates;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

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
                Partner Hospitals
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ 
                  mb: 4,
                  maxWidth: 800,
                  mx: 'auto',
                  opacity: 0.9,
                  textShadow: '0 2px 10px rgba(0,0,0,0.2)',
                  lineHeight: 1.6,
                  fontSize: '1.2rem'
                }}
              >
                Find trusted healthcare partners near you. All our partner hospitals 
                accept PulsePay for instant emergency payments.
              </Typography>
            </motion.div>
          </Container>
        </HeroSection>

        {/* Search and Map Section */}
        <Box sx={{ py: 6, background: '#f8f9ff' }}>
          <Container maxWidth="lg">
            <Grid container spacing={4}>
              {/* Search and Filters */}
              <Box sx={{ width: { xs: '100%', md: '33.33%' }, px: 1, mb: 2 }}>
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                      Find Hospitals
                    </Typography>
                    
                    <TextField
                      fullWidth
                      placeholder="Search hospitals, specialties, or location..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                      sx={{ mb: 3 }}
                    />

                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<MyLocation />}
                      onClick={() => {
                        if (userLocation) {
                          // Center map on user location
                          console.log('Centering on user location:', userLocation);
                        }
                      }}
                      sx={{ mb: 2 }}
                    >
                      Use My Location
                    </Button>

                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => setShowMap(!showMap)}
                      sx={{
                        background: 'linear-gradient(45deg, #7B61FF, #E573B7)',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #6B51EF, #D563A7)',
                        }
                      }}
                    >
                      {showMap ? 'Show List View' : 'Show Map View'}
                    </Button>
                  </Paper>

                  {/* Hospital List */}
                  <Box sx={{ maxHeight: 600, overflowY: 'auto' }}>
                    <AnimatePresence>
                      {filteredHospitals.map((hospital, index) => (
                        <motion.div
                          key={hospital.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: index * 0.1 }}
                        >
                          <HospitalCard 
                            onClick={() => handleHospitalClick(hospital)}
                            sx={{ mb: 2 }}
                          >
                            <CardContent sx={{ p: 3 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                <Typography variant="h6" fontWeight={600} sx={{ color: '#232946' }}>
                                  {hospital.name}
                                </Typography>
                                <Rating value={hospital.rating} readOnly size="small" />
                              </Box>
                              
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <LocationOn sx={{ fontSize: 16, color: '#7B61FF', mr: 1 }} />
                                <Typography variant="body2" color="text.secondary">
                                  {hospital.address}, {hospital.city}, {hospital.state}
                                </Typography>
                              </Box>
                              
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Typography variant="body2" color="primary" fontWeight={500}>
                                  {hospital.distance} away
                                </Typography>
                              </Box>

                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {hospital.specialties.slice(0, 2).map((specialty) => (
                                  <Chip
                                    key={specialty}
                                    label={specialty}
                                    size="small"
                                    sx={{
                                      background: 'rgba(123, 97, 255, 0.1)',
                                      color: '#7B61FF',
                                      fontSize: '0.75rem'
                                    }}
                                  />
                                ))}
                              </Box>
                            </CardContent>
                          </HospitalCard>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </Box>
                </motion.div>
              </Box>

              {/* Map Section */}
              <Box sx={{ width: { xs: '100%', md: '66.67%' }, px: 1, mb: 2 }}>
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <MapContainer>
                    <Box sx={{ textAlign: 'center', p: 4 }}>
                      <Typography variant="h5" fontWeight={600} sx={{ mb: 2, color: '#232946' }}>
                        Interactive Map
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 3, color: '#666' }}>
                        Google Maps integration coming soon! 
                        <br />
                        For now, use the hospital list to find locations.
                      </Typography>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                        {hospitals.slice(0, 3).map((hospital) => (
                          <motion.div
                            key={hospital.id}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button
                              variant="outlined"
                              onClick={() => handleHospitalClick(hospital)}
                              sx={{
                                borderColor: '#7B61FF',
                                color: '#7B61FF',
                                '&:hover': {
                                  borderColor: '#6B51EF',
                                  background: 'rgba(123, 97, 255, 0.1)',
                                }
                              }}
                            >
                              {hospital.name}
                            </Button>
                          </motion.div>
                        ))}
                      </Box>
                    </Box>
                  </MapContainer>
                </motion.div>
              </Box>
            </Grid>
          </Container>
        </Box>

        {/* Hospital Details Dialog */}
        <Dialog
          open={!!selectedHospital}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          {selectedHospital && (
            <>
              <DialogTitle sx={{ pb: 1 }}>
                <Typography variant="h5" fontWeight={600}>
                  {selectedHospital.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedHospital.address}, {selectedHospital.city}, {selectedHospital.state}
                </Typography>
              </DialogTitle>
              
              <DialogContent>
                <Grid container spacing={3}>
                  <Box sx={{ width: { xs: '100%', md: '50%' }, px: 1, mb: 2 }}>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                      Contact Information
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          <Phone sx={{ color: '#7B61FF' }} />
                        </ListItemIcon>
                        <ListItemText primary={selectedHospital.phone} />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <Email sx={{ color: '#7B61FF' }} />
                        </ListItemIcon>
                        <ListItemText primary={selectedHospital.email} />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <Language sx={{ color: '#7B61FF' }} />
                        </ListItemIcon>
                        <ListItemText primary={selectedHospital.website} />
                      </ListItem>
                    </List>
                  </Box>
                  
                  <Box sx={{ width: { xs: '100%', md: '50%' }, px: 1, mb: 2 }}>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                      Services & Amenities
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                        Specialties:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selectedHospital.specialties.map((specialty) => (
                          <Chip
                            key={specialty}
                            label={specialty}
                            size="small"
                            sx={{
                              background: 'rgba(123, 97, 255, 0.1)',
                              color: '#7B61FF'
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                        Amenities:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selectedHospital.amenities.map((amenity) => (
                          <Chip
                            key={amenity}
                            label={amenity}
                            size="small"
                            variant="outlined"
                            sx={{ borderColor: '#E573B7', color: '#E573B7' }}
                          />
                        ))}
                      </Box>
                    </Box>
                  </Box>
                  
                  <Box sx={{ width: '100%', px: 1, mb: 2 }}>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                      Description
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      {selectedHospital.description}
                    </Typography>
                  </Box>
                </Grid>
              </DialogContent>
              
              <DialogActions sx={{ p: 3 }}>
                <Button onClick={handleCloseDialog}>
                  Close
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Directions />}
                  onClick={() => getDirections(selectedHospital)}
                  sx={{
                    background: 'linear-gradient(45deg, #7B61FF, #E573B7)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #6B51EF, #D563A7)',
                    }
                  }}
                >
                  Get Directions
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Box>
    </ThemeProvider>
  );
}