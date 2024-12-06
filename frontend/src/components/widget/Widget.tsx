import React, { useState } from 'react';
import { Box, Fab, Slide } from '@mui/material';
import { Chat as ChatIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import ChatWindow from './ChatWindow';

interface WidgetProps {
    botId: string;
    apiEndpoint: string;
    widgetPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    theme?: {
        primaryColor: string;
        fontFamily: string;
        borderRadius: string;
        buttonColor: string;
        backgroundColor: string;
        headerColor: string;
    };
}

const WidgetContainer = styled(Box)<{ widgetPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' }>(({ widgetPosition }) => {
    const positions = {
        'bottom-right': { bottom: 20, right: 20 },
        'bottom-left': { bottom: 20, left: 20 },
        'top-right': { top: 20, right: 20 },
        'top-left': { top: 20, left: 20 }
    };

    return {
        position: 'fixed',
        ...(positions[widgetPosition || 'bottom-right']),
        zIndex: 1000,
    };
});

const ChatContainer = styled(Box)<{ 
    widgetPosition: string;
    customTheme: {
        backgroundColor: string;
        borderRadius: string;
    };
    isEnlarged: boolean;
}>(({ widgetPosition, customTheme, isEnlarged }) => {
    const isBottom = widgetPosition.startsWith('bottom');
    const isRight = widgetPosition.endsWith('right');

    return {
        position: 'fixed',
        right: isRight ? '20px' : 'auto',
        left: !isRight ? '20px' : 'auto',
        bottom: isBottom ? '100px' : 'auto',
        top: !isBottom ? '100px' : 'auto',
        width: isEnlarged ? '600px' : '400px',
        maxWidth: 'calc(100vw - 40px)',
        height: isEnlarged ? '700px' : '600px',
        maxHeight: isBottom ? 'calc(100vh - 120px)' : 'calc(100vh - 40px)',
        backgroundColor: customTheme.backgroundColor,
        borderRadius: customTheme.borderRadius,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        zIndex: 1000,
        overflow: 'hidden',
        transition: 'all 0.3s ease-in-out',
    };
});

const defaultTheme = {
    primaryColor: '#2563eb',
    fontFamily: 'Inter, system-ui, sans-serif',
    borderRadius: '8px',
    buttonColor: '#2563eb',
    backgroundColor: '#ffffff',
    headerColor: '#1e40af',
};

const Widget: React.FC<WidgetProps> = ({
    botId,
    apiEndpoint,
    widgetPosition = 'bottom-right',
    theme = defaultTheme,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isEnlarged, setIsEnlarged] = useState(false);

    const toggleChat = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            setIsEnlarged(false);
        }
    };

    return (
        <>
            <WidgetContainer widgetPosition={widgetPosition}>
                <Fab
                    color="primary"
                    onClick={toggleChat}
                    sx={{
                        backgroundColor: theme.buttonColor,
                        '&:hover': {
                            backgroundColor: theme.buttonColor,
                            opacity: 0.9,
                        },
                        display: isOpen ? 'none' : 'flex',
                    }}
                >
                    <ChatIcon />
                </Fab>
            </WidgetContainer>

            <Slide direction="up" in={isOpen} mountOnEnter unmountOnExit>
                <ChatContainer 
                    widgetPosition={widgetPosition} 
                    customTheme={theme} 
                    isEnlarged={isEnlarged}
                >
                    <ChatWindow
                        botId={botId}
                        apiEndpoint={apiEndpoint}
                        onClose={toggleChat}
                        theme={theme}
                        isEnlarged={isEnlarged}
                        onToggleEnlarge={() => setIsEnlarged(!isEnlarged)}
                    />
                </ChatContainer>
            </Slide>
        </>
    );
};

export default Widget;
