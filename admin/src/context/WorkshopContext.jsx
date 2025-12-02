import axios from 'axios'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { AdminContext } from './AdminContext'

export const WorkshopContext = createContext()

const DEFAULT_DURATION_MINUTES = 60
const MIN_DURATION_MINUTES = 15
const STATUS = {
  DRAFT: 'draft',
  READY: 'ready',
  UPCOMING: 'upcoming',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
}

const normalizeWorkshopShape = (workshop = {}) => ({
  ...workshop,
  id: workshop.id || workshop._id || `ws-${Date.now()}`,
  startTime: workshop.startTime || '',
  durationMinutes:
    Number.isFinite(Number(workshop.durationMinutes)) && Number(workshop.durationMinutes) > 0
      ? Number(workshop.durationMinutes)
      : DEFAULT_DURATION_MINUTES,
})

const isValidDate = (value) => {
  if (!value) return false
  const parsed = new Date(value)
  return !Number.isNaN(parsed.getTime())
}

const isPastDate = (value) => {
  if (!isValidDate(value)) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const parsed = new Date(value)
  return parsed < today
}

const buildWorkshopRecord = (input, { isDraft = false, targetStatus } = {}) => {
  const {
    title,
    facilitator,
    date,
    startTime = '',
    durationMinutes = DEFAULT_DURATION_MINUTES,
    capacity,
    enrolled,
    priceType = 'free',
    price = 0,
    description = '',
    coverImage = '',
    status,
  } = input

  const trimmedTitle = title?.trim()
  if (!trimmedTitle) {
    toast.error('Please provide a workshop title.')
    return null
  }

  if (!isDraft && !date) {
    toast.error('Please choose a date for published workshops.')
    return null
  }

  const parsedCapacity = Number(capacity) || 0
  if (!isDraft && parsedCapacity <= 0) {
    toast.error('Capacity must be greater than zero.')
    return null
  }
  const normalizedCapacity = parsedCapacity > 0 ? parsedCapacity : 0
  const safeEnrolled = Math.min(normalizedCapacity, Math.max(0, Number(enrolled) || 0))

  const normalizedPriceType = priceType === 'paid' ? 'paid' : 'free'
  const parsedPrice = Number(price) || 0
  if (!isDraft && normalizedPriceType === 'paid' && parsedPrice <= 0) {
    toast.error('Paid workshops need a price greater than zero.')
    return null
  }
  const safePrice = normalizedPriceType === 'paid' ? parsedPrice : 0

  const safeDuration = Number(durationMinutes) || 0
  if (!isDraft && (!startTime || safeDuration < MIN_DURATION_MINUTES)) {
    toast.error(`Please include a start time and at least ${MIN_DURATION_MINUTES} minutes for published workshops.`)
    return null
  }

  if (!isDraft && !coverImage) {
    toast.error('Please upload a cover image before publishing.')
    return null
  }

  const computedStatus = targetStatus || (isDraft ? STATUS.DRAFT : status || STATUS.READY)

  return normalizeWorkshopShape({
    ...input,
    title: trimmedTitle,
    facilitator: facilitator?.trim() || 'Facilitator TBA',
    date: date || '',
    startTime: startTime || '',
    durationMinutes: safeDuration > 0 ? safeDuration : DEFAULT_DURATION_MINUTES,
    capacity: normalizedCapacity,
    enrolled: safeEnrolled,
    priceType: normalizedPriceType,
    price: safePrice,
    description: description?.trim() || '',
    coverImage,
    status: computedStatus,
  })
}

