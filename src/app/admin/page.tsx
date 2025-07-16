"use client";

import { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  IconButton,
  CircularProgress,
  Avatar,
  TextField
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { 
  People,
  Payment,
  Security,
  Settings,
  TrendingUp,
  Warning,
  Visibility,
  VerifiedUser,
  Block,
  AdminPanelSettings,
  Refresh,
  Download,
  Email,
  Assessment
} from '@mui/icons-material';
import { supabase } from '@/utils/supabaseClient';
import Navigation from '@/components/Navigation';
import ThemeProvider from '@/components/ThemeProvider';

const HeroSection = styled(Box)({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  padding: '120px 0 80px',
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
});

const StatCard = styled(Card)({
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(123, 97, 255, 0.1)',
  borderRadius: 20,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 20px 40px rgba(123, 97, 255, 0.2)',
  }
});

const AdminCard = styled(Card)({
  background: 'linear-gradient(135deg, rgba(123, 97, 255, 0.1) 0%, rgba(229, 115, 183, 0.1) 100%)',
  border: '1px solid rgba(123, 97, 255, 0.2)',
  borderRadius: 16,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'scale(1.02)',
    boxShadow: '0 12px 32px rgba(123, 97, 255, 0.15)',
  }
});

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'user' | 'admin' | 'guest';
  is_verified: boolean;
  created_at: string;
  total_payments: number;
  total_amount: number;
  last_payment_date: string;
  fraud_checks_count: number;
  high_risk_checks: number;
}

interface Payment {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  tx_hash: string;
  created_at: string;
  hospital_id: string;
  description: string;
  user_email: string;
}

interface FraudCheck {
  id: string;
  user_id: string;
  payment_id: string;
  check_type: string;
  provider: string;
  score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  user_email: string;
}

interface AdminSettings {
  system_maintenance?: {
    enabled: boolean;
    message: string;
  };
  fraud_thresholds?: {
    low: number;
    medium: number;
    high: number;
  };
  payment_limits?: {
    min: number;
    max: number;
    daily_limit: number;
  };
  api_keys?: {
    openai: string;
    telesign: string;
    idanalyzer: string;
  };
}

