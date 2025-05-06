import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const RefundPaymentRequest = () => {
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    bankName: '',
    branch: '',
    accountNumber: '',
    accountHolder: ''
  });
  const [payment, setPayment] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:4000/api/payments/${paymentId}`);
        if (response.data) {
          setPayment(response.data);
          setForm(prev => ({
            ...prev,
            name: response.data.name || ''
          }));
        } else {
          setError('Payment not found');
        }
      } catch (error) {
        console.error('Error fetching payment details:', error);
        setError(error.response?.data?.error || 'Failed to load payment details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (paymentId) {
      fetchPaymentDetails();
    } else {
      setError('Payment ID is required');
      setIsLoading(false);
    }
  }, [paymentId]);

  // Function to check for refund status updates
  const checkRefundStatus = async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/refunds');
      const userRefunds = response.data.filter(
        refund => refund.paymentId === paymentId && 
        refund.notification && 
        !refund.notification.isRead
      );

      if (userRefunds.length > 0) {
        const newNotifications = userRefunds.map(refund => ({
          id: refund._id,
          message: refund.notification.message,
          timestamp: refund.notification.createdAt
        }));
        setNotifications(prev => [...prev, ...newNotifications]);
      }
    } catch (error) {
      console.error('Error checking refund status:', error);
    }
  };

  // Check for updates every 30 seconds
  useEffect(() => {
    const interval = setInterval(checkRefundStatus, 30000);
    return () => clearInterval(interval);
  }, [paymentId]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    
    try {
      const response = await axios.post('http://localhost:4000/api/refund', {
        ...form,
        paymentId
      });
      setMessage(response.data.message);
      setForm({
        name: '',
        bankName: '',
        branch: '',
        accountNumber: '',
        accountHolder: ''
      });
      // Redirect back to appointments page after successful submission
      setTimeout(() => {
        navigate('/my-appointments');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit refund request. Please try again.');
    }
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={() => navigate('/my-appointments')}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
        >
          Back to Appointments
        </button>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Payment not found or you don't have permission to view it.</p>
        <button 
          onClick={() => navigate('/my-appointments')}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
        >
          Back to Appointments
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold text-center mb-8">Refund Payment Request</h2>
      
      {/* Notifications */}
      {notifications.map((notification) => (
        <div 
          key={notification.id}
          className="bg-blue-50 border border-blue-200 p-4 mb-4 rounded-md"
        >
          <p className="text-blue-800">{notification.message}</p>
          <small className="text-blue-600">{new Date(notification.timestamp).toLocaleString()}</small>
          <button 
            onClick={() => removeNotification(notification.id)}
            className="float-right text-blue-600 hover:text-blue-800"
          >
            ×
          </button>
        </div>
      ))}
      
      {message && (
        <div className="bg-green-50 border border-green-200 p-4 mb-4 rounded-md text-green-800">
          {message}
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 mb-4 rounded-md text-red-800">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="max-w-lg mx-auto bg-white p-8 rounded-lg shadow-md">
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">Name:</label>
          <input 
            type="text" 
            name="name" 
            value={form.name} 
            onChange={handleChange} 
            required 
            className="w-full px-3 py-2 border rounded-md"
            disabled 
          />
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Account to be refunded</h3>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Bank Name:</label>
            <input 
              type="text" 
              name="bankName" 
              value={form.bankName} 
              onChange={handleChange} 
              required 
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Branch:</label>
            <input 
              type="text" 
              name="branch" 
              value={form.branch} 
              onChange={handleChange} 
              required 
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Account Number:</label>
            <input 
              type="text" 
              name="accountNumber" 
              value={form.accountNumber} 
              onChange={handleChange} 
              required 
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Account Holder:</label>
            <input 
              type="text" 
              name="accountHolder" 
              value={form.accountHolder} 
              onChange={handleChange} 
              required 
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>
        
        <button 
          type="submit" 
          className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark transition-colors"
        >
          Submit Refund Request
        </button>
      </form>
    </div>
  );
};

export default RefundPaymentRequest; 