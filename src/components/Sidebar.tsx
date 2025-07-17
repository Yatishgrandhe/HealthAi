import { useState, useEffect } from "react";
import {
  Box,
  List,
  Typography,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Chip
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Person as ProfileIcon,
  Settings as SettingsIcon,
  AdminPanelSettings as AdminIcon,
  LocalHospital as HealthIcon,
  Psychology as TherapistIcon,
  FitnessCenter as FitnessIcon,
  Straighten as PostureIcon,
  Bookmark as SavedIcon,
  TrendingUp as AnalyticsIcon,
  CalendarToday as CalendarIcon
} from "@mui/icons-material";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";

const drawerWidth = 280;

interface MenuItem {
  text: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
  category?: string;
}

export const getMenuItems = (user: any): MenuItem[] => {
  const baseItems: MenuItem[] = [
    // Main Dashboard
    { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    // Health & Wellness
    { text: "Health Tools", icon: <HealthIcon />, path: "/health-tools?from=dashboard", category: "Health & Wellness" },
    { text: "Therapist Chat", icon: <TherapistIcon />, path: "/health-tools/therapist-chat?from=dashboard" },
    { text: "Posture Check", icon: <PostureIcon />, path: "/health-tools/posture-check?from=dashboard" },
    { text: "Fitness Planner", icon: <FitnessIcon />, path: "/health-tools/fitness-planner?from=dashboard" },
    { text: "Saved Routines", icon: <SavedIcon />, path: "/health-tools/saved-routines?from=dashboard" },
    // Analytics & Progress
    { text: "Health Analytics", icon: <AnalyticsIcon />, path: "/dashboard/analytics", category: "Analytics" },
    { text: "Progress Calendar", icon: <CalendarIcon />, path: "/dashboard/calendar" },
    // Account & Settings
    { text: "Profile", icon: <ProfileIcon />, path: "/profile", category: "Account" },
    { text: "Settings", icon: <SettingsIcon />, path: "/dashboard/settings" },
  ];
  if (user?.user_metadata?.account_type === 'admin' || user?.user_metadata?.role === 'admin') {
    baseItems.push({ text: "Admin Panel", icon: <AdminIcon />, path: "/admin", category: "Administration" });
  }
  return baseItems;
};

export default function Sidebar({ user, pathname }: { user: any, pathname: string }) {
  const menuItems = getMenuItems(user || {});
  const groupedMenuItems = menuItems.reduce((acc, item) => {
    const category = item.category || 'Main';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(path);
  };

  return (
    <Box sx={{ width: drawerWidth, height: '100vh', display: 'flex', flexDirection: 'column', background: '#101828', color: 'white', borderRight: '1px solid #e0e0e0' }}>
      {/* Logo and Header */}
      <Box sx={{
        p: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'linear-gradient(135deg, rgba(0, 102, 204, 0.1), rgba(51, 153, 255, 0.1))'
      }}>
        <Link href="/dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <img
              src="/health-ai-logo.png"
              alt="Health AI Logo"
              width={48}
              height={48}
              style={{
                borderRadius: '50%',
                background: 'transparent',
                display: 'block'
              }}
            />
            <Typography variant="h6" sx={{
              fontWeight: 700,
              background: "linear-gradient(90deg, #0066CC, #3399FF)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>
              Health AI
            </Typography>
          </Box>
        </Link>
      </Box>
      {/* Navigation Menu */}
      <Box sx={{ flex: 1, overflow: 'auto', py: 2 }}>
        {Object.entries(groupedMenuItems).map(([category, items]) => (
          <Box key={category}>
            {category !== 'Main' && (
              <Typography
                variant="caption"
                sx={{
                  px: 3,
                  py: 1,
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                {category}
              </Typography>
            )}
            <List>
              {items.map((item) => (
                <ListItem key={item.text} disablePadding>
                  <ListItemButton
                    component={Link}
                    href={item.path}
                    selected={isActive(item.path)}
                    sx={{
                      mx: 1,
                      borderRadius: 2,
                      mb: 0.5,
                      '&.Mui-selected': {
                        background: 'linear-gradient(90deg, rgba(0, 102, 204, 0.2), rgba(51, 153, 255, 0.2))',
                        border: '1px solid rgba(0, 102, 204, 0.3)',
                        '&:hover': {
                          background: 'linear-gradient(90deg, rgba(0, 102, 204, 0.3), rgba(51, 153, 255, 0.3))',
                        }
                      },
                      '&:hover': {
                        background: 'rgba(255, 255, 255, 0.05)',
                      }
                    }}
                  >
                    <ListItemIcon sx={{
                      minWidth: 40,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: isActive(item.path)
                            ? `linear-gradient(135deg, #0066CC20, #0066CC40)`
                            : 'rgba(255, 255, 255, 0.1)',
                          color: isActive(item.path) ? '#0066CC' : 'rgba(255, 255, 255, 0.8)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            background: isActive(item.path)
                              ? `linear-gradient(135deg, #0066CC30, #0066CC50)`
                              : 'rgba(255, 255, 255, 0.15)',
                          },
                          '& .MuiSvgIcon-root': {
                            background: 'transparent !important',
                            borderRadius: '0 !important',
                          }
                        }}
                      >
                        {item.icon}
                      </Box>
                    </ListItemIcon>
                    <ListItemText primary={item.text} />
                    {item.badge && (
                      <Chip label={item.badge} size="small" color="primary" />
                    )}
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        ))}
      </Box>
    </Box>
  );
} 