export default function AdminPage() {
  const [user, setUser] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [fraudChecks, setFraudChecks] = useState<FraudCheck[]>([]);
  const [stats, setStats] = useState<unknown>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [settings, setSettings] = useState<AdminSettings>({
    system_maintenance: { enabled: false, message: '' },
    fraud_thresholds: { low: 0.3, medium: 0.6, high: 0.8 },
    payment_limits: { min: 10, max: 50000, daily_limit: 100000 },
    api_keys: { openai: '', telesign: '', idanalyzer: '' }
  });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (user && (user as { role: string }).role === 'admin') {
      fetchData();
    }
  }, [user, refreshKey]);

  const checkAdminAccess = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        window.location.href = '/login';
        return;
      }

      const { data: userProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (userProfile?.role !== 'admin') {
        window.location.href = '/';
        return;
      }

      setUser(userProfile);
    } catch (error) {
      console.error('Error checking admin access:', error);
      window.location.href = '/login';
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      // Fetch admin stats
      const { data: statsData } = await supabase.rpc('get_admin_stats');
      setStats(statsData || {});

      // Fetch users
      const { data: usersData } = await supabase
        .from('admin_dashboard')
        .select('*')
        .order('user_created_at', { ascending: false });

      setUsers(usersData || []);

      // Fetch recent payments
      const { data: paymentsData } = await supabase
        .from('payments')
        .select(`
          *,
          users!inner(email)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      setPayments(paymentsData?.map(p => ({ ...p, user_email: p.users.email })) || []);

      // Fetch fraud checks
      const { data: fraudData } = await supabase
        .from('fraud_checks')
        .select(`
          *,
          users!inner(email)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      setFraudChecks(fraudData?.map(f => ({ ...f, user_email: f.users.email })) || []);

      // Fetch admin settings
      const { data: settingsData } = await supabase
        .from('admin_settings')
        .select('*');

      const settingsObj: Record<string, unknown> = {};
      settingsData?.forEach((setting: { key: string; value: unknown }) => {
        settingsObj[setting.key] = setting.value;
      });
      setSettings(settingsObj as AdminSettings);
      const sysMaint = settingsObj.system_maintenance;
      const enabled =
        typeof sysMaint === 'object' &&
        sysMaint !== null &&
        'enabled' in sysMaint &&
        typeof (sysMaint as { enabled?: unknown }).enabled === 'boolean'
          ? (sysMaint as { enabled: boolean }).enabled
          : false;
      setMaintenanceMode(enabled);

    } catch (error) {
      console.error('Error fetching admin data:', error);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleUserAction = async (userId: string, action: string) => {
    try {
      switch (action) {
        case 'verify':
          await supabase
            .from('users')
            .update({ is_verified: true })
            .eq('id', userId);
          break;
        case 'block':
          await supabase
            .from('users')
            .update({ role: 'guest' })
            .eq('id', userId);
          break;
        case 'promote':
          await supabase
            .from('users')
            .update({ role: 'admin' })
            .eq('id', userId);
          break;
      }
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error performing user action:', error);
    }
  };

  const handleMaintenanceToggle = async () => {
    try {
      const newValue = !maintenanceMode;
      await supabase
        .from('admin_settings')
        .upsert({
          key: 'system_maintenance',
          value: { enabled: newValue, message: 'System is under maintenance' }
        });
      setMaintenanceMode(newValue);
    } catch (error) {
      console.error('Error toggling maintenance mode:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!user || (user as { role: string }).role !== 'admin') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Typography variant="h4" color="error">Access Denied</Typography>
      </Box>
    );
  }

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
                Admin Dashboard
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ 
                  mb: 4,
                  maxWidth: 800,
                  mx: 'auto',
                  opacity: 0.9,
                  textShadow: '0 2px 10px rgba(0,0,0,0.2)'
                }}
              >
                Monitor transactions, manage users, and control system settings
              </Typography>
            </motion.div>
          </Container>
        </HeroSection>

        {/* Main Content */}
        <Box sx={{ py: 6, background: '#f8f9ff' }}>
          <Container maxWidth="xl">
            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Box sx={{ width: { xs: '100%', sm: '50%', md: '25%' }, px: 1, mb: 2 }}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <StatCard>
                    <CardContent sx={{ textAlign: 'center', p: 3 }}>
                      <People sx={{ fontSize: 48, color: '#7B61FF', mb: 2 }} />
                      <Typography variant="h4" fontWeight={700} color="#232946">
                        {(stats as { total_users: number })?.total_users || 0}
                      </Typography>
                      <Typography variant="body2" color="#666">
                        Total Users
                      </Typography>
                    </CardContent>
                  </StatCard>
                </motion.div>
              </Box>
              
              <Box sx={{ width: { xs: '100%', sm: '50%', md: '25%' }, px: 1, mb: 2 }}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  <StatCard>
                    <CardContent sx={{ textAlign: 'center', p: 3 }}>
                      <Payment sx={{ fontSize: 48, color: '#E573B7', mb: 2 }} />
                      <Typography variant="h4" fontWeight={700} color="#232946">
                        {(stats as { total_payments: number })?.total_payments || 0}
                      </Typography>
                      <Typography variant="body2" color="#666">
                        Total Payments
                      </Typography>
                    </CardContent>
                  </StatCard>
                </motion.div>
              </Box>
              
              <Box sx={{ width: { xs: '100%', sm: '50%', md: '25%' }, px: 1, mb: 2 }}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <StatCard>
                    <CardContent sx={{ textAlign: 'center', p: 3 }}>
                      <TrendingUp sx={{ fontSize: 48, color: '#FFD166', mb: 2 }} />
                      <Typography variant="h4" fontWeight={700} color="#232946">
                        ${(stats as { total_amount: number })?.total_amount || 0}.toLocaleString()
                      </Typography>
                      <Typography variant="body2" color="#666">
                        Total Amount
                      </Typography>
                    </CardContent>
                  </StatCard>
                </motion.div>
              </Box>
              
              <Box sx={{ width: { xs: '100%', sm: '50%', md: '25%' }, px: 1, mb: 2 }}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <StatCard>
                    <CardContent sx={{ textAlign: 'center', p: 3 }}>
                      <Warning sx={{ fontSize: 48, color: '#f44336', mb: 2 }} />
                      <Typography variant="h4" fontWeight={700} color="#232946">
                        {(stats as { high_fraud_alerts: number })?.high_fraud_alerts || 0}
                      </Typography>
                      <Typography variant="body2" color="#666">
                        High Risk Alerts
                      </Typography>
                    </CardContent>
                  </StatCard>
                </motion.div>
              </Box>
            </Grid>

            {/* Quick Actions */}
            <AdminCard sx={{ mb: 4 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight={600} color="#232946">
                    Quick Actions
                  </Typography>
                  <Button
                    startIcon={<Refresh />}
                    onClick={() => setRefreshKey(prev => prev + 1)}
                    variant="outlined"
                    size="small"
                  >
                    Refresh Data
                  </Button>
                </Box>
                
                <Grid container spacing={2}>
                  <Box sx={{ width: { xs: '100%', sm: '50%', md: '25%' }, px: 1, mb: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={maintenanceMode}
                          onChange={handleMaintenanceToggle}
                          color="primary"
                        />
                      }
                      label="Maintenance Mode"
                    />
                  </Box>
                  <Box sx={{ width: { xs: '100%', sm: '50%', md: '25%' }, px: 1, mb: 2 }}>
                    <Button
                      startIcon={<Download />}
                      variant="outlined"
                      fullWidth
                      size="small"
                    >
                      Export Data
                    </Button>
                  </Box>
                  <Box sx={{ width: { xs: '100%', sm: '50%', md: '25%' }, px: 1, mb: 2 }}>
                    <Button
                      startIcon={<Email />}
                      variant="outlined"
                      fullWidth
                      size="small"
                    >
                      Send Notifications
                    </Button>
                  </Box>
                  <Box sx={{ width: { xs: '100%', sm: '50%', md: '25%' }, px: 1, mb: 2 }}>
                    <Button
                      startIcon={<Assessment />}
                      variant="outlined"
                      fullWidth
                      size="small"
                    >
                      Generate Report
                    </Button>
                  </Box>
                </Grid>
              </CardContent>
            </AdminCard>

            {/* Tabs */}
            <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="admin tabs">
                  <Tab icon={<People />} label="Users" />
                  <Tab icon={<Payment />} label="Payments" />
                  <Tab icon={<Security />} label="Fraud Detection" />
                  <Tab icon={<Settings />} label="Settings" />
                </Tabs>
              </Box>

              {/* Users Tab */}
              <TabPanel value={tabValue} index={0}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>User</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Payments</TableCell>
                        <TableCell>Total Amount</TableCell>
                        <TableCell>Risk Level</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar sx={{ bgcolor: '#7B61FF' }}>
                                {user.email.charAt(0).toUpperCase()}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={600}>
                                  {user.full_name || 'N/A'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {user.email}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={user.role} 
                              color={user.role === 'admin' ? 'primary' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={user.is_verified ? 'Verified' : 'Pending'} 
                              color={user.is_verified ? 'success' : 'warning'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{user.total_payments}</TableCell>
                          <TableCell>${user.total_amount.toLocaleString()}</TableCell>
                          <TableCell>
                            <Chip 
                              label={user.high_risk_checks > 0 ? 'High Risk' : 'Low Risk'} 
                              color={user.high_risk_checks > 0 ? 'error' : 'success'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <IconButton
                                size="small"
                                onClick={() => handleUserAction(user.id, 'verify')}
                                disabled={user.is_verified}
                              >
                                <VerifiedUser fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleUserAction(user.id, user.role === 'admin' ? 'block' : 'promote')}
                              >
                                {user.role === 'admin' ? <Block fontSize="small" /> : <AdminPanelSettings fontSize="small" />}
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </TabPanel>

              {/* Payments Tab */}
              <TabPanel value={tabValue} index={1}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Transaction ID</TableCell>
                        <TableCell>User</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            <Typography variant="body2" fontFamily="monospace">
                              {payment.tx_hash || payment.id.slice(0, 8)}
                            </Typography>
                          </TableCell>
                          <TableCell>{payment.user_email}</TableCell>
                          <TableCell>${payment.amount.toLocaleString()}</TableCell>
                          <TableCell>
                            <Chip 
                              label={payment.status} 
                              color={getStatusColor(payment.status) as unknown as 'success' | 'warning' | 'error' | 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {new Date(payment.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <IconButton size="small">
                              <Visibility fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </TabPanel>

              {/* Fraud Detection Tab */}
              <TabPanel value={tabValue} index={2}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>User</TableCell>
                        <TableCell>Check Type</TableCell>
                        <TableCell>Provider</TableCell>
                        <TableCell>Score</TableCell>
                        <TableCell>Risk Level</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {fraudChecks.map((check) => (
                        <TableRow key={check.id}>
                          <TableCell>{check.user_email}</TableCell>
                          <TableCell>{check.check_type}</TableCell>
                          <TableCell>{check.provider}</TableCell>
                          <TableCell>{(check.score * 100).toFixed(1)}%</TableCell>
                          <TableCell>
                            <Chip 
                              label={check.risk_level} 
                              color={getRiskLevelColor(check.risk_level) as unknown as 'success' | 'warning' | 'error' | 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {new Date(check.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <IconButton size="small">
                              <Visibility fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </TabPanel>

              {/* Settings Tab */}
              <TabPanel value={tabValue} index={3}>
                <Grid container spacing={3}>
                  <Box sx={{ width: { xs: '100%', md: '50%' }, px: 1, mb: 2 }}>
                    <AdminCard>
                      <CardContent>
                        <Typography variant="h6" fontWeight={600} mb={2}>
                          System Settings
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={maintenanceMode}
                                onChange={handleMaintenanceToggle}
                                color="primary"
                              />
                            }
                            label="Maintenance Mode"
                          />
                          <TextField
                            label="Maintenance Message"
                            multiline
                            rows={3}
                            defaultValue={settings?.system_maintenance?.message || ''}
                            fullWidth
                          />
                        </Box>
                      </CardContent>
                    </AdminCard>
                  </Box>
                  
                  <Box sx={{ width: { xs: '100%', md: '50%' }, px: 1, mb: 2 }}>
                    <AdminCard>
                      <CardContent>
                        <Typography variant="h6" fontWeight={600} mb={2}>
                          Fraud Detection
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <TextField
                            label="Low Risk Threshold"
                            type="number"
                            defaultValue={settings?.fraud_thresholds?.low || 0.3}
                            fullWidth
                          />
                          <TextField
                            label="Medium Risk Threshold"
                            type="number"
                            defaultValue={settings?.fraud_thresholds?.medium || 0.6}
                            fullWidth
                          />
                          <TextField
                            label="High Risk Threshold"
                            type="number"
                            defaultValue={settings?.fraud_thresholds?.high || 0.8}
                            fullWidth
                          />
                        </Box>
                      </CardContent>
                    </AdminCard>
                  </Box>
                  
                  <Box sx={{ width: { xs: '100%', md: '50%' }, px: 1, mb: 2 }}>
                    <AdminCard>
                      <CardContent>
                        <Typography variant="h6" fontWeight={600} mb={2}>
                          Payment Limits
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <TextField
                            label="Minimum Amount"
                            type="number"
                            defaultValue={settings?.payment_limits?.min || 10}
                            fullWidth
                          />
                          <TextField
                            label="Maximum Amount"
                            type="number"
                            defaultValue={settings?.payment_limits?.max || 50000}
                            fullWidth
                          />
                          <TextField
                            label="Daily Limit"
                            type="number"
                            defaultValue={settings?.payment_limits?.daily_limit || 100000}
                            fullWidth
                          />
                        </Box>
                      </CardContent>
                    </AdminCard>
                  </Box>
                  
                  <Box sx={{ width: { xs: '100%', md: '50%' }, px: 1, mb: 2 }}>
                    <AdminCard>
                      <CardContent>
                        <Typography variant="h6" fontWeight={600} mb={2}>
                          API Configuration
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <TextField
                            label="OpenAI API Key"
                            type="password"
                            defaultValue={settings?.api_keys?.openai || ''}
                            fullWidth
                          />
                          <TextField
                            label="Telesign API Key"
                            type="password"
                            defaultValue={settings?.api_keys?.telesign || ''}
                            fullWidth
                          />
                          <TextField
                            label="IDAnalyzer API Key"
                            type="password"
                            defaultValue={settings?.api_keys?.idanalyzer || ''}
                            fullWidth
                          />
                        </Box>
                      </CardContent>
                    </AdminCard>
                  </Box>
                </Grid>
              </TabPanel>
            </Paper>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
} 