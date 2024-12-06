import React from 'react';
import { Container, Box, Typography } from '@mui/material';
import SubscriptionPlans from '../components/subscription/SubscriptionPlans';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const SubscriptionPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, updateUser } = useAuth();

    const handlePlanSelect = async (planId: string) => {
        try {
            // Directly update subscription without payment
            const response = await fetch('/api/subscription/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    planId,
                    bypassPayment: true // Add this flag for testing
                })
            });

            if (response.ok) {
                const updatedUser = await response.json();
                updateUser(updatedUser);
                navigate('/dashboard');
            }
        } catch (error) {
            console.error('Error updating subscription:', error);
        }
    };

    return (
        <Container maxWidth="lg">
            <Box sx={{ width: '100%', mt: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Choose Your Plan
                </Typography>
                <SubscriptionPlans
                    currentPlan={user?.subscription}
                    onSelectPlan={handlePlanSelect}
                />
            </Box>
        </Container>
    );
};

export default SubscriptionPage;
