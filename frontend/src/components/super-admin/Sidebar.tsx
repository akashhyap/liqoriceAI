import React from 'react';
import {
    Box,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Paper,
    Typography
} from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';

const Sidebar = () => {
    const location = useLocation();

    const menuItems = [
        {
            text: 'Dashboard',
            icon: <DashboardIcon />,
            path: '/super-admin/dashboard'
        },
        {
            text: 'Users',
            icon: <PeopleIcon />,
            path: '/super-admin/users'
        },
        {
            text: 'Settings',
            icon: <SettingsIcon />,
            path: '/super-admin/settings'
        }
    ];

    return (
        <Paper 
            elevation={0}
            sx={{
                width: 240,
                minHeight: '100vh',
                borderRight: '1px solid rgba(0, 0, 0, 0.12)',
                bgcolor: 'background.paper'
            }}
        >
            <Box p={2}>
                <Typography variant="h6" component="div" gutterBottom>
                    Super Admin Panel
                </Typography>
            </Box>
            <List>
                {menuItems.map((item) => (
                    <ListItem
                        key={item.text}
                        component={Link}
                        to={item.path}
                        selected={location.pathname === item.path}
                        sx={{
                            color: 'inherit',
                            textDecoration: 'none',
                            '&.Mui-selected': {
                                bgcolor: 'action.selected'
                            },
                            '&:hover': {
                                bgcolor: 'action.hover'
                            }
                        }}
                    >
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.text} />
                    </ListItem>
                ))}
            </List>
        </Paper>
    );
};

export default Sidebar;
