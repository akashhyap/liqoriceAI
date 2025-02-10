import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useAuth } from '../context/AuthContext';

const ImpersonationBanner = () => {
    const { isImpersonating, endImpersonation, user } = useAuth();

    if (!isImpersonating) {
        return null;
    }

    return (
        <Box
            sx={{
                bgcolor: 'warning.main',
                color: 'warning.contrastText',
                py: 1,
                px: 2,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 2
            }}
        >
            <Typography>
                You are currently viewing {user?.name}'s account
            </Typography>
            <Button
                variant="contained"
                color="inherit"
                size="small"
                onClick={endImpersonation}
            >
                Exit User View
            </Button>
        </Box>
    );
};

export default ImpersonationBanner;
