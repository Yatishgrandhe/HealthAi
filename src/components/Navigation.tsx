"use client";

import { useState, useEffect } from 'react';
import { AppBar, Toolbar, Button, Box, IconButton, Drawer, List, ListItem, ListItemText } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu as MenuIcon, Close as CloseIcon } from '@mui/icons-material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';


const navItems = [
  { name: 'Home', path: '/' },
  { name: 'How It Works', path: '/how-it-works' },
  { name: 'Health Tools', path: '/health-tools' },
  { name: 'Partner Hospitals', path: '/hospitals' },
  { name: 'Login', path: '/login' },
  { name: 'Register', path: '/register' },
];

export default function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  const drawer = (
    <Box sx={{ width: 280, pt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
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
      <List>
        {navItems.map((item) => (
          <ListItem 
            key={item.name} 
            component={Link} 
            href={item.path}
            onClick={() => setMobileOpen(false)}
            sx={{
              color: isActive(item.path) ? 'primary.main' : 'text.primary',
              fontWeight: isActive(item.path) ? 600 : 400,
              '&:hover': {
                backgroundColor: 'rgba(0, 102, 204, 0.1)',
              }
            }}
          >
            <ListItemText 
              primary={item.name} 
              sx={{
                '& .MuiListItemText-primary': {
                  fontSize: '1.1rem',
                }
              }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar 
        position="fixed" 
        elevation={scrolled ? 8 : 0}
        sx={{
          background: 'linear-gradient(90deg, #0066CC 0%, #004499 100%)',
          minHeight: { xs: '80px', md: '100px' },
          height: { xs: '80px', md: '100px' },
          justifyContent: 'flex-start',
          boxShadow: scrolled ? 8 : 0,
          zIndex: 1200,
        }}
      >
        <Toolbar sx={{ 
          justifyContent: 'space-between', 
          px: { xs: 3, md: 6 },
          minHeight: { xs: '80px', md: '100px' },
          py: 0,
          maxWidth: '1400px',
          mx: 'auto',
          width: '100%'
        }}>
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: 2,
                cursor: 'pointer',
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: { xs: 52, md: 60 },
                  height: { xs: 52, md: 60 },
                  position: 'relative',
                }}>
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
                </Box>
                <Box sx={{ 
                  display: { xs: 'none', sm: 'block' },
                  color: 'white',
                  fontWeight: 700,
                  fontSize: { xs: '1.25rem', md: '1.5rem' },
                  letterSpacing: '-0.5px',
                }}>
                  Health AI
                </Box>
              </Box>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2 }}>
            <AnimatePresence>
              {navItems.map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Button
                    component={Link}
                    href={item.path}
                    sx={{
                      color: scrolled ? 'text.primary' : 'white',
                      fontWeight: isActive(item.path) ? 600 : 400,
                      position: 'relative',
                      px: 3,
                      py: 1.5,
                      fontSize: '1rem',
                      textTransform: 'none',
                      borderRadius: '28px',
                      minWidth: 'auto',
                      background: 'transparent',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: 0,
                        left: '50%',
                        width: isActive(item.path) ? '100%' : '0%',
                        height: '3px',
                        background: 'linear-gradient(90deg, #0066CC, #3399FF)',
                        transform: 'translateX(-50%)',
                        transition: 'width 0.3s ease',
                        borderRadius: '2px',
                      },
                      '&:hover::after': {
                        width: '100%',
                      },
                      '&:hover': {
                        background: scrolled ? 'rgba(0, 102, 204, 0.15)' : 'rgba(255, 255, 255, 0.15)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        color: scrolled ? 'primary.main' : 'white',
                      },
                      '&:active': {
                        transform: 'translateY(0px)',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                      },
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    {item.name}
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </Box>

          {/* Mobile Menu Button */}
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              display: { md: 'none' },
              color: scrolled ? 'text.primary' : 'white',
              p: 1.5,
              borderRadius: '50%',
              '&:hover': {
                background: scrolled ? 'rgba(0, 102, 204, 0.1)' : 'rgba(255, 255, 255, 0.1)',
                transform: 'scale(1.05)',
              },
              transition: 'all 0.3s ease'
            }}
          >
            <MenuIcon sx={{ fontSize: 32 }} />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: 280,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
          <IconButton onClick={handleDrawerToggle}>
            <CloseIcon />
          </IconButton>
        </Box>
        {drawer}
      </Drawer>
    </>
  );
} 