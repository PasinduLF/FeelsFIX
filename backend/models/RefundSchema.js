import mongoose from 'mongoose';

const refundSchema = new mongoose.Schema({
    name: { type: String, required: true },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true },
    bankName: { type: String, required: true },
    branch: { type: String, required: true },
    accountNumber: { type: String, required: true },
    accountHolder: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Declined'], default: 'Pending' },
    createdAt: { type: Date, default: Date.now }
});

// Add index on paymentId to ensure one refund per payment
refundSchema.index({ paymentId: 1 }, { unique: true });

export default mongoose.model('Refund', refundSchema); 