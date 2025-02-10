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

const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validatePassword = (password) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
};

const createSuperAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Get user input
        console.log('\n=== Create Super Admin ===\n');
        
        let name = await question('Enter name: ');
        while (!name || name.trim().length < 2) {
            console.log('Name must be at least 2 characters long');
            name = await question('Enter name: ');
        }

        let email = await question('Enter email: ');
        while (!validateEmail(email)) {
            console.log('Please enter a valid email address');
            email = await question('Enter email: ');
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('A user with this email already exists');
            process.exit(1);
        }

        let password = await question('Enter password (min 8 chars, 1 uppercase, 1 lowercase, 1 number): ');
        while (!validatePassword(password)) {
            console.log('Password must contain at least 8 characters, 1 uppercase letter, 1 lowercase letter, and 1 number');
            password = await question('Enter password: ');
        }

        let confirmPassword = await question('Confirm password: ');
        while (password !== confirmPassword) {
            console.log('Passwords do not match');
            confirmPassword = await question('Confirm password: ');
        }

        // Create super admin user - password will be hashed by the User model's pre-save middleware
        const superAdmin = await User.create({
            name,
            email,
            password, // No manual hashing here
            role: 'super_admin',
            status: 'active',
            subscription: 'professional'
        });

        console.log('\nSuper admin created successfully:');
        console.log('Name:', superAdmin.name);
        console.log('Email:', superAdmin.email);
        console.log('\nYou can now login at /super-admin/login');

        // Test password match
        const testMatch = await bcrypt.compare(password, superAdmin.password);
        console.log('\nPassword verification test:', testMatch ? 'PASSED' : 'FAILED');

    } catch (error) {
        console.error('Error creating super admin:', error);
    } finally {
        rl.close();
        await mongoose.disconnect();
        process.exit(0);
    }
};

createSuperAdmin();
