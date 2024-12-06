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
    useElements,
    Elements
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import axios from '../../services/axios';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY!);

interface PaymentFormProps {
    planId: string;
    onSuccess: () => void;
    onCancel: () => void;
}

const PaymentFormContent: React.FC<PaymentFormProps> = ({
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
            // Create payment intent
            const { data: clientSecret } = await axios.post('/create-subscription', {
                planId,
                email
            });

            // Confirm the payment with Stripe
            const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
                clientSecret,
                {
                    payment_method: {
                        card: elements.getElement(CardElement)!,
                        billing_details: {
                            email
                        }
                    }
                }
            );

            if (stripeError) {
                setError(stripeError.message || 'An error occurred');
            } else if (paymentIntent.status === 'succeeded') {
                onSuccess();
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        }

        setProcessing(false);
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

const PaymentForm: React.FC<PaymentFormProps> = (props) => {
    return (
        <Elements stripe={stripePromise}>
            <PaymentFormContent {...props} />
        </Elements>
    );
};

export default PaymentForm;
