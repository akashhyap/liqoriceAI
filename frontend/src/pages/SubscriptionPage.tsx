import React from 'react';
import { Container, Box, Typography } from '@mui/material';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import SubscriptionPlans from '../components/subscription/SubscriptionPlans';
import PaymentForm from '../components/subscription/PaymentForm';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Initialize Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY!);

const SubscriptionPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, updateUser } = useAuth();
    const [selectedPlan, setSelectedPlan] = React.useState<string | null>(null);
    const [clientSecret, setClientSecret] = React.useState<string>('');

    const handlePlanSelect = async (planId: string) => {
        try {
            setSelectedPlan(planId);
            
            // Create subscription intent
            const response = await fetch(`${process.env.REACT_APP_API_URL}/subscription/create-subscription`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ planId })
            });

            if (!response.ok) {
                throw new Error('Failed to create subscription');
            }

            const data = await response.json();
            setClientSecret(data.clientSecret);
        } catch (error) {
            console.error('Error creating subscription:', error);
        }
    };

    const handlePaymentSuccess = async () => {
        // Refresh user data
        const response = await fetch(`${process.env.REACT_APP_API_URL}/user/me`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        if (response.ok) {
            const userData = await response.json();
            updateUser(userData);
        }
        navigate('/dashboard');
    };

    const handlePaymentCancel = () => {
        setSelectedPlan(null);
        setClientSecret('');
    };

    return (
        <Container maxWidth="lg">
            <Box sx={{ width: '100%', mt: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Choose Your Plan
                </Typography>
                {!selectedPlan ? (
                    <SubscriptionPlans
                        currentPlan={user?.subscription}
                        onSelectPlan={handlePlanSelect}
                    />
                ) : clientSecret && (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                        <PaymentForm
                            planId={selectedPlan}
                            onSuccess={handlePaymentSuccess}
                            onCancel={handlePaymentCancel}
                        />
                    </Elements>
                )}
            </Box>
        </Container>
    );
};

export default SubscriptionPage;
