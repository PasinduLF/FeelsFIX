import React, { useContext, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { useEffect } from 'react'

const DoctorsList = () => {
  const { doctors, aToken, getAllDoctors, changeAvailability } = useContext(AdminContext)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (aToken) {
      getAllDoctors()
    }
  }, [aToken])

  const filteredDoctors = doctors.filter(doctor => 
    doctor.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
              <div className='border border-indigo-200 rounded-xl max-w-56 overflow-hidden cursor-pointer group' key={index}>
                <img className='bg-indigo-50 group-hover:bg-primary transition-all duration-500' src={item.image} alt="" />
                <div className='p-4'>
                  <p className='text-neutral-800 text-lg font-medium'>{item.name}</p>
                  <p className='text-zinc-600 text-sm'>{item.speciality}</p>
                  <div className='mt-2 flex items-center gap-1 text-sm'>
                    <input onChange={() => changeAvailability(item._id)} type="checkbox" checked={item.available} />
                    <p>Available</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className='text-gray-500 text-center w-full'>No doctors found matching your search.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default DoctorsList