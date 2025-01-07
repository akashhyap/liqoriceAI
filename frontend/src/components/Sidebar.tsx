import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Notifications as NotificationsIcon,
  CreditCard as CreditCardIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 240;

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const Sidebar = ({ mobileOpen = false, onMobileClose }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/app/dashboard' },
    { text: 'Settings', icon: <NotificationsIcon />, path: '/app/settings' },
    { text: 'Subscription', icon: <CreditCardIcon />, path: '/app/subscription' },
  ];

  const drawer = (
    <Box sx={{ mt: 8, px:2 }}>
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => {
              navigate(item.path);
              if (isMobile && onMobileClose) {
                onMobileClose();
              }
            }}
            selected={location.pathname === item.path}
            sx={{
              mb: 1,
              px:1,
              borderRadius: 1,
              '&.Mui-selected': {
                backgroundColor: 'primary.main',
                color: 'white',
                '& .MuiListItemIcon-root': {
                  color: 'white',
                },
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
              },
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{
        width: { md: mobileOpen ? drawerWidth : 0 },
        flexShrink: 0,
      }}
    >
      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: theme.palette.background.default,
            borderRight: '1px solid',
            borderColor: 'divider',
            boxShadow: isMobile ? '4px 0 8px rgba(0,0,0,0.1)' : 'none',
            top: 0,
            zIndex: theme.zIndex.drawer,
            visibility: {
              xs: 'visible',
              md: mobileOpen ? 'visible' : 'hidden'
            },
            transform: {
              xs: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
              md: 'none'
            },
            transition: theme.transitions.create(['transform', 'width'], {
              duration: theme.transitions.duration.standard,
            }),
          },
        }}
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
