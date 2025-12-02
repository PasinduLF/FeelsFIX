import { useContext, useEffect, useMemo, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'
import Spinner from '../../components/Spinner'

const decisionFilters = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'declined', label: 'Declined' },
]

const timelineStatusStyle = {
  upcoming: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  completed: 'bg-slate-100 text-slate-700 border-slate-200',
  cancelled: 'bg-rose-50 text-rose-600 border-rose-100',
}

const decisionStatusStyle = {
  pending: 'bg-amber-50 text-amber-700 border-amber-100',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  declined: 'bg-rose-50 text-rose-600 border-rose-100',
}

const formatDate = (value) => {
  if (!value) return 'Date TBA'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

const formatTime = (value) => {
  if (!value) return 'Time TBA'
  const [hrs, mins] = value.split(':').map(Number)
  if (Number.isNaN(hrs) || Number.isNaN(mins)) return value
  const date = new Date()
  date.setHours(hrs)
  date.setMinutes(mins)
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

const WorkshopRegistrations = () => {
  const {
    workshopRegistrations,
    workshopRegistrationLoading,
    fetchWorkshopRegistrations,
    updateWorkshopRegistrationDecision,
  } = useContext(AdminContext)

  const [activeFilter, setActiveFilter] = useState('all')

  useEffect(() => {
    fetchWorkshopRegistrations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredRegistrations = useMemo(() => {
    if (activeFilter === 'all') return workshopRegistrations
    return workshopRegistrations.filter((registration) => registration.decisionStatus === activeFilter)
  }, [activeFilter, workshopRegistrations])

  const handleDecision = async (registrationId, decision) => {
    let note = ''
    if (decision === 'declined') {
      note = window.prompt('Add a note for the member (optional)', '') || ''
    }
    await updateWorkshopRegistrationDecision(registrationId, decision, note)
  }

  return (
    <div className='m-5 w-full space-y-6'>
      <header className='bg-white border rounded-2xl shadow-sm p-6 space-y-2'>
        <p className='text-xs uppercase tracking-[0.3em] text-gray-400'>Workshop Registrations</p>
        <h1 className='text-3xl font-semibold text-gray-800'>Manage participant requests</h1>
        <p className='text-sm text-gray-500'>Approve or decline seats, leave notes for members, and keep cohorts balanced.</p>
      </header>

      <div className='flex flex-wrap gap-3 bg-white border rounded-2xl p-3 shadow-sm'>
        {decisionFilters.map((filter) => (
          <button
            key={filter.id}
            type='button'
            onClick={() => setActiveFilter(filter.id)}
            className={`px-4 py-2 text-sm font-semibold rounded-full border transition ${
              activeFilter === filter.id
                ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                : 'text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            {filter.label}
            <span className='ml-2 text-xs opacity-70'>
              {filter.id === 'all'
                ? workshopRegistrations.length
                : workshopRegistrations.filter((item) => item.decisionStatus === filter.id).length}
            </span>
          </button>
        ))}
      </div>

      {workshopRegistrationLoading ? (
        <div className='flex justify-center py-20'>
          <Spinner />
        </div>
      ) : filteredRegistrations.length === 0 ? (
        <div className='border border-dashed border-gray-200 rounded-3xl p-10 text-center text-gray-500 bg-white'>
          No registrations in this category yet.
        </div>
      ) : (
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-5'>
          {filteredRegistrations.map((registration) => (
            <article key={registration.id} className='bg-white border rounded-3xl shadow-sm p-6 flex flex-col gap-4'>
              <div className='flex items-start justify-between gap-3 flex-wrap'>
                <div>
                  <p className='text-xs uppercase tracking-[0.3em] text-gray-400'>Workshop</p>
                  <h2 className='text-xl font-semibold text-gray-800'>{registration.title}</h2>
                  <p className='text-sm text-gray-500'>{formatDate(registration.date)} · {formatTime(registration.startTime)}</p>
                </div>
                <div className='flex flex-wrap gap-2'>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${timelineStatusStyle[registration.status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                    {registration.status?.charAt(0).toUpperCase() + registration.status?.slice(1) || 'Upcoming'}
                  </span>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${decisionStatusStyle[registration.decisionStatus] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                    {registration.decisionStatus?.charAt(0).toUpperCase() + registration.decisionStatus?.slice(1) || 'Pending'}
                  </span>
                </div>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm'>
                <div className='border rounded-2xl p-4 bg-slate-50'>
                  <p className='text-xs uppercase tracking-widest text-gray-400'>Participant</p>
                  <p className='font-semibold text-gray-800'>{registration.participantName}</p>
                  <p className='text-gray-500'>{registration.email}</p>
                  <p className='text-gray-500'>{registration.phone}</p>
                </div>
                <div className='border rounded-2xl p-4 bg-slate-50'>
                  <p className='text-xs uppercase tracking-widest text-gray-400'>Notes</p>
                  <p className='text-gray-600 min-h-[44px]'>
                    {registration.notes || 'No message provided.'}
                  </p>
                </div>
              </div>

              {registration.decisionNote && (
                <div className='border border-amber-100 bg-amber-50 rounded-2xl p-4 text-sm text-amber-700'>
                  <p className='font-semibold mb-1'>Admin note</p>
                  <p>{registration.decisionNote}</p>
                </div>
              )}

              <div className='flex flex-wrap gap-3 justify-end'>
                <button
                  type='button'
                  onClick={() => handleDecision(registration.id, 'approved')}
                  disabled={registration.decisionStatus === 'approved'}
                  className={`px-5 py-2 rounded-full text-sm font-semibold border ${
                    registration.decisionStatus === 'approved'
                      ? 'bg-emerald-100 text-emerald-600 border-emerald-200 cursor-not-allowed'
                      : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  Approve
                </button>
                <button
                  type='button'
                  onClick={() => handleDecision(registration.id, 'declined')}
                  disabled={registration.decisionStatus === 'declined'}
                  className={`px-5 py-2 rounded-full text-sm font-semibold border ${
                    registration.decisionStatus === 'declined'
                      ? 'bg-rose-100 text-rose-600 border-rose-200 cursor-not-allowed'
                      : 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  Decline
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

export default WorkshopRegistrations
