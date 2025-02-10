import React from 'react';
import {
    Box,
    Drawer,
    AppBar,
    Toolbar,
    List,
    Typography,
    Divider,
    IconButton,
    ListItem,
    ListItemIcon,
    ListItemText,
    Container,
    useTheme
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    People as PeopleIcon,
    History as HistoryIcon,
    PersonAdd as PersonAddIcon,
    Menu as MenuIcon
} from '@mui/icons-material';
import { Link, Outlet, useLocation } from 'react-router-dom';

const drawerWidth = 240;

const SuperAdminLayout: React.FC = () => {
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const theme = useTheme();
    const location = useLocation();

    const menuItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/super-admin' },
        { text: 'Users', icon: <PeopleIcon />, path: '/super-admin/users' },
        { text: 'Audit Logs', icon: <HistoryIcon />, path: '/super-admin/audit-logs' },
        { text: 'Create Super Admin', icon: <PersonAddIcon />, path: '/super-admin/create' }
    ];

    const drawer = (
        <div>
            <Toolbar>
                <Typography variant="h6" noWrap component="div">
                    Super Admin
                </Typography>
            </Toolbar>
            <Divider />
            <List>
                {menuItems.map((item) => (
                    <ListItem
                        button
                        key={item.text}
                        component={Link}
                        to={item.path}
                        selected={location.pathname === item.path}
                        sx={{
                            '&.Mui-selected': {
                                backgroundColor: theme.palette.primary.main + '20'
                            }
                        }}
                    >
                        <ListItemIcon sx={{ color: location.pathname === item.path ? theme.palette.primary.main : 'inherit' }}>
                            {item.icon}
                        </ListItemIcon>
                        <ListItemText 
                            primary={item.text}
                            sx={{ 
                                color: location.pathname === item.path ? theme.palette.primary.main : 'inherit'
                            }}
                        />
                    </ListItem>
                ))}
            </List>
        </div>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` }
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        edge="start"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div">
                        {menuItems.find(item => item.path === location.pathname)?.text || 'Super Admin'}
                    </Typography>
                </Toolbar>
            </AppBar>
            <Box
                component="nav"
                sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
            >
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={() => setMobileOpen(false)}
                    ModalProps={{
                        keepMounted: true // Better open performance on mobile.
                    }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
                    }}
                >
                    {drawer}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    mt: 8
                }}
            >
                <Container maxWidth="lg">
                    <Outlet />
                </Container>
            </Box>
        </Box>
    );
};

export default SuperAdminLayout;
