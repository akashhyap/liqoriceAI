import mongoose from 'mongoose';

const visitorUserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        trim: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    lastLoginAt: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    },
    totalSessions: {
        type: Number,
        default: 0
    },
    metadata: {
        browser: String,
        os: String,
        device: String,
        lastIp: String
    }
}, {
    timestamps: true
});

// Method to update last login
visitorUserSchema.methods.updateLastLogin = async function() {
    this.lastLoginAt = Date.now();
    this.totalSessions += 1;
    await this.save();
};

const VisitorUser = mongoose.model('VisitorUser', visitorUserSchema);

export default VisitorUser;
