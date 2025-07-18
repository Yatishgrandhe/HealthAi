import {
  AppBar,
  Toolbar,
  Typography,
  IconButton
} from "@mui/material";
import {
  Menu as MenuIcon,
  Logout as LogoutIcon
} from "@mui/icons-material";
import Box from "@mui/material/Box";

export default function TopBar({
  user,
  menuItems = [],
  onSignOut,
  onNavigate,
  onDrawerToggle,
  pathname
}: {
  user: any,
  menuItems?: any[],
  onSignOut: () => void,
  onNavigate: (path: string) => void,
  onDrawerToggle?: () => void,
  pathname: string
}) {

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
        {/* Sign Out Button */}
        <IconButton
          onClick={onSignOut}
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
          <LogoutIcon sx={{ color: '#0066CC' }} />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
} 