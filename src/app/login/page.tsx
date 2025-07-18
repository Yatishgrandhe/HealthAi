"use client";

import { useState } from "react";
import { 
  Box, 
  Container, 
  Paper, 
  TextField, 
  Button, 
  Typography, 
  Link as MuiLink,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton
} from "@mui/material";
import { 
  Email, 
  Lock, 
  Visibility, 
  VisibilityOff,
  CheckCircle,
  Error
} from "@mui/icons-material";
import { motion } from "framer-motion";
import Link from "next/link";
import { supabase } from "@/utils/supabaseClient";


export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) {
        setError(error.message);
      } else {
        // Check if user has completed account setup
        const userMetadata = data.user?.user_metadata;
        const setupCompleted = userMetadata?.setup_completed;
        
        setSuccess("Login successful! Redirecting...");
        setTimeout(() => {
          if (setupCompleted) {
            window.location.href = "/dashboard";
          } else {
            window.location.href = "/account-setup";
          }
        }, 1500);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      setError("Please enter your email address first");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({ 
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });
      
      if (error) {
        setError(error.message);
      } else {
        setSuccess("Magic link sent! Check your email.");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0066CC 0%, #004499 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 4,
        px: 2
      }}
    >
      <Container maxWidth="sm">
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
                background: "linear-gradient(90deg, #0066CC, #3399FF, #004499)",
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
                <Link href="/" passHref>
                  <Box sx={{ cursor: "pointer", display: "inline-block" }}>
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
                  </Box>
                </Link>
              </motion.div>
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  fontWeight: 700,
                  background: "linear-gradient(90deg, #0066CC, #3399FF)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  mt: 2,
                  mb: 1
                }}
              >
                Welcome Back
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Sign in to your Health AI account
              </Typography>
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

            {/* Login Form */}
            <Box
              component="form"
              onSubmit={handleLogin}
              sx={{ display: "flex", flexDirection: "column", gap: 3 }}
            >
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: "primary.main" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 3,
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "primary.main",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "primary.main",
                      borderWidth: 2,
                    },
                  },
                }}
              />

              <TextField
                fullWidth
                label="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: "primary.main" }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 3,
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "primary.main",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "primary.main",
                      borderWidth: 2,
                    },
                  },
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  py: 1.5,
                  borderRadius: 3,
                  background: "linear-gradient(45deg, #0066CC, #3399FF)",
                  color: "white",
                  fontWeight: 600,
                  fontSize: "1.1rem",
                  textTransform: "none",
                  boxShadow: "0 4px 20px rgba(0, 102, 204, 0.3)",
                  "&:hover": {
                    background: "linear-gradient(45deg, #004499, #0066CC)",
                    boxShadow: "0 6px 25px rgba(0, 102, 204, 0.4)",
                    transform: "translateY(-1px)",
                  },
                  "&:disabled": {
                    background: "rgba(0, 102, 204, 0.5)",
                    transform: "none",
                  },
                  transition: "all 0.3s ease",
                }}
              >
                {loading ? (
                  <CircularProgress size={24} sx={{ color: "white" }} />
                ) : (
                  "Sign In"
                )}
              </Button>

              <Button
                type="button"
                fullWidth
                variant="outlined"
                onClick={handleMagicLink}
                disabled={loading || !email}
                sx={{
                  py: 1.5,
                  borderRadius: 3,
                  borderColor: "primary.main",
                  color: "primary.main",
                  fontWeight: 600,
                  fontSize: "1rem",
                  textTransform: "none",
                  "&:hover": {
                    borderColor: "primary.dark",
                    background: "rgba(0, 102, 204, 0.05)",
                    transform: "translateY(-1px)",
                  },
                  "&:disabled": {
                    borderColor: "rgba(0, 102, 204, 0.3)",
                    color: "rgba(0, 102, 204, 0.3)",
                    transform: "none",
                  },
                  transition: "all 0.3s ease",
                }}
              >
                Send Magic Link
              </Button>
            </Box>

            {/* Footer Links */}
            <Box sx={{ mt: 4, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Don't have an account?{" "}
                <MuiLink
                  component={Link}
                  href="/register"
                  sx={{
                    color: "primary.main",
                    textDecoration: "none",
                    fontWeight: 600,
                    "&:hover": {
                      textDecoration: "underline",
                    },
                  }}
                >
                  Sign up here
                </MuiLink>
              </Typography>
              
              <Typography variant="body2" color="text.secondary">
                <MuiLink
                  component={Link}
                  href="/forgot-password"
                  sx={{
                    color: "primary.main",
                    textDecoration: "none",
                    fontWeight: 600,
                    "&:hover": {
                      textDecoration: "underline",
                    },
                  }}
                >
                  Forgot your password?
                </MuiLink>
              </Typography>
            </Box>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
} 