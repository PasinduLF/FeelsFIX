import { useContext, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import Spinner from '../components/Spinner'
import { AppContext } from '../context/AppContext'

const filters = [
  { id: 'all', label: 'All' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
]

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

const StatusPill = ({ status }) => {
  const normalized = status?.toLowerCase()
  const styles = {
    upcoming: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    completed: 'bg-slate-100 text-slate-700 border-slate-200',
    cancelled: 'bg-rose-50 text-rose-600 border-rose-100',
  }
  return (
    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${styles[normalized] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
      {normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : 'Status'}
    </span>
  )
}

const DecisionPill = ({ decisionStatus }) => {
  const normalized = decisionStatus?.toLowerCase()
  const styles = {
    pending: 'bg-amber-50 text-amber-700 border-amber-100',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    declined: 'bg-rose-50 text-rose-600 border-rose-100',
  }
  return (
    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${styles[normalized] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
      {normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : 'Pending'}
    </span>
  )
}

const MyWorkshops = () => {
  const navigate = useNavigate()
  const { backendUrl, token, userData } = useContext(AppContext)
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')

  useEffect(() => {
    if (!token || !backendUrl) return
    const fetchRegistrations = async () => {
      setLoading(true)
      setError('')
      try {
        const { data } = await axios.get(`${backendUrl}/api/workshops/registrations/me`, { headers: { token } })
        if (data.success) {
          setRegistrations(data.data || [])
        } else {
          setError(data.message || 'Unable to load your workshops.')
        }
      } catch (err) {
        setError(err?.response?.data?.message || err.message || 'Unable to load your workshops.')
      } finally {
        setLoading(false)
      }
    }

    fetchRegistrations()
  }, [backendUrl, token])

  const counts = useMemo(() => {
    const base = { all: registrations.length, upcoming: 0, completed: 0, cancelled: 0 }
    registrations.forEach((item) => {
      if (item.status && Object.prototype.hasOwnProperty.call(base, item.status)) {
        base[item.status] += 1
      }
    })
    return base
  }, [registrations])

  const filteredRegistrations = useMemo(() => {
    if (activeFilter === 'all') return registrations
    return registrations.filter((item) => item.status === activeFilter)
  }, [activeFilter, registrations])

  if (!token) {
    return (
      <div className='mt-16 mb-20 text-center space-y-4'>
        <h1 className='text-3xl font-semibold text-slate-900'>Sign in to view your workshops</h1>
        <p className='text-slate-600 max-w-xl mx-auto'>Your reserved workshops will show up here once you log in using the same account you used during registration.</p>
        <button type='button' onClick={() => navigate('/login')} className='px-8 py-3 rounded-full bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition'>
          Go to login
        </button>
      </div>
    )
  }

  return (
    <div className='mt-10 mb-20 space-y-8'>
      <header className='space-y-2'>
        <p className='text-sm uppercase tracking-[0.3em] text-indigo-500'>My Workshops</p>
        <h1 className='text-3xl font-semibold text-slate-900'>Saved registrations for {userData?.name || 'you'}</h1>
        <p className='text-slate-600 max-w-2xl'>Track every workshop you have bookmarked or reserved. We categorize them automatically so you can focus on showing up prepared.</p>
      </header>

      <div className='flex flex-wrap gap-3 border border-slate-100 rounded-2xl p-2 bg-white shadow-sm'>
        {filters.map((filter) => (
          <button
            key={filter.id}
            type='button'
            onClick={() => setActiveFilter(filter.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              activeFilter === filter.id
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {filter.label}
            <span className='ml-2 text-xs font-medium opacity-70'>
              {filter.id === 'all' ? counts.all : counts[filter.id] || 0}
            </span>
          </button>
        ))}
      </div>

      {loading && (
        <div className='flex justify-center py-20'>
          <Spinner />
        </div>
      )}

      {!loading && error && (
        <div className='border border-rose-200 bg-rose-50 text-rose-700 rounded-2xl px-6 py-4 text-center'>
          {error}
        </div>
      )}

      {!loading && !error && filteredRegistrations.length === 0 && (
        <div className='border border-dashed border-slate-200 rounded-3xl p-10 text-center text-slate-500 bg-white'>
          <p className='text-lg font-medium'>No workshops in this category yet.</p>
          <p className='mt-2 text-sm'>Reserve a new session to see it listed here.</p>
          <button type='button' onClick={() => navigate('/workshops')} className='mt-4 px-6 py-2 rounded-full bg-indigo-600 text-white font-semibold'>
            Browse workshops
          </button>
        </div>
      )}

      {!loading && !error && filteredRegistrations.length > 0 && (
        <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
          {filteredRegistrations.map((registration) => {
            const canViewWorkshop = Boolean(registration.workshopId)
            return (
              <article key={registration.id} className='bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm flex flex-col'>
                {registration.coverImage && (
                  <img src={registration.coverImage} alt={registration.title} className='w-full h-44 object-cover' loading='lazy' />
                )}
                <div className='p-6 flex flex-col gap-4 flex-1'>
                  <div className='flex items-center justify-between flex-wrap gap-2'>
                    <div className='flex items-center gap-2'>
                      <StatusPill status={registration.status} />
                      <DecisionPill decisionStatus={registration.decisionStatus} />
                    </div>
                    <span className='text-sm text-slate-500'>Booked on {formatDate(registration.createdAt)}</span>
                  </div>
                  {registration.decisionStatus === 'declined' && registration.decisionNote && (
                    <p className='text-sm text-rose-500 bg-rose-50 border border-rose-100 rounded-2xl px-4 py-2'>
                      {registration.decisionNote}
                    </p>
                  )}
                  <div className='space-y-2'>
                    <h3 className='text-xl font-semibold text-slate-900'>{registration.title}</h3>
                    <p className='text-sm text-slate-500'>Facilitator · {registration.facilitator}</p>
                  </div>
                  <div className='grid grid-cols-2 gap-3 text-sm text-slate-600'>
                    <div className='p-3 bg-slate-50 rounded-2xl border border-slate-100'>
                      <p className='text-xs uppercase tracking-widest text-slate-500'>Date</p>
                      <p className='font-semibold'>{formatDate(registration.date)}</p>
                      <p>{formatTime(registration.startTime)}</p>
                    </div>
                    <div className='p-3 bg-slate-50 rounded-2xl border border-slate-100'>
                      <p className='text-xs uppercase tracking-widest text-slate-500'>Duration</p>
                      <p className='font-semibold'>{formatDuration(registration.durationMinutes)}</p>
                      <p>{registration.priceType === 'paid' ? 'Paid' : 'Free'}</p>
                    </div>
                  </div>
                  <button
                    type='button'
                    disabled={!canViewWorkshop}
                    onClick={() => canViewWorkshop && navigate(`/workshops/${registration.workshopId}/register`, { state: { from: 'my-workshops' } })}
                    className={`mt-auto w-full rounded-2xl py-3 font-semibold transition ${
                      canViewWorkshop ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {canViewWorkshop ? 'View workshop page' : 'Workshop no longer available'}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default MyWorkshops
