import User from '../models/User.js';

class UsageService {
    static async trackMessageUsage(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Get usage limits based on subscription
            const usageLimits = {
                free: 100,
                starter: 1000,
                pro: 5000,
                enterprise: Infinity
            };

            const limit = usageLimits[user.subscription] || usageLimits.free;

            // Check if user has exceeded their limit
            if (user.usage.messages >= limit) {
                throw new Error('Message limit exceeded for current subscription');
            }

            // Increment message count
            user.usage.messages += 1;
            await user.save();

            return {
                current: user.usage.messages,
                limit: limit
            };
        } catch (error) {
            console.error('Error tracking message usage:', error);
            throw error;
        }
    }

    static async trackStorageUsage(userId, bytes) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Storage limits in bytes
            const storageLimits = {
                free: 100 * 1024 * 1024, // 100MB
                starter: 1024 * 1024 * 1024, // 1GB
                pro: 5 * 1024 * 1024 * 1024, // 5GB
                enterprise: Infinity
            };

            const limit = storageLimits[user.subscription] || storageLimits.free;

            // Check if user would exceed their limit
            if (user.usage.storage + bytes > limit) {
                throw new Error('Storage limit exceeded for current subscription');
            }

            // Increment storage usage
            user.usage.storage += bytes;
            await user.save();

            return {
                current: user.usage.storage,
                limit: limit
            };
        } catch (error) {
            console.error('Error tracking storage usage:', error);
            throw error;
        }
    }

    static async resetUsage(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            user.usage = {
                messages: 0,
                storage: 0
            };
            await user.save();

            return user.usage;
        } catch (error) {
            console.error('Error resetting usage:', error);
            throw error;
        }
    }
}

export default UsageService;
