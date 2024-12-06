import React, { useState } from 'react';
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
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';

const LandingNavbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const navItems = [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'About', href: '#about' },
  ];

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
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
                  bgcolor: 'secondary.main',
                  color: 'white',
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  px: 3,
                  borderRadius: '30px',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  }
                }}
              >
                Get Started
              </Button>
            </Box>
          )}

          {/* Mobile Menu Button */}
          {isMobile && (
            <IconButton
              edge="end"
              color="inherit"
              aria-label="menu"
              onClick={handleMobileMenuToggle}
              sx={{ color: 'text.primary' }}
            >
              {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </IconButton>
          )}
        </Toolbar>
      </Container>

      {/* Mobile Menu Drawer */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen && isMobile}
        onClose={handleMobileMenuToggle}
        PaperProps={{
          sx: {
            width: '100%',
            backgroundColor: 'white',
            color: 'text.primary',
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <IconButton
            color="inherit"
            onClick={handleMobileMenuToggle}
            sx={{ mb: 2, color: 'text.primary' }}
          >
            <CloseIcon />
          </IconButton>
          <List>
            {navItems.map((item) => (
              <ListItem 
                key={item.label}
                component="a"
                href={item.href}
                onClick={handleMobileMenuToggle}
                sx={{
                  py: 2,
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  }
                }}
              >
                <ListItemText 
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '1.1rem',
                    fontWeight: 500,
                    color: 'text.primary'
                  }}
                />
              </ListItem>
            ))}
            <ListItem sx={{ pt: 4 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  navigate('/login');
                  handleMobileMenuToggle();
                }}
                sx={{
                  color: 'primary.main',
                  borderColor: 'primary.main',
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  py: 1.5,
                  borderRadius: '30px',
                  mb: 2,
                  '&:hover': {
                    borderColor: 'primary.dark',
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  }
                }}
              >
                Sign In
              </Button>
              <Button
                fullWidth
                variant="contained"
                onClick={() => {
                  navigate('/register');
                  handleMobileMenuToggle();
                }}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  py: 1.5,
                  borderRadius: '30px',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  }
                }}
              >
                Get Started
              </Button>
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
};

export default LandingNavbar;