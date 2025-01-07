import React, { useState } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    TextField,
    Typography,
    Alert
} from '@mui/material';
import {
    CardElement,
    useStripe,
    useElements
} from '@stripe/react-stripe-js';

interface PaymentFormProps {
    planId: string;
    onSuccess: () => void;
    onCancel: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
    planId,
    onSuccess,
    onCancel
}) => {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [email, setEmail] = useState('');

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setProcessing(true);
        setError(null);

        try {
            const cardElement = elements.getElement(CardElement);
            if (!cardElement) {
                throw new Error('Card element not found');
            }

            // Create payment method
            const { error: cardError, paymentMethod } = await stripe.createPaymentMethod({
                type: 'card',
                card: cardElement,
                billing_details: {
                    email
                }
            });

            if (cardError) {
                throw cardError;
            }

            // Create subscription with payment method
            const response = await fetch(`${process.env.REACT_APP_API_URL}/subscription/create-subscription`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    planId,
                    email,
                    paymentMethodId: paymentMethod.id
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create subscription');
            }

            const { clientSecret } = await response.json();

            // Confirm the payment
            const { error: confirmError } = await stripe.confirmCardPayment(clientSecret);

            if (confirmError) {
                throw confirmError;
            }

            onSuccess();
        } catch (err: any) {
            setError(err.message || 'An error occurred');
            setProcessing(false);
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit}>
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Payment Details
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <TextField
                        fullWidth
                        type="email"
                        label="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        sx={{ mb: 2 }}
                    />

                    <Box sx={{ mb: 2 }}>
                        <CardElement
                            options={{
                                style: {
                                    base: {
                                        fontSize: '16px',
                                        color: '#424770',
                                        '::placeholder': {
                                            color: '#aab7c4'
                                        }
                                    },
                                    invalid: {
                                        color: '#9e2146'
                                    }
                                }
                            }}
                        />
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button
                            type="button"
                            onClick={onCancel}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={!stripe || processing}
                        >
                            {processing ? 'Processing...' : 'Subscribe'}
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default PaymentForm;
