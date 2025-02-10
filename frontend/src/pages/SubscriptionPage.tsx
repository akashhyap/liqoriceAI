import React, { useState } from 'react';
import { Box, Container, Typography, Alert, CircularProgress } from '@mui/material';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import SubscriptionPlans from '../components/subscription/SubscriptionPlans';
import PaymentForm from '../components/subscription/PaymentForm';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Initialize Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY!);

const SubscriptionPageContent: React.FC = () => {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPaymentForm, setShowPaymentForm] = useState(false);

    const handlePlanSelect = async (planId: string) => {
        setError(null);
        setSelectedPlan(planId);

        if (planId === 'free') {
            setLoading(true);
            try {
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
                navigate('/app/dashboard');
            } catch (err: any) {
                console.error('Error updating to free plan:', err);
                setError(err.message || 'Failed to update subscription');
            } finally {
                setLoading(false);
            }
        } else {
            setShowPaymentForm(true);
        }
    };

    const handlePaymentSuccess = async () => {
        try {
            const userResponse = await fetch(`${process.env.REACT_APP_API_URL}/users/me`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (userResponse.ok) {
                const userData = await userResponse.json();
                updateUser(userData);
            }
            navigate('/app/dashboard');
        } catch (err: any) {
            console.error('Error updating user data:', err);
            setError(err.message || 'Failed to update user data');
        }
    };

    const handlePaymentCancel = () => {
        setSelectedPlan(null);
        setShowPaymentForm(false);
        setError(null);
    };

    return (
        <Container maxWidth="lg">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Choose Your Plan
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                        <CircularProgress />
                    </Box>
                )}

                <SubscriptionPlans
                    onSelectPlan={handlePlanSelect}
                    selectedPlan={selectedPlan}
                    currentPlan={user?.subscription || 'free'}
                    disabled={loading || showPaymentForm}
                />

                {showPaymentForm && selectedPlan && selectedPlan !== 'free' && (
                    <Box sx={{ mt: 4 }}>
                        <PaymentForm
                            planId={selectedPlan}
                            onSuccess={handlePaymentSuccess}
                            onCancel={handlePaymentCancel}
                        />
                    </Box>
                )}
            </Box>
        </Container>
    );
};

// Wrap the component with Stripe Elements
const SubscriptionPage: React.FC = () => (
    <Elements stripe={stripePromise}>
        <SubscriptionPageContent />
    </Elements>
);

export default SubscriptionPage;
