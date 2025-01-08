import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        trim: true,
        maxlength: [50, 'Name cannot be more than 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'super_admin'],
        default: 'user'
    },
    subscription: {
        type: String,
        enum: ['free', 'starter', 'professional'],
        default: 'free'
    },
    apiKey: {
        type: String,
        unique: true,
        sparse: true
    },
    usage: {
        messages: {
            type: Number,
            default: 0
        },
        storage: {
            type: Number,
            default: 0
        }
    },
    notificationSettings: {
        email: {
            newMessages: {
                type: Boolean,
                default: true
            },
            weeklyReports: {
                type: Boolean,
                default: true
            },
            systemUpdates: {
                type: Boolean,
                default: true
            }
        },
        push: {
            enabled: {
                type: Boolean,
                default: true
            }
        }
    },
    address: {
        street: String,
        city: String,
        state: String,
        country: String,
        zipCode: String
    },
    status: {
        type: String,
        enum: ['active', 'suspended', 'deleted'],
        default: 'active'
    },
    stripeCustomerId: {
        type: String,
        sparse: true
    },
    subscriptionDetails: {
        id: String,
        status: String,
        currentPeriodEnd: Date,
        cancelAtPeriodEnd: Boolean
    }
}, {
    timestamps: true
});

// Convert email to lowercase before saving
userSchema.pre('save', async function(next) {
    if (this.isModified('email')) {
        this.email = this.email.toLowerCase();
    }
    next();
});

// Encrypt password using bcrypt
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        next();
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Sign JWT and return
userSchema.methods.getSignedJwtToken = function() {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
    try {
        // Log password comparison details for debugging
        console.log('Comparing passwords:', {
            enteredLength: enteredPassword.length,
            hashedLength: this.password.length
        });
        
        // Use bcrypt.compare for password comparison
        const isMatch = await bcrypt.compare(enteredPassword, this.password);
        console.log('bcrypt comparison result:', isMatch);
        return isMatch;
    } catch (error) {
        console.error('Password comparison error:', error);
        return false;
    }
};

// Generate API key
userSchema.methods.generateApiKey = function() {
    const apiKey = crypto.randomBytes(32).toString('hex');
    this.apiKey = apiKey;
    return apiKey;
};

const User = mongoose.model('User', userSchema);

export default User;
