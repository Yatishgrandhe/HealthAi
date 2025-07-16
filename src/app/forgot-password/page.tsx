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
  InputAdornment
} from "@mui/material";
import { 
  Email, 
  ArrowBack, 
  CheckCircle,
  Error
} from "@mui/icons-material";
import { motion } from "framer-motion";
import Link from "next/link";
import { supabase } from "@/utils/supabaseClient";


export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/forgot-password`,
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess("Password reset link sent! Check your email.");
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
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
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
                Reset Password
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Enter your email to receive a password reset link
              </Typography>
            </Box>

            {/* Back to Login Link */}
            <Box sx={{ mb: 3 }}>
              <Link href="/login" passHref>
                <MuiLink
                  component="span"
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 1,
                    color: "primary.main",
                    textDecoration: "none",
                    fontWeight: 500,
                    "&:hover": {
                      textDecoration: "underline"
                    }
                  }}
                >
                  <ArrowBack sx={{ fontSize: 20 }} />
                  Back to Login
                </MuiLink>
              </Link>
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

            {/* Reset Password Form */}
            <Box
              component="form"
              onSubmit={handleResetPassword}
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

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading || !email}
                  sx={{
                    py: 1.5,
                    borderRadius: 3,
                    background: "linear-gradient(90deg, #E573B7, #7B61FF)",
                    fontSize: "1.1rem",
                    fontWeight: 600,
                    textTransform: "none",
                    boxShadow: "0 8px 32px rgba(123, 97, 255, 0.3)",
                    "&:hover": {
                      background: "linear-gradient(90deg, #D563A7, #6B51EF)",
                      boxShadow: "0 12px 40px rgba(123, 97, 255, 0.4)",
                      transform: "translateY(-2px)",
                    },
                    "&:disabled": {
                      background: "rgba(0, 0, 0, 0.12)",
                      color: "rgba(0, 0, 0, 0.38)",
                    },
                  }}
                >
                  {loading ? (
                    <CircularProgress size={24} sx={{ color: "white" }} />
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </motion.div>
            </Box>

            {/* Additional Help */}
            <Box sx={{ textAlign: "center", mt: 4, pt: 3, borderTop: "1px solid rgba(0, 0, 0, 0.1)" }}>
              <Typography variant="body2" color="text.secondary">
                Don&apos;t have an account?{" "}
                <Link href="/register" passHref>
                  <MuiLink
                    component="span"
                    sx={{
                      color: "primary.main",
                      fontWeight: 600,
                      textDecoration: "none",
                      "&:hover": {
                        textDecoration: "underline"
                      }
                    }}
                  >
                    Sign up here
                  </MuiLink>
                </Link>
              </Typography>
            </Box>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
} 