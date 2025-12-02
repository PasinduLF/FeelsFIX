import { useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AppContext } from '../context/AppContext';

const Payment = () => {
    const { appointmentId } = useParams();
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [amount, setAmount] = useState('');
    const [bank, setBank] = useState('Bank of Ceylon');
    const [bankSearch, setBankSearch] = useState('Bank of Ceylon');
    const [showBankList, setShowBankList] = useState(false);
    const [file, setFile] = useState(null);
    const [paymentId, setPaymentId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [showReceipt, setShowReceipt] = useState(false);
    const [paymentData, setPaymentData] = useState(null);
    const navigate = useNavigate();
    const { backendUrl } = useContext(AppContext);
    const apiBase = useMemo(() => backendUrl ? backendUrl.replace(/\/$/, '') : '', [backendUrl]);

    // Updated bank details with different account numbers
    const bankDetails = {
        'Bank of Ceylon': {
            accountNo: '8987432',
            branch: 'Malabe',
            accountHolder: 'Feelsfix'
        },
        'Peoples Bank': {
            accountNo: '34657894576',
            branch: 'Malabe',
            accountHolder: 'Feelsfix'
        },
        'Commercial Bank': {
            accountNo: '2342235789564',
            branch: 'Malabe',
            accountHolder: 'Feelsfix'
        },
        'Sampath Bank': {
            accountNo: '7894561230',
            branch: 'Malabe',
            accountHolder: 'Feelsfix'
        },
        'Nations Trust Bank': {
            accountNo: '4567891230',
            branch: 'Malabe',
            accountHolder: 'Feelsfix'
        },
        'HNB': {
            accountNo: '9876543210',
            branch: 'Malabe',
            accountHolder: 'Feelsfix'
        },
        'NSB': {
            accountNo: '1234567890',
            branch: 'Malabe',
            accountHolder: 'Feelsfix'
        }
    };

    const bankOptions = [
        'Bank of Ceylon',
        'Peoples Bank',
        'Commercial Bank',
        'Sampath Bank',
        'Nations Trust Bank',
        'HNB',
        'NSB'
    ];

    // Filter banks based on search
    const filteredBanks = bankOptions.filter(b => 
        b.toLowerCase().includes(bankSearch.toLowerCase())
    );

    // Generate Payment ID
    useEffect(() => {
        const generatePaymentId = () => {
            const id = 'PAY' + Math.floor(100000 + Math.random() * 900000);
            setPaymentId(id);
        };
        generatePaymentId();
    }, []);

    const generateReceipt = () => {
        if (!paymentData) return;

        try {
            const doc = new jsPDF();
            
            // Add title
            doc.setFontSize(24);
            doc.setTextColor(95, 111, 255);
            doc.text('Payment Receipt', 105, 20, { align: 'center' });
            
            // Add logo or header
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text('Therapy Booking System', 105, 30, { align: 'center' });
            
            // Add receipt details
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);

            const receiptDetails = [
                ['Payment ID:', paymentData.paymentId],
                ['Date:', new Date().toLocaleDateString()],
                ['Name:', paymentData.name],
                ['Phone:', paymentData.phone],
                ['Bank:', paymentData.bank],
                ['Amount:', `$${paymentData.amount.toFixed(2)}`],
                ['Status:', 'Payment Received']
            ];

            autoTable(doc, {
                startY: 40,
                body: receiptDetails,
                theme: 'plain',
                styles: { fontSize: 12 },
                columnStyles: {
                    0: { fontStyle: 'bold', cellWidth: 40 },
                    1: { cellWidth: 100 }
                }
            });

            // Add footer
            const footerY = doc.lastAutoTable.finalY + 20;
            doc.setFontSize(10);
            doc.setTextColor(128, 128, 128);
            doc.text('Thank you for your payment.', 105, footerY, { align: 'center' });
            doc.text('Please keep this receipt for your records.', 105, footerY + 10, { align: 'center' });

            // Save the PDF
            doc.save(`payment-receipt-${paymentData.paymentId}.pdf`);
        } catch (error) {
            console.error('Error generating receipt:', error);
            alert('Failed to generate receipt. Please contact support.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!file) {
            setError('Please select a payment slip to upload.');
            return;
        }

        if (!appointmentId) {
            setError('Appointment ID is missing. Please try booking again.');
            return;
        }

        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('paymentId', paymentId);
        formData.append('name', name);
        formData.append('phone', phone);
        formData.append('amount', amount);
        formData.append('bank', bank);
        formData.append('appointmentId', appointmentId);
        formData.append('file', file);

        try {
            if (!apiBase) {
                setError('Backend is not configured. Please try again later.');
                setIsSubmitting(false);
                return;
            }
            const response = await axios.post(`${apiBase}/api/payments/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Store payment data for receipt generation
            const newPaymentData = {
                paymentId,
                name,
                phone,
                bank,
                amount: parseFloat(amount)
            };
            setPaymentData(newPaymentData);
            setShowReceipt(true);

            alert('Payment slip uploaded successfully!');
            console.log(response.data);
        } catch (error) {
            console.error('Error uploading payment:', error);
            setError(error.response?.data?.error || 'Error uploading payment slip. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDownloadAndClose = () => {
        generateReceipt();
        // Reset form
        setName('');
        setPhone('');
        setAmount('');
        setFile(null);
        setPaymentId('PAY' + Math.floor(100000 + Math.random() * 900000));
        setShowReceipt(false);
        setPaymentData(null);
        // Redirect to home page
        navigate('/');
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.header}>Payment</h2>
            {!showReceipt ? (
                <div style={styles.wrapper}>
                    {/* Left Side - Bank Details */}
                    <div style={styles.card}>
                        <h3 style={styles.cardHeader}>Bank Details</h3>
                        <div style={styles.searchContainer}>
                            <input
                                type="text"
                                placeholder="Search bank..."
                                value={bankSearch}
                                onChange={(e) => {
                                    setBankSearch(e.target.value);
                                    setShowBankList(true);
                                }}
                                onFocus={() => setShowBankList(true)}
                                style={styles.input}
                            />
                            {showBankList && filteredBanks.length > 0 && (
                                <div style={styles.bankList}>
                                    {filteredBanks.map((option, index) => (
                                        <div
                                            key={index}
                                            style={styles.bankOption}
                                            onClick={() => {
                                                setBank(option);
                                                setBankSearch(option);
                                                setShowBankList(false);
                                            }}
                                        >
                                            {option}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div style={styles.bankDetailsContainer}>
                            <div style={styles.bankDetail}>
                                <span style={styles.bankDetailLabel}>Selected Bank:</span>
                                <span style={styles.bankDetailValue}>{bank || 'None selected'}</span>
                            </div>
                            <div style={styles.bankDetail}>
                                <span style={styles.bankDetailLabel}>Account No:</span>
                                <span style={styles.bankDetailValue}>{bankDetails[bank]?.accountNo}</span>
                            </div>
                            <div style={styles.bankDetail}>
                                <span style={styles.bankDetailLabel}>Branch:</span>
                                <span style={styles.bankDetailValue}>{bankDetails[bank]?.branch}</span>
                            </div>
                            <div style={styles.bankDetail}>
                                <span style={styles.bankDetailLabel}>Account Holder:</span>
                                <span style={styles.bankDetailValue}>{bankDetails[bank]?.accountHolder}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Upload Payment Slip */}
                    <div style={styles.card}>
                        <h3 style={styles.cardHeader}>Upload Payment Slip</h3>
                        {error && <div style={styles.error}>{error}</div>}
                        <form onSubmit={handleSubmit} style={styles.form}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Full Name</label>
                                <input
                                    type="text"
                                    placeholder="Enter your full name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    style={styles.input}
                                />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Phone Number</label>
                                <input
                                    type="tel"
                                    placeholder="Enter 10-digit phone number"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    required
                                    style={styles.input}
                                    pattern="[0-9]{10}"
                                    title="Please enter a valid 10-digit phone number"
                                />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Amount</label>
                                <input
                                    type="number"
                                    placeholder="Enter payment amount"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    required
                                    style={styles.input}
                                />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Payment Slip</label>
                                <input
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.pdf"
                                    onChange={(e) => setFile(e.target.files[0])}
                                    required
                                    style={styles.fileInput}
                                />
                            </div>
                            <button 
                                type="submit" 
                                style={styles.button}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Processing...' : 'Submit Payment'}
                            </button>
                        </form>
                    </div>
                </div>
            ) : (
                <div style={styles.successCard}>
                    <h3 style={styles.successHeader}>
                        ✓ Payment Successful!
                    </h3>
                    <p style={styles.successText}>Your payment has been uploaded successfully.</p>
                    <p style={styles.successText}>Payment ID: {paymentData?.paymentId}</p>
                    <button 
                        onClick={handleDownloadAndClose}
                        style={styles.downloadButton}
                    >
                        Download Receipt
                    </button>
                </div>
            )}
        </div>
    );
};

// Styles
const styles = {
    container: {
        padding: '40px 20px',
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#F0F4FF',
        minHeight: '100vh'
    },
    header: {
        color: '#5F6FFF',
        fontSize: '28px',
        fontWeight: 'bold',
        marginBottom: '30px',
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: '1px'
    },
    wrapper: {
        display: 'flex',
        justifyContent: 'center',
        gap: '30px',
        flexWrap: 'wrap',
        maxWidth: '1200px',
        margin: '0 auto'
    },
    card: {
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '15px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        width: '380px',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        ':hover': {
            transform: 'translateY(-5px)',
            boxShadow: '0 6px 12px rgba(0,0,0,0.15)'
        }
    },
    cardHeader: {
        color: '#5F6FFF',
        fontSize: '20px',
        fontWeight: '600',
        marginBottom: '20px',
        paddingBottom: '10px',
        borderBottom: '2px solid #5F6FFF',
        textAlign: 'center'
    },
    bankDetailsContainer: {
        backgroundColor: '#f8faff',
        padding: '15px',
        borderRadius: '10px',
        marginTop: '15px'
    },
    bankDetail: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 0',
        borderBottom: '1px solid #eee'
    },
    bankDetailLabel: {
        color: '#666',
        fontWeight: '600'
    },
    bankDetailValue: {
        color: '#333',
        fontWeight: '500'
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '5px'
    },
    label: {
        color: '#666',
        fontSize: '14px',
        fontWeight: '500',
        marginBottom: '5px'
    },
    input: {
        width: '100%',
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid #ddd',
        fontSize: '14px',
        transition: 'border-color 0.3s ease',
        ':focus': {
            borderColor: '#5F6FFF',
            outline: 'none'
        }
    },
    fileInput: {
        width: '100%',
        padding: '10px',
        border: '2px dashed #5F6FFF',
        borderRadius: '8px',
        backgroundColor: '#f8faff',
        cursor: 'pointer',
        textAlign: 'center'
    },
    button: {
        backgroundColor: '#5F6FFF',
        color: 'white',
        padding: '14px',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        ':hover': {
            backgroundColor: '#4a5ae8',
            transform: 'translateY(-2px)'
        },
        ':disabled': {
            backgroundColor: '#a0a0a0',
            cursor: 'not-allowed',
            transform: 'none'
        }
    },
    searchContainer: {
        position: 'relative',
        width: '100%',
        marginBottom: '20px'
    },
    bankList: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        maxHeight: '200px',
        overflowY: 'auto',
        backgroundColor: 'white',
        border: '1px solid #ddd',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        zIndex: 1000
    },
    bankOption: {
        padding: '12px 15px',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        ':hover': {
            backgroundColor: '#f0f4ff'
        }
    },
    error: {
        color: '#dc3545',
        backgroundColor: '#ffe6e6',
        padding: '10px',
        borderRadius: '8px',
        textAlign: 'center',
        marginBottom: '15px'
    },
    successCard: {
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '15px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        maxWidth: '500px',
        margin: '0 auto',
        textAlign: 'center'
    },
    successHeader: {
        color: '#28a745',
        fontSize: '24px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px'
    },
    successText: {
        color: '#666',
        marginBottom: '15px',
        fontSize: '16px',
        lineHeight: '1.5'
    },
    downloadButton: {
        backgroundColor: '#5F6FFF',
        color: 'white',
        padding: '14px 28px',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        marginTop: '25px',
        ':hover': {
            backgroundColor: '#4a5ae8',
            transform: 'translateY(-2px)'
        }
    }
};

export default Payment;