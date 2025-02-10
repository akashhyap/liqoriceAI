import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import ImpersonationBanner from './ImpersonationBanner';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isImpersonating } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
      <CssBaseline />
      {isImpersonating && <ImpersonationBanner />}
      <Box sx={{ display: 'flex', flex: 1 }}>
        <Navbar onMenuClick={handleDrawerToggle} />
        <Sidebar mobileOpen={mobileOpen} onMobileClose={handleDrawerToggle} />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            mt: '64px',
            width: '100%',
            maxWidth: '100vw',
            overflowX: 'hidden',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
