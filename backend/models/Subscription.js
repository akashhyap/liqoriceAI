import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    plan: {
        type: String,
        enum: ['free', 'starter', 'professional'],
        default: 'free'
    },
    status: {
        type: String,
        enum: ['active', 'cancelled', 'expired'],
        default: 'active'
    },
    currentPeriodStart: {
        type: Date,
        required: true
    },
    currentPeriodEnd: {
        type: Date,
        required: true
    },
    cancelAtPeriodEnd: {
        type: Boolean,
        default: false
    },
    stripeSubscriptionId: {
        type: String,
        sparse: true
    },
    stripeCustomerId: {
        type: String,
        sparse: true
    },
    lastPaymentStatus: {
        type: String,
        enum: ['succeeded', 'failed', 'pending'],
        default: 'succeeded'
    },
    features: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

// Index for efficient queries
subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ plan: 1 });
subscriptionSchema.index({ stripeSubscriptionId: 1 });

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;
