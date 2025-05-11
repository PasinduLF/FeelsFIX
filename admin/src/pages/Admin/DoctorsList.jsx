import React, { useContext, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { useEffect } from 'react'
import { FaTrash, FaEdit } from 'react-icons/fa'
import axios from 'axios'
import { toast } from 'react-toastify'

const DoctorsList = () => {
  const { doctors, aToken, getAllDoctors, changeAvailability, backendUrl } = useContext(AdminContext)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    speciality: '',
    degree: '',
    experience: '',
    about: '',
    fees: '',
    address1: '',
    address2: '',
    image: null
  })

  useEffect(() => {
    if (aToken) {
      getAllDoctors()
    }
  }, [aToken])

  const filteredDoctors = doctors.filter(doctor => 
    doctor.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDeleteDoctor = async (doctorId) => {
    if (!window.confirm('Are you sure you want to delete this doctor? This action cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    try {
      const { data } = await axios.delete(`${backendUrl}/api/admin/doctors/${doctorId}`, {
        headers: { aToken }
      })
      
      if (data.success) {
        toast.success('Doctor deleted successfully')
        getAllDoctors() // Refresh the list
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete doctor')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEditClick = (doctor) => {
    setSelectedDoctor(doctor)
    setFormData({
      name: doctor.name,
      speciality: doctor.speciality,
      degree: doctor.degree,
      experience: doctor.experience,
      about: doctor.about,
      fees: doctor.fees,
      address1: doctor.address.line1,
      address2: doctor.address.line2,
      image: null
    })
    setIsEditing(true)
  }

  const handleUpdateDoctor = async (e) => {
    e.preventDefault()
    setIsDeleting(true)
    try {
      const formDataToSend = new FormData()
      formDataToSend.append('name', formData.name)
      formDataToSend.append('speciality', formData.speciality)
      formDataToSend.append('degree', formData.degree)
      formDataToSend.append('experience', formData.experience)
      formDataToSend.append('about', formData.about)
      formDataToSend.append('fees', formData.fees)
      formDataToSend.append('address', JSON.stringify({
        line1: formData.address1,
        line2: formData.address2
      }))
      if (formData.image) {
        formDataToSend.append('image', formData.image)
      }

      const { data } = await axios.put(
        `${backendUrl}/api/admin/doctors/${selectedDoctor._id}`,
        formDataToSend,
        {
          headers: {
            aToken,
            'Content-Type': 'multipart/form-data'
          }
        }
      )

      if (data.success) {
        toast.success('Doctor updated successfully')
        setIsEditing(false)
        getAllDoctors()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update doctor')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className='m-5 h-[90vh] flex flex-col'>
      {/* Fixed header with search */}
      <div className='bg-white sticky top-0 z-10 pb-4'>
        <h1 className='text-lg font-medium mb-4'>All Doctors</h1>
        <div className='relative w-full max-w-md mx-auto'>
          <input
            type="text"
            placeholder="Search by doctor's name..."
            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              className='absolute right-3 top-2 text-gray-400 hover:text-gray-600'
              onClick={() => setSearchTerm('')}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Scrollable doctors list */}
      <div className='flex-grow overflow-y-auto pt-4'>
        <div className='w-full flex flex-wrap gap-4 gap-y-6'>
          {filteredDoctors.length > 0 ? (
            filteredDoctors.map((item, index) => (
              <div className='border border-indigo-200 rounded-xl max-w-56 overflow-hidden group relative' key={index}>
                <img className='bg-indigo-50 group-hover:bg-primary transition-all duration-500' src={item.image} alt="" />
                <div className='p-4'>
                  <p className='text-neutral-800 text-lg font-medium'>{item.name}</p>
                  <p className='text-zinc-600 text-sm'>{item.speciality}</p>
                  <div className='mt-2 flex items-center justify-between'>
                    <div className='flex items-center gap-1 text-sm'>
                      <input onChange={() => changeAvailability(item._id)} type="checkbox" checked={item.available} />
                      <p>Available</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditClick(item)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50 transition-colors"
                        title="Edit doctor"
                      >
                        <FaEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDoctor(item._id)}
                        disabled={isDeleting}
                        className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50 transition-colors"
                        title="Delete doctor"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className='text-gray-500 text-center w-full'>No doctors found matching your search.</p>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Edit Doctor</h2>
            <form onSubmit={handleUpdateDoctor} className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <img
                  className="w-16 h-16 rounded-full object-cover"
                  src={formData.image ? URL.createObjectURL(formData.image) : selectedDoctor.image}
                  alt=""
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
                  className="text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Speciality</label>
                  <select
                    value={formData.speciality}
                    onChange={(e) => setFormData({ ...formData, speciality: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  >
                    <option value="Psychologists (Ph.D. or Psy.D.)">Psychologists (Ph.D. or Psy.D.)</option>
                    <option value="Psychiatrists (M.D. or D.O.)">Psychiatrists (M.D. or D.O.)</option>
                    <option value="Marriage and Family Therapists (MFT)">Marriage and Family Therapists (MFT)</option>
                    <option value="Child and Adolescent Therapists">Child and Adolescent Therapists</option>
                    <option value="Neuropsychologists">Neuropsychologists</option>
                    <option value="Clinical Social Workers">Clinical Social Workers</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Degree</label>
                  <input
                    type="text"
                    value={formData.degree}
                    onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Experience</label>
                  <select
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  >
                    {[...Array(10)].map((_, i) => (
                      <option key={i + 1} value={`${i + 1} Year`}>{i + 1} Year</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Fees</label>
                  <input
                    type="number"
                    value={formData.fees}
                    onChange={(e) => setFormData({ ...formData, fees: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Address Line 1</label>
                  <input
                    type="text"
                    value={formData.address1}
                    onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Address Line 2</label>
                  <input
                    type="text"
                    value={formData.address2}
                    onChange={(e) => setFormData({ ...formData, address2: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">About</label>
                <textarea
                  value={formData.about}
                  onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {isDeleting ? 'Updating...' : 'Update Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default DoctorsList