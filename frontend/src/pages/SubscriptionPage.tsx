import React from 'react';
import { Container, Box, Typography, Alert, CircularProgress } from '@mui/material';
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
    const [error, setError] = React.useState<string>('');
    const [loading, setLoading] = React.useState(false);

    const handlePlanSelect = async (planId: string) => {
        try {
            setLoading(true);
            setError('');
            setSelectedPlan(planId);
            
            // Skip payment for free plan
            if (planId === 'free') {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/subscription/update`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ planId })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to update subscription');
                }

                const userData = await response.json();
                updateUser(userData);
                navigate('/dashboard');
                return;
            }
            
            // Create subscription intent for paid plans
            const response = await fetch(`${process.env.REACT_APP_API_URL}/subscription/create-subscription`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ planId })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create subscription');
            }

            const data = await response.json();
            if (!data.clientSecret) {
                throw new Error('No client secret received');
            }
            setClientSecret(data.clientSecret);
        } catch (err: any) {
            console.error('Error creating subscription:', err);
            setError(err.message || 'An error occurred while processing your request');
            setSelectedPlan(null);
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentSuccess = async () => {
        try {
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
        } catch (err) {
            console.error('Error updating user data:', err);
        }
    };

    const handlePaymentCancel = () => {
        setSelectedPlan(null);
        setClientSecret('');
        setError('');
    };

    return (
        <Container maxWidth="lg">
            <Box sx={{ width: '100%', mt: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Choose Your Plan
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : !selectedPlan || selectedPlan === 'free' ? (
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
