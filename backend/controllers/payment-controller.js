import fs from 'fs';
import multer from 'multer';
import Payment from '../models/PaymentSchema.js';
import appointmentModel from '../models/appointmentModel.js';
import WorkshopRegistrationModel from '../models/workshopRegistrationModel.js';

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

const DASHBOARD_STRIPE_CURRENCY = (process.env.STRIPE_CURRENCY || 'LKR').toUpperCase();

const roundCurrency = (value = 0) => Math.round(value * 100) / 100;

const convertStripeAmount = (value = 0) => roundCurrency((value || 0) / 100);

const buildMonthBuckets = (count = 6) => {
    const months = [];
    const today = new Date();
    today.setDate(1);
    today.setHours(0, 0, 0, 0);

    for (let i = count - 1; i >= 0; i -= 1) {
        const current = new Date(today.getFullYear(), today.getMonth() - i, 1);
        months.push({
            key: `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`,
            label: current.toLocaleString('en-US', { month: 'short' }),
            start: new Date(current.getFullYear(), current.getMonth(), 1),
        });
    }

    return months;
};

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

// Get a single payment by ID
const getPaymentById = async (req, res) => {
    try {
        const { id } = req.params;
        const payment = await Payment.findById(id);

        if (!payment) {
            return res.status(404).json({ error: "Payment not found" });
        }

        res.status(200).json(payment);
    } catch (error) {
        console.error("Fetch error:", error);
        res.status(500).json({ error: "Failed to fetch payment" });
    }
};

const getFinanceDashboardMetrics = async (req, res) => {
    try {
        const monthBuckets = buildMonthBuckets(6);
        const rangeStart = new Date(monthBuckets[0].start);

        const stripeRevenuePromise = WorkshopRegistrationModel.aggregate([
            { $match: { paymentStatus: 'succeeded' } },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$paymentAmount' },
                    count: { $sum: 1 },
                },
            },
        ]);

        const stripeStatusPromise = WorkshopRegistrationModel.aggregate([
            { $match: { paymentAmount: { $gt: 0 } } },
            {
                $group: {
                    _id: '$paymentStatus',
                    count: { $sum: 1 },
                    amount: { $sum: '$paymentAmount' },
                },
            },
        ]);

        const stripeMonthlyPromise = WorkshopRegistrationModel.aggregate([
            { $match: { paymentStatus: 'succeeded', createdAt: { $gte: rangeStart } } },
            {
                $group: {
                    _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                    amount: { $sum: '$paymentAmount' },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]);

        const recentStripePromise = WorkshopRegistrationModel.find({ paymentAmount: { $gt: 0 } })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('participantName paymentAmount paymentStatus paymentCurrency paymentMethodType createdAt workshopTitle');

        const bankRevenuePromise = Payment.aggregate([
            { $match: { status: 'Approved' } },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 },
                },
            },
        ]);

        const bankStatusPromise = Payment.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    amount: { $sum: '$amount' },
                },
            },
        ]);

        const bankMonthlyPromise = Payment.aggregate([
            { $match: { status: 'Approved', createdAt: { $gte: rangeStart } } },
            {
                $group: {
                    _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                    amount: { $sum: '$amount' },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]);

        const recentBankPromise = Payment.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('name amount status bank createdAt paymentId');

        const [
            stripeRevenueAgg,
            stripeStatusAgg,
            stripeMonthlyAgg,
            recentStripe,
            bankRevenueAgg,
            bankStatusAgg,
            bankMonthlyAgg,
            recentBank,
        ] = await Promise.all([
            stripeRevenuePromise,
            stripeStatusPromise,
            stripeMonthlyPromise,
            recentStripePromise,
            bankRevenuePromise,
            bankStatusPromise,
            bankMonthlyPromise,
            recentBankPromise,
        ]);

        const stripeRevenueData = stripeRevenueAgg[0] || { totalAmount: 0, count: 0 };
        const bankRevenueData = bankRevenueAgg[0] || { totalAmount: 0, count: 0 };

        const stripeStatuses = stripeStatusAgg.reduce((acc, entry) => {
            const key = entry._id || 'unknown';
            acc[key] = {
                count: entry.count,
                amount: convertStripeAmount(entry.amount),
            };
            return acc;
        }, {});

        const bankStatuses = bankStatusAgg.reduce((acc, entry) => {
            const key = entry._id || 'Unknown';
            acc[key] = {
                count: entry.count,
                amount: roundCurrency(entry.amount || 0),
            };
            return acc;
        }, {});

        const stripeMonthlyMap = stripeMonthlyAgg.reduce((acc, entry) => {
            const key = `${entry._id.year}-${String(entry._id.month).padStart(2, '0')}`;
            acc[key] = convertStripeAmount(entry.amount || 0);
            return acc;
        }, {});

        const bankMonthlyMap = bankMonthlyAgg.reduce((acc, entry) => {
            const key = `${entry._id.year}-${String(entry._id.month).padStart(2, '0')}`;
            acc[key] = roundCurrency(entry.amount || 0);
            return acc;
        }, {});

        const monthlySeries = {
            labels: monthBuckets.map((bucket) => bucket.label),
            stripe: monthBuckets.map((bucket) => stripeMonthlyMap[bucket.key] || 0),
            bank: monthBuckets.map((bucket) => bankMonthlyMap[bucket.key] || 0),
            currency: 'LKR',
        };

        const stripeTotal = convertStripeAmount(stripeRevenueData.totalAmount || 0);
        const bankTotal = roundCurrency(bankRevenueData.totalAmount || 0);

        const responsePayload = {
            totals: {
                combined: {
                    amount: roundCurrency(stripeTotal + bankTotal),
                    count: (stripeRevenueData.count || 0) + (bankRevenueData.count || 0),
                    currency: 'LKR',
                },
                stripe: {
                    amount: stripeTotal,
                    count: stripeRevenueData.count || 0,
                    currency: DASHBOARD_STRIPE_CURRENCY,
                },
                bank: {
                    amount: bankTotal,
                    count: bankRevenueData.count || 0,
                    currency: 'LKR',
                },
            },
            statusBreakdown: {
                stripe: stripeStatuses,
                bank: bankStatuses,
            },
            monthlySeries,
            recentActivity: {
                stripe: recentStripe.map((entry) => ({
                    id: entry._id,
                    name: entry.participantName,
                    reference: entry.workshopTitle,
                    amount: convertStripeAmount(entry.paymentAmount || 0),
                    status: entry.paymentStatus,
                    method: entry.paymentMethodType || 'card',
                    currency: (entry.paymentCurrency || DASHBOARD_STRIPE_CURRENCY).toUpperCase(),
                    createdAt: entry.createdAt,
                })),
                bank: recentBank.map((entry) => ({
                    id: entry._id,
                    name: entry.name,
                    reference: entry.bank,
                    amount: roundCurrency(entry.amount || 0),
                    status: entry.status,
                    method: 'bank-transfer',
                    currency: 'LKR',
                    createdAt: entry.createdAt,
                    paymentId: entry.paymentId,
                })),
            },
            generatedAt: new Date(),
        };

        res.json({ success: true, data: responsePayload });
    } catch (error) {
        console.error('Finance dashboard error:', error);
        res.status(500).json({ success: false, message: 'Unable to load finance dashboard' });
    }
};

export { uploadPayment, getPayments, approvePayment, declinePayment, deletePayment, upload, getPaymentById, getFinanceDashboardMetrics };