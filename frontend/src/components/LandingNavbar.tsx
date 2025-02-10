import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  Button,
  Container,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  useTheme,
  useMediaQuery,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Typography,
  ListItemIcon,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Settings, Logout } from '@mui/icons-material';

const LandingNavbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    console.log('Auth state in LandingNavbar:', { user });
  }, [user]);

  const navItems = [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'About', href: '#about' },
  ];

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    handleProfileMenuClose();
    navigate('/login');
  };

  return (
    <AppBar 
      position="fixed" 
      elevation={0}
      sx={{
        backgroundColor: 'white',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
      }}
    >
      <Container maxWidth="lg">
        <Toolbar sx={{ py: 2.5, justifyContent: 'space-between' }}>
          {/* Logo */}
          <Box
            component="img"
            src="/licorice-logo.png"
            alt="LiquoriceAI Logo"
            sx={{
              height: '50px',
              cursor: 'pointer'
            }}
            onClick={() => navigate('/')}
          />

          {/* Desktop Navigation */}
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {navItems.map((item) => (
                <Button
                  key={item.label}
                  color="inherit"
                  href={item.href}
                  sx={{
                    color: 'text.primary',
                    opacity: 0.9,
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 500,
                    '&:hover': {
                      opacity: 1,
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    }
                  }}
                >
                  {item.label}
                </Button>
              ))}
              
              {user ? (
                <>
                  <IconButton
                    onClick={handleProfileMenuOpen}
                    sx={{
                      padding: 0.5,
                      border: '2px solid',
                      borderColor: 'primary.main',
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: 'primary.main',
                        color: 'white',
                      }}
                    >
                      {user.email?.[0].toUpperCase()}
                    </Avatar>
                  </IconButton>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleProfileMenuClose}
                    onClick={handleProfileMenuClose}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    PaperProps={{
                      sx: {
                        width: '240px',
                        mt: 1.5,
                        '& .MuiMenuItem-root': {
                          px: 2,
                          py: 1,
                          borderRadius: 1,
                          mx: 1,
                          mb: 0.5,
                        },
                      },
                    }}
                  >
                    <Box sx={{ px: 2, py: 1.5 }}>
                      <Typography variant="subtitle1" noWrap>
                        {user.email}
                      </Typography>
                    </Box>
                    <Divider />
                    <MenuItem onClick={() => navigate('/app/dashboard')}>
                      <ListItemIcon>
                        <Settings fontSize="small" />
                      </ListItemIcon>
                      Dashboard
                    </MenuItem>
                    <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                      <ListItemIcon>
                        <Logout fontSize="small" color="error" />
                      </ListItemIcon>
                      Logout
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/login')}
                    sx={{
                      color: 'primary.main',
                      borderColor: 'primary.main',
                      textTransform: 'none',
                      fontSize: '1rem',
                      fontWeight: 600,
                      px: 3,
                      borderRadius: '30px',
                      '&:hover': {
                        borderColor: 'primary.dark',
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      }
                    }}
                  >
                    Sign In
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => navigate('/register')}
                    sx={{
                      color: 'white',
                      textTransform: 'none',
                      fontSize: '1rem',
                      fontWeight: 600,
                      px: 3,
                      borderRadius: '30px',
                    }}
                  >
                    Get Started
                  </Button>
                </>
              )}
            </Box>
          )}

          {/* Mobile Menu Icon */}
          {isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={handleMobileMenuToggle}
              sx={{ color: 'text.primary' }}
            >
              {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </IconButton>
          )}

          {/* Mobile Menu Drawer */}
          <Drawer
            anchor="right"
            open={mobileMenuOpen}
            onClose={handleMobileMenuToggle}
            PaperProps={{
              sx: {
                width: '100%',
                maxWidth: '300px',
                bgcolor: 'background.paper',
                pt: 8
              }
            }}
          >
            <List>
              {navItems.map((item) => (
                <ListItem key={item.label} button href={item.href}>
                  <ListItemText primary={item.label} />
                </ListItem>
              ))}
              {user ? (
                <>
                  <ListItem button onClick={() => navigate('/app/settings')}>
                    <ListItemText primary="Settings" />
                  </ListItem>
                  <ListItem button onClick={handleLogout}>
                    <ListItemText primary="Logout" sx={{ color: 'error.main' }} />
                  </ListItem>
                </>
              ) : (
                <>
                  <ListItem button onClick={() => navigate('/login')}>
                    <ListItemText primary="Sign In" />
                  </ListItem>
                  <ListItem button onClick={() => navigate('/register')}>
                    <ListItemText primary="Get Started" />
                  </ListItem>
                </>
              )}
            </List>
          </Drawer>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default LandingNavbar;