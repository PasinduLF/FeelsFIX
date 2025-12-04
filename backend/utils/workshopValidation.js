import { WORKSHOP_STATUS as STATUS } from '../models/workshopModel.js'

const DEFAULT_DURATION_MINUTES = 60
const MIN_DURATION_MINUTES = 15

const asNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isNaN(parsed) ? fallback : parsed
}

const normalizeString = (value, fallback = '') => (value ? String(value).trim() : fallback)

const toDateOrNull = (value) => {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export const normalizeWorkshopPayload = (payload = {}, { isDraft = false, targetStatus } = {}) => {
  const title = normalizeString(payload.title)
  const facilitator = normalizeString(payload.facilitator, 'Facilitator TBA')
  const description = normalizeString(payload.description)
  const date = toDateOrNull(payload.date)
  const startTime = normalizeString(payload.startTime)
  const durationMinutes = asNumber(payload.durationMinutes, DEFAULT_DURATION_MINUTES)
  const capacity = asNumber(payload.capacity, 0)
  const enrolled = Math.max(0, Math.min(capacity, asNumber(payload.enrolled, 0)))
  const priceType = payload.priceType === 'paid' ? 'paid' : 'free'
  const price = priceType === 'paid' ? Math.max(0, asNumber(payload.price, 0)) : 0
  const coverImage = payload.coverImage || ''

  if (!title) {
    throw new Error('Please provide a workshop title.')
  }

  const requiresFullDetails = !isDraft
  if (requiresFullDetails) {
    if (!date) throw new Error('Please choose a valid date for this workshop.')
    if (!startTime) throw new Error('Please include a session start time.')
    if (durationMinutes < MIN_DURATION_MINUTES) {
      throw new Error(`Duration must be at least ${MIN_DURATION_MINUTES} minutes.`)
    }
    if (capacity <= 0) throw new Error('Capacity must be greater than zero.')
    if (priceType === 'paid' && price <= 0) {
      throw new Error('Paid workshops require a price greater than zero.')
    }
    if (!coverImage) throw new Error('Please upload a cover image before publishing.')
  }

  const status = targetStatus || payload.status || STATUS.READY

  return {
    title,
    facilitator,
    description,
    date,
    startTime,
    durationMinutes: durationMinutes > 0 ? durationMinutes : DEFAULT_DURATION_MINUTES,
    capacity: capacity > 0 ? capacity : 0,
    enrolled,
    priceType,
    price,
    coverImage,
    status,
  }
}
