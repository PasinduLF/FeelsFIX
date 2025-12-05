import express from 'express';
import { 
    uploadPayment, 
    getPayments, 
    approvePayment, 
    declinePayment,
    deletePayment,
    upload,
    getPaymentById,
    getFinanceDashboardMetrics,
} from '../controllers/payment-controller.js';
import { createRefund, getRefunds, updateRefundStatus, deleteRefund, completeRefund } from '../controllers/refund-controller.js';

const router = express.Router();

// Route to upload payment slip
router.post('/payments/upload', upload.single('file'), uploadPayment);

// Route to fetch all payment records
router.get('/payments', getPayments);

// Route to fetch finance dashboard metrics
router.get('/payments/finance-dashboard', getFinanceDashboardMetrics);

// Route to fetch a single payment by ID
router.get('/payments/:id', getPaymentById);

// Route to approve a payment
router.put('/payments/approve/:id', approvePayment);

router.put('/payments/decline/:id', declinePayment);

// Route to delete a payment
router.delete('/payments/:id', deletePayment);

// Refund routes
router.post('/refund', createRefund);
router.get('/refunds', getRefunds);
router.put('/refunds/:id/status', updateRefundStatus);
router.put('/refunds/:id/complete', completeRefund);
router.delete('/refunds/:id', deleteRefund);

export default router;