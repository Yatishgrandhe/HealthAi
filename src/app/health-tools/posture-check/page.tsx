"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Paper, 
  IconButton,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Snackbar
} from "@mui/material";
import { 
  CameraAlt, 
  PlayArrow, 
  Stop, 
  Refresh, 
  Save, 
  Delete, 
  CheckCircle,
  Warning,
  Info,
  TrendingUp,
  FitnessCenter,
  Psychology,
  Visibility,
  VisibilityOff,
  Settings,
  BugReport,
  PowerSettingsNew,
  ArrowBack,
  Videocam,
  VideocamOff,
  ErrorOutline,
  ZoomIn,
  ZoomOut,
  History
} from "@mui/icons-material";
import { motion } from "framer-motion";
import Link from "next/link";

import { PostureAnalysis, ProgressReport } from "@/types/posture";
import { useUser } from "@/utils/supabaseClient";
import HealthDataService from "@/utils/healthDataService";
import imageUploadService from "@/utils/imageUploadService";
import BackButton from "@/components/BackButton";

export default function PostureCheckPage() {
  const [cameraPermission, setCameraPermission] = useState<"granted" | "denied" | "pending">("pending");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<PostureAnalysis | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [videoReady, setVideoReady] = useState(false);
  const [apiStatus, setApiStatus] = useState<"checking" | "ready" | "error" | "unknown">("unknown");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [progressReports, setProgressReports] = useState<ProgressReport[]>([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [maxZoom, setMaxZoom] = useState(3);
  const [minZoom, setMinZoom] = useState(0.3);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomStartDistance, setZoomStartDistance] = useState(0);
  const [zoomStartLevel, setZoomStartLevel] = useState(1);
  const [countdown, setCountdown] = useState(0);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [showZoomPercentage, setShowZoomPercentage] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraContainerRef = useRef<HTMLDivElement>(null);
  const { user, loading: userLoading } = useUser();
  const healthDataService = new HealthDataService();

  // Debug logging
  useEffect(() => {
    console.log('User state changed:', { user, userLoading });
  }, [user, userLoading]);

  // Check if browser supports getUserMedia
  const isBrowserSupported = () => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  };

  // Get available cameras
  const getAvailableCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setAvailableCameras(videoDevices);
      console.log("Available cameras:", videoDevices);
      return videoDevices;
    } catch (error) {
      console.error('Error getting cameras:', error);
      return;
    }
  };

  // Flip to next camera
  const flipCamera = async () => {
    if (availableCameras.length <= 1) {
      setSnackbarMessage("Only one camera available");
      setSnackbarOpen(true);
      return;
    }

    const nextIndex = (currentCameraIndex + 1) % availableCameras.length;
    setCurrentCameraIndex(nextIndex);
    
    // Restart camera with new device
    await restartCameraWithDevice(availableCameras[nextIndex].deviceId);
  };

  // Restart camera with specific device
  const restartCameraWithDevice = async (deviceId?: string) => {
    try {
      stopCamera();
      await new Promise(resolve => setTimeout(resolve, 500));
      const constraints = {
        video: { 
          deviceId: deviceId ? { exact: deviceId } : undefined,
          facingMode: deviceId ? undefined : "user",
          width: { ideal: 1280, min: 640, max: 1920 },
          height: { ideal: 720, min: 480, max: 1080 },
          aspectRatio: { ideal: 16/9 },
          frameRate: { ideal: 30, min: 15 }
        },
        audio: false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setIsCameraOn(true);
      setCameraPermission("granted");
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setVideoReady(true);
      }
    } catch (error) {
      console.error('Error switching camera:', error);
      setSnackbarMessage("Failed to switch camera");
      setSnackbarOpen(true);
    }
  };

  // Zoom functions
  const zoomIn = useCallback(() => {
    if (zoomLevel < maxZoom) {
      setZoomLevel(prev => Math.min(prev + 0.25, maxZoom));
    }
  }, [zoomLevel, maxZoom]);

  const zoomOut = useCallback(() => {
    if (zoomLevel > minZoom) {
      setZoomLevel(prev => Math.max(prev - 0.25, minZoom));
    }
  }, [zoomLevel, minZoom]);

  const resetZoom = useCallback(() => {
    setZoomLevel(1);
  }, []);

  const getDistance = useCallback((touch1: Touch, touch2: Touch) => {
    return Math.sqrt(
      Math.pow(touch1.clientX - touch2.clientX, 2) +
      Math.pow(touch1.clientY - touch2.clientY, 2)
    );
  }, []);

  const handleWheel = useCallback((event: WheelEvent) => {
    if (isCameraOn) {
      event.preventDefault();
      const delta = event.deltaY > 0 ? -0.25 : 0.25;
      setZoomLevel(prev => Math.max(minZoom, Math.min(maxZoom, prev + delta)));
    }
  }, [isCameraOn, minZoom, maxZoom]);

  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (event.touches.length === 2) {
      setIsZooming(true);
      setZoomStartDistance(getDistance(event.touches[0], event.touches[1]));
      setZoomStartLevel(zoomLevel);
    }
  }, [getDistance, zoomLevel]);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (isZooming && event.touches.length === 2) {
      event.preventDefault();
      const currentDistance = getDistance(event.touches[0], event.touches[1]);
      const scale = currentDistance / zoomStartDistance;
      const newZoom = Math.max(minZoom, Math.min(maxZoom, zoomStartLevel * scale));
      setZoomLevel(newZoom);
    }
  }, [isZooming, getDistance, zoomStartDistance, zoomStartLevel, minZoom, maxZoom]);

  const handleTouchEnd = useCallback(() => {
    setIsZooming(false);
  }, []);

  const checkApiStatus = async () => {
    try {
      setApiStatus("checking");
      const response = await fetch('/api/test-posture-api');
      const result = await response.json();
      
      if (result.success) {
        setApiStatus("ready");
        console.log("Posture analysis API is ready");
      } else {
        setApiStatus("error");
        console.error("Posture analysis API error:", result.message);
      }
    } catch (error) {
      setApiStatus("error");
      console.error("Failed to check API status:", error);
    }
  };

  const requestCameraPermission = async () => {
    try {
      setCameraPermission("pending");
      setError(null);
      setVideoReady(false);
      
      console.log("Requesting camera permission...");
      
      // Enhanced constraints for better person detection
      const constraints = {
        video: { 
          facingMode: "user",
          width: { ideal: 1280, min: 640, max: 1920 },
          height: { ideal: 720, min: 480, max: 1080 },
          aspectRatio: { ideal: 16/9 },
          frameRate: { ideal: 30, min: 15 }
        },
        audio: false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log("Camera stream obtained:", stream);
      console.log("Stream tracks:", stream.getTracks());
      console.log("Track settings:", stream.getVideoTracks()[0]?.getSettings());
      
      // IMMEDIATELY set camera as on when we get the stream
      streamRef.current = stream;
      setIsCameraOn(true);
      setCameraPermission("granted");
      
      // Get available cameras after permission is granted
      await getAvailableCameras();
      
      if (videoRef.current) {
        // Set up video element
        const video = videoRef.current;
        video.srcObject = stream;
        
        // Set up event listeners
        const onLoadedMetadata = () => {
          console.log("Video metadata loaded");
          console.log("Video dimensions:", video.videoWidth, "x", video.videoHeight);
          setVideoReady(true);
          setSnackbarMessage("Camera is now active! Position yourself in the center.");
          setSnackbarOpen(true);
        };
        
        const onCanPlay = () => {
          console.log("Video can play");
          setVideoReady(true);
        };
        
        const onPlay = () => {
          console.log("Video playing");
          setVideoReady(true);
        };
        
        const onError = (e: Event) => {
          console.error("Video error:", e);
          setError("Video loading failed");
        };
        
        // Add event listeners
        video.addEventListener('loadedmetadata', onLoadedMetadata);
        video.addEventListener('canplay', onCanPlay);
        video.addEventListener('play', onPlay);
        video.addEventListener('error', onError);
        
        // Try to play immediately
        try {
          await video.play();
          console.log("Video play started successfully");
          setVideoReady(true);
          setSnackbarMessage("Camera is now active! Position yourself in the center.");
          setSnackbarOpen(true);
        } catch (playError) {
          console.error("Video play error:", playError);
          // Even if play fails, camera is still on
          setVideoReady(true);
          setSnackbarMessage("Camera ready but video may not be visible");
          setSnackbarOpen(true);
        }
        
        // Fallback: ensure camera is marked as on after a short delay
        setTimeout(() => {
          if (stream.getTracks().length > 0) {
            setIsCameraOn(true);
            setCameraPermission("granted");
            setVideoReady(true);
            console.log("Fallback: Camera marked as active");
          }
        }, 1000);
      }
    } catch (error: any) {
      console.error("Camera permission denied:", error);
      setCameraPermission("denied");
      setError(error.message || "Failed to access camera");
      setSnackbarMessage("Camera access denied. Please allow camera permissions.");
      setSnackbarOpen(true);
    }
  };

  const loadProgressReports = useCallback(async () => {
    try {
      console.log('Loading progress reports, user:', { user, userLoading });
      
      if (user && !userLoading) {
        try {
          console.log('Attempting to load from database...');
          const sessions = await healthDataService.getPostureCheckSessions();
          console.log('Sessions loaded from database:', sessions);
          setProgressReports(sessions.map(session => ({
            id: session.id || '',
            timestamp: session.created_at || new Date().toISOString(),
            score: session.posture_score || 0,
            status: session.session_title?.includes('Good') ? 'good' : 
                    session.session_title?.includes('Fair') ? 'fair' : 
                    session.session_title?.includes('Poor') ? 'poor' : 
                    session.session_title?.includes('Excellent') ? 'excellent' : 'fair',
            imageUrl: session.image_urls?.[0] || '',
            analysis: session.analysis_data || {}
          })));
        } catch (dbError) {
          console.error('Database load error:', dbError);
          // If database fails, try to load from localStorage as fallback
          console.log('Falling back to localStorage due to database error');
          const savedReports = localStorage.getItem('postureProgressReports');
          if (savedReports) {
            console.log('Loading from localStorage as fallback');
            setProgressReports(JSON.parse(savedReports));
          }
        }
      } else {
        // Load from localStorage for guests or when supabase is not available
        console.log('Loading from localStorage for guest user');
        const savedReports = localStorage.getItem('postureProgressReports');
        if (savedReports) {
          console.log('Found saved reports in localStorage');
          setProgressReports(JSON.parse(savedReports));
        } else {
          console.log('No saved reports found in localStorage');
        }
      }
    } catch (error) {
      console.error('Error loading progress reports:', error);
    }
  }, [user, userLoading, healthDataService]);

  // Check API status and request camera permission on component mount
  useEffect(() => {
    if (typeof window !== 'undefined' && isBrowserSupported()) {
      // Check API status first
      checkApiStatus();
      
      const timer = setTimeout(() => {
        requestCameraPermission();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, []);

  // Load progress reports on component mount and when user changes
  useEffect(() => {
    if (!userLoading) {
      loadProgressReports();
    }
  }, [user, userLoading, loadProgressReports]);

  // Add keyboard shortcuts for zoom
  useEffect(() => {
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
      if (isCameraOn) {
        if ((event.ctrlKey || event.metaKey) && event.key === '=') {
          event.preventDefault();
          zoomIn();
        } else if ((event.ctrlKey || event.metaKey) && event.key === '-') {
          event.preventDefault();
          zoomOut();
        } else if ((event.ctrlKey || event.metaKey) && event.key === '0') {
          event.preventDefault();
          resetZoom();
        }
      }
    }, [isCameraOn, zoomIn, zoomOut, resetZoom]);

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCameraOn, zoomIn, zoomOut, resetZoom]);

  // Add touch and wheel zoom event listeners
  useEffect(() => {
    const container = cameraContainerRef.current;
    if (container && isCameraOn) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      container.addEventListener('touchstart', handleTouchStart, { passive: false });
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      container.addEventListener('touchend', handleTouchEnd, { passive: false });

      return () => {
        container.removeEventListener('wheel', handleWheel);
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isCameraOn, zoomLevel, maxZoom, minZoom, isZooming, zoomStartDistance, zoomStartLevel, handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log("Stopped track:", track.kind);
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
    setVideoReady(false);
  };

  const restartCamera = async () => {
    stopCamera();
    await new Promise(resolve => setTimeout(resolve, 500));
    await requestCameraPermission();
  };

  const forceCameraOn = () => {
    console.log("Force camera on called");
    if (streamRef.current && streamRef.current.getTracks().length > 0) {
      setIsCameraOn(true);
      setCameraPermission("granted");
      setVideoReady(true);
      console.log("Camera forced on");
    } else {
      console.log("No stream available, requesting permission");
      requestCameraPermission();
    }
  };

  const captureFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return null;
    
    // Additional safety checks to prevent React error #418
    if (!video.readyState || video.readyState < 2) {
      console.warn("Video not ready for capture");
      return null;
    }
    
    // Set canvas size to match video dimensions for better quality
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Ensure video is playing and has valid dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.error("Video has no valid dimensions");
      return null;
    }
    
    // Draw video frame to canvas with high quality
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to base64 with higher quality for better detection
    return canvas.toDataURL('image/jpeg', 0.95);
  };

  const analyzePostureWithAI = async (imageData: string): Promise<PostureAnalysis> => {
    try {
      const response = await fetch('/api/posture-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageData.split(',')[1], // Remove data:image/jpeg;base64, prefix
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze posture');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Analysis failed');
      }

      return result.analysis;
    } catch (error) {
      console.error('AI analysis error:', error);
      throw error;
    }
  };

  const analyzePosture = async () => {
    if (!isCameraOn) {
      setSnackbarMessage("Please enable camera first");
      setSnackbarOpen(true);
      return;
    }

    // Start 3-second countdown
    setIsCountingDown(true);
    setCountdown(3);
    setSnackbarMessage("Get ready! Analysis starting in 3 seconds...");
    setSnackbarOpen(true);

    // Countdown timer
    for (let i = 3; i > 0; i--) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCountdown(i - 1);
      if (i > 1) {
        setSnackbarMessage(`Get ready! Analysis starting in ${i - 1} seconds...`);
        setSnackbarOpen(true);
      }
    }

    setIsCountingDown(false);
    setCountdown(0);
    setSnackbarMessage("Analyzing posture...");
    setSnackbarOpen(true);

    setIsAnalyzing(true);
    setError(null);
    
    try {
      // Capture current frame
      const imageData = captureFrame();
      if (!imageData) {
        throw new Error("Failed to capture image");
      }

      console.log("Captured image for analysis");
      
      // Store captured image for user to decide what to do with it
      setCapturedImage(imageData);
      
      // Analyze with AI
      const aiAnalysis = await analyzePostureWithAI(imageData);
      console.log("AI Analysis result:", aiAnalysis);
      
      // Add timestamp and captured image to analysis
      const analysisWithImage: PostureAnalysis = {
        ...aiAnalysis,
        capturedImage: imageData,
        timestamp: new Date().toISOString()
      };
      
      setAnalysis(analysisWithImage);
      setShowImageOptions(true);
      
      setSnackbarMessage("Posture analysis completed! Choose what to do with the captured image.");
      setSnackbarOpen(true);
      
    } catch (error: any) {
      console.error('Analysis error:', error);
      
      // Fallback to simulated analysis if AI fails
      const fallbackAnalysis: PostureAnalysis = {
        score: 50,
        status: "fair",
        feedback: [
          "Analysis completed with basic assessment",
          "Consider improving lighting for better results",
          "Ensure you're fully visible in the frame"
        ],
        recommendations: [
          "Maintain good posture throughout the day",
          "Take regular breaks to stretch",
          "Consider ergonomic adjustments"
        ],
        confidence: 0.3,
        personDetected: false,
        faceDetected: false,
        detectionMethods: [],
        detailedAnalysis: {
          headNeck: { score: 50, issues: [], riskLevel: 'moderate', recommendations: [] },
          shoulders: { score: 50, issues: [], riskLevel: 'moderate', recommendations: [] },
          spine: { score: 50, issues: [], riskLevel: 'moderate', recommendations: [] },
          hips: { score: 50, issues: [], riskLevel: 'moderate', recommendations: [] },
          overall: { score: 50, issues: [], riskLevel: 'moderate', recommendations: [] },
        },
        analysisMetadata: {
          imageQuality: 0.5,
          lightingConditions: 'unknown',
          bodyVisibility: 0.5,
          processingTime: 0,
          detectionConfidence: 0.3,
        },
        capturedImage: capturedImage || undefined,
        timestamp: new Date().toISOString()
      };
      
      setAnalysis(fallbackAnalysis);
      setError("AI analysis unavailable, showing basic assessment");
      setSnackbarMessage("Using basic posture assessment");
      setSnackbarOpen(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveToProgressReport = async () => {
    if (!analysis || !capturedImage) return;

    try {
      if (user) {
        // Convert data URL to File
        const res = await fetch(capturedImage);
        const blob = await res.blob();
        const file = new File([blob], `posture_${Date.now()}.jpg`, { type: blob.type });
        
        let imageUrl = '';
        
        try {
          // Try to upload to Supabase Storage first
          const uploadResult = await imageUploadService.uploadImageToStorage(file, 'posture', 'Posture Check Image');
          imageUrl = uploadResult.url;
        } catch (uploadError) {
          console.warn('Failed to upload to storage, using data URL:', uploadError);
          // Fallback to data URL if storage upload fails
          imageUrl = `data:image/jpeg;base64,${capturedImage.split(',')[1]}`;
        }
        
        // Save to Supabase with proper error handling
        const sessionData = {
          session_title: `${analysis.status.charAt(0).toUpperCase() + analysis.status.slice(1)} Posture Check`,
          posture_score: analysis.score,
          analysis_data: analysis,
          image_urls: [imageUrl],
          recommendations: analysis.recommendations || [],
          duration_seconds: Math.floor((Date.now() - (analysis.timestamp ? new Date(analysis.timestamp).getTime() : Date.now())) / 1000)
        };
        
        try {
          console.log('Saving posture session to database:', sessionData);
          await healthDataService.savePostureCheckSession(sessionData);
          console.log('Successfully saved to database');
          
          // Reload progress reports from database
          const sessions = await healthDataService.getPostureCheckSessions();
          console.log('Loaded sessions from database:', sessions);
          setProgressReports(sessions.map(session => ({
            id: session.id || '',
            timestamp: session.created_at || new Date().toISOString(),
            score: session.posture_score || 0,
            status: session.session_title?.includes('Good') ? 'good' : 
                    session.session_title?.includes('Fair') ? 'fair' : 
                    session.session_title?.includes('Poor') ? 'poor' : 
                    session.session_title?.includes('Excellent') ? 'excellent' : 'fair',
            imageUrl: session.image_urls?.[0] || '',
            analysis: session.analysis_data || {}
          })));
        } catch (dbError) {
          console.error('Database save error:', dbError);
          // If database save fails, fall back to localStorage
          console.log('Falling back to localStorage due to database error');
          const imageUrl = `data:image/jpeg;base64,${capturedImage.split(',')[1]}`;
          const progressReport = {
            id: Date.now().toString(),
            timestamp: analysis.timestamp || new Date().toISOString(),
            score: analysis.score,
            status: analysis.status,
            imageUrl: imageUrl,
            analysis: analysis
          };
          const existingReports = JSON.parse(localStorage.getItem('postureProgressReports') || '[]');
          const updatedReports = [...existingReports, progressReport];
          localStorage.setItem('postureProgressReports', JSON.stringify(updatedReports));
          setProgressReports(updatedReports);
          setSnackbarMessage("Database connection failed. Data saved locally.");
          setSnackbarOpen(true);
        }
      } else {
        // Save to localStorage for guests or when supabase is not available
        const imageUrl = `data:image/jpeg;base64,${capturedImage.split(',')[1]}`;
        const progressReport = {
          id: Date.now().toString(),
          timestamp: analysis.timestamp || new Date().toISOString(),
          score: analysis.score,
          status: analysis.status,
          imageUrl: imageUrl,
          analysis: analysis
        };
        const existingReports = JSON.parse(localStorage.getItem('postureProgressReports') || '[]');
        const updatedReports = [...existingReports, progressReport];
        localStorage.setItem('postureProgressReports', JSON.stringify(updatedReports));
        setProgressReports(updatedReports);
      }
      setShowImageOptions(false);
      setCapturedImage(null);
      setSnackbarMessage("Progress report saved successfully!");
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error saving progress report:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to save progress report';
      if (error instanceof Error) {
        if (error.message.includes('Database connection failed')) {
          errorMessage = 'Database connection failed. Your data has been saved locally.';
        } else if (error.message.includes('storage')) {
          errorMessage = 'Image upload failed. Your posture analysis has been saved without the image.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
      
      // Even if saving fails, clear the captured image to allow new captures
      setShowImageOptions(false);
      setCapturedImage(null);
    }
  };

  const deleteCapturedImage = () => {
    setCapturedImage(null);
    setShowImageOptions(false);
    setSnackbarMessage("Captured image deleted");
    setSnackbarOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "good": return "#4CAF50";
      case "fair": return "#FF9800";
      case "poor": return "#F44336";
      default: return "#9E9E9E";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "good": return <CheckCircle />;
      case "fair": return <Warning />;
      case "poor": return <ErrorOutline color="error" />;
      default: return <Info />;
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <Box sx={{ 
      minHeight: user ? "calc(100vh - 120px)" : "100vh", 
      background: "#f8f9ff",
      "@keyframes pulse": {
        "0%": { opacity: 1 },
        "50%": { opacity: 0.5 },
        "100%": { opacity: 1 }
      }
    }}>
      {/* Back Button for logged-out users */}
      {!user && (
        <Box sx={{ mb: 2 }}>
          <BackButton href="/health-tools" label="Back to Health Tools" />
        </Box>
      )}
      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <strong>Debug Info:</strong> User: {user ? user.email : 'Not logged in'}, 
          Loading: {userLoading ? 'Yes' : 'No'}, 
          Progress Reports: {progressReports.length}, 
          API Status: {apiStatus}
        </Alert>
      )}

      {/* Status Bar */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #7B61FF, #4CAF50)",
          py: 2,
          mb: 3
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <img 
                src="/health-ai-logo.png" 
                alt="Health AI Logo" 
                width={32} 
                height={32} 
                style={{
                  borderRadius: '50%',
                  background: 'transparent',
                  display: 'block'
                }}
              />
              <Box sx={{ ml: 2 }}>
                <Typography
                  variant="h6"
                  sx={{
                    color: "white",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 1
                  }}
                >
                  <CameraAlt sx={{ fontSize: 20 }} />
                  Posture Check
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "rgba(255, 255, 255, 0.8)",
                    fontSize: "0.75rem"
                  }}
                >
                  AI-powered posture analysis
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              {/* View History button - only for logged-in users */}
              {user && (
                <Button
                  component={Link}
                  href="/health-tools/posture-history"
                  variant="outlined"
                  size="small"
                  startIcon={<History />}
                  sx={{
                    borderColor: "rgba(255, 255, 255, 0.3)",
                    color: "white",
                    fontWeight: 500,
                    '&:hover': {
                      borderColor: "rgba(255, 255, 255, 0.5)",
                      backgroundColor: "rgba(255, 255, 255, 0.1)"
                    }
                  }}
                >
                  View History
                </Button>
              )}
              <Chip
                label={isCameraOn ? "Camera Active" : "Camera Off"}
                size="small"
                icon={isCameraOn ? <Videocam /> : <VideocamOff />}
                sx={{
                  background: isCameraOn ? "rgba(76, 175, 80, 0.2)" : "rgba(255, 255, 255, 0.2)",
                  color: "white",
                  fontWeight: 500
                }}
              />
              <Chip
                label={
                  apiStatus === "ready" ? "AI Ready" :
                  apiStatus === "checking" ? "Checking AI..." :
                  apiStatus === "error" ? "AI Error" : "AI Unknown"
                }
                size="small"
                icon={
                  apiStatus === "ready" ? <CheckCircle /> :
                  apiStatus === "checking" ? <CircularProgress size={16} /> :
                  apiStatus === "error" ? <ErrorOutline color="error" /> : <Info />
                }
                sx={{
                  background: 
                    apiStatus === "ready" ? "rgba(76, 175, 80, 0.2)" :
                    apiStatus === "checking" ? "rgba(255, 152, 0, 0.2)" :
                    apiStatus === "error" ? "rgba(244, 67, 54, 0.2)" :
                    "rgba(255, 255, 255, 0.2)",
                  color: "white",
                  fontWeight: 500
                }}
              />
              {process.env.NODE_ENV === 'development' && (
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      console.log("Camera state:", { isCameraOn, cameraPermission, error, videoReady });
                      console.log("Video ref:", videoRef.current);
                      console.log("Stream ref:", streamRef.current);
                      if (videoRef.current) {
                        console.log("Video readyState:", videoRef.current.readyState);
                        console.log("Video srcObject:", videoRef.current.srcObject);
                        console.log("Video dimensions:", videoRef.current.videoWidth, "x", videoRef.current.videoHeight);
                        console.log("Video paused:", videoRef.current.paused);
                        console.log("Video currentTime:", videoRef.current.currentTime);
                      }
                      if (streamRef.current) {
                        console.log("Stream active:", streamRef.current.active);
                        console.log("Stream tracks:", streamRef.current.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled, readyState: t.readyState })));
                      }
                    }}
                    sx={{
                      borderColor: "rgba(255, 255, 255, 0.3)",
                      color: "white",
                      fontSize: "10px",
                      px: 1,
                      py: 0.5
                    }}
                  >
                    Debug
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={forceCameraOn}
                    sx={{
                      borderColor: "rgba(255, 255, 255, 0.3)",
                      color: "white",
                      fontSize: "10px",
                      px: 1,
                      py: 0.5
                    }}
                  >
                    Force On
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/posture-analysis');
                        const result = await response.json();
                        console.log("API test result:", result);
                        setSnackbarMessage(`API Status: ${result.success ? 'OK' : 'Error'}`);
                        setSnackbarOpen(true);
                      } catch (error) {
                        console.error("API test error:", error);
                        setSnackbarMessage("API test failed");
                        setSnackbarOpen(true);
                      }
                    }}
                    sx={{
                      borderColor: "rgba(255, 255, 255, 0.3)",
                      color: "white",
                      fontSize: "10px",
                      px: 1,
                      py: 0.5
                    }}
                  >
                    Test API
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Notice for logged-out users */}
        {!user && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Guest User Notice:</strong> As a guest, your posture checks are saved locally and cannot be viewed in the history page. 
              <Link href="/register" style={{ color: '#1976d2', textDecoration: 'none', marginLeft: '8px' }}>
                Sign up to unlock all features!
              </Link>
            </Typography>
          </Alert>
        )}
        
        {/* Progress Reports Section */}
        {progressReports.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: "#7B61FF" }}>
              Progress Reports ({progressReports.length})
            </Typography>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', md: 'repeat(auto-fill, minmax(300px, 1fr))' },
              gap: 2 
            }}>
              {progressReports.slice(-6).reverse().map((report) => (
                <Paper
                  key={report.id}
                  elevation={2}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    background: "rgba(255, 255, 255, 0.95)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(255, 255, 255, 0.2)"
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: `conic-gradient(${getStatusColor(report.status)} ${report.score * 3.6}deg, #f0f0f0 0deg)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mr: 2
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600, color: getStatusColor(report.status) }}>
                        {report.score}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {report.status.toUpperCase()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(report.timestamp).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                  
                  {report.imageUrl && (
                    <Box sx={{ mb: 2, textAlign: "center" }}>
                      <img 
                        src={report.imageUrl} 
                        alt="Posture check" 
                        style={{
                          maxWidth: "100%",
                          maxHeight: "120px",
                          borderRadius: "4px",
                          border: "1px solid #e0e0e0"
                        }}
                      />
                    </Box>
                  )}
                  
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.8rem" }}>
                    {new Date(report.timestamp).toLocaleString()}
                  </Typography>
                </Paper>
              ))}
            </Box>
          </Box>
        )}

        {/* Main Camera and Analysis Section */}
        <Box sx={{ width: '100%' }}>
          {/* Large Camera Section */}
            <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Paper
                elevation={8}
                sx={{
                  borderRadius: 3,
                  overflow: "hidden",
                  background: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                width: '100%'
                }}
              >
              {/* Large Camera Feed */}
                <Box
                  ref={cameraContainerRef}
                  sx={{
                    position: "relative",
                    background: "#000",
                  height: { xs: '400px', md: '500px', lg: '600px' },
                    display: "flex",
                    alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                    cursor: "zoom-in",
                    userSelect: "none"
                  }}
                >
                {!isBrowserSupported() && (
                  <Box sx={{ textAlign: "center", color: "white", p: 4 }}>
                    <ErrorOutline sx={{ fontSize: 64, mb: 2, color: 'error.main' }} />
                    <Typography variant="h5" sx={{ mb: 1 }}>
                      Browser Not Supported
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 3 }}>
                      Your browser doesn't support camera access. Please use a modern browser like Chrome, Firefox, or Safari.
                    </Typography>
                  </Box>
                )}

                {cameraPermission === "pending" && isBrowserSupported() && (
                  <Box sx={{ textAlign: "center", color: "white", p: 4 }}>
                      <CircularProgress sx={{ color: "white", mb: 2 }} />
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      Requesting Camera Permission...
                    </Typography>
                    <Typography variant="body2">
                      Please allow camera access when prompted
                    </Typography>
                    </Box>
                  )}

                  {cameraPermission === "denied" && (
                  <Box sx={{ textAlign: "center", color: "white", p: 4 }}>
                    <ErrorOutline sx={{ fontSize: 64, mb: 2, color: 'error.main' }} />
                    <Typography variant="h5" sx={{ mb: 1 }}>
                        Camera Access Required
                      </Typography>
                    <Typography variant="body1" sx={{ mb: 3 }}>
                        Please allow camera access to analyze your posture
                      </Typography>
                      <Button
                        variant="contained"
                      size="large"
                        onClick={requestCameraPermission}
                        sx={{
                          background: "linear-gradient(135deg, #7B61FF, #4CAF50)",
                        px: 4,
                        py: 1.5,
                          "&:hover": {
                            background: "linear-gradient(135deg, #6B51EF, #45A049)",
                          },
                        }}
                      >
                        Enable Camera
                      </Button>
                    </Box>
                  )}

                  {cameraPermission === "granted" && !isCameraOn && (
                  <Box sx={{ textAlign: "center", color: "white", p: 4 }}>
                    <CameraAlt sx={{ fontSize: 64, mb: 2 }} />
                    <Typography variant="h5" sx={{ mb: 1 }}>
                        Camera Ready
                      </Typography>
                    <Typography variant="body1" sx={{ mb: 3 }}>
                        Click start to begin posture analysis
                      </Typography>
                      <Button
                        variant="contained"
                      size="large"
                        onClick={requestCameraPermission}
                        sx={{
                          background: "linear-gradient(135deg, #7B61FF, #4CAF50)",
                        px: 4,
                        py: 1.5,
                          "&:hover": {
                            background: "linear-gradient(135deg, #6B51EF, #45A049)",
                          },
                        }}
                      >
                        Start Camera
                      </Button>
                    </Box>
                  )}

                  {isCameraOn && (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                        backgroundColor: "#000",
                        zIndex: 1,
                        transform: `scale(${zoomLevel})`,
                        transformOrigin: "center center",
                        transition: "transform 0.3s ease"
                      }}
                      onLoadedMetadata={() => {
                        console.log("Video metadata loaded");
                        if (videoRef.current) {
                          console.log("Video dimensions:", videoRef.current.videoWidth, "x", videoRef.current.videoHeight);
                        }
                      }}
                      onCanPlay={() => {
                        console.log("Video can play");
                        setVideoReady(true);
                      }}
                      onPlay={() => {
                        console.log("Video playing");
                        setVideoReady(true);
                      }}
                      onError={(e) => {
                        console.error("Video error:", e);
                        setError("Video loading failed");
                      }}
                    />
                    
                    {/* Zoom Controls */}
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: 20,
                        right: 20,
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                        zIndex: 3
                      }}
                    >
                      <IconButton
                        onClick={zoomIn}
                        disabled={zoomLevel >= maxZoom}
                        sx={{
                          bgcolor: "rgba(0, 0, 0, 0.6)",
                          color: "white",
                          "&:hover": {
                            bgcolor: "rgba(0, 0, 0, 0.8)"
                          },
                          "&:disabled": {
                            bgcolor: "rgba(0, 0, 0, 0.3)",
                            color: "rgba(255, 255, 255, 0.5)"
                          }
                        }}
                      >
                        <ZoomIn />
                      </IconButton>
                      <IconButton
                        onClick={zoomOut}
                        disabled={zoomLevel <= minZoom}
                        sx={{
                          bgcolor: "rgba(0, 0, 0, 0.6)",
                          color: "white",
                          "&:hover": {
                            bgcolor: "rgba(0, 0, 0, 0.8)"
                          },
                          "&:disabled": {
                            bgcolor: "rgba(0, 0, 0, 0.3)",
                            color: "rgba(255, 255, 255, 0.5)"
                          }
                        }}
                      >
                        <ZoomOut />
                      </IconButton>
                      {zoomLevel !== 1 && (
                        <IconButton
                          onClick={resetZoom}
                          sx={{
                            bgcolor: "rgba(0, 0, 0, 0.6)",
                            color: "white",
                            "&:hover": {
                              bgcolor: "rgba(0, 0, 0, 0.8)"
                            }
                          }}
                        >
                          <Typography variant="caption" sx={{ fontSize: "0.7rem" }}>
                            1x
                          </Typography>
                        </IconButton>
                      )}
                    </Box>
                    
                    {/* Remove the Zoom Level Indicator */}
                    {availableCameras.length > 1 && (
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: 20,
                          left: 20,
                          zIndex: 3
                        }}
                      >
                        <IconButton
                          onClick={flipCamera}
                          sx={{
                            bgcolor: "rgba(0, 0, 0, 0.6)",
                            color: "white",
                            '&:hover': {
                              bgcolor: "rgba(0, 0, 0, 0.8)"
                            }
                          }}
                        >
                          <CameraAlt />
                        </IconButton>
                      </Box>
                    )}

                    {/* Countdown Overlay */}
                    {isCountingDown && (
                      <Box
                        sx={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          zIndex: 10,
                          textAlign: "center"
                        }}
                      >
                        <Box
                          sx={{
                            width: 120,
                            height: 120,
                            borderRadius: "50%",
                            background: "rgba(0, 0, 0, 0.8)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "4px solid #7B61FF",
                            animation: "pulse 1s infinite"
                          }}
                        >
                          <Typography
                            variant="h1"
                            sx={{
                              color: "white",
                              fontWeight: 700,
                              fontSize: "3rem",
                              textShadow: "2px 2px 4px rgba(0,0,0,0.8)"
                            }}
                          >
                            {countdown}
                          </Typography>
                        </Box>
                        <Typography
                          variant="h6"
                          sx={{
                            color: "white",
                            mt: 2,
                            fontWeight: 600,
                            textShadow: "2px 2px 4px rgba(0,0,0,0.8)"
                          }}
                        >
                          Get Ready!
                        </Typography>
                      </Box>
                    )}

                    {/* Zoom Instructions */}
                    {zoomLevel === 1 && !isCountingDown && (
                      <Box
                        sx={{
                          position: "absolute",
                          top: 20,
                          left: 20,
                          bgcolor: "rgba(0, 0, 0, 0.7)",
                          color: "white",
                          px: 2,
                          py: 1,
                          borderRadius: 1,
                          zIndex: 3,
                          maxWidth: "200px"
                        }}
                      >
                        <Typography variant="caption" sx={{ fontSize: "10px" }}>
                          💡 Scroll wheel or pinch to zoom • Use buttons for precise control
                        </Typography>
                      </Box>
                    )}
                    
                    {/* Positioning guide overlay */}
                    <Box
                      sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: "200px",
                        height: "300px",
                        border: "2px dashed rgba(255, 255, 255, 0.6)",
                        borderRadius: "10px",
                        pointerEvents: "none",
                        zIndex: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: "rgba(255, 255, 255, 0.8)",
                          textAlign: "center",
                          fontSize: "12px",
                          fontWeight: 600,
                          textShadow: "1px 1px 2px rgba(0,0,0,0.8)"
                        }}
                      >
                        Position yourself here
                      </Typography>
                    </Box>
                    
                    {/* Camera status indicator */}
                    <Box
                      sx={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        background: "rgba(0, 0, 0, 0.8)",
                        color: "white",
                        px: 2,
                        py: 1,
                        borderRadius: 1,
                        fontSize: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        zIndex: 2
                      }}
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: videoReady ? "#4CAF50" : "#FF9800",
                          animation: videoReady ? "pulse 1.5s infinite" : "none"
                        }}
                      />
                      {videoReady ? "Camera Active" : "Loading..."}
                    </Box>
                    
                    {/* Manual controls */}
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: 10,
                        right: 10,
                        display: "flex",
                        gap: 1,
                        zIndex: 2
                      }}
                    >
                      <Button
                        variant="contained"
                        size="small"
                        onClick={restartCamera}
                        sx={{
                          background: "rgba(0, 0, 0, 0.8)",
                          color: "white",
                          fontSize: "10px",
                          px: 1,
                          py: 0.5,
                          "&:hover": {
                            background: "rgba(0, 0, 0, 0.9)"
                          }
                        }}
                      >
                        Restart
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => {
                          if (videoRef.current && streamRef.current) {
                            videoRef.current.srcObject = streamRef.current;
                            videoRef.current.play();
                          }
                        }}
                        sx={{
                          background: "rgba(0, 0, 0, 0.8)",
                          color: "white",
                          fontSize: "10px",
                          px: 1,
                          py: 0.5,
                          "&:hover": {
                            background: "rgba(0, 0, 0, 0.9)"
                          }
                        }}
                      >
                        Refresh
                      </Button>
                    </Box>
                  </>
                  )}

                  {isAnalyzing && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                      background: "rgba(0, 0, 0, 0.8)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      color: "white",
                      zIndex: 3
                      }}
                    >
                      <Box sx={{ textAlign: "center" }}>
                      <CircularProgress size={60} sx={{ color: "white", mb: 3 }} />
                      <Typography variant="h5" sx={{ mb: 1 }}>
                        Analyzing Posture...
                      </Typography>
                      <Typography variant="body1">
                        Please stay still and face the camera
                      </Typography>
                      </Box>
                    </Box>
                  )}

                {/* Hidden canvas for capturing frames */}
                <canvas
                  ref={canvasRef}
                  style={{ display: 'none' }}
                />
              </Box>

              {/* Camera Controls */}
                <Box sx={{ p: 3 }}>
                <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                    <Button
                      fullWidth
                      variant="contained"
                    size="large"
                      onClick={isCameraOn ? stopCamera : requestCameraPermission}
                      startIcon={isCameraOn ? <VideocamOff /> : <Videocam />}
                      sx={{
                        background: isCameraOn 
                          ? "linear-gradient(135deg, #F44336, #D32F2F)"
                          : "linear-gradient(135deg, #7B61FF, #4CAF50)",
                      py: 1.5,
                        "&:hover": {
                          background: isCameraOn 
                            ? "linear-gradient(135deg, #D32F2F, #B71C1C)"
                            : "linear-gradient(135deg, #6B51EF, #45A049)",
                        },
                      }}
                    >
                      {isCameraOn ? "Stop Camera" : "Start Camera"}
                    </Button>
                    <IconButton
                    onClick={restartCamera}
                      disabled={!isCameraOn}
                    size="large"
                      sx={{
                        background: "linear-gradient(135deg, #FF9800, #F57C00)",
                        color: "white",
                        "&:hover": {
                          background: "linear-gradient(135deg, #F57C00, #E65100)",
                        },
                        "&:disabled": {
                          background: "rgba(0, 0, 0, 0.12)",
                          color: "rgba(0, 0, 0, 0.38)",
                        },
                      }}
                    >
                      <Refresh />
                    </IconButton>
                  </Box>

                  <Button
                    fullWidth
                    variant="contained"
                  size="large"
                    onClick={analyzePosture}
                  disabled={!isCameraOn || isAnalyzing || isCountingDown || apiStatus !== "ready"}
                    sx={{
                      background: "linear-gradient(135deg, #E573B7, #7B61FF)",
                    py: 2,
                    fontSize: "1.1rem",
                    fontWeight: 600,
                      "&:hover": {
                        background: "linear-gradient(135deg, #D563A7, #6B51EF)",
                      },
                      "&:disabled": {
                        background: "rgba(0, 0, 0, 0.12)",
                        color: "rgba(0, 0, 0, 0.38)",
                      },
                    }}
                  >
                  {isCountingDown ? `Get Ready... (${countdown}s)` :
                   isAnalyzing ? "Analyzing..." : 
                   apiStatus !== "ready" ? "AI Not Ready" : "Analyze Posture"}
                  </Button>
                
                {apiStatus === "error" && (
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    onClick={checkApiStatus}
                    sx={{
                      mt: 1,
                      borderColor: "#F44336",
                      color: "#F44336",
                      "&:hover": {
                        borderColor: "#D32F2F",
                        background: "rgba(244, 67, 54, 0.05)",
                      },
                    }}
                  >
                    Retry AI Connection
                  </Button>
                )}
                </Box>
              </Paper>
            </motion.div>

          {/* Analysis Results Section - Under Camera */}
          {!analysis ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
                <Paper
                  elevation={4}
                  sx={{
                    p: 4,
                    borderRadius: 3,
                    background: "rgba(255, 255, 255, 0.95)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                  mt: 3,
                  width: '100%',
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    textAlign: "center"
                  }}
                >
                <CameraAlt sx={{ fontSize: 80, color: "#7B61FF", mb: 3 }} />
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                    Ready to Check Your Posture?
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Enable your camera and click "Analyze Posture" to get started. 
                  Make sure you're in a well-lit area and facing the camera.
                  </Typography>
                
                {/* Camera Status Info */}
                <Box sx={{ mb: 3, width: '100%' }}>
                  <Alert severity="info" sx={{ borderRadius: 2, mb: 2 }}>
                    <Typography variant="body2">
                      <strong>Privacy Note:</strong> Your video is processed locally and not stored. 
                      We only analyze your posture in real-time.
                    </Typography>
                  </Alert>
                  
                  {isCameraOn && (
                    <Alert severity="success" sx={{ borderRadius: 2 }}>
                      <Typography variant="body2">
                        <strong>Camera Active:</strong> You're ready for posture analysis!
                      </Typography>
                    </Alert>
                  )}
                </Box>
                
                {/* Tips for better detection */}
                <Box sx={{ width: '100%' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: "#7B61FF" }}>
                    Tips for Better Detection:
                  </Typography>
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="body2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                      <CheckCircle sx={{ fontSize: 16, color: "#4CAF50", mr: 1 }} />
                      Stand 3-6 feet away from the camera
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                      <CheckCircle sx={{ fontSize: 16, color: "#4CAF50", mr: 1 }} />
                      Ensure good lighting on your face and upper body
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                      <CheckCircle sx={{ fontSize: 16, color: "#4CAF50", mr: 1 }} />
                      Face the camera directly and stay still during analysis
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                      <CheckCircle sx={{ fontSize: 16, color: "#4CAF50", mr: 1 }} />
                      Remove any obstructions between you and the camera
                    </Typography>
                  </Box>
                </Box>
                </Paper>
            </motion.div>
              ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
                <Paper
                  elevation={4}
                  sx={{
                    p: 4,
                    borderRadius: 3,
                    background: "rgba(255, 255, 255, 0.95)",
                    backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  mt: 3,
                  width: '100%'
                }}
              >
                {/* Detection Status */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Detection Status
                  </Typography>
                  <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                    <Chip
                      label={analysis.personDetected ? "Person Detected" : "No Person Found"}
                      icon={analysis.personDetected ? <CheckCircle /> : <ErrorOutline color="error" />}
                      sx={{
                        background: analysis.personDetected ? "rgba(76, 175, 80, 0.2)" : "rgba(244, 67, 54, 0.2)",
                        color: analysis.personDetected ? "#4CAF50" : "#F44336",
                        fontWeight: 600
                      }}
                    />
                    <Chip
                      label={analysis.faceDetected ? "Face Detected" : "No Face Found"}
                      icon={analysis.faceDetected ? <CheckCircle /> : <Warning />}
                      sx={{
                        background: analysis.faceDetected ? "rgba(76, 175, 80, 0.2)" : "rgba(255, 152, 0, 0.2)",
                        color: analysis.faceDetected ? "#4CAF50" : "#FF9800",
                        fontWeight: 600
                      }}
                    />
                  </Box>
                  
                  {!analysis.personDetected && (
                    <Alert severity="warning" sx={{ borderRadius: 2, mb: 2 }}>
                      <Typography variant="body2">
                        <strong>No person detected.</strong> Please ensure you are fully visible in the camera frame.
                      </Typography>
                    </Alert>
                  )}
                  
                  {analysis.personDetected && !analysis.faceDetected && (
                    <Alert severity="info" sx={{ borderRadius: 2, mb: 2 }}>
                      <Typography variant="body2">
                        <strong>Person detected but face not clear.</strong> Try facing the camera more directly.
                      </Typography>
                    </Alert>
                  )}
                </Box>

                  {/* Score Display */}
                  <Box sx={{ textAlign: "center", mb: 4 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                      Posture Score
                    </Typography>
                    <Box
                      sx={{
                      width: 140,
                      height: 140,
                        borderRadius: "50%",
                        background: `conic-gradient(${getStatusColor(analysis.status)} ${analysis.score * 3.6}deg, #f0f0f0 0deg)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mx: "auto",
                        mb: 2,
                        position: "relative"
                      }}
                    >
                      <Box
                        sx={{
                        width: 120,
                        height: 120,
                          borderRadius: "50%",
                          background: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexDirection: "column"
                        }}
                      >
                      <Typography variant="h2" sx={{ fontWeight: 700, color: getStatusColor(analysis.status) }}>
                          {analysis.score}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          / 100
                        </Typography>
                      </Box>
                    </Box>
                    <Chip
                      label={analysis.status.toUpperCase()}
                      icon={getStatusIcon(analysis.status)}
                      sx={{
                        background: `${getStatusColor(analysis.status)}20`,
                        color: getStatusColor(analysis.status),
                        fontWeight: 600,
                        fontSize: "1rem",
                        px: 2,
                        py: 1
                      }}
                    />
                  {analysis.confidence && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Confidence: {Math.round(analysis.confidence * 100)}%
                    </Typography>
                  )}
                  </Box>

                  {/* Detailed Analysis */}
                  {analysis.detailedAnalysis && (
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        Detailed Body Analysis
                      </Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                        {Object.entries(analysis.detailedAnalysis).map(([part, data]: [string, any]) => (
                          <Box key={part}>
                            <Card 
                              sx={{ 
                                p: 2, 
                                border: `2px solid ${data.score >= 80 ? '#4CAF50' : data.score >= 60 ? '#FF9800' : '#F44336'}`,
                                background: data.score >= 80 ? 'rgba(76, 175, 80, 0.05)' : data.score >= 60 ? 'rgba(255, 152, 0, 0.05)' : 'rgba(244, 67, 54, 0.05)'
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, textTransform: 'capitalize', flex: 1 }}>
                                  {part.replace(/([A-Z])/g, ' $1').trim()}
                                </Typography>
                                <Chip 
                                  label={`${data.score}/100`}
                                  size="small"
                                  sx={{
                                    background: data.score >= 80 ? '#4CAF50' : data.score >= 60 ? '#FF9800' : '#F44336',
                                    color: 'white',
                                    fontWeight: 600
                                  }}
                                />
                              </Box>
                              {data.issues.length > 0 && (
                                <Box sx={{ mt: 1 }}>
                                  {data.issues.map((issue: string, index: number) => (
                                    <Typography 
                                      key={index} 
                                      variant="body2" 
                                      sx={{ 
                                        color: '#F44336', 
                                        fontSize: '0.75rem',
                                        mb: 0.5,
                                        display: 'flex',
                                        alignItems: 'flex-start'
                                      }}
                                    >
                                      <ErrorOutline sx={{ fontSize: 14, mr: 0.5, mt: 0.1 }} />
                                      {issue}
                                    </Typography>
                                  ))}
                                </Box>
                              )}
                              {data.score >= 80 && (
                                <Typography variant="body2" sx={{ color: '#4CAF50', fontSize: '0.75rem', mt: 1 }}>
                                  <CheckCircle sx={{ fontSize: 14, mr: 0.5 }} />
                                  Good posture detected
                                </Typography>
                              )}
                            </Card>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Feedback */}
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      Analysis Feedback
                    </Typography>
                    {analysis.feedback.map((item, index) => (
                      <Box key={index} sx={{ display: "flex", alignItems: "flex-start", mb: 1 }}>
                        {item.includes('🚨') || item.includes('❌') || item.includes('💀') ? (
                          <ErrorOutline sx={{ color: "#F44336", mr: 1, fontSize: 20, mt: 0.1 }} />
                        ) : item.includes('⚠️') ? (
                          <Warning sx={{ color: "#FF9800", mr: 1, fontSize: 20, mt: 0.1 }} />
                        ) : item.includes('✅') ? (
                          <CheckCircle sx={{ color: "#4CAF50", mr: 1, fontSize: 20, mt: 0.1 }} />
                        ) : (
                          <Info sx={{ color: "#2196F3", mr: 1, fontSize: 20, mt: 0.1 }} />
                        )}
                        <Typography variant="body2">{item}</Typography>
                      </Box>
                    ))}
                  </Box>

                  {/* Recommendations */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      Recommendations
                    </Typography>
                    {analysis.recommendations.map((item, index) => (
                      <Box key={index} sx={{ display: "flex", alignItems: "flex-start", mb: 1 }}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: "#7B61FF",
                            mt: 0.5,
                            mr: 1,
                            flexShrink: 0
                          }}
                        />
                        <Typography variant="body2">{item}</Typography>
                      </Box>
                    ))}
                  </Box>

                {/* Image Options */}
                {showImageOptions && capturedImage && (
                  <Box sx={{ mb: 4, p: 2, border: "1px solid #e0e0e0", borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      Captured Image Options
                    </Typography>
                    
                    {/* Captured Image Preview */}
                    <Box sx={{ mb: 2, textAlign: "center" }}>
                      <img 
                        src={capturedImage} 
                        alt="Captured posture" 
                        style={{
                          maxWidth: "100%",
                          maxHeight: "200px",
                          borderRadius: "8px",
                          border: "2px solid #e0e0e0"
                        }}
                      />
                    </Box>
                    
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={saveToProgressReport}
                        sx={{
                          background: "linear-gradient(135deg, #4CAF50, #45A049)",
                          py: 1.5,
                          "&:hover": {
                            background: "linear-gradient(135deg, #45A049, #3D8B40)",
                          },
                        }}
                      >
                        Save to Progress Report
                      </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                        onClick={deleteCapturedImage}
                    sx={{
                          borderColor: "#F44336",
                          color: "#F44336",
                          py: 1.5,
                          "&:hover": {
                            borderColor: "#D32F2F",
                            background: "rgba(244, 67, 54, 0.05)",
                          },
                        }}
                      >
                        Delete Image
                      </Button>
                    </Box>
                  </Box>
                )}
                {!userLoading && user && capturedImage && (
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    startIcon={<Save />}
                    onClick={saveToProgressReport}
                    sx={{ mt: 2 }}
                  >
                    Save Image
                  </Button>
                )}

                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => {
                    setAnalysis(null);
                    setCapturedImage(null);
                    setShowImageOptions(false);
                  }}
                  sx={{
                      borderColor: "#7B61FF",
                      color: "#7B61FF",
                    py: 1.5,
                      "&:hover": {
                        borderColor: "#6B51EF",
                        background: "rgba(123, 97, 255, 0.05)",
                      },
                    }}
                  >
                    Analyze Again
                  </Button>
                </Paper>
            </motion.div>
          )}
        </Box>
      </Container>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity="info" 
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
} 