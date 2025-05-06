import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'appointment', required: true },
    paymentId: { type: String, required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    bank: { type: String, required: true },
    branch: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Declined'], default: 'Pending' },
    fileUrl: { type: String, required: true },
    refundId: { type: mongoose.Schema.Types.ObjectId, ref: 'Refund' },
    createdAt: { type: Date, default: Date.now },
});

// Ensure indexes are not unique
paymentSchema.pre('save', async function() {
    try {
        // Drop any existing unique index on branch field
        await this.collection.dropIndex('branch_1');
    } catch (error) {
        // Ignore error if index doesn't exist
        if (error.code !== 27) {
            throw error;
        }
    }
});

export default mongoose.model('Payment', paymentSchema);