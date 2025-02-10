import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        enum: [
            'user_create',
            'user_update',
            'user_delete',
            'subscription_update',
            'subscription_cancel',
            'user_suspend',
            'user_impersonation'
        ]
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    targetUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    details: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    previousState: mongoose.Schema.Types.Mixed,
    newState: mongoose.Schema.Types.Mixed,
    ip: String,
    userAgent: String
}, {
    timestamps: true
});

// Index for efficient querying
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ targetUser: 1, createdAt: -1 });
auditLogSchema.index({ performedBy: 1, createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
