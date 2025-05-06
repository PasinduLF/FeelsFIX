import { useEffect, useState } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import "./ViewPayments.css";
import { jsPDF } from "jspdf";
import 'jspdf-autotable';

const ViewPayments = () => {
    const [payments, setPayments] = useState([]);
    const [refunds, setRefunds] = useState([]);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const location = useLocation();
    const [notifications, setNotifications] = useState([]);

    const fetchPayments = async () => {
        try {
            setIsLoading(true);
            const response = await axios.get('http://localhost:4000/api/payments');
            setPayments(response.data);
        } catch (error) {
            console.error('Error fetching payments:', error);
            setMessage('Failed to load payments. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchRefunds = async () => {
        try {
            const response = await axios.get('http://localhost:4000/api/refunds');
            setRefunds(response.data);
        } catch (error) {
            console.error('Error fetching refunds:', error);
        }
    };

    // Function to check for new refund requests
    const checkNewRefunds = () => {
        const newRefunds = refunds.filter(refund => refund.isNew);
        if (newRefunds.length > 0) {
            const newNotifications = newRefunds.map(refund => ({
                id: refund._id,
                message: `New refund request from ${refund.name} for Payment ID: ${refund.paymentId}`,
                timestamp: new Date().toISOString()
            }));
            setNotifications(prev => [...prev, ...newNotifications]);
        }
    };

    useEffect(() => {
        fetchPayments();
        fetchRefunds();
    }, []);

    useEffect(() => {
        checkNewRefunds();
    }, [refunds]);

    const handleApprove = async (id) => {
        try {
            await axios.put(`http://localhost:4000/api/payments/approve/${id}`);
            setPayments(prevPayments =>
                prevPayments.map(payment =>
                    payment._id === id ? { ...payment, status: 'Approved' } : payment
                )
            );
            setMessage('Payment approved successfully!');
        } catch (error) {
            console.error('Error approving payment:', error);
            setMessage('Failed to approve payment.');
        }
    };

    const handleDecline = async (id) => {
        try {
            await axios.put(`http://localhost:4000/api/payments/decline/${id}`);
            setPayments(prevPayments =>
                prevPayments.map(payment =>
                    payment._id === id ? { ...payment, status: 'Declined' } : payment
                )
            );
            setMessage('Payment declined successfully!');
        } catch (error) {
            console.error('Error declining payment:', error);
            setMessage('Failed to decline payment.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this payment?')) {
            try {
                await axios.delete(`http://localhost:4000/api/payments/${id}`);
                setPayments(prevPayments => prevPayments.filter(payment => payment._id !== id));
                setMessage('Payment deleted successfully!');
                if (selectedPayment?._id === id) {
                    setSelectedPayment(null);
                }
            } catch (error) {
                console.error('Error deleting payment:', error);
                setMessage('Failed to delete payment.');
            }
        }
    };

    const handleViewDocument = (payment) => {
        setSelectedPayment(payment);
    };

    const getStatusCounts = () => {
        const counts = {
            all: payments.length,
            pending: payments.filter(p => p.status === 'Pending').length,
            approved: payments.filter(p => p.status === 'Approved').length,
            declined: payments.filter(p => p.status === 'Declined').length,
            refund: refunds.length
        };
        return counts;
    };

    const generateReport = () => {
        try {
            setIsGeneratingReport(true);
            const doc = new jsPDF();
            
            // Add title
            doc.setFontSize(20);
            doc.setTextColor(95, 111, 255);
            doc.text("Payment Status Report", 105, 20, { align: 'center' });

            // Add status counts
            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0);
            const counts = getStatusCounts();
            doc.text(`Total Payments: ${counts.all}`, 20, 35);
            doc.text(`Pending: ${counts.pending}`, 20, 45);
            doc.text(`Approved: ${counts.approved}`, 20, 55);
            doc.text(`Declined: ${counts.declined}`, 20, 65);

            let yPos = 85;

            // Function to add status-specific tables
            const addStatusTable = (statusPayments, title, startY) => {
                if (statusPayments.length === 0) return startY;

                doc.setFontSize(16);
                doc.setTextColor(0, 0, 0);
                doc.text(title, 20, startY - 10);

                const tableData = statusPayments.map(payment => [
                    payment.paymentId || '',
                    payment.name || '',
                    payment.bank || '',
                    payment.amount ? `$${payment.amount}` : '',
                    payment.phone || ''
                ]);

                doc.autoTable({
                    startY: startY,
                    head: [['Payment ID', 'Name', 'Bank', 'Amount', 'Phone']],
                    body: tableData,
                    theme: 'grid',
                    headStyles: {
                        fillColor: [95, 111, 255],
                        textColor: 255,
                        fontSize: 12,
                        fontStyle: 'bold'
                    },
                    styles: {
                        fontSize: 10,
                        cellPadding: 5
                    },
                    margin: { top: 10 }
                });

                return doc.lastAutoTable.finalY + 20;
            };

            // Get payments by status
            const pendingPayments = payments.filter(p => p.status === 'Pending');
            const approvedPayments = payments.filter(p => p.status === 'Approved');
            const declinedPayments = payments.filter(p => p.status === 'Declined');

            // Add tables for each status
            yPos = addStatusTable(pendingPayments, 'Pending Payments', yPos);
            yPos = addStatusTable(approvedPayments, 'Approved Payments', yPos);
            yPos = addStatusTable(declinedPayments, 'Declined Payments', yPos);

            // Add footer
            doc.setFontSize(10);
            doc.setTextColor(128, 128, 128);
            doc.text('Generated on: ' + new Date().toLocaleString(), 20, yPos);

            // Save the PDF
            doc.save('payment-report.pdf');
            setMessage('Report generated successfully!');
        } catch (error) {
            console.error('Error generating report:', error);
            setMessage('Failed to generate report. Please try again.');
        } finally {
            setIsGeneratingReport(false);
        }
    };

    const handleFilterClick = (filter) => {
        setActiveFilter(filter);
        setSearchTerm(''); // Reset search when changing filters
    };

    const filteredPayments = payments.filter(payment => {
        const matchesSearch = payment.paymentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            payment.name.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (!matchesSearch) return false;

        switch (activeFilter) {
            case 'pending':
                return payment.status === 'Pending';
            case 'approved':
                return payment.status === 'Approved';
            case 'declined':
                return payment.status === 'Declined';
            case 'refund':
                return false;
            default:
                return true;
        }
    });

    const filteredRefunds = refunds.filter(refund => {
        const matchesSearch = refund.paymentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            refund.name.toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchesSearch) return false;
        return activeFilter === 'refund';
    });

    const handleDeleteRefund = async (id) => {
        if (window.confirm('Are you sure you want to delete this refund request?')) {
            try {
                await axios.delete(`http://localhost:4000/api/refunds/${id}`);
                setMessage('Refund request deleted successfully');
                // Refresh the refunds list
                fetchRefunds();
            } catch (error) {
                console.error('Error deleting refund:', error);
                setMessage('Failed to delete refund request');
            }
        }
    };

    const handleCompleteRefund = async (id) => {
        try {
            await axios.put(`http://localhost:4000/api/refunds/${id}/complete`);
            setMessage('Refund request marked as completed');
            // Refresh the refunds list
            fetchRefunds();
            
            // Show notification on home page
            localStorage.setItem('refundNotification', JSON.stringify({
                message: 'Your refund request has been completed!',
                timestamp: new Date().toISOString()
            }));
        } catch (error) {
            console.error('Error completing refund:', error);
            setMessage('Failed to complete refund request');
        }
    };

    // Function to remove notification
    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    };

    return (
        <div className="dashboard-container">
            {/* Notifications Section */}
            {notifications.length > 0 && (
                <div className="notifications-container" style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    zIndex: 1000
                }}>
                    {notifications.map(notification => (
                        <div key={notification.id} className="notification" style={{
                            background: '#4CAF50',
                            color: 'white',
                            padding: '15px',
                            marginBottom: '10px',
                            borderRadius: '4px',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            minWidth: '300px'
                        }}>
                            <span>{notification.message}</span>
                            <button 
                                onClick={() => removeNotification(notification.id)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'white',
                                    cursor: 'pointer',
                                    marginLeft: '10px',
                                    fontSize: '20px'
                                }}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="dashboard-header">
                <h1>Admin Dashboard</h1>
                <div className="header-actions">
                    <input
                        type="text"
                        placeholder="Search payments..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                    <button 
                        className={`btn-generate-doc ${isGeneratingReport ? 'loading' : ''}`}
                        onClick={generateReport}
                        disabled={isGeneratingReport}
                    >
                        {isGeneratingReport ? 'Generating...' : 'Generate Report'}
                    </button>
                </div>
            </div>

            <div className="dashboard-content">
                {/* Payment Status Section */}
                <div className="status-section">
                    <h2>Payment Status</h2>
                    <div className="status-list">
                        <div 
                            className={`status-item ${activeFilter === 'all' ? 'active' : ''}`}
                            onClick={() => handleFilterClick('all')}
                        >
                            <span className="status-label">All</span>
                            <span className="status-count">{getStatusCounts().all}</span>
                        </div>
                        <div 
                            className={`status-item pending ${activeFilter === 'pending' ? 'active' : ''}`}
                            onClick={() => handleFilterClick('pending')}
                        >
                            <span className="status-label">Pending</span>
                            <span className="status-count">{getStatusCounts().pending}</span>
                        </div>
                        <div 
                            className={`status-item approved ${activeFilter === 'approved' ? 'active' : ''}`}
                            onClick={() => handleFilterClick('approved')}
                        >
                            <span className="status-label">Approved</span>
                            <span className="status-count">{getStatusCounts().approved}</span>
                        </div>
                        <div 
                            className={`status-item declined ${activeFilter === 'declined' ? 'active' : ''}`}
                            onClick={() => handleFilterClick('declined')}
                        >
                            <span className="status-label">Declined</span>
                            <span className="status-count">{getStatusCounts().declined}</span>
                        </div>
                        <div 
                            className={`status-item refund ${activeFilter === 'refund' ? 'active' : ''}`}
                            onClick={() => handleFilterClick('refund')}
                        >
                            <span className="status-label">Refund Requests</span>
                            <span className="status-count">{getStatusCounts().refund}</span>
                        </div>
                    </div>
                </div>

                {/* Payment Details Section */}
                <div className="payments-section">
                    {activeFilter === 'refund' ? (
                        filteredRefunds.map((refund, idx) => (
                            <div key={idx} className="payment-card">
                                <div className="payment-info">
                                    <h3>{refund.paymentId}</h3>
                                    <p><strong>Name:</strong> {refund.name}</p>
                                    <p><strong>Bank Name:</strong> {refund.bankName}</p>
                                    <p><strong>Branch:</strong> {refund.branch}</p>
                                    <p><strong>Account Number:</strong> {refund.accountNumber}</p>
                                    <p><strong>Account Holder:</strong> {refund.accountHolder}</p>
                                    <p><strong>Status:</strong> {refund.status}</p>
                                    <div className="action-buttons">
                                        {refund.status !== 'Completed' && (
                                            <button 
                                                className="complete-button"
                                                onClick={() => handleCompleteRefund(refund._id)}
                                                style={{
                                                    background: '#4CAF50',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '5px 10px',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    marginRight: '10px'
                                                }}
                                            >
                                                Complete
                                            </button>
                                        )}
                                        <button 
                                            className="delete-button"
                                            onClick={() => handleDeleteRefund(refund._id)}
                                            style={{
                                                background: '#ff4444',
                                                color: 'white',
                                                border: 'none',
                                                padding: '5px 10px',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        filteredPayments.map((payment) => (
                            <div key={payment._id} className="payment-card">
                                <div className="payment-info">
                                    <h3>{payment.paymentId}</h3>
                                    <p><strong>Name:</strong> {payment.name}</p>
                                    <p><strong>Bank:</strong> {payment.bank}</p>
                                    <p><strong>Amount:</strong> ${payment.amount.toFixed(2)}</p>
                                    <p><strong>Phone:</strong> {payment.phone}</p>
                                    <p><strong>Status:</strong> {payment.status}</p>
                                </div>
                                <div className="payment-actions">
                                    <button
                                        className="btn btn-view"
                                        onClick={() => handleViewDocument(payment)}
                                    >
                                        View Document
                                    </button>
                                    {payment.status === 'Pending' && (
                                        <>
                                            <button
                                                className="btn btn-approve"
                                                onClick={() => handleApprove(payment._id)}
                                            >
                                                Approve
                                            </button>
                                            <button
                                                className="btn btn-decline"
                                                onClick={() => handleDecline(payment._id)}
                                            >
                                                Decline
                                            </button>
                                        </>
                                    )}
                                    <button
                                        className="btn btn-delete"
                                        onClick={() => handleDelete(payment._id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Document View Modal */}
            {selectedPayment && (
                <div className="modal-overlay" onClick={() => setSelectedPayment(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Payment Document - {selectedPayment.paymentId}</h3>
                            <button className="modal-close" onClick={() => setSelectedPayment(null)}>×</button>
                        </div>
                        <div className="modal-body">
                            {selectedPayment.fileUrl.endsWith('.pdf') ? (
                                <embed 
                                    src={`http://localhost:4000${selectedPayment.fileUrl}`} 
                                    type="application/pdf" 
                                    width="100%" 
                                    height="500px"
                                />
                            ) : (
                                <img 
                                    src={`http://localhost:4000${selectedPayment.fileUrl}`} 
                                    alt="Payment Document" 
                                    style={{ maxWidth: '100%', maxHeight: '500px' }}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}

            {message && (
                <div className={`alert-message ${
                    message.includes('successfully') ? 'alert-success' : 'alert-error'
                }`}>
                    {message}
                </div>
            )}
        </div>
    );
};

export default ViewPayments;