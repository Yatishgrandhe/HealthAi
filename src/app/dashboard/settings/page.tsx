"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Chip,
  Avatar,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Badge,
  Tooltip,
  LinearProgress
} from "@mui/material";
import {
  Settings,
  Notifications,
  PrivacyTip,
  DeleteForever,
  Download,
  Save,
  Cancel,
  Visibility,
  VisibilityOff,
  ArrowBack,
  Person,
  FitnessCenter,
  Lock,
  Palette,
  DataUsage
} from "@mui/icons-material";
import { motion } from "framer-motion";
import Link from "next/link";
import { useUser } from "@/utils/supabaseClient";
import HealthDataService from "@/utils/healthDataService";

interface Settings {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    fitnessReminders: boolean;
    postureReminders: boolean;
    therapyReminders: boolean;
    weeklyReports: boolean;
    achievements: boolean;
  };
  privacy: {
    shareData: boolean;
    publicProfile: boolean;
    allowAnalytics: boolean;
    dataRetention: number;
  };
  appearance: {
    theme: 'light' | 'dark' | 'auto';
    fontSize: number;
    compactMode: boolean;
    animations: boolean;
  };
  health: {
    units: 'metric' | 'imperial';
    timezone: string;
    language: string;
    accessibility: boolean;
  };
  data: {
    autoBackup: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
    cloudSync: boolean;
    dataExport: boolean;
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    notifications: {
      email: true,
      push: true,
      sms: false,
      fitnessReminders: true,
      postureReminders: true,
      therapyReminders: true,
      weeklyReports: true,
      achievements: true,
    },
    privacy: {
      shareData: false,
      publicProfile: false,
      allowAnalytics: true,
      dataRetention: 365,
    },
    appearance: {
      theme: 'auto',
      fontSize: 16,
      compactMode: false,
      animations: true,
    },
    health: {
      units: 'metric',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: 'en',
      accessibility: false,
    },
    data: {
      autoBackup: true,
      backupFrequency: 'weekly',
      cloudSync: true,
      dataExport: false,
    },
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  const { user, loading: userLoading } = useUser();
  const healthDataService = new HealthDataService();

  useEffect(() => {
    if (user) {
      loadUserProfile();
      loadSettings();
    }
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;
    
    try {
      // For now, we'll use the user data directly since getUserProfile might not exist
      setUserProfile({
        full_name: user.user_metadata?.full_name || '',
        email: user.email || '',
        id: user.id
      });
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadSettings = async () => {
    if (!user) return;
    
    try {
      const savedSettings = localStorage.getItem(`settings-${user.id}`);
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      localStorage.setItem(`settings-${user.id}`, JSON.stringify(settings));
      // Here you could also save to Supabase if needed
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (category: keyof Settings, setting: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value,
      },
    }));
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // Here you would implement password change logic
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setShowPasswordDialog(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Error changing password:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDataExport = async () => {
    setLoading(true);
    try {
      // Here you would implement data export logic
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      setShowExportDialog(false);
    } catch (error) {
      console.error('Error exporting data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDataDelete = async () => {
    setLoading(true);
    try {
      // Here you would implement data deletion logic
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Error deleting data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderNotificationsSettings = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Notifications />
          Notifications
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.notifications.email}
                  onChange={(e) => handleSettingChange('notifications', 'email', e.target.checked)}
                />
              }
              label="Email Notifications"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.notifications.push}
                  onChange={(e) => handleSettingChange('notifications', 'push', e.target.checked)}
                />
              }
              label="Push Notifications"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.notifications.fitnessReminders}
                  onChange={(e) => handleSettingChange('notifications', 'fitnessReminders', e.target.checked)}
                />
              }
              label="Fitness Reminders"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.notifications.postureReminders}
                  onChange={(e) => handleSettingChange('notifications', 'postureReminders', e.target.checked)}
                />
              }
              label="Posture Check Reminders"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.notifications.therapyReminders}
                  onChange={(e) => handleSettingChange('notifications', 'therapyReminders', e.target.checked)}
                />
              }
              label="Therapy Session Reminders"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.notifications.weeklyReports}
                  onChange={(e) => handleSettingChange('notifications', 'weeklyReports', e.target.checked)}
                />
              }
              label="Weekly Progress Reports"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderPrivacySettings = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <PrivacyTip />
          Privacy & Security
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.privacy.shareData}
                  onChange={(e) => handleSettingChange('privacy', 'shareData', e.target.checked)}
                />
              }
              label="Share Health Data for Research"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.privacy.publicProfile}
                  onChange={(e) => handleSettingChange('privacy', 'publicProfile', e.target.checked)}
                />
              }
              label="Public Profile"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.privacy.allowAnalytics}
                  onChange={(e) => handleSettingChange('privacy', 'allowAnalytics', e.target.checked)}
                />
              }
              label="Allow Analytics"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Data Retention (days): {settings.privacy.dataRetention}
              </Typography>
              <Slider
                value={settings.privacy.dataRetention}
                onChange={(_, value) => handleSettingChange('privacy', 'dataRetention', value)}
                min={30}
                max={1095}
                step={30}
                marks={[
                  { value: 30, label: '30d' },
                  { value: 365, label: '1y' },
                  { value: 1095, label: '3y' },
                ]}
              />
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderAppearanceSettings = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Palette />
          Appearance
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Theme</InputLabel>
              <Select
                value={settings.appearance.theme}
                onChange={(e) => handleSettingChange('appearance', 'theme', e.target.value)}
                label="Theme"
              >
                <MenuItem value="light">Light</MenuItem>
                <MenuItem value="dark">Dark</MenuItem>
                <MenuItem value="auto">Auto</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Font Size: {settings.appearance.fontSize}px
              </Typography>
              <Slider
                value={settings.appearance.fontSize}
                onChange={(_, value) => handleSettingChange('appearance', 'fontSize', value)}
                min={12}
                max={24}
                step={1}
                marks={[
                  { value: 12, label: 'S' },
                  { value: 16, label: 'M' },
                  { value: 20, label: 'L' },
                  { value: 24, label: 'XL' },
                ]}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.appearance.compactMode}
                  onChange={(e) => handleSettingChange('appearance', 'compactMode', e.target.checked)}
                />
              }
              label="Compact Mode"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.appearance.animations}
                  onChange={(e) => handleSettingChange('appearance', 'animations', e.target.checked)}
                />
              }
              label="Enable Animations"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderHealthSettings = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <FitnessCenter />
          Health Preferences
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Units</InputLabel>
              <Select
                value={settings.health.units}
                onChange={(e) => handleSettingChange('health', 'units', e.target.value)}
                label="Units"
              >
                <MenuItem value="metric">Metric (kg, cm)</MenuItem>
                <MenuItem value="imperial">Imperial (lbs, ft)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Language</InputLabel>
              <Select
                value={settings.health.language}
                onChange={(e) => handleSettingChange('health', 'language', e.target.value)}
                label="Language"
              >
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="es">Español</MenuItem>
                <MenuItem value="fr">Français</MenuItem>
                <MenuItem value="de">Deutsch</MenuItem>
                <MenuItem value="zh">中文</MenuItem>
                <MenuItem value="ja">日本語</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.health.accessibility}
                  onChange={(e) => handleSettingChange('health', 'accessibility', e.target.checked)}
                />
              }
              label="Accessibility Mode"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderDataSettings = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <DataUsage />
          Data Management
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.data.autoBackup}
                  onChange={(e) => handleSettingChange('data', 'autoBackup', e.target.checked)}
                />
              }
              label="Auto Backup"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Backup Frequency</InputLabel>
              <Select
                value={settings.data.backupFrequency}
                onChange={(e) => handleSettingChange('data', 'backupFrequency', e.target.value)}
                label="Backup Frequency"
              >
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.data.cloudSync}
                  onChange={(e) => handleSettingChange('data', 'cloudSync', e.target.checked)}
                />
              }
              label="Cloud Sync"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={() => setShowExportDialog(true)}
              fullWidth
            >
              Export Data
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderAccountSettings = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Person />
          Account Settings
        </Typography>
        
        {userProfile && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Full Name"
                value={userProfile.full_name || ''}
                variant="outlined"
                disabled
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                value={user?.email || ''}
                variant="outlined"
                disabled
              />
            </Grid>
          </Grid>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Button
              variant="outlined"
              startIcon={<Lock />}
              onClick={() => setShowPasswordDialog(true)}
              fullWidth
            >
              Change Password
            </Button>
          </Grid>
          <Grid item xs={12} md={6}>
            <Button
              variant="outlined"
              startIcon={<DeleteForever />}
              onClick={() => setShowDeleteDialog(true)}
              color="error"
              fullWidth
            >
              Delete Account
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  if (userLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ minHeight: "100vh", background: "#f8f9ff", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Container maxWidth="sm">
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
              Login Required
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Please log in to access your settings.
            </Typography>
            <Button
              variant="contained"
              component={Link}
              href="/login"
              sx={{
                background: "linear-gradient(135deg, #FFD166, #06D6A0)",
                "&:hover": {
                  background: "linear-gradient(135deg, #FFC107, #00C853)",
                }
              }}
            >
              Login
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", background: "#f8f9ff" }}>
      {/* Header */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #FFD166, #06D6A0)",
          py: 3,
          position: "sticky",
          top: 0,
          zIndex: 1000
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Link href="/dashboard" passHref>
                <IconButton
                  sx={{
                    color: "white",
                    mr: 2,
                    "&:hover": {
                      background: "rgba(255, 255, 255, 0.1)",
                      transform: "translateX(-2px)",
                    },
                    transition: "all 0.3s ease"
                  }}
                >
                  <ArrowBack />
                </IconButton>
              </Link>
              <img 
                src="/health-ai-logo.png" 
                alt="Health AI Logo" 
                width={40} 
                height={40} 
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
                  <Settings sx={{ fontSize: 24 }} />
                  Settings
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "rgba(255, 255, 255, 0.8)",
                    fontSize: "0.8rem"
                  }}
                >
                  Manage your preferences and account
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<Cancel />}
                sx={{
                  borderColor: "rgba(255, 255, 255, 0.3)",
                  color: "white",
                  "&:hover": {
                    borderColor: "white",
                    background: "rgba(255, 255, 255, 0.1)",
                  }
                }}
              >
                Reset
              </Button>
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={16} /> : <Save />}
                onClick={saveSettings}
                disabled={saving}
                sx={{
                  background: "rgba(255, 255, 255, 0.2)",
                  color: "white",
                  "&:hover": {
                    background: "rgba(255, 255, 255, 0.3)",
                  }
                }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Paper
            elevation={8}
            sx={{
              borderRadius: 3,
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.2)"
            }}
          >
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              sx={{ borderBottom: 1, borderColor: 'divider', px: 3, pt: 2 }}
            >
              <Tab label="General" />
              <Tab label="Privacy" />
              <Tab label="Appearance" />
              <Tab label="Health" />
              <Tab label="Data" />
              <Tab label="Account" />
            </Tabs>

            <Box sx={{ p: 3 }}>
              {activeTab === 0 && renderNotificationsSettings()}
              {activeTab === 1 && renderPrivacySettings()}
              {activeTab === 2 && renderAppearanceSettings()}
              {activeTab === 3 && renderHealthSettings()}
              {activeTab === 4 && renderDataSettings()}
              {activeTab === 5 && renderAccountSettings()}
            </Box>
          </Paper>
        </motion.div>
      </Container>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onClose={() => setShowPasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            type={showPassword ? 'text' : 'password'}
            label="Current Password"
            value={passwordData.currentPassword}
            onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth
            type={showPassword ? 'text' : 'password'}
            label="New Password"
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            type={showPassword ? 'text' : 'password'}
            label="Confirm New Password"
            value={passwordData.confirmPassword}
            onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
              />
            }
            label="Show Password"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPasswordDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handlePasswordChange}
            disabled={loading}
            sx={{
              background: "linear-gradient(135deg, #FFD166, #06D6A0)",
              "&:hover": {
                background: "linear-gradient(135deg, #FFC107, #00C853)",
              }
            }}
          >
            {loading ? 'Changing...' : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Data Export Dialog */}
      <Dialog open={showExportDialog} onClose={() => setShowExportDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Export Data</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This will export all your health data including fitness plans, posture checks, therapy sessions, and progress tracking.
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            The export process may take a few minutes depending on the amount of data.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowExportDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleDataExport}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <Download />}
            sx={{
              background: "linear-gradient(135deg, #FFD166, #06D6A0)",
              "&:hover": {
                background: "linear-gradient(135deg, #FFC107, #00C853)",
              }
            }}
          >
            {loading ? 'Exporting...' : 'Export Data'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone. All your data will be permanently deleted.
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete your account? This will remove all your health data, fitness plans, and account information.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDataDelete}
            disabled={loading}
            sx={{
              background: "linear-gradient(135deg, #F44336, #D32F2F)",
              "&:hover": {
                background: "linear-gradient(135deg, #D32F2F, #B71C1C)",
              }
            }}
          >
            {loading ? 'Deleting...' : 'Delete Account'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 