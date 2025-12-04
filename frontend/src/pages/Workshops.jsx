import { useContext, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import Spinner from '../components/Spinner'
import { AppContext } from '../context/AppContext'
import {
  buildFilterOptions,
  formatDateLabel,
  formatDurationLabel,
  formatTimeLabel,
  getCategoryLabel,
  getLevelLabel,
  getPriceLabel,
  getSeatsMeta,
  getStatusBadges,
  isRegistrationOpen,
} from '../utils/workshopHelpers'

const initialFilters = { dateFrom: '', dateTo: '', price: 'all', category: 'all', level: 'all' }
const sortOptions = [
  { value: 'closest', label: 'Closest date' },
  { value: 'popular', label: 'Most popular' },
  { value: 'newest', label: 'Newest' },
]

const badgeToneClasses = {
  indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  amber: 'bg-amber-50 text-amber-700 border-amber-100',
  rose: 'bg-rose-50 text-rose-600 border-rose-100',
  slate: 'bg-slate-100 text-slate-600 border-slate-200',
}

const getWorkshopId = (workshop) => workshop._id || workshop.id

const getEventTimestamp = (workshop) => {
  const dateValue = workshop.date || workshop.startDate
  if (!dateValue) return null
  const parsed = new Date(dateValue)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.getTime()
}

const getNewestTimestamp = (workshop) => {
  const references = [workshop.publishedAt, workshop.createdAt, workshop.updatedAt, workshop.date]
  const timestamps = references
    .map((value) => {
      if (!value) return null
      const parsed = new Date(value)
      return Number.isNaN(parsed.getTime()) ? null : parsed.getTime()
    })
    .filter((value) => Number.isFinite(value))
  return timestamps.length ? Math.max(...timestamps) : 0
}

const Workshops = () => {
  const { backendUrl } = useContext(AppContext)
  const [workshops, setWorkshops] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState(initialFilters)
  const [sortBy, setSortBy] = useState('closest')
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

  const normalizedWorkshops = useMemo(() => {
    return workshops.map((workshop) => {
      const seatsMeta = getSeatsMeta(workshop)
      return {
        ...workshop,
        categoryLabel: getCategoryLabel(workshop),
        levelLabel: getLevelLabel(workshop),
        priceLabel: getPriceLabel(workshop),
        statusBadges: getStatusBadges(workshop),
        isRegistrationOpen: isRegistrationOpen(workshop),
        eventTimestamp: getEventTimestamp(workshop),
        ...seatsMeta,
      }
    })
  }, [workshops])

  const filterOptions = useMemo(() => buildFilterOptions(workshops), [workshops])

  const filteredWorkshops = useMemo(() => {
    return normalizedWorkshops.filter((workshop) => {
      if (filters.price !== 'all' && workshop.priceType !== filters.price) return false
      if (filters.category !== 'all' && workshop.categoryLabel !== filters.category) return false
      if (filters.level !== 'all' && workshop.levelLabel !== filters.level) return false
      if (filters.dateFrom) {
        const from = new Date(filters.dateFrom)
        from.setHours(0, 0, 0, 0)
        if (!workshop.eventTimestamp || workshop.eventTimestamp < from.getTime()) return false
      }
      if (filters.dateTo) {
        const to = new Date(filters.dateTo)
        to.setHours(23, 59, 59, 999)
        if (!workshop.eventTimestamp || workshop.eventTimestamp > to.getTime()) return false
      }
      return true
    })
  }, [normalizedWorkshops, filters])

  const orderedWorkshops = useMemo(() => {
    const sorted = [...filteredWorkshops]
    switch (sortBy) {
      case 'popular':
        sorted.sort((a, b) => (b.enrolled || 0) - (a.enrolled || 0))
        break
      case 'newest':
        sorted.sort((a, b) => getNewestTimestamp(b) - getNewestTimestamp(a))
        break
      case 'closest':
      default:
        sorted.sort((a, b) => {
          const dateA = Number.isFinite(a.eventTimestamp) ? a.eventTimestamp : Number.POSITIVE_INFINITY
          const dateB = Number.isFinite(b.eventTimestamp) ? b.eventTimestamp : Number.POSITIVE_INFINITY
          return dateA - dateB
        })
    }
    return sorted
  }, [filteredWorkshops, sortBy])

  const nextWorkshop = orderedWorkshops[0]

  const handleReserve = (workshop) => {
    const selectedId = getWorkshopId(workshop)
    if (!selectedId) return
    navigate(`/workshops/${selectedId}/register`, { state: { workshop } })
  }

  const handleFilterChange = (event) => {
    const { name, value } = event.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  const resetFilters = () => setFilters(initialFilters)

  return (
    <div className='mt-10 mb-16 space-y-10'>
      <section className='bg-indigo-50 border border-indigo-100 rounded-3xl p-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between'>
        <div className='max-w-2xl space-y-4'>
          <p className='text-sm uppercase tracking-[0.3em] text-indigo-500'>Workshops</p>
          <h1 className='text-3xl sm:text-4xl font-semibold text-slate-900'>Interactive wellness workshops led by licensed therapists</h1>
          <p className='text-slate-600'>Join small-group cohorts covering emotional resilience, stress relief, and evidence-based practices. Seats are limited so everyone gets space to reflect.</p>
          <div className='flex flex-wrap gap-6 text-sm text-slate-700'>
            <div>
              <p className='text-xs uppercase tracking-widest text-slate-500'>Visible sessions</p>
              <p className='text-3xl font-semibold text-indigo-600'>{orderedWorkshops.length}</p>
            </div>
            {nextWorkshop && (
              <div>
                <p className='text-xs uppercase tracking-widest text-slate-500'>Next cohort</p>
                <p className='text-base font-semibold'>{formatDateLabel(nextWorkshop.date)} · {formatTimeLabel(nextWorkshop.startTime)}</p>
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

      <section className='rounded-3xl border border-slate-200 bg-white p-6 space-y-4'>
        <div className='flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4 flex-1'>
            <div>
              <label htmlFor='dateFrom' className='text-xs font-semibold uppercase tracking-wide text-slate-500'>From</label>
              <input type='date' id='dateFrom' name='dateFrom' value={filters.dateFrom} onChange={handleFilterChange} className='mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100' />
            </div>
            <div>
              <label htmlFor='dateTo' className='text-xs font-semibold uppercase tracking-wide text-slate-500'>To</label>
              <input type='date' id='dateTo' name='dateTo' value={filters.dateTo} onChange={handleFilterChange} className='mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100' />
            </div>
            <div>
              <label htmlFor='price' className='text-xs font-semibold uppercase tracking-wide text-slate-500'>Price</label>
              <select id='price' name='price' value={filters.price} onChange={handleFilterChange} className='mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'>
                <option value='all'>All</option>
                <option value='free'>Free</option>
                <option value='paid'>Paid</option>
              </select>
            </div>
            <div>
              <label htmlFor='category' className='text-xs font-semibold uppercase tracking-wide text-slate-500'>Category</label>
              <select id='category' name='category' value={filters.category} onChange={handleFilterChange} className='mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'>
                <option value='all'>All</option>
                {filterOptions.categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor='level' className='text-xs font-semibold uppercase tracking-wide text-slate-500'>Level</label>
              <select id='level' name='level' value={filters.level} onChange={handleFilterChange} className='mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'>
                <option value='all'>All levels</option>
                {filterOptions.levels.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
          </div>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
            <div>
              <label htmlFor='sortBy' className='text-xs font-semibold uppercase tracking-wide text-slate-500'>Sort by</label>
              <select id='sortBy' value={sortBy} onChange={(event) => setSortBy(event.target.value)} className='mt-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'>
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <button type='button' onClick={resetFilters} className='rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-400'>
              Reset
            </button>
          </div>
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

      {!loading && !error && orderedWorkshops.length === 0 && (
        <div className='border border-dashed border-slate-200 rounded-3xl p-10 text-center text-slate-500 bg-white'>
          No workshops match your filters. Adjust the filters or{' '}
          <button type='button' onClick={() => navigate('/inquiry')} className='text-indigo-600 underline font-medium'>send us an inquiry</button> for private sessions.
        </div>
      )}

      {!loading && !error && orderedWorkshops.length > 0 && (
        <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
          {orderedWorkshops.map((workshop) => (
            <article key={getWorkshopId(workshop)} className='bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm flex flex-col'>
              {workshop.coverImage && (
                <img src={workshop.coverImage} alt={workshop.title} className='w-full h-48 object-cover' loading='lazy' />
              )}
              <div className='p-6 flex flex-col gap-4 flex-1'>
                <div className='flex flex-wrap gap-2 text-xs font-semibold'>
                  {workshop.statusBadges.map((badge) => (
                    <span key={`${badge.label}-${badge.intent}`} className={`px-3 py-1 rounded-full border ${badgeToneClasses[badge.intent] || badgeToneClasses.slate}`}>
                      {badge.label}
                    </span>
                  ))}
                </div>
                <div className='space-y-2'>
                  <h3 className='text-xl font-semibold text-slate-900'>{workshop.title}</h3>
                  <p className='text-sm text-slate-500'>Hosted by {workshop.facilitator}</p>
                  <p className='text-sm text-slate-600'>{workshop.description || 'Live, interactive session with guided practice and take-home tools.'}</p>
                </div>
                <div className='grid grid-cols-2 gap-3 text-sm text-slate-600'>
                  <div className='p-3 bg-slate-50 rounded-2xl border border-slate-100'>
                    <p className='text-xs uppercase tracking-widest text-slate-500'>Date</p>
                    <p className='font-semibold'>{formatDateLabel(workshop.date)}</p>
                    <p>{formatTimeLabel(workshop.startTime)}</p>
                  </div>
                  <div className='p-3 bg-slate-50 rounded-2xl border border-slate-100'>
                    <p className='text-xs uppercase tracking-widest text-slate-500'>Duration</p>
                    <p className='font-semibold'>{formatDurationLabel(workshop.durationMinutes)}</p>
                    <p>{workshop.capacity || 'Unlimited'} seats</p>
                  </div>
                </div>
                <div className='flex items-center justify-between text-sm text-slate-600'>
                  <span>{workshop.enrolled || 0} registered</span>
                  <span>{workshop.seatsLeft} seats left</span>
                </div>
                <button
                  type='button'
                  onClick={() => handleReserve(workshop)}
                  disabled={!workshop.isRegistrationOpen}
                  className={`w-full mt-auto rounded-2xl py-3 text-white font-semibold transition ${workshop.isRegistrationOpen ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-300 cursor-not-allowed'}`}
                >
                  {workshop.isRegistrationOpen ? 'Reserve a spot' : 'Registration closed'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

export default Workshops