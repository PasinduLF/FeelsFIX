import fs from 'fs';
import multer from 'multer';
import Payment from '../models/PaymentSchema.js';
import appointmentModel from '../models/appointmentModel.js';

// Configure uploads directory
const uploadDir = 'uploadPayment/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only PDFs and images are allowed!'), false);
        }
    }
});

// Upload Payment Slip
const uploadPayment = async (req, res) => {
    try {
        const { paymentId, name, phone, bank, amount, appointmentId } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: "File is required" });
        }

        // Get branch from bank details
        const bankDetails = {
            'Bank of Ceylon': { branch: 'Malabe' },
            'Peoples Bank': { branch: 'Malabe' },
            'Commercial Bank': { branch: 'Malabe' },
            'Sampath Bank': { branch: 'Malabe' },
            'Nations Trust Bank': { branch: 'Malabe' },
            'HNB': { branch: 'Malabe' },
            'NSB': { branch: 'Malabe' }
        };

        // Create new payment
        const newPayment = new Payment({
            appointmentId,
            paymentId,
            name,
            phone,
            bank,
            branch: bankDetails[bank]?.branch || 'Malabe',
            amount: parseFloat(amount),
            status: 'Pending',
            fileUrl: `/uploadPayment/${req.file.filename}`,
        });

        await newPayment.save();

        // Update appointment with payment reference but don't set payment status yet
        await appointmentModel.findByIdAndUpdate(appointmentId, {
            paymentId: newPayment._id,
            payment: false // Keep payment status as false until approved
        });

        res.status(201).json({ 
            message: "Payment uploaded successfully!", 
            payment: newPayment 
        });

    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ 
            error: error.message || "Server error during upload." 
        });
    }
};

// Get all payments
const getPayments = async (req, res) => {
    try {
        const payments = await Payment.find().populate('appointmentId');
        res.status(200).json(payments);
    } catch (error) {
        console.error("Fetch error:", error);
        res.status(500).json({ error: "Failed to fetch payments" });
    }
};

// Approve Payment
const approvePayment = async (req, res) => {
    try {
        const { id } = req.params;
        const payment = await Payment.findByIdAndUpdate(
            id,
            { status: 'Approved' },
            { new: true }
        );

        if (!payment) {
            return res.status(404).json({ error: "Payment not found" });
        }

        // Update appointment payment status to true only after approval
        await appointmentModel.findByIdAndUpdate(payment.appointmentId, {
            payment: true
        });

        res.status(200).json({ message: "Payment approved", payment });
    } catch (error) {
        console.error("Approval error:", error);
        res.status(500).json({ error: "Failed to approve payment" });
    }
};

// Decline Payment
const declinePayment = async (req, res) => {
    try {
        const { id } = req.params;
        const payment = await Payment.findByIdAndUpdate(
            id,
            { status: 'Declined' },
            { new: true }
        );

        if (!payment) {
            return res.status(404).json({ error: "Payment not found" });
        }

        // Keep appointment payment status as false when declined
        await appointmentModel.findByIdAndUpdate(payment.appointmentId, {
            payment: false,
            paymentId: null // Remove payment reference
        });

        res.status(200).json({ message: "Payment declined", payment });
    } catch (error) {
        console.error("Decline error:", error);
        res.status(500).json({ error: "Failed to decline payment" });
    }
};

// Delete Payment
const deletePayment = async (req, res) => {
    try {
        const { id } = req.params;
        const payment = await Payment.findById(id);

        if (!payment) {
            return res.status(404).json({ error: "Payment not found" });
        }

        // Delete the file
        const filePath = payment.fileUrl.replace('/uploadPayment/', uploadDir);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Update appointment payment status
        await appointmentModel.findByIdAndUpdate(payment.appointmentId, {
            payment: false,
            paymentId: null
        });

        // Delete payment record
        await Payment.findByIdAndDelete(id);

        res.status(200).json({ message: "Payment deleted successfully" });
    } catch (error) {
        console.error("Delete error:", error);
        res.status(500).json({ error: "Failed to delete payment" });
    }
};

export { uploadPayment, getPayments, approvePayment, declinePayment, deletePayment, upload };