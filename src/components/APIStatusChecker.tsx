"use client";

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Warning,
  Refresh,
  ExpandMore,
  ExpandLess,
  Api,
  Psychology,
  FitnessCenter
} from '@mui/icons-material';
import aiService from '@/utils/aiService';

interface APIStatus {
  gemini: boolean;
  cloudVision: boolean;
  overall: boolean;
  errors: string[];
}

export default function APIStatusChecker() {
  const [status, setStatus] = useState<APIStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const checkAPIStatus = async () => {
    setLoading(true);
    try {
      const result = await aiService.healthCheck();
      setStatus(result);
    } catch (error) {
      console.error('API status check failed:', error);
      setStatus({
        gemini: false,
        cloudVision: false,
        overall: false,
        errors: ['Failed to check API status']
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAPIStatus();
  }, []);

  const getStatusIcon = (isWorking: boolean) => {
    return isWorking ? (
      <CheckCircle sx={{ color: 'success.main' }} />
    ) : (
      <Error sx={{ color: 'error.main' }} />
    );
  };

  const getStatusChip = (isWorking: boolean, label: string) => {
    return (
      <Chip
        icon={getStatusIcon(isWorking)}
        label={isWorking ? 'Connected' : 'Not Connected'}
        color={isWorking ? 'success' : 'error'}
        variant="outlined"
        size="small"
      />
    );
  };

  if (!status) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} sx={{ mr: 1 }} />
            <Typography>Checking API status...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Api sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">API Status</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              size="small"
              startIcon={<Refresh />}
              onClick={checkAPIStatus}
              disabled={loading}
            >
              {loading ? 'Checking...' : 'Refresh'}
            </Button>
            <Button
              size="small"
              onClick={() => setExpanded(!expanded)}
              endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
            >
              {expanded ? 'Hide' : 'Details'}
            </Button>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Psychology sx={{ color: 'primary.main' }} />
            <Typography variant="body2">Gemini (AI Chat & Research)</Typography>
            {getStatusChip(status.gemini, 'Gemini')}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FitnessCenter sx={{ color: 'primary.main' }} />
            <Typography variant="body2">Cloud Vision (Image Analysis)</Typography>
            {getStatusChip(status.cloudVision, 'Cloud Vision')}
          </Box>
        </Box>

        {!status.overall && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>API Key Issue Detected:</strong> The Gemini API key appears to be invalid or expired.
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              To fix this:
            </Typography>
            <Typography variant="body2" component="div" sx={{ pl: 2 }}>
              1. Visit <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener" style={{ color: 'inherit', textDecoration: 'underline' }}>Google AI Studio</a><br/>
              2. Create a new API key<br/>
              3. Update your .env.local file with the new key<br/>
              4. Restart the development server
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
              AI features are currently running in demo mode with sample responses.
            </Typography>
          </Alert>
        )}

        <Collapse in={expanded}>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Configuration Required:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <Psychology />
                </ListItemIcon>
                <ListItemText
                  primary="Gemini API Key"
                  secondary="Set NEXT_PUBLIC_GEMINI_API_KEY in your environment variables for AI chat and nutrition planning"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <FitnessCenter />
                </ListItemIcon>
                <ListItemText
                  primary="Cloud Vision API Key"
                  secondary="Already configured for fitness image analysis"
                />
              </ListItem>
            </List>

            {status.errors.length > 0 && (
              <Alert severity="error" sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Errors:
                </Typography>
                <List dense>
                  {status.errors.map((error, index) => (
                    <ListItem key={index} sx={{ py: 0 }}>
                      <ListItemIcon>
                        <Error sx={{ color: 'error.main', fontSize: 16 }} />
                      </ListItemIcon>
                      <ListItemText primary={error} />
                    </ListItem>
                  ))}
                </List>
              </Alert>
            )}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
} 