const WorkshopContextProvider = ({ children }) => {
  const { aToken } = useContext(AdminContext)
  const backendUrl = import.meta.env.VITE_BACKEND_URL
  const [workshops, setWorkshops] = useState([])
  const [editingWorkshop, setEditingWorkshop] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleRequestError = (error, fallback = 'Something went wrong') => {
    const message = error?.response?.data?.message || error.message || fallback
    toast.error(message)
  }

  const getAuthHeaders = useCallback(() => ({ atoken: aToken }), [aToken])

  const upsertWorkshop = useCallback((incoming) => {
    if (!incoming) return
    const normalized = normalizeWorkshopShape(incoming)
    setWorkshops((prev) => {
      const index = prev.findIndex((item) => item.id === normalized.id)
      if (index === -1) {
        return [normalized, ...prev]
      }
      const clone = [...prev]
      clone[index] = normalized
      return clone
    })
  }, [])

  const fetchWorkshops = useCallback(async () => {
    if (!backendUrl || !aToken) {
      setWorkshops([])
      return
    }
    setLoading(true)
    try {
      const { data } = await axios.get(`${backendUrl}/api/workshops`, { headers: getAuthHeaders() })
      if (data.success) {
        setWorkshops(data.data.map(normalizeWorkshopShape))
      } else {
        toast.error(data.message || 'Unable to load workshops')
      }
    } catch (error) {
      handleRequestError(error, 'Unable to load workshops')
    } finally {
      setLoading(false)
    }
  }, [aToken, backendUrl, getAuthHeaders])

  useEffect(() => {
    fetchWorkshops()
  }, [fetchWorkshops])

  const stats = useMemo(() => {
    const totalCapacity = workshops.reduce((total, item) => total + item.capacity, 0)
    const totalEnrolled = workshops.reduce((total, item) => total + item.enrolled, 0)
    const fillRate = totalCapacity ? Math.round((totalEnrolled / totalCapacity) * 100) : 0
    return { totalCapacity, totalEnrolled, fillRate }
  }, [workshops])

  const formatWorkshopDate = (date) => {
    if (!date) return 'Date TBA'
    const formatted = new Date(date)
    if (Number.isNaN(formatted.getTime())) {
      return date
    }
    return formatted.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const ensureBackendConfigured = () => {
    if (!backendUrl) {
      toast.error('Backend URL missing. Please configure VITE_BACKEND_URL.')
      return false
    }
    if (!aToken) {
      toast.error('Please sign in again to manage workshops.')
      return false
    }
    return true
  }

  const addWorkshop = async (input, options = {}) => {
    if (!ensureBackendConfigured()) return false
    const isDraft = !!options.isDraft
    const prepared = buildWorkshopRecord(input, { isDraft, targetStatus: options.status })
    if (!prepared) {
      return false
    }

    const payload = { ...prepared }
    delete payload.id

    setLoading(true)
    try {
      const { data } = await axios.post(`${backendUrl}/api/workshops`, payload, { headers: getAuthHeaders() })
      if (data.success) {
        upsertWorkshop(data.data)
        toast[isDraft ? 'info' : 'success'](isDraft ? 'Draft saved' : 'Workshop saved to Ready queue')
        await fetchWorkshops()
        return normalizeWorkshopShape(data.data)
      }
      toast.error(data.message || 'Unable to save workshop')
    } catch (error) {
      handleRequestError(error, 'Unable to save workshop')
    } finally {
      setLoading(false)
    }
    return false
  }

  const updateWorkshop = async (id, updates = {}, options = {}) => {
    if (!ensureBackendConfigured()) return false
    const existing = workshops.find((item) => item.id === id)
    if (!existing) {
      toast.error('Workshop not found')
      return false
    }
    const targetStatus = options.status || updates.status || existing.status
    const isDraftStage = options.isDraft ?? targetStatus === STATUS.DRAFT
    const prepared = buildWorkshopRecord(
      { ...existing, ...updates, status: targetStatus },
      { isDraft: isDraftStage, targetStatus }
    )
    if (!prepared) {
      return false
    }

    const payload = { ...prepared }
    delete payload.id

    setLoading(true)
    try {
      const { data } = await axios.patch(`${backendUrl}/api/workshops/${id}`, payload, { headers: getAuthHeaders() })
      if (data.success) {
        const normalized = normalizeWorkshopShape(data.data)
        upsertWorkshop(normalized)
        toast.success(options.toastMessage || 'Workshop updated')
        if (options.keepEditing) {
          setEditingWorkshop(normalized)
        } else {
          setEditingWorkshop(null)
        }
        await fetchWorkshops()
        return normalized
      }
      toast.error(data.message || 'Unable to update workshop')
    } catch (error) {
      handleRequestError(error, 'Unable to update workshop')
    } finally {
      setLoading(false)
    }
    return false
  }

  const publishWorkshop = async (id) => {
    if (!ensureBackendConfigured()) return false
    const existing = workshops.find((item) => item.id === id)
    if (!existing) {
      toast.error('Workshop not found')
      return false
    }

    const readyForPublish = buildWorkshopRecord(existing, { isDraft: false, targetStatus: STATUS.UPCOMING })
    if (!readyForPublish) {
      return false
    }

    setLoading(true)
    try {
      const { data } = await axios.patch(`${backendUrl}/api/workshops/${id}/publish`, {}, { headers: getAuthHeaders() })
      if (data.success) {
        const normalized = normalizeWorkshopShape({ ...data.data, status: STATUS.UPCOMING })
        upsertWorkshop(normalized)
        toast.success('Workshop published')
        await fetchWorkshops()
        return normalized
      }
      toast.error(data.message || 'Unable to publish workshop')
    } catch (error) {
      handleRequestError(error, 'Unable to publish workshop')
    } finally {
      setLoading(false)
    }
    return false
  }

  const focusWorkshopForEditing = (workshop) => {
    if (!workshop) {
      setEditingWorkshop(null)
      return
    }
    setEditingWorkshop(normalizeWorkshopShape(workshop))
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

  const formatStartTime = (value) => {
    if (!value) return 'Time TBA'
    const [hrs, mins] = value.split(':').map((segment) => Number(segment))
    if (Number.isNaN(hrs) || Number.isNaN(mins)) return value
    const date = new Date()
    date.setHours(hrs)
    date.setMinutes(mins)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  const statusBuckets = useMemo(() => {
    const buckets = {
      drafts: [],
      ready: [],
      upcoming: [],
      completed: [],
      cancelled: [],
    }

    workshops.forEach((workshop) => {
      const normalized = normalizeWorkshopShape(workshop)
      let derivedStatus = normalized.status || STATUS.READY

      if (derivedStatus === STATUS.READY && normalized.publishedAt) {
        derivedStatus = STATUS.UPCOMING
      }

      if ((derivedStatus === STATUS.UPCOMING || derivedStatus === STATUS.READY) && isPastDate(normalized.date)) {
        derivedStatus = STATUS.COMPLETED
      }

      switch (derivedStatus) {
        case STATUS.DRAFT:
          buckets.drafts.push(normalized)
          break
        case STATUS.CANCELLED:
          buckets.cancelled.push(normalized)
          break
        case STATUS.COMPLETED:
          buckets.completed.push(normalized)
          break
        case STATUS.UPCOMING:
          buckets.upcoming.push(normalized)
          break
        case STATUS.READY:
        default:
          buckets.ready.push(normalized)
          break
      }
    })

    return buckets
  }, [workshops])

  const clearEditingWorkshop = () => setEditingWorkshop(null)

  return (
    <WorkshopContext.Provider
      value={{
  workshops,
  loading,
        addWorkshop,
        updateWorkshop,
        publishWorkshop,
  refreshWorkshops: fetchWorkshops,
        stats,
        formatWorkshopDate,
        statusBuckets,
        formatDuration,
        formatStartTime,
        editingWorkshop,
        focusWorkshopForEditing,
        clearEditingWorkshop,
        setEditingWorkshop,
      }}
    >
      {children}
    </WorkshopContext.Provider>
  )
}

export default WorkshopContextProvider
