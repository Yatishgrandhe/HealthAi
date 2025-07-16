"use client";

import { useState, useEffect } from "react";
import { 
  Box, 
  Container, 
  Paper, 
  TextField, 
  Button, 
  Typography, 
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  InputAdornment,
  IconButton,
  FormControlLabel,
  Checkbox
} from "@mui/material";
import { 
  HealthAndSafety,
  Security,
  Person,
  CheckCircle,
  Error,
  Visibility,
  VisibilityOff,
  ArrowForward,
  ArrowBack
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";


interface SetupData {
  fullName: string;
  phoneNumber: string;
  dateOfBirth: string;
  emergencyContact: string;
  healthGoals: string;
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
}

const steps = [
  'Personal Information',
  'Health Profile',
  'Security & Verification'
];

export default function AccountSetupPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string; email?: string; email_confirmed_at?: string } | null>(null);
  const router = useRouter();

  const [setupData, setSetupData] = useState<SetupData>({
    fullName: '',
    phoneNumber: '',
    dateOfBirth: '',
    emergencyContact: '',
    healthGoals: '',
    agreeToTerms: false,
    agreeToPrivacy: false
  });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      
      // Check if user email is verified
      if (!user.email_confirmed_at) {
        setError("Please verify your email address before setting up your account. Check your inbox for a verification link.");
        return;
      }
      
      setUser(user);
    };
    
    checkUser();
  }, [router]);

  const handleInputChange = (field: keyof SetupData, value: string | boolean) => {
    setSetupData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0:
        if (!setupData.fullName.trim() || !setupData.phoneNumber.trim() || !setupData.dateOfBirth || !setupData.emergencyContact.trim()) {
          setError("Please fill in all personal information fields.");
          return false;
        }
        break;
      case 1:
        if (!setupData.healthGoals.trim()) {
          setError("Please describe your health goals.");
          return false;
        }
        break;
      case 2:
        if (!setupData.agreeToTerms || !setupData.agreeToPrivacy) {
          setError("Please agree to both Terms of Service and Privacy Policy.");
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
      setError(null);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
    setError(null);
  };

  const handleCompleteSetup = async () => {
    if (!validateStep(activeStep)) return;
    
    setLoading(true);
    setError(null);

    try {
      // Update user profile with additional information
      const { error: profileError } = await supabase.auth.updateUser({
        data: {
          full_name: setupData.fullName,
          phone_number: setupData.phoneNumber,
          date_of_birth: setupData.dateOfBirth,
          emergency_contact: setupData.emergencyContact,
          health_goals: setupData.healthGoals,
          setup_completed: true
        }
      });

      if (profileError) {
        throw profileError;
      }

      setSuccess("Account setup completed successfully! Redirecting to your dashboard...");
      
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);

    } catch (error: unknown) {
      let errorMessage = "An error occurred during account setup. Please try again.";
      function isErrorWithMessage(err: unknown): err is { message: string } {
        return typeof err === "object" && err !== null && "message" in err && typeof (err as { message?: unknown }).message === "string";
      }
      if (isErrorWithMessage(error)) {
        errorMessage = error.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Typography variant="h6" sx={{ mb: 3, color: "primary.main", fontWeight: 600 }}>
              <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
              Personal Information
            </Typography>
            
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <TextField
                fullWidth
                label="Full Name"
                value={setupData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ color: "primary.main" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />

              <TextField
                fullWidth
                label="Phone Number"
                value={setupData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                required
                placeholder="+1 (555) 123-4567"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />

              <TextField
                fullWidth
                label="Date of Birth"
                type="date"
                value={setupData.dateOfBirth}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                required
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />

              <TextField
                fullWidth
                label="Emergency Contact"
                value={setupData.emergencyContact}
                onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                required
                placeholder="Name and phone number"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />
            </Box>
          </motion.div>
        );

      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Typography variant="h6" sx={{ mb: 3, color: "primary.main", fontWeight: 600 }}>
              <HealthAndSafety sx={{ mr: 1, verticalAlign: 'middle' }} />
              Health Profile
            </Typography>
            
            <Card sx={{ mb: 3, background: "rgba(123, 97, 255, 0.05)", border: "1px solid rgba(123, 97, 255, 0.2)" }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Describe your health goals and any specific health conditions you have.
                </Typography>
              </CardContent>
            </Card>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <TextField
                fullWidth
                label="Health Goals"
                multiline
                rows={4}
                value={setupData.healthGoals}
                onChange={(e) => handleInputChange('healthGoals', e.target.value)}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Security sx={{ color: "primary.main" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />
            </Box>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Typography variant="h6" sx={{ mb: 3, color: "primary.main", fontWeight: 600 }}>
              <Security sx={{ mr: 1, verticalAlign: 'middle' }} />
              Security & Verification
            </Typography>
            
            <Card sx={{ mb: 3, background: "rgba(76, 175, 80, 0.05)", border: "1px solid rgba(76, 175, 80, 0.2)" }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  <CheckCircle sx={{ mr: 1, verticalAlign: 'middle', color: 'success.main' }} />
                  Email verification completed successfully
                </Typography>
              </CardContent>
            </Card>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={setupData.agreeToTerms}
                    onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
                    sx={{
                      color: "primary.main",
                      "&.Mui-checked": {
                        color: "primary.main",
                      },
                    }}
                  />
                }
                label={
                  <Typography variant="body2" color="text.secondary">
                    I agree to the{" "}
                    <a href="#" style={{ color: "#7B61FF", textDecoration: "none", fontWeight: 500 }}>
                      Terms of Service
                    </a>
                  </Typography>
                }
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={setupData.agreeToPrivacy}
                    onChange={(e) => handleInputChange('agreeToPrivacy', e.target.checked)}
                    sx={{
                      color: "primary.main",
                      "&.Mui-checked": {
                        color: "primary.main",
                      },
                    }}
                  />
                }
                label={
                  <Typography variant="body2" color="text.secondary">
                    I agree to the{" "}
                    <a href="#" style={{ color: "#7B61FF", textDecoration: "none", fontWeight: 500 }}>
                      Privacy Policy
                    </a>
                  </Typography>
                }
              />
            </Box>
          </motion.div>
        );

      default:
        return null;
    }
  };

  if (!user) {
    return (
      <Box sx={{ 
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
      }}>
        <CircularProgress sx={{ color: "white" }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 4,
        px: 2
      }}
    >
      <Container maxWidth="md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Paper
            elevation={24}
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: 4,
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              position: "relative",
              overflow: "hidden",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "4px",
                background: "linear-gradient(90deg, #E573B7, #7B61FF, #FFD166)",
                borderRadius: "4px 4px 0 0"
              }
            }}
          >
            {/* Logo and Header */}
            <Box sx={{ textAlign: "center", mb: 4 }}>
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <img 
              src="/health-ai-logo.png" 
              alt="Health AI Logo" 
              width={60} 
              height={60} 
              style={{
                borderRadius: '50%',
                background: 'transparent',
                display: 'block'
              }}
            />
              </motion.div>
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  fontWeight: 700,
                  background: "linear-gradient(90deg, #E573B7, #7B61FF)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  mt: 2,
                  mb: 1
                }}
              >
                Complete Your Setup
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Let&#39;s get your Health AI account ready
              </Typography>
            </Box>

            {/* Stepper */}
            <Box sx={{ mb: 4 }}>
              <Stepper activeStep={activeStep} alternativeLabel>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>

            {/* Success/Error Messages */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Alert 
                  severity="error" 
                  icon={<Error />}
                  sx={{ mb: 3, borderRadius: 2 }}
                >
                  {error}
                </Alert>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Alert 
                  severity="success" 
                  icon={<CheckCircle />}
                  sx={{ mb: 3, borderRadius: 2 }}
                >
                  {success}
                </Alert>
              </motion.div>
            )}

            {/* Step Content */}
            <Box sx={{ mb: 4 }}>
              {renderStepContent(activeStep)}
            </Box>

            {/* Navigation Buttons */}
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                startIcon={<ArrowBack />}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                Back
              </Button>

              <Box>
                {activeStep === steps.length - 1 ? (
                  <Button
                    variant="contained"
                    onClick={handleCompleteSetup}
                    disabled={loading}
                    endIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
                    sx={{
                      borderRadius: 2,
                      background: "linear-gradient(90deg, #E573B7, #7B61FF)",
                      textTransform: "none",
                      fontWeight: 600,
                      px: 4,
                      "&:hover": {
                        background: "linear-gradient(90deg, #D563A7, #6B51EF)",
                      },
                    }}
                  >
                    {loading ? "Setting Up..." : "Complete Setup"}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    endIcon={<ArrowForward />}
                    sx={{
                      borderRadius: 2,
                      background: "linear-gradient(90deg, #E573B7, #7B61FF)",
                      textTransform: "none",
                      fontWeight: 600,
                      px: 4,
                      "&:hover": {
                        background: "linear-gradient(90deg, #D563A7, #6B51EF)",
                      },
                    }}
                  >
                    Next
                  </Button>
                )}
              </Box>
            </Box>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
} 