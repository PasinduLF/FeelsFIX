import { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { WorkshopContext } from '../../context/WorkshopContext'

const getBarColor = (percent) => {
  if (percent >= 85) return 'bg-emerald-500'
  if (percent >= 60) return 'bg-amber-500'
  return 'bg-indigo-500'
}

const getBadgeColor = (percent) => {
  if (percent >= 85) return 'bg-emerald-50 text-emerald-700 border border-emerald-100'
  if (percent >= 60) return 'bg-amber-50 text-amber-700 border border-amber-100'
  return 'bg-indigo-50 text-indigo-700 border border-indigo-100'
}

const statusSections = [
  {
    key: 'drafts',
    eyebrow: 'Drafts',
    title: 'Ideas in progress',
    description: 'Saved while details are still coming together.',
    badge: 'Draft',
    accent: 'bg-slate-50 border-slate-100',
  },
  {
    key: 'ready',
    eyebrow: 'Ready to publish',
    title: 'Launch queue',
    description: 'Fully detailed sessions waiting for a go-live.',
    badge: 'Ready',
    accent: 'bg-emerald-50 border-emerald-100',
  },
  {
    key: 'upcoming',
    eyebrow: 'Upcoming',
    title: 'Launching soon',
    description: 'Sessions with confirmed dates and seats to fill.',
    badge: 'Upcoming',
    accent: 'bg-indigo-50 border-indigo-100',
  },
  {
    key: 'completed',
    eyebrow: 'Held Sessions',
    title: 'Completed workshops',
    description: 'Programs already delivered to your teams.',
    badge: 'Completed',
    accent: 'bg-amber-50 border-amber-100',
  },
  {
    key: 'cancelled',
    eyebrow: 'Cancelled',
    title: 'On hold or cancelled',
    description: 'Sessions that were postponed or called off.',
    badge: 'Cancelled',
    accent: 'bg-rose-50 border-rose-100',
  },
]

const WorkshopBars = () => {
  const {
    workshops,
    stats,
    formatWorkshopDate,
    statusBuckets,
    formatDuration,
    formatStartTime,
    publishWorkshop,
    focusWorkshopForEditing,
    loading,
  } = useContext(WorkshopContext)
  const navigate = useNavigate()
  const [publishingId, setPublishingId] = useState(null)

  const handlePublish = async (id) => {
    if (publishingId) return
    setPublishingId(id)
    try {
      await publishWorkshop(id)
    } finally {
      setPublishingId(null)
    }
  }

  const handleEdit = (workshop) => {
    focusWorkshopForEditing(workshop)
    navigate('/add-workshop')
  }

  return (
    <div className='m-5 space-y-6'>
      <div className='bg-white border rounded-2xl shadow-sm p-6'>
        <div className='flex flex-wrap gap-4 items-center justify-between mb-6'>
          <div>
            <p className='text-xs tracking-[0.3em] text-gray-400 uppercase'>Workshops</p>
            <h3 className='text-3xl font-semibold text-gray-800'>Engagement overview</h3>
            <p className='text-sm text-gray-500'>Monitor interest versus seat availability for each planned cohort.</p>
          </div>
          <div className='text-right'>
            <p className='text-xs uppercase text-gray-400'>Overall fill</p>
            <p className='text-3xl font-semibold text-indigo-600'>{stats.fillRate}%</p>
            <p className='text-xs text-gray-500'>{stats.totalEnrolled} / {stats.totalCapacity} seats</p>
          </div>
        </div>

        <div className='space-y-4'>
          {workshops.length === 0 ? (
            <div className='border border-dashed border-gray-200 rounded-2xl p-8 text-center text-gray-500 bg-gray-50'>
              No workshops yet. Head to the planner to add your first session.
            </div>
          ) : (
            workshops.map((workshop) => {
              const percent = workshop.capacity ? Math.round((workshop.enrolled / workshop.capacity) * 100) : 0
              return (
                <div key={workshop.id} className='p-4 border rounded-2xl hover:shadow-md transition-all bg-gradient-to-br from-white to-gray-50'>
                  <div className='flex items-start justify-between gap-4'>
                    <div>
                      <p className='font-semibold text-gray-800'>{workshop.title}</p>
                      <p className='text-xs text-gray-500'>{workshop.facilitator} • {formatWorkshopDate(workshop.date)}</p>
                      <p className='text-[11px] text-gray-400 mt-1'>{formatStartTime(workshop.startTime)} • {formatDuration(workshop.durationMinutes)}</p>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getBadgeColor(percent)}`}>
                      {percent}% full
                    </span>
                  </div>
                  <div className='h-3 bg-gray-100 rounded-full mt-3 overflow-hidden'>
                    <div
                      className={`h-full rounded-full ${getBarColor(percent)}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className='flex items-center justify-between text-xs text-gray-500 mt-2'>
                    <span>{workshop.enrolled} registered</span>
                    <span>{workshop.capacity} seats</span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5'>
        {statusSections.map((section) => {
          const bucket = statusBuckets?.[section.key] || []
          return (
            <div key={section.key} className='bg-white border rounded-2xl shadow-sm p-5 flex flex-col gap-4'>
              <div>
                <p className='text-xs tracking-[0.2em] uppercase text-gray-400'>{section.eyebrow}</p>
                <div className='flex items-center justify-between gap-3'>
                  <div>
                    <h4 className='text-xl font-semibold text-gray-800'>{section.title}</h4>
                    <p className='text-sm text-gray-500'>{section.description}</p>
                  </div>
                  <span className='text-sm font-semibold text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full'>{bucket.length}</span>
                </div>
              </div>

              {bucket.length === 0 ? (
                <div className='flex flex-col items-center justify-center text-center border border-dashed border-gray-200 rounded-2xl p-6 text-sm text-gray-400'>
                  Nothing here yet
                </div>
              ) : (
                <div className='space-y-3'>
                  {bucket.map((workshop) => (
                    <div key={workshop.id} className={`border rounded-2xl p-4 bg-gradient-to-br from-white to-gray-50 ${section.accent}`}>
                      <div className='flex items-start justify-between gap-3'>
                        <div>
                          <p className='font-semibold text-gray-800'>{workshop.title}</p>
                          <p className='text-xs text-gray-500'>{workshop.facilitator}</p>
                        </div>
                        <span className='text-[11px] font-semibold px-3 py-1 rounded-full border border-gray-200 text-gray-600'>{section.badge}</span>
                      </div>
                      <div className='flex flex-wrap items-center gap-4 text-xs text-gray-500 mt-3'>
                        <span>{formatWorkshopDate(workshop.date)}</span>
                        <span>{formatStartTime(workshop.startTime)}</span>
                        <span>{formatDuration(workshop.durationMinutes)}</span>
                        <span>{workshop.capacity} seats</span>
                        <span>{workshop.priceType === 'paid' ? `$${Number(workshop.price || 0).toFixed(2)}` : 'Free session'}</span>
                      </div>
                      {section.key === 'ready' && (
                        <div className='flex flex-wrap gap-2 mt-4'>
                          <button
                            type='button'
                            onClick={() => handleEdit(workshop)}
                            className='px-4 py-2 text-xs font-semibold rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50'
                          >
                            Edit details
                          </button>
                          <button
                            type='button'
                            onClick={() => handlePublish(workshop.id)}
                            disabled={publishingId === workshop.id || loading}
                            className={`px-4 py-2 text-xs font-semibold rounded-full text-white ${publishingId === workshop.id || loading ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                          >
                            {publishingId === workshop.id ? 'Publishing…' : 'Publish'}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default WorkshopBars
