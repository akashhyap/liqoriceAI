import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import readline from 'readline';

dotenv.config();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const validatePassword = (password) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
};

const resetPassword = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const email = 'akash@localleads247.com';
        
        // Find the super admin
        const user = await User.findOne({ email, role: 'super_admin' });
        
        if (!user) {
            console.log('Super admin not found with email:', email);
            process.exit(1);
        }

        console.log('\nResetting password for super admin:', email);

        let password = await question('\nEnter new password (min 8 chars, 1 uppercase, 1 lowercase, 1 number): ');
        while (!validatePassword(password)) {
            console.log('Password must contain at least 8 characters, 1 uppercase letter, 1 lowercase letter, and 1 number');
            password = await question('Enter new password: ');
        }

        let confirmPassword = await question('Confirm password: ');
        while (password !== confirmPassword) {
            console.log('Passwords do not match');
            confirmPassword = await question('Confirm password: ');
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Update the password
        await User.findByIdAndUpdate(user._id, { password: hashedPassword });

        console.log('\nPassword updated successfully!');
        console.log('You can now login with your new password');

        // Test the new password
        const updatedUser = await User.findById(user._id).select('+password');
        const testMatch = await bcrypt.compare(password, updatedUser.password);
        console.log('\nPassword verification test:', testMatch ? 'PASSED' : 'FAILED');

    } catch (error) {
        console.error('Error resetting password:', error);
    } finally {
        rl.close();
        await mongoose.disconnect();
        process.exit(0);
    }
};

resetPassword();
