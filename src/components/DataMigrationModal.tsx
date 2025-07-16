"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Warning,
  Psychology,
  FitnessCenter,
  Straighten,
  Bookmark,
  TrendingUp
} from '@mui/icons-material';
import healthDataService, { getBrowserData, clearBrowserData } from '@/utils/healthDataService';

interface DataMigrationModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface MigrationStatus {
  status: 'idle' | 'checking' | 'migrating' | 'completed' | 'failed';
  browserData: any;
  migrationRecord: any;
  progress: number;
  error?: string;
  migratedCount: number;
}

export default function DataMigrationModal({ open, onClose, onComplete }: DataMigrationModalProps) {
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus>({
    status: 'idle',
    browserData: null,
    migrationRecord: null,
    progress: 0,
    migratedCount: 0
  });

  useEffect(() => {
    if (open) {
      checkForBrowserData();
    }
  }, [open]);

  const checkForBrowserData = async () => {
    setMigrationStatus(prev => ({ ...prev, status: 'checking' }));
    
    try {
      // Check if user has already migrated data
      const migrationRecord = await healthDataService.checkBrowserDataMigration();
      
      // Get browser data
      const browserData = getBrowserData();
      
      if (migrationRecord?.migration_status === 'completed') {
        setMigrationStatus(prev => ({
          ...prev,
          status: 'completed',
          migrationRecord,
          browserData
        }));
        return;
      }

      if (!browserData || (
        (!browserData.therapistChat || browserData.therapistChat.length === 0) &&
        (!browserData.postureCheck || browserData.postureCheck.length === 0) &&
        (!browserData.fitnessPlanner || browserData.fitnessPlanner.length === 0) &&
        (!browserData.savedRoutines || browserData.savedRoutines.length === 0) &&
        (!browserData.healthProgress || browserData.healthProgress.length === 0)
      )) {
        setMigrationStatus(prev => ({
          ...prev,
          status: 'completed',
          browserData: null,
          migrationRecord
        }));
        return;
      }

      setMigrationStatus(prev => ({
        ...prev,
        status: 'idle',
        browserData,
        migrationRecord
      }));

    } catch (error) {
      console.error('Error checking browser data:', error);
      setMigrationStatus(prev => ({
        ...prev,
        status: 'failed',
        error: 'Failed to check for browser data'
      }));
    }
  };

  const startMigration = async () => {
    if (!migrationStatus.browserData) return;

    setMigrationStatus(prev => ({ ...prev, status: 'migrating', progress: 0 }));

    try {
      const result = await healthDataService.migrateBrowserData(migrationStatus.browserData);
      
      setMigrationStatus(prev => ({
        ...prev,
        status: 'completed',
        progress: 100,
        migratedCount: result.migratedCount
      }));

      // Clear browser data after successful migration
      clearBrowserData();

    } catch (error) {
      console.error('Error migrating data:', error);
      setMigrationStatus(prev => ({
        ...prev,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Migration failed'
      }));
    }
  };

  const skipMigration = () => {
    setMigrationStatus(prev => ({ ...prev, status: 'completed' }));
  };

  const handleClose = () => {
    if (migrationStatus.status === 'migrating') return; // Prevent closing during migration
    onClose();
  };

  const handleComplete = () => {
    onComplete();
    onClose();
  };

  const getDataSummary = () => {
    const { browserData } = migrationStatus;
    if (!browserData) return [];

    const summary = [];
    
    if (browserData.therapistChat?.length > 0) {
      summary.push({
        type: 'Therapist Chat',
        count: browserData.therapistChat.length,
        icon: <Psychology />,
        color: '#E573B7'
      });
    }
    
    if (browserData.postureCheck?.length > 0) {
      summary.push({
        type: 'Posture Checks',
        count: browserData.postureCheck.length,
        icon: <Straighten />,
        color: '#7B61FF'
      });
    }
    
    if (browserData.fitnessPlanner?.length > 0) {
      summary.push({
        type: 'Fitness Plans',
        count: browserData.fitnessPlanner.length,
        icon: <FitnessCenter />,
        color: '#FFD166'
      });
    }
    
    if (browserData.savedRoutines?.length > 0) {
      summary.push({
        type: 'Saved Routines',
        count: browserData.savedRoutines.length,
        icon: <Bookmark />,
        color: '#06D6A0'
      });
    }
    
    if (browserData.healthProgress?.length > 0) {
      summary.push({
        type: 'Progress Records',
        count: browserData.healthProgress.length,
        icon: <TrendingUp />,
        color: '#4CAF50'
      });
    }

    return summary;
  };

  const renderContent = () => {
    switch (migrationStatus.status) {
      case 'checking':
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Checking for existing data...
            </Typography>
            <LinearProgress />
          </Box>
        );

      case 'migrating':
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Migrating your data to your account...
            </Typography>
            <LinearProgress variant="determinate" value={migrationStatus.progress} />
            <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
              {migrationStatus.progress}% complete
            </Typography>
          </Box>
        );

      case 'completed':
        if (migrationStatus.migratedCount > 0) {
          return (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CheckCircle sx={{ fontSize: 60, color: '#4CAF50', mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                Migration Complete!
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
                Successfully migrated {migrationStatus.migratedCount} items to your account.
              </Typography>
              <Alert severity="success" sx={{ mb: 2 }}>
                Your data is now safely stored in your account and will sync across all your devices.
              </Alert>
            </Box>
          );
        } else {
          return (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                No Data to Migrate
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                No browser data was found to migrate. You can start using Health AI tools to create new data.
              </Typography>
            </Box>
          );
        }

      case 'failed':
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Error sx={{ fontSize: 60, color: '#f44336', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              Migration Failed
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
              {migrationStatus.error || 'An error occurred during migration.'}
            </Typography>
            <Alert severity="warning">
              Your browser data is still available locally. You can try migrating again later.
            </Alert>
          </Box>
        );

      default:
        const dataSummary = getDataSummary();
        
        if (dataSummary.length === 0) {
          return (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                No Data Found
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                No browser data was found to migrate. You can start using Health AI tools to create new data.
              </Typography>
            </Box>
          );
        }

        return (
          <Box sx={{ py: 2 }}>
            <Typography variant="body1" sx={{ mb: 3 }}>
              We found some data in your browser that can be migrated to your account for better security and cross-device access.
            </Typography>
            
            <Typography variant="h6" sx={{ mb: 2 }}>
              Data to Migrate:
            </Typography>
            
            <List>
              {dataSummary.map((item, index) => (
                <ListItem key={index} sx={{ px: 0 }}>
                  <ListItemIcon sx={{ color: item.color }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.type}
                    secondary={`${item.count} item${item.count > 1 ? 's' : ''}`}
                  />
                  <Chip 
                    label={item.count} 
                    size="small" 
                    sx={{ 
                      backgroundColor: item.color,
                      color: 'white',
                      fontWeight: 600
                    }}
                  />
                </ListItem>
              ))}
            </List>

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Benefits of migrating:</strong>
                <br />• Secure cloud storage
                <br />• Access from any device
                <br />• Automatic backups
                <br />• Cross-account data sharing
              </Typography>
            </Alert>
          </Box>
        );
    }
  };

  const renderActions = () => {
    switch (migrationStatus.status) {
      case 'checking':
      case 'migrating':
        return null;

      case 'completed':
        return (
          <Button 
            variant="contained" 
            onClick={handleComplete}
            sx={{
              background: 'linear-gradient(45deg, #0066CC, #3399FF)',
              '&:hover': {
                background: 'linear-gradient(45deg, #004499, #0066CC)'
              }
            }}
          >
            Continue to Health AI
          </Button>
        );

      case 'failed':
        return (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="outlined" onClick={checkForBrowserData}>
              Try Again
            </Button>
            <Button 
              variant="contained" 
              onClick={handleComplete}
              sx={{
                background: 'linear-gradient(45deg, #0066CC, #3399FF)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #004499, #0066CC)'
                }
              }}
            >
              Continue Anyway
            </Button>
          </Box>
        );

      default:
        const dataSummary = getDataSummary();
        if (dataSummary.length === 0) {
          return (
            <Button 
              variant="contained" 
              onClick={handleComplete}
              sx={{
                background: 'linear-gradient(45deg, #0066CC, #3399FF)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #004499, #0066CC)'
                }
              }}
            >
              Continue to Health AI
            </Button>
          );
        }

        return (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="outlined" onClick={skipMigration}>
              Skip Migration
            </Button>
            <Button 
              variant="contained" 
              onClick={startMigration}
              sx={{
                background: 'linear-gradient(45deg, #0066CC, #3399FF)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #004499, #0066CC)'
                }
              }}
            >
              Migrate Data
            </Button>
          </Box>
        );
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)'
        }
      }}
    >
      <DialogTitle sx={{ 
        textAlign: 'center',
        background: 'linear-gradient(135deg, #0066CC, #3399FF)',
        color: 'white',
        borderRadius: '12px 12px 0 0'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
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
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Data Migration
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 4, py: 3 }}>
        {renderContent()}
      </DialogContent>

      <DialogActions sx={{ px: 4, pb: 3, justifyContent: 'center' }}>
        {renderActions()}
      </DialogActions>
    </Dialog>
  );
} 