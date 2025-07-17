import { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider
} from "@mui/material";
import {
  Notifications as NotificationsIcon,
  Menu as MenuIcon,
  Logout as LogoutIcon,
  AccountCircle as AccountIcon,
  Person as ProfileIcon,
  Settings as SettingsIcon
} from "@mui/icons-material";
import Box from "@mui/material/Box";

export default function TopBar({
  user,
  notifications = 0,
  menuItems = [],
  onSignOut,
  onNavigate,
  onDrawerToggle,
  pathname
}: {
  user: any,
  notifications?: number,
  menuItems?: any[],
  onSignOut: () => void,
  onNavigate: (path: string) => void,
  onDrawerToggle?: () => void,
  pathname: string
}) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(path);
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        width: { md: `calc(100% - 280px)` },
        ml: { md: `280px` },
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
        boxShadow: '0 2px 20px rgba(0, 0, 0, 0.1)',
        zIndex: 1300
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onDrawerToggle}
          sx={{
            mr: 2,
            display: { md: 'none' },
            background: 'rgba(0, 102, 204, 0.1)',
            borderRadius: '50%',
            '&:hover': {
              background: 'rgba(0, 102, 204, 0.2)',
            },
            '& .MuiSvgIcon-root': {
              background: 'transparent !important',
              borderRadius: '0 !important',
              boxShadow: 'none !important'
            }
          }}
        >
          <MenuIcon sx={{ color: '#0066CC' }} />
        </IconButton>
        <Typography variant="h6" sx={{ flexGrow: 1, color: '#333', fontWeight: 600 }}>
          {menuItems?.find(item => isActive(item.path))?.text || 'Dashboard'}
        </Typography>
        {/* Notifications */}
        <IconButton
          color="inherit"
          sx={{
            mr: 1,
            background: 'rgba(0, 102, 204, 0.1)',
            borderRadius: '50%',
            '&:hover': {
              background: 'rgba(0, 102, 204, 0.2)',
            },
            '& .MuiSvgIcon-root': {
              background: 'transparent !important',
              borderRadius: '0 !important',
              boxShadow: 'none !important'
            }
          }}
        >
          <Badge badgeContent={notifications} color="error">
            <NotificationsIcon sx={{ color: '#0066CC' }} />
          </Badge>
        </IconButton>
        {/* Profile Menu */}
        <IconButton
          onClick={e => setAnchorEl(e.currentTarget)}
          sx={{
            background: 'rgba(0, 102, 204, 0.1)',
            borderRadius: '50%',
            '&:hover': {
              background: 'rgba(0, 102, 204, 0.2)',
            },
            '& .MuiSvgIcon-root': {
              background: 'transparent !important',
              borderRadius: '0 !important',
              boxShadow: 'none !important'
            }
          }}
        >
          <AccountIcon sx={{ color: '#0066CC' }} />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 200,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            }
          }}
        >
          <MenuItem onClick={() => { onNavigate('/profile'); setAnchorEl(null); }}>
            <ListItemIcon>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0066CC20, #0066CC40)',
                  color: '#0066CC',
                  '& .MuiSvgIcon-root': {
                    background: 'transparent !important',
                    borderRadius: '0 !important',
                    boxShadow: 'none !important'
                  }
                }}
              >
                <ProfileIcon fontSize="small" />
              </Box>
            </ListItemIcon>
            Profile
          </MenuItem>
          <MenuItem onClick={() => { onNavigate('/dashboard/settings'); setAnchorEl(null); }}>
            <ListItemIcon>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0066CC20, #0066CC40)',
                  color: '#0066CC',
                  '& .MuiSvgIcon-root': {
                    background: 'transparent !important',
                    borderRadius: '0 !important',
                    boxShadow: 'none !important'
                  }
                }}
              >
                <SettingsIcon fontSize="small" />
              </Box>
            </ListItemIcon>
            Settings
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => { onSignOut(); setAnchorEl(null); }}>
            <ListItemIcon>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FF444420, #FF444440)',
                  color: '#FF4444',
                  '& .MuiSvgIcon-root': {
                    background: 'transparent !important',
                    borderRadius: '0 !important',
                    boxShadow: 'none !important'
                  }
                }}
              >
                <LogoutIcon fontSize="small" />
              </Box>
            </ListItemIcon>
            Sign Out
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
} 