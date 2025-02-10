import React from 'react';
import { Box, keyframes } from '@mui/material';

const bounce = keyframes`
  0%, 80%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  40% {
    transform: translateY(-4px);
    opacity: 1;
  }
`;

const TypingIndicator: React.FC = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.7,
        p: 1.5,
        maxWidth: 'fit-content',
        bgcolor: 'background.paper',
        borderRadius: 2,
        borderTopLeftRadius: 0,
        boxShadow: '0 2px 8px -2px rgba(0,0,0,0.07), 0 4px 16px -2px rgba(0,0,0,0.025)',
        ml: 1,
        mt: 1,
        mb: 2
      }}
    >
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          sx={{
            width: 5,
            height: 5,
            bgcolor: 'primary.main',
            borderRadius: '50%',
            opacity: 0.4,
            animation: `${bounce} 1.4s ease-in-out ${i * 0.16}s infinite both`,
          }}
        />
      ))}
    </Box>
  );
};

export default TypingIndicator;
