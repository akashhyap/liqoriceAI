import User from '../models/User.js';

const checkSubscription = (requiredPlan) => {
    return async (req, res, next) => {
        try {
            const user = await User.findById(req.user.id);
            
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Free tier can only access free features
            if (requiredPlan === 'free') {
                return next();
            }

            // Check if user's subscription meets the required plan level
            const planLevels = {
                'free': 0,
                'starter': 1,
                'pro': 2,
                'enterprise': 3
            };

            const userPlanLevel = planLevels[user.subscription] || 0;
            const requiredPlanLevel = planLevels[requiredPlan];

            if (userPlanLevel < requiredPlanLevel) {
                return res.status(403).json({
                    message: `This feature requires a ${requiredPlan} subscription`
                });
            }

            next();
        } catch (error) {
            console.error('Error checking subscription:', error);
            res.status(500).json({ message: 'Error checking subscription status' });
        }
    };
};

export default checkSubscription;
