import React from 'react';
import { useLocation } from 'react-router-dom';
import { Box, styled } from '@mui/material';
import { ChatWindow } from '../components/widget';

const FullScreenContainer = styled(Box)({
    width: '100vw',
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
});

const ChatContainer = styled(Box)(({ theme }) => ({
    width: '100%',
    height: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
    [theme.breakpoints.up('sm')]: {
        padding: theme.spacing(2),
        height: 'calc(100% - 32px)',
    },
}));

const FullScreenChat: React.FC = () => {
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    
    const botId = params.get('botId') || '';
    const apiEndpoint = params.get('apiEndpoint') || '';
    const theme = {
        primaryColor: params.get('primaryColor') || '#2563eb',
        fontFamily: params.get('fontFamily') || 'Inter, system-ui, sans-serif',
        borderRadius: params.get('borderRadius') || '8px',
        buttonColor: params.get('buttonColor') || '#2563eb',
        backgroundColor: params.get('backgroundColor') || '#ffffff',
        headerColor: params.get('headerColor') || '#1e40af',
    };

    if (!botId || !apiEndpoint) {
        return (
            <Box p={3}>
                <h1>Invalid Chat Link</h1>
                <p>This chat link appears to be invalid or expired.</p>
            </Box>
        );
    }

    return (
        <FullScreenContainer>
            <ChatContainer>
                <ChatWindow
                    botId={botId}
                    apiEndpoint={apiEndpoint}
                    theme={theme}
                    isFullScreen
                />
            </ChatContainer>
        </FullScreenContainer>
    );
};

export default FullScreenChat;
