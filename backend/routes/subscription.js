import express from 'express';
import Stripe from 'stripe';
import { protect } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Price IDs mapping
const PLAN_PRICES = {
    starter: process.env.STRIPE_STARTER_PRICE_ID,
    professional: process.env.STRIPE_PROFESSIONAL_PRICE_ID
};

// Create subscription
router.post('/create-subscription', protect, async (req, res) => {
    try {
        const { planId, paymentMethodId, email } = req.body;

        // Get the correct price ID
        const priceId = PLAN_PRICES[planId];
        if (!priceId) {
            throw new Error('Invalid plan selected');
        }

        // Get or create customer
        let user = await User.findById(req.user.id);
        if (!user.stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: email || user.email,
                payment_method: paymentMethodId,
                invoice_settings: {
                    default_payment_method: paymentMethodId,
                },
            });
            user.stripeCustomerId = customer.id;
            await user.save();
        } else {
            // Update customer's default payment method
            await stripe.customers.update(user.stripeCustomerId, {
                invoice_settings: {
                    default_payment_method: paymentMethodId,
                },
            });
        }

        // Create subscription
        const subscription = await stripe.subscriptions.create({
            customer: user.stripeCustomerId,
            items: [{ price: priceId }],
            payment_behavior: 'default_incomplete',
            expand: ['latest_invoice.payment_intent'],
        });

        // Update user's subscription status
        await User.findByIdAndUpdate(req.user.id, {
            subscription: planId,
            subscriptionId: subscription.id,
            subscriptionStatus: subscription.status
        });

        res.json({
            subscriptionId: subscription.id,
            clientSecret: subscription.latest_invoice.payment_intent.client_secret
        });
    } catch (error) {
        console.error('Subscription creation error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Cancel subscription
router.post('/cancel', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user.subscriptionId) {
            return res.status(400).json({ error: 'No active subscription found' });
        }

        // Cancel the subscription at period end
        const subscription = await stripe.subscriptions.update(user.subscriptionId, {
            cancel_at_period_end: true
        });

        // Update user's subscription status
        user.subscriptionStatus = 'canceling';
        await user.save();

        res.json({
            message: 'Subscription will be canceled at the end of the billing period',
            subscription
        });
    } catch (error) {
        console.error('Subscription cancellation error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Get subscription status
router.get('/status', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user.subscriptionId) {
            return res.json({ subscription: null });
        }

        const subscription = await stripe.subscriptions.retrieve(user.subscriptionId);
        res.json({ subscription });
    } catch (error) {
        console.error('Error fetching subscription status:', error);
        res.status(400).json({ error: error.message });
    }
});

export default router;
