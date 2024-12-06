const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const auth = require('../middleware/auth');
const User = require('../models/User.js');

const PLAN_PRICES = {
    starter: process.env.STRIPE_STARTER_PRICE_ID,
    pro: process.env.STRIPE_PRO_PRICE_ID,
    enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID
};

// Create a subscription
router.post('/create-subscription', auth, async (req, res) => {
    try {
        const { planId, email } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Create or get customer
        let customer;
        if (user.stripeCustomerId) {
            customer = await stripe.customers.retrieve(user.stripeCustomerId);
        } else {
            customer = await stripe.customers.create({
                email: email || user.email
            });
            user.stripeCustomerId = customer.id;
            await user.save();
        }

        // Create subscription
        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [{ price: PLAN_PRICES[planId] }],
            payment_behavior: 'default_incomplete',
            expand: ['latest_invoice.payment_intent']
        });

        res.json({
            clientSecret: subscription.latest_invoice.payment_intent.client_secret
        });
    } catch (error) {
        console.error('Error creating subscription:', error);
        res.status(500).json({ message: 'Error creating subscription' });
    }
});

// Update subscription status
router.post('/update', auth, async (req, res) => {
    try {
        const { planId } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update user's subscription
        user.subscription = planId;
        await user.save();

        res.json(user);
    } catch (error) {
        console.error('Error updating subscription:', error);
        res.status(500).json({ message: 'Error updating subscription' });
    }
});

// Get subscription details
router.get('/details', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.stripeCustomerId) {
            return res.json({ subscription: null });
        }

        const subscriptions = await stripe.subscriptions.list({
            customer: user.stripeCustomerId,
            status: 'active',
            expand: ['data.default_payment_method']
        });

        res.json({
            subscription: subscriptions.data[0] || null
        });
    } catch (error) {
        console.error('Error fetching subscription details:', error);
        res.status(500).json({ message: 'Error fetching subscription details' });
    }
});

// Cancel subscription
router.post('/cancel', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user || !user.stripeCustomerId) {
            return res.status(404).json({ message: 'User or subscription not found' });
        }

        const subscriptions = await stripe.subscriptions.list({
            customer: user.stripeCustomerId,
            status: 'active'
        });

        if (subscriptions.data.length === 0) {
            return res.status(404).json({ message: 'No active subscription found' });
        }

        // Cancel the subscription at period end
        await stripe.subscriptions.update(subscriptions.data[0].id, {
            cancel_at_period_end: true
        });

        res.json({ message: 'Subscription will be canceled at the end of the billing period' });
    } catch (error) {
        console.error('Error canceling subscription:', error);
        res.status(500).json({ message: 'Error canceling subscription' });
    }
});

// Stripe webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];

    try {
        const event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );

        // Handle the event
        switch (event.type) {
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted':
                const subscription = event.data.object;
                const user = await User.findOne({
                    stripeCustomerId: subscription.customer
                });

                if (user) {
                    if (subscription.status === 'active') {
                        // Update user's subscription status
                        user.subscription = subscription.items.data[0].price.nickname.toLowerCase();
                    } else if (subscription.status === 'canceled') {
                        user.subscription = 'free';
                    }
                    await user.save();
                }
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(400).send(`Webhook Error: ${error.message}`);
    }
});

module.exports = router;
