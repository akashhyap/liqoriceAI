import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, IconButton, Box, Menu, MenuItem, ListItemIcon, Avatar, Divider } from '@mui/material';
import { Menu as MenuIcon, AccountCircle, Logout as LogoutIcon, Person as PersonIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

interface NavbarProps {
  onMenuClick?: () => void;
}

const Navbar = ({ onMenuClick }: NavbarProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: (theme) => theme.palette.primary.main
      }}
    >
      <Toolbar>
        <IconButton
          size="large"
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={onMenuClick}
          sx={{ mr: 2, color: '#ffffff' }}
        >
          <MenuIcon />
        </IconButton>
        <Box
          component="img"
          src="/licorice-logo.png"
          alt="LiquoriceAI Logo"
          sx={{
            height: '40px',
            cursor: 'pointer',
            marginRight: 'auto',
            filter: 'brightness(0) invert(1)',
            WebkitFilter: 'brightness(0) invert(1)'
          }}
          onClick={() => navigate('/')}
        />
        <Box>
          <IconButton
            onClick={handleMenuOpen}
            sx={{
              padding: 0.5,
              border: '2px solid',
              borderColor: 'white',
            }}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: 'white',
                color: 'primary.main',
              }}
            >
              {user?.email?.[0].toUpperCase()}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            onClick={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              elevation: 0,
              sx: {
                width: '240px',
                mt: 1.5,
                overflow: 'visible',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
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
            <Box sx={{ 
              p: 2, 
              pb: 1.5,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}>
              {user?.email}
            </Box>

            <Box sx={{ mt: 1 }}>
              <MenuItem onClick={() => navigate('/app/dashboard/profile')}>
                <ListItemIcon>
                  <PersonIcon fontSize="small" />
                </ListItemIcon>
                Profile
              </MenuItem>

              <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" color="error" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Box>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
