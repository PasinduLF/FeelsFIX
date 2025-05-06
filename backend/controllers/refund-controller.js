import Refund from '../models/RefundSchema.js';
import Payment from '../models/PaymentSchema.js';

// Create a new refund request
const createRefund = async (req, res) => {
    try {
        const { name, paymentId, bankName, branch, accountNumber, accountHolder } = req.body;

        // Check if payment exists and is approved
        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({ error: "Payment not found" });
        }
        if (payment.status !== 'Approved') {
            return res.status(400).json({ error: "Can only request refund for approved payments" });
        }

        // Check if refund already exists
        const existingRefund = await Refund.findOne({ paymentId });
        if (existingRefund) {
            return res.status(400).json({ error: "Refund request already exists for this payment" });
        }

        const newRefund = new Refund({
            name,
            paymentId,
            bankName,
            branch,
            accountNumber,
            accountHolder,
            isNew: true
        });

        await newRefund.save();

        // Update payment with refund reference
        await Payment.findByIdAndUpdate(paymentId, { refundId: newRefund._id });

        res.status(201).json({ 
            message: "Refund request submitted successfully!", 
            refund: newRefund 
        });

    } catch (error) {
        console.error("Refund request error:", error);
        res.status(500).json({ 
            error: error.message || "Server error during refund request submission." 
        });
    }
};

// Get all refunds
const getRefunds = async (req, res) => {
    try {
        const refunds = await Refund.find().populate('paymentId');
        res.status(200).json(refunds);
    } catch (error) {
        console.error("Get refunds error:", error);
        res.status(500).json({ error: "Failed to fetch refunds" });
    }
};

// Update refund status
const updateRefundStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const refund = await Refund.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!refund) {
            return res.status(404).json({ error: "Refund not found" });
        }

        res.status(200).json({ message: "Refund status updated", refund });
    } catch (error) {
        console.error("Update refund status error:", error);
        res.status(500).json({ error: "Failed to update refund status" });
    }
};

// Delete refund
const deleteRefund = async (req, res) => {
    try {
        const { id } = req.params;
        const refund = await Refund.findById(id);

        if (!refund) {
            return res.status(404).json({ error: "Refund not found" });
        }

        // Remove refund reference from payment
        await Payment.findByIdAndUpdate(refund.paymentId, { refundId: null });
        
        // Delete refund
        await Refund.findByIdAndDelete(id);

        res.status(200).json({ message: "Refund deleted successfully" });
    } catch (error) {
        console.error("Delete refund error:", error);
        res.status(500).json({ error: "Failed to delete refund" });
    }
};

// Complete refund
const completeRefund = async (req, res) => {
    try {
        const { id } = req.params;
        const refund = await Refund.findByIdAndUpdate(
            id,
            { status: 'Completed' },
            { new: true }
        );

        if (!refund) {
            return res.status(404).json({ error: "Refund not found" });
        }

        res.status(200).json({ message: "Refund marked as completed", refund });
    } catch (error) {
        console.error("Complete refund error:", error);
        res.status(500).json({ error: "Failed to complete refund" });
    }
};

export { createRefund, getRefunds, updateRefundStatus, deleteRefund, completeRefund }; 