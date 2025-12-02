import { useContext, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import Spinner from '../components/Spinner'
import { AppContext } from '../context/AppContext'

const formatDate = (value) => {
  if (!value) return 'Date TBA'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

const formatTime = (value) => {
  if (!value) return 'Time TBA'
  const [hrs, mins] = value.split(':').map((segment) => Number(segment))
  if (Number.isNaN(hrs) || Number.isNaN(mins)) return value
  const date = new Date()
  date.setHours(hrs)
  date.setMinutes(mins)
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

const formatDuration = (minutes) => {
  const total = Number(minutes)
  if (!Number.isFinite(total) || total <= 0) return 'Duration TBA'
  const hrs = Math.floor(total / 60)
  const mins = total % 60
  if (hrs && mins) return `${hrs}h ${mins}m`
  if (hrs) return `${hrs}h`
  return `${mins}m`
}

const priceLabel = (workshop) => {
  if (workshop.priceType === 'paid') {
    const amount = Number(workshop.price || 0)
    return amount > 0 ? `$${amount.toFixed(2)}` : 'Paid'
  }
  return 'Free'
}

const getWorkshopId = (workshop) => workshop._id || workshop.id

const Workshops = () => {
  const { backendUrl } = useContext(AppContext)
  const [workshops, setWorkshops] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const fetchWorkshops = async () => {
      if (!backendUrl) {
        setError('Backend is unreachable right now. Please try again later.')
        return
      }
      setLoading(true)
      setError('')
      try {
        const { data } = await axios.get(`${backendUrl}/api/workshops/public`)
        if (data.success) {
          setWorkshops(data.data || [])
        } else {
          setError(data.message || 'Unable to load workshops')
        }
      } catch (err) {
        setError(err?.response?.data?.message || err.message || 'Unable to load workshops')
      } finally {
        setLoading(false)
      }
    }

    fetchWorkshops()
  }, [backendUrl])

  const sortedWorkshops = useMemo(() => {
    return [...workshops]
      .map((workshop) => ({
        ...workshop,
        date: workshop.date || workshop.startDate,
      }))
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : Infinity
        const dateB = b.date ? new Date(b.date).getTime() : Infinity
        return dateA - dateB
      })
  }, [workshops])

  const nextWorkshop = sortedWorkshops[0]

  const handleReserve = (workshop) => {
    const selectedId = getWorkshopId(workshop)
    if (!selectedId) return
    navigate(`/workshops/${selectedId}/register`, { state: { workshop } })
  }

  return (
    <div className='mt-10 mb-16 space-y-10'>
      <section className='bg-indigo-50 border border-indigo-100 rounded-3xl p-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between'>
        <div className='max-w-2xl space-y-4'>
          <p className='text-sm uppercase tracking-[0.3em] text-indigo-500'>Workshops</p>
          <h1 className='text-3xl sm:text-4xl font-semibold text-slate-900'>Interactive wellness workshops led by licensed therapists</h1>
          <p className='text-slate-600'>Join small-group cohorts covering emotional resilience, stress relief, and evidence-based practices. Seats are limited so everyone gets space to reflect.</p>
          <div className='flex flex-wrap gap-6 text-sm text-slate-700'>
            <div>
              <p className='text-xs uppercase tracking-widest text-slate-500'>Upcoming sessions</p>
              <p className='text-3xl font-semibold text-indigo-600'>{sortedWorkshops.length}</p>
            </div>
            {nextWorkshop && (
              <div>
                <p className='text-xs uppercase tracking-widest text-slate-500'>Next cohort</p>
                <p className='text-base font-semibold'>{formatDate(nextWorkshop.date)} · {formatTime(nextWorkshop.startTime)}</p>
              </div>
            )}
          </div>
        </div>
        <div className='bg-white rounded-2xl shadow-sm border border-white/60 p-5 w-full md:max-w-xs'>
          <p className='text-xs uppercase tracking-[0.2em] text-indigo-400'>Why join?</p>
          <ul className='mt-4 space-y-3 text-sm text-slate-700'>
            <li>✓ Evidence-based tools you can apply instantly</li>
            <li>✓ Live Q&A with therapists after each session</li>
            <li>✓ Actionable worksheets emailed post-event</li>
          </ul>
        </div>
      </section>

      {loading && (
        <div className='flex justify-center py-12'>
          <Spinner />
        </div>
      )}

      {!loading && error && (
        <div className='border border-rose-200 bg-rose-50 text-rose-700 rounded-2xl px-6 py-4 text-center'>
          {error}
        </div>
      )}

      {!loading && !error && sortedWorkshops.length === 0 && (
        <div className='border border-dashed border-slate-200 rounded-3xl p-10 text-center text-slate-500 bg-white'>
          No upcoming workshops are published yet. Check back soon or <button type='button' onClick={() => navigate('/inquiry')} className='text-indigo-600 underline font-medium'>send us an inquiry</button> for private sessions.
        </div>
      )}

      {!loading && !error && sortedWorkshops.length > 0 && (
        <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
          {sortedWorkshops.map((workshop) => {
            const seatsLeft = Math.max(0, (Number(workshop.capacity) || 0) - (Number(workshop.enrolled) || 0))
            return (
              <article key={getWorkshopId(workshop)} className='bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm flex flex-col'>
                {workshop.coverImage && (
                  <img src={workshop.coverImage} alt={workshop.title} className='w-full h-48 object-cover' loading='lazy' />
                )}
                <div className='p-6 flex flex-col gap-4 flex-1'>
                  <div className='flex items-center justify-between text-xs font-semibold'>
                    <span className='px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100'>Upcoming</span>
                    <span className='px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200'>{priceLabel(workshop)}</span>
                  </div>
                  <div className='space-y-2'>
                    <h3 className='text-xl font-semibold text-slate-900'>{workshop.title}</h3>
                    <p className='text-sm text-slate-500'>Hosted by {workshop.facilitator}</p>
                    <p className='text-sm text-slate-600'>{workshop.description || 'Live, interactive session with guided practice and take-home tools.'}</p>
                  </div>
                  <div className='grid grid-cols-2 gap-3 text-sm text-slate-600'>
                    <div className='p-3 bg-slate-50 rounded-2xl border border-slate-100'>
                      <p className='text-xs uppercase tracking-widest text-slate-500'>Date</p>
                      <p className='font-semibold'>{formatDate(workshop.date)}</p>
                      <p>{formatTime(workshop.startTime)}</p>
                    </div>
                    <div className='p-3 bg-slate-50 rounded-2xl border border-slate-100'>
                      <p className='text-xs uppercase tracking-widest text-slate-500'>Duration</p>
                      <p className='font-semibold'>{formatDuration(workshop.durationMinutes)}</p>
                      <p>{workshop.capacity} seats</p>
                    </div>
                  </div>
                  <div className='flex items-center justify-between text-sm text-slate-600'>
                    <span>{workshop.enrolled} registered</span>
                    <span>{seatsLeft} seats left</span>
                  </div>
                  <button
                    type='button'
                    onClick={() => handleReserve(workshop)}
                    className='w-full mt-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-2xl transition-all'
                  >
                    Reserve a spot
                  </button>
                </div>
              </article>
          )})}
        </div>
      )}
    </div>
  )
}

export default Workshops