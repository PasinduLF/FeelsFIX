import { useContext, useEffect, useState } from 'react'
import { WorkshopContext } from '../../context/WorkshopContext'
import { assets } from '../../assets/assets'

const initialForm = {
  title: '',
  facilitator: '',
  date: '',
  startTime: '',
  durationMinutes: 60,
  capacity: 30,
  enrolled: 0,
  priceType: 'free',
  price: 0,
  description: '',
  coverImage: '',
}

const AddWorkshop = () => {
  const {
    addWorkshop,
    updateWorkshop,
    stats,
    formatDuration,
    formatStartTime,
    editingWorkshop,
    clearEditingWorkshop,
    loading,
  } = useContext(WorkshopContext)
  const [formData, setFormData] = useState(initialForm)
  const isEditing = Boolean(editingWorkshop)
  const isBusy = loading

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => {
      if (name === 'capacity' || name === 'enrolled' || name === 'durationMinutes') {
        return { ...prev, [name]: Number(value) }
      }
      if (name === 'price') {
        return { ...prev, price: Number(value) }
      }
      if (name === 'priceType') {
        return {
          ...prev,
          priceType: value,
          price: value === 'paid' ? Math.max(1, prev.price || 0) : 0,
        }
      }
      return { ...prev, [name]: value }
    })
  }

  useEffect(() => {
    if (editingWorkshop) {
      setFormData({ ...initialForm, ...editingWorkshop })
    } else {
      setFormData(initialForm)
    }
  }, [editingWorkshop])
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) {
      setFormData((prev) => ({ ...prev, coverImage: '' }))
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, coverImage: reader.result }))
    }
    reader.readAsDataURL(file)
  }

  const handleRemovePhoto = () => {
    setFormData((prev) => ({ ...prev, coverImage: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isEditing && editingWorkshop) {
      const updated = await updateWorkshop(editingWorkshop.id, formData)
      if (updated) {
        console.log('Workshop update payload', updated)
        setFormData(initialForm)
      }
      return
    }

    const savedWorkshop = await addWorkshop(formData)
    if (savedWorkshop) {
      console.log('Workshop submission payload', savedWorkshop)
      setFormData(initialForm)
    }
  }

  const handleSaveDraft = async () => {
    if (isEditing) return
    const savedWorkshop = await addWorkshop(formData, { isDraft: true, status: 'draft' })
    if (savedWorkshop) {
      console.log('Workshop draft payload', savedWorkshop)
    }
  }

  const handleCancelEdit = () => {
    clearEditingWorkshop()
    setFormData(initialForm)
  }

  const isValid = () => {
    if (!formData.title.trim()) return false
    if (!formData.facilitator.trim()) return false
    if (!formData.date) return false
    if (!formData.startTime) return false
    if (!formData.durationMinutes || Number(formData.durationMinutes) <= 0) return false
    if (!formData.capacity || Number(formData.capacity) <= 0) return false
    if (!formData.coverImage) return false
    if (formData.priceType === 'paid' && (!formData.price || Number(formData.price) <= 0)) return false
    return true
  }

  return (
    <div className='m-5'>
      <div className='bg-white border rounded-2xl shadow-sm p-6 flex flex-col gap-5 max-w-3xl'>
        <div className='flex items-center justify-between gap-4 flex-wrap'>
          <div>
            <p className='text-xs tracking-[0.2em] text-gray-400 uppercase'>Add Workshop</p>
            <h3 className='text-3xl font-semibold text-gray-800 mt-1'>Plan a new session</h3>
            <p className='text-gray-500 text-sm mt-1'>Publish upcoming ideas so the team can monitor enrollment goals.</p>
          </div>
          <img src={assets.add_icon} alt='Add workshop' className='w-14 h-14 p-3 bg-indigo-50 rounded-full' />
        </div>

        {isEditing && (
          <div className='bg-amber-50 border border-amber-100 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-amber-800'>
            <div>
              <p className='text-xs uppercase tracking-[0.2em] text-amber-500'>Editing mode</p>
              <p className='text-sm font-semibold'>Updating “{editingWorkshop?.title}”</p>
            </div>
            <button
              type='button'
              onClick={handleCancelEdit}
              className='text-xs font-semibold px-4 py-2 rounded-full border border-amber-200 bg-white text-amber-600 hover:bg-amber-100'
            >
              Cancel editing
            </button>
          </div>
        )}

        <div className='bg-indigo-50 border border-indigo-100 rounded-2xl p-4 grid grid-cols-2 gap-4 text-indigo-800'>
          <div>
            <p className='text-xs uppercase tracking-wider text-indigo-500'>Capacity Health</p>
            <p className='text-3xl font-bold mt-2'>{stats.fillRate}%</p>
            {stats.totalCapacity === 0 ? (
              <p className='text-sm'>Add your first workshop to start tracking performance.</p>
            ) : (
              <p className='text-sm'>Fill rate across all planned workshops</p>
            )}
          </div>
          <div>
            <p className='text-xs uppercase tracking-wider text-indigo-500'>Seats Planned</p>
            <p className='text-3xl font-bold mt-2'>{stats.totalCapacity}</p>
            {stats.totalCapacity === 0 ? (
              <p className='text-sm'>No registrations yet — publish a session to unlock insights.</p>
            ) : (
              <p className='text-sm'>{stats.totalEnrolled} people already registered</p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Workshop Details */}
          <div>
            <label className='text-sm font-medium text-gray-700'>Workshop Details</label>
            <p className='text-xs text-gray-400'>Title and host information</p>
            <input
              type='text'
              name='title'
              placeholder='Workshop title'
              value={formData.title}
              onChange={handleChange}
              required
              className='mt-3 w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none'
            />
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3'>
              <input
                type='text'
                name='facilitator'
                placeholder='Facilitator / Host'
                value={formData.facilitator}
                onChange={handleChange}
                required
                className='w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none'
              />
              <input
                type='date'
                name='date'
                value={formData.date}
                onChange={handleChange}
                required
                className='w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-600 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none'
              />
            </div>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3'>
              <div>
                <label className='text-xs text-gray-500'>Session start time</label>
                <input
                  type='time'
                  name='startTime'
                  value={formData.startTime}
                  onChange={handleChange}
                  required
                  className='mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-600 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none'
                />
                <p className='text-xs text-gray-400 mt-1'>Shown to attendees on confirmation emails.</p>
              </div>
              <div>
                <label className='text-xs text-gray-500'>Duration (minutes)</label>
                <input
                  type='number'
                  min={15}
                  step={15}
                  name='durationMinutes'
                  value={formData.durationMinutes}
                  onChange={handleChange}
                  required
                  className='mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none'
                />
                <p className='text-xs text-gray-400 mt-1'>Plan realistic timing (minimum 15 minutes).</p>
              </div>
            </div>
            <textarea
              name='description'
              placeholder='Optional description (what attendees will learn)'
              value={formData.description || ''}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              className='mt-3 w-full border border-gray-200 rounded-xl px-4 py-2.5 h-24 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none'
            />
            <p className='text-xs text-gray-400 mt-1'>Optional: add a short summary to help attendees decide.</p>
          </div>

          {/* Capacity & Attendance */}
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            <div>
              <label className='text-xs text-gray-500'>Capacity</label>
              <input
                type='number'
                min={1}
                name='capacity'
                value={formData.capacity}
                onChange={handleChange}
                required
                className='mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none'
              />
              <p className='text-xs text-gray-400 mt-1'>Set maximum seats available.</p>
            </div>
            <div>
              <label className='text-xs text-gray-500'>Expected attendees</label>
              <input
                type='number'
                min={0}
                name='enrolled'
                value={formData.enrolled}
                onChange={handleChange}
                required
                className='mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none'
              />
              <p className='text-xs text-gray-400 mt-1'>Estimated number of registrants (updates fill rate).</p>
            </div>
          </div>

          {/* Pricing */}
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            <div>
              <label className='text-xs text-gray-500'>Price type</label>
              <select
                name='priceType'
                value={formData.priceType}
                onChange={handleChange}
                required
                className='mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none'
              >
                <option value='free'>Free</option>
                <option value='paid'>Paid</option>
              </select>
              <p className='text-xs text-gray-400 mt-1'>Choose whether this session is free or paid.</p>
            </div>
            <div>
              <label className='text-xs text-gray-500'>Price (USD)</label>
              <input
                type='number'
                min={0}
                step='0.01'
                name='price'
                value={formData.price}
                onChange={handleChange}
                disabled={formData.priceType !== 'paid'}
                required={formData.priceType === 'paid'}
                className='mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none disabled:opacity-60'
              />
              {formData.priceType === 'paid' ? (
                <p className='text-xs text-gray-400 mt-1'>Enter a price greater than 0 for paid workshops.</p>
              ) : (
                <p className='text-xs text-gray-400 mt-1'>Price hidden for free sessions.</p>
              )}
            </div>
          </div>

          {/* Cover image */}
          <div>
            <label className='text-sm font-medium text-gray-700'>Workshop Cover</label>
            <p className='text-xs text-gray-400'>Upload a 4:3 image to highlight the session</p>
            <div className='mt-3 border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3 bg-gray-50'>
              {formData.coverImage ? (
                <>
                  <img src={formData.coverImage} alt='Workshop cover' className='w-full max-h-64 object-cover rounded-xl' />
                  <button type='button' onClick={handleRemovePhoto} className='text-sm text-red-500 underline'>Remove photo</button>
                </>
              ) : (
                <>
                  <p className='text-sm text-gray-500'>Drag & drop an image or click to browse</p>
                  <label className='px-4 py-2 rounded-full bg-white border border-gray-200 text-sm font-medium text-indigo-600 cursor-pointer hover:border-indigo-300'>
                    Choose Image
                    <input type='file' accept='image/*' className='hidden' onChange={handlePhotoChange} />
                  </label>
                </>
              )}
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 items-start'>
            <div className='flex flex-col gap-2'>
              {!isEditing && (
                <button
                  type='button'
                  onClick={handleSaveDraft}
                  disabled={isBusy}
                  className={`w-full border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl transition-all ${isBusy ? 'opacity-70 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                >
                  {isBusy ? 'Saving…' : 'Save Draft'}
                </button>
              )}
              <button
                type='submit'
                disabled={!isValid() || isBusy}
                className={`w-full ${isValid() && !isBusy ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-300 cursor-not-allowed'} text-white font-semibold py-3 rounded-xl transition-all shadow`}
              >
                {isBusy ? 'Saving…' : isEditing ? 'Update workshop' : 'Save to ready queue'}
              </button>
            </div>
            <div className='bg-gray-50 border rounded-xl p-4'>
              <p className='text-sm font-medium text-gray-700'>Preview</p>
              <p className='text-xs text-gray-400'>Review your workshop before submitting</p>
              <div className='mt-3 text-sm text-gray-800'>
                {formData.coverImage && (
                  <img src={formData.coverImage} alt='Preview cover' className='w-full rounded-xl mb-3 object-cover max-h-48' />
                )}
                <p className='font-semibold'>{formData.title || 'Untitled workshop'}</p>
                <p className='text-xs text-gray-500'>{formData.facilitator || 'Facilitator TBA'} • {formData.date || 'Date TBA'}</p>
                <p className='text-xs text-gray-500 mt-1'>{formatStartTime(formData.startTime)} • {formatDuration(formData.durationMinutes)}</p>
                <p className='text-xs text-gray-500 mt-2'>{formData.description || ''}</p>
                <div className='flex items-center justify-between text-xs text-gray-500 mt-3'>
                  <span>{formData.enrolled} registered</span>
                  <span>{formData.capacity} seats</span>
                </div>
                <div className='text-xs text-gray-500 mt-2'>{formData.priceType === 'paid' ? `$${Number(formData.price || 0).toFixed(2)}` : 'Free'}</div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddWorkshop
