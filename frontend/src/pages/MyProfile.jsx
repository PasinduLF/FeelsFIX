import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { assets } from '../assets/assets';
import axios from 'axios';
import { toast } from 'react-toastify';

const MyProfile = () => {
  const { userData, setUserData, token, backendUrl, loadUserProfileData } = useContext(AppContext);

  const [isEdit, setIsEdit] = useState(false);
  const [image, setImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    const phoneRegex = /^[0-9]{10}$/;

    if (!userData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!userData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!phoneRegex.test(userData.phone)) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    if (!userData.address.line1.trim()) {
      newErrors.address = 'Address line 1 is required';
    }

    if (!userData.dob) {
      newErrors.dob = 'Date of birth is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateUserProfileData = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append('name', userData.name.trim());
      formData.append('phone', userData.phone);
      formData.append('address', JSON.stringify({
        line1: userData.address.line1.trim(),
        line2: userData.address.line2?.trim() || ''
      }));
      formData.append('gender', userData.gender);
      formData.append('dob', userData.dob);

      if (image) {
        // Validate image file type and size
        if (!image.type.match('image.*')) {
          toast.error('Please select a valid image file');
          return;
        }
        if (image.size > 2 * 1024 * 1024) { // 2MB limit
          toast.error('Image size should be less than 2MB');
          return;
        }
        formData.append('image', image);
      }

      const { data } = await axios.post(`${backendUrl}/api/user/update-profile`, formData, {
        headers: { 
          token,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (data.success) {
        toast.success('Profile updated successfully');
        await loadUserProfileData();
        setIsEdit(false);
        setImage(null);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
    }
  };

  const handleCancelEdit = () => {
    setIsEdit(false);
    setImage(null);
    setErrors({});
    loadUserProfileData(); // Reset to original data
  };

  if (!userData) {
    return <div className="text-center py-12">Loading profile data...</div>;
  }

  return (
    <div className="max-w-lg mx-auto p-4 md:p-6">
      {/* Profile Header */}
      <div className="flex flex-col items-center mb-8">
        {isEdit ? (
          <label htmlFor="image" className="cursor-pointer group relative">
            <div className="relative overflow-hidden rounded-full w-32 h-32 border-2 border-gray-200">
              <img
                className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                src={image ? URL.createObjectURL(image) : userData.image}
                alt="Profile"
              />
              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <img className="w-8 h-8" src={assets.upload_icon} alt="Upload" />
              </div>
            </div>
            <input 
              onChange={handleImageChange} 
              type="file" 
              id="image" 
              accept="image/*"
              className="sr-only" 
            />
          </label>
        ) : (
          <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-gray-200">
            <img className="w-full h-full object-cover" src={userData.image} alt="Profile" />
          </div>
        )}

        {isEdit ? (
          <div className="mt-4 w-full max-w-xs">
            <input
              className={`w-full text-3xl font-medium text-center bg-gray-50 p-2 rounded ${errors.name ? 'border-red-500' : ''}`}
              type="text"
              value={userData.name}
              onChange={(e) => setUserData(prev => ({ ...prev, name: e.target.value }))}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>
        ) : (
          <h1 className="text-3xl font-medium text-neutral-800 mt-4">{userData.name}</h1>
        )}
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-medium text-neutral-600 mb-4">CONTACT INFORMATION</h2>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Email ID</p>
            <p className="text-blue-600">{userData.email}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500">Phone</p>
            {isEdit ? (
              <div>
                <input
                  className={`w-full p-2 bg-gray-50 rounded ${errors.phone ? 'border-red-500' : ''}`}
                  type="tel"
                  value={userData.phone}
                  onChange={(e) => setUserData(prev => ({ ...prev, phone: e.target.value }))}
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
            ) : (
              <p className="text-blue-500">{userData.phone}</p>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500">Address</p>
            {isEdit ? (
              <div>
                <input
                  className={`w-full p-2 bg-gray-50 rounded mb-2 ${errors.address ? 'border-red-500' : ''}`}
                  placeholder="Address line 1"
                  value={userData.address.line1}
                  onChange={(e) =>
                    setUserData(prev => ({
                      ...prev,
                      address: { ...prev.address, line1: e.target.value },
                    }))
                  }
                />
                <input
                  className="w-full p-2 bg-gray-50 rounded"
                  placeholder="Address line 2 (optional)"
                  value={userData.address.line2}
                  onChange={(e) =>
                    setUserData(prev => ({
                      ...prev,
                      address: { ...prev.address, line2: e.target.value },
                    }))
                  }
                />
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
              </div>
            ) : (
              <div className="text-gray-600">
                <p>{userData.address.line1}</p>
                {userData.address.line2 && <p>{userData.address.line2}</p>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-medium text-neutral-600 mb-4">BASIC INFORMATION</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Gender</p>
            {isEdit ? (
              <select
                className="w-full p-2 bg-gray-50 rounded"
                value={userData.gender}
                onChange={(e) => setUserData(prev => ({ ...prev, gender: e.target.value }))}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            ) : (
              <p className="text-gray-600">{userData.gender}</p>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500">Date of Birth</p>
            {isEdit ? (
              <div>
                <input
                  className={`w-full p-2 bg-gray-50 rounded ${errors.dob ? 'border-red-500' : ''}`}
                  type="date"
                  value={userData.dob}
                  onChange={(e) => setUserData(prev => ({ ...prev, dob: e.target.value }))}
                  max={new Date().toISOString().split('T')[0]} // Prevent future dates
                />
                {errors.dob && <p className="text-red-500 text-xs mt-1">{errors.dob}</p>}
              </div>
            ) : (
              <p className="text-gray-600">{userData.dob || 'Not specified'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 mt-8">
        {isEdit ? (
          <>
            <button
              className="px-6 py-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
              onClick={handleCancelEdit}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              className="px-6 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors disabled:opacity-70"
              onClick={updateUserProfileData}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </>
        ) : (
          <button
            className="px-6 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors"
            onClick={() => setIsEdit(true)}
          >
            Edit Profile
          </button>
        )}
      </div>
    </div>
  );
};

export default MyProfile;