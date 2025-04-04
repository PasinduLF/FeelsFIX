import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import { NavLink, useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaUserMd, FaMoneyBillWave, FaTimesCircle, FaCheckCircle } from 'react-icons/fa';

const MyAppointments = () => {
  const { backendUrl, token, getDoctorsData } = useContext(AppContext);
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'upcoming', 'completed', 'cancelled'
  const navigate = useNavigate();

  const months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const slotDateFormat = (slotDate) => {
    try {
      const dateArray = slotDate.split('_');
      if (dateArray.length !== 3) return slotDate;
      return `${dateArray[0]} ${months[Number(dateArray[1])]} ${dateArray[2]}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return slotDate;
    }
  };

  const getUserAppointments = async () => {
    setIsLoading(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/user/appointments`, {
        headers: { token }
      });
      if (data.success) {
        // Sort by date (newest first)
        const sortedAppointments = data.appointments.sort((a, b) => {
          return new Date(b.slotDate.replace(/_/g, '-')) - new Date(a.slotDate.replace(/_/g, '-'));
        });
        setAppointments(sortedAppointments);
      } else {
        toast.error(data.message || "Failed to fetch appointments");
      }
    } catch (error) {
      console.error("Fetch appointments error:", error);
      toast.error(error.response?.data?.message || error.message || "Failed to fetch appointments");
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const cancelAppointment = async (appointmentId) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    
    setCancellingId(appointmentId);
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/cancel-appointment`,
        { appointmentId },
        { headers: { token } }
      );
      if (data.success) {
        toast.success(data.message);
        await getUserAppointments();
        getDoctorsData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Cancel appointment error:", error);
      toast.error(error.response?.data?.message || error.message || "Failed to cancel appointment");
    } finally {
      setCancellingId(null);
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return !appointment.cancelled && !appointment.isCompleted;
    if (filter === 'completed') return appointment.isCompleted;
    if (filter === 'cancelled') return appointment.cancelled;
    return true;
  });

  useEffect(() => {
    if (token) {
      getUserAppointments();
    } else {
      navigate('/login');
    }
  }, [token]);

  if (isLoading && appointments.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-800">My Appointments</h2>
        
        <div className="flex space-x-2 mt-4 md:mt-0">
          <button 
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-sm rounded-full ${filter === 'all' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('upcoming')}
            className={`px-3 py-1 text-sm rounded-full ${filter === 'upcoming' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
          >
            Upcoming
          </button>
          <button 
            onClick={() => setFilter('completed')}
            className={`px-3 py-1 text-sm rounded-full ${filter === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
          >
            Completed
          </button>
          <button 
            onClick={() => setFilter('cancelled')}
            className={`px-3 py-1 text-sm rounded-full ${filter === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}
          >
            Cancelled
          </button>
        </div>
      </div>

      {filteredAppointments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          {filter === 'all' ? (
            <>
              <p className="text-gray-600 mb-4">You don't have any appointments yet.</p>
              <NavLink 
                to="/doctors" 
                className="inline-block px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
              >
                Book an appointment now
              </NavLink>
            </>
          ) : (
            <p className="text-gray-600">No {filter} appointments found.</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((item) => (
            <div 
              key={item._id} 
              className={`p-5 rounded-lg border ${item.cancelled ? 'bg-gray-50' : item.isCompleted ? 'bg-green-50' : 'bg-white'} shadow-sm hover:shadow-md transition-shadow`}
            >
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0">
                  <img 
                    className="w-32 h-32 object-cover rounded-lg bg-indigo-50 border border-gray-200"
                    src={item.docData.image} 
                    alt={`Dr. ${item.docData.name}`} 
                  />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                        <FaUserMd className="mr-2 text-primary" />
                        {item.docData.name}
                      </h3>
                      <p className="text-gray-600 ml-6">{item.docData.speciality}</p>
                    </div>
                    {item.cancelled ? (
                      <span className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full">
                        Cancelled
                      </span>
                    ) : item.isCompleted ? (
                      <span className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                        Completed
                      </span>
                    ) : (
                      <span className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
                        Upcoming
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-4 space-y-3">
                    <div className="flex items-start">
                      <FaMapMarkerAlt className="mt-1 mr-2 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-600">{item.docData.address.line1}</p>
                        {item.docData.address.line2 && (
                          <p className="text-sm text-gray-600">{item.docData.address.line2}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <FaCalendarAlt className="mr-2 text-gray-400" />
                      <p className="text-sm text-gray-600">
                        {slotDateFormat(item.slotDate)}
                      </p>
                    </div>
                    
                    <div className="flex items-center">
                      <FaClock className="mr-2 text-gray-400" />
                      <p className="text-sm text-gray-600">{item.slotTime}</p>
                    </div>
                    
                    {item.payment && (
                      <div className="flex items-center">
                        <FaMoneyBillWave className="mr-2 text-gray-400" />
                        <p className="text-sm text-gray-600">Payment completed</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 min-w-[180px] justify-center">
                  {!item.cancelled && item.payment && !item.isCompleted && (
                    <span className="px-4 py-2 text-center text-green-600 bg-green-50 rounded-md border border-green-100 flex items-center justify-center">
                      <FaCheckCircle className="mr-2" /> Paid
                    </span>
                  )}
                  
                  {!item.cancelled && !item.payment && !item.isCompleted && (
                    <NavLink to='/payment' className="w-full">
                      <button className="w-full px-4 py-2 text-sm text-white bg-primary rounded-md hover:bg-primary-dark transition-colors flex items-center justify-center">
                        <FaMoneyBillWave className="mr-2" /> Pay Now
                      </button>
                    </NavLink>
                  )}
                  
                  {!item.cancelled && !item.isCompleted && (
                    <button 
                      onClick={() => cancelAppointment(item._id)}
                      disabled={cancellingId === item._id}
                      className={`w-full px-4 py-2 text-sm rounded-md transition-colors flex items-center justify-center ${
                        cancellingId === item._id 
                          ? 'bg-gray-300 text-gray-600' 
                          : 'text-white bg-red-600 hover:bg-red-700'
                      }`}
                    >
                      <FaTimesCircle className="mr-2" />
                      {cancellingId === item._id ? 'Cancelling...' : 'Cancel'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyAppointments;