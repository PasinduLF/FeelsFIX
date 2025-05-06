import React, { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppContext } from '../context/AppContext'

function Doctors() {
  const { speciality } = useParams()
  const { doctors } = useContext(AppContext)
  const [filterDoc, setFilterDoc] = useState([])
  const [showFilter, setShowFilter] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const navigate = useNavigate()

  const applyFilter = () => {
    let filtered = doctors

    // Apply speciality filter
    if (speciality) {
      filtered = filtered.filter(doc => doc.speciality === speciality)
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(doc => 
        doc.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilterDoc(filtered)
  }

  useEffect(() => {
    applyFilter()
  }, [doctors, speciality, searchTerm])

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-4">
        <p className='text-gray-600'>Browse through the doctors specialist.</p>
        <input
          type='text'
          placeholder='Search doctors by name...'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className='w-64 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
        />
      </div>
      <div className='flex flex-col sm:flex-row items-start gap-5 mt-5'>
        <button 
          className={`py-1 px-3 border rounded text-sm transition-all sm:hidden ${showFilter ? 'bg-primary text-white' : ''}`} 
          onClick={() => setShowFilter(prev => !prev)}
        >
          Filters
        </button>
        <div className={`flex-col gap-4 text-sm text-gray-600 ${showFilter ? 'flex' : 'hidden sm:flex'}`}>
          <p 
            onClick={() => speciality === 'Psychologists (Ph.D. or Psy.D.)' ? navigate('/doctors') : navigate('/doctors/Psychologists (Ph.D. or Psy.D.)')} 
            className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${speciality === "Psychologists (Ph.D. or Psy.D.)" ? "bg-indigo-100 text-black" : ""}`}
          >
            Psychologists (Ph.D. or Psy.D.)
          </p>
          <p 
            onClick={() => speciality === 'Psychiatrists (M.D. or D.O.)' ? navigate('/doctors') : navigate('/doctors/Psychiatrists (M.D. or D.O.)')} 
            className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${speciality === "Psychiatrists (M.D. or D.O.)" ? "bg-indigo-100 text-black" : ""}`}
          >
            Psychiatrists (M.D. or D.O.)
          </p>
          <p 
            onClick={() => speciality === 'Marriage and Family Therapists (MFT)' ? navigate('/doctors') : navigate('/doctors/Marriage and Family Therapists (MFT)')} 
            className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${speciality === "Marriage and Family Therapists (MFT)" ? "bg-indigo-100 text-black" : ""}`}
          >
            Marriage & Family Therapists (MFT)
          </p>
          <p 
            onClick={() => speciality === 'Child and Adolescent Therapists' ? navigate('/doctors') : navigate('/doctors/Child and Adolescent Therapists')} 
            className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${speciality === "Child and Adolescent Therapists" ? "bg-indigo-100 text-black" : ""}`}
          >
            Child & Adolescent Therapists
          </p>
          <p 
            onClick={() => speciality === 'Neuropsychologists' ? navigate('/doctors') : navigate('/doctors/Neuropsychologists')} 
            className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${speciality === "Neuropsychologists" ? "bg-indigo-100 text-black" : ""}`}
          >
            Neuropsychologists
          </p>
          <p 
            onClick={() => speciality === 'Clinical Social Workers' ? navigate('/doctors') : navigate('/doctors/Clinical Social Workers')} 
            className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${speciality === "Clinical Social Workers" ? "bg-indigo-100 text-black" : ""}`}
          >
            Clinical Social Workers
          </p>
        </div>
        <div className='w-full grid grid-cols-auto gap-4 gap-y-6'>
          {filterDoc.map((item, index) => (
            <div 
              onClick={() => navigate(`/appointment/${item._id}`)} 
              className='border border-blue-200 rounded-xl overflow-hidden cursor-pointer hover:translate-y-[-10px] transition-all duration-500' 
              key={index}
            >
              <img className='bg-blue-50' src={item.image} alt="" />
              <div className='p-4'>
                <div className={`flex items-center gap-2 text-sm text-center ${item.available ? 'text-green-500' : 'text-gray-500'}`}>
                  <p className={`w-2 h-2 ${item.available ? 'bg-green-500' : 'bg-gray-500'} rounded-full`}></p>
                  <p>{item.available ? 'Available' : 'Not Available'}</p>
                </div>
                <p className='text-gray-900 text-lg font-medium'>{item.name}</p>
                <p className='text-gray-600 text-sm'>{item.speciality}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Doctors