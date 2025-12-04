import jwt from 'jsonwebtoken'
import Stripe from 'stripe'
import WorkshopModel, { WORKSHOP_STATUS as STATUS } from '../models/workshopModel.js'
import WorkshopRegistrationModel from '../models/workshopRegistrationModel.js'

const DEFAULT_STRIPE_PUBLISHABLE_KEY = 'pk_test_51SaUlLGsnHBQEtELEXOjrwQKzYSnhqwtHIqHRt6p2xgnW88rGpVHDdoDGEucI5HmqN3mXYHAVAMLme4U6noKDxcI00581SsjAo'
const DEFAULT_STRIPE_SECRET_KEY = 'sk_test_51SaUlLGsnHBQEtELDU59944GY3Jv0oqtgdsFzQHVXA3qRi60A3u3xJu7yfUq0yN2zoVQ8ouMmpaJzwscQBx46iWa00pGUhkkls'
const DEFAULT_STRIPE_CURRENCY = 'lkr'

const stripeSecret = process.env.STRIPE_SECRET_KEY || DEFAULT_STRIPE_SECRET_KEY
const stripeCurrency = process.env.STRIPE_CURRENCY || DEFAULT_STRIPE_CURRENCY
const stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLIC_KEY || DEFAULT_STRIPE_PUBLISHABLE_KEY
const stripe = stripeSecret ? new Stripe(stripeSecret) : null

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

const buildSessionDateTime = (dateValue, startTime) => {
  if (!dateValue) return null
  const parsedDate = new Date(dateValue)
  if (Number.isNaN(parsedDate.getTime())) return null
  if (!startTime) return parsedDate

  const match = startTime.match(/(\d{1,2}):(\d{2})(?:\s*(am|pm))?/i)
  if (!match) return parsedDate
  let hours = Number(match[1])
  const minutes = Number(match[2])
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return parsedDate
  const meridian = match[3]?.toLowerCase()
  if (meridian === 'pm' && hours < 12) hours += 12
  if (meridian === 'am' && hours === 12) hours = 0
  parsedDate.setHours(hours, minutes, 0, 0)
  return parsedDate
}

const isPastSession = (dateValue, startTime) => {
  const sessionDate = buildSessionDateTime(dateValue, startTime)
  if (!sessionDate) return false
  return sessionDate.getTime() < Date.now()
}

const ensureStatus = (requestedStatus, date, startTime) => {
  const normalizedStatus = typeof requestedStatus === 'string' ? requestedStatus.toLowerCase() : requestedStatus
  if (!normalizedStatus) return STATUS.READY
  if ([STATUS.DRAFT, STATUS.CANCELLED].includes(normalizedStatus)) return normalizedStatus
  if (normalizedStatus === STATUS.COMPLETED) return STATUS.COMPLETED
  if (normalizedStatus === STATUS.UPCOMING && isPastSession(date, startTime)) {
    return STATUS.COMPLETED
  }
  if (normalizedStatus === STATUS.UPCOMING) return STATUS.UPCOMING
  if (normalizedStatus === STATUS.READY) return STATUS.READY
  return STATUS.READY
}

const sanitizeWorkshopPayload = (payload = {}, { isDraft = false, targetStatus } = {}) => {
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

  const status = ensureStatus(targetStatus || payload.status || STATUS.READY, date, startTime)

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

const formatWorkshopResponse = (workshopDoc) => {
  if (!workshopDoc) return null
  const workshop = workshopDoc.toObject ? workshopDoc.toObject() : workshopDoc
  const derivedStatus = ensureStatus(workshop.status, workshop.date, workshop.startTime)
  return {
    ...workshop,
    id: workshop._id?.toString?.() || workshop.id,
    status: derivedStatus,
  }
}

const handleControllerError = (res, error, defaultMessage = 'Something went wrong') => {
  console.error(error)
  const message = error?.message || defaultMessage
  res.status(400).json({ success: false, message })
}

const ensureStripeClient = () => {
  if (!stripe) {
    const err = new Error('Payment gateway is not configured')
    err.statusCode = 500
    throw err
  }
  return stripe
}

const deriveRegistrationStatus = (registrationDoc, workshopDoc) => {
  if (!registrationDoc) return 'upcoming'
  if (registrationDoc.status === 'cancelled') return 'cancelled'
  const workshopStatus = workshopDoc ? ensureStatus(workshopDoc.status, workshopDoc.date, workshopDoc.startTime) : null
  if (workshopStatus === STATUS.CANCELLED) return 'cancelled'
  if (workshopStatus === STATUS.COMPLETED) return 'completed'
  const referenceDate = workshopDoc?.date || registrationDoc.workshopDate
  const referenceTime = workshopDoc?.startTime || registrationDoc.workshopStartTime
  if (!referenceDate) return 'upcoming'
  return isPastSession(referenceDate, referenceTime) ? 'completed' : 'upcoming'
}

const getUserIdFromHeaders = (req) => {
  const token = req.headers?.token
  if (!token) return null
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    return decoded?.id || null
  } catch (error) {
    return null
  }
}

export const createWorkshop = async (req, res) => {
  try {
    const isDraft = req.body?.status === STATUS.DRAFT
    const payload = sanitizeWorkshopPayload(req.body, { isDraft, targetStatus: req.body?.status })
    const workshop = await WorkshopModel.create({
      ...payload,
      savedAt: new Date(),
      updatedAt: new Date(),
      publishedAt: payload.status === STATUS.UPCOMING ? new Date() : null,
    })
    res.json({ success: true, data: formatWorkshopResponse(workshop) })
  } catch (error) {
    handleControllerError(res, error, 'Unable to create workshop')
  }
}

export const getWorkshops = async (req, res) => {
  try {
    const { status } = req.query
    const query = {}
    if (status) {
      if (Array.isArray(status)) {
        query.status = { $in: status }
      } else {
        query.status = status
      }
    }
    const workshops = await WorkshopModel.find(query).sort({ date: 1, createdAt: -1 })
    res.json({ success: true, data: workshops.map(formatWorkshopResponse) })
  } catch (error) {
    handleControllerError(res, error, 'Unable to fetch workshops')
  }
}

export const getPublicWorkshops = async (req, res) => {
  try {
    const { status } = req.query
    const requestedStatuses = Array.isArray(status)
      ? status.map((value) => value?.toString()?.toLowerCase?.() || '')
      : status
        ? [status?.toString()?.toLowerCase?.()]
        : [STATUS.UPCOMING]

    // When the public listing asks for upcoming sessions we still want to fetch READY
    // ones from Mongo because they may flip to UPCOMING dynamically at runtime.
    const queryStatuses = requestedStatuses.includes(STATUS.UPCOMING) || requestedStatuses.includes(STATUS.READY)
      ? [STATUS.UPCOMING, STATUS.READY]
      : requestedStatuses

    const workshops = await WorkshopModel.find({ status: { $in: queryStatuses } }).sort({ date: 1, startTime: 1 })
    const enriched = workshops.map(formatWorkshopResponse)
    const filtered = enriched.filter((workshop) => requestedStatuses.includes(workshop.status))

    res.json({ success: true, data: filtered })
  } catch (error) {
    handleControllerError(res, error, 'Unable to fetch workshops')
  }
}

export const getPublicWorkshopById = async (req, res) => {
  try {
    const workshop = await WorkshopModel.findById(req.params.id)
    if (!workshop) {
      return res.status(404).json({ success: false, message: 'Workshop not found' })
    }
    const derivedStatus = ensureStatus(workshop.status, workshop.date, workshop.startTime)
    if (![STATUS.UPCOMING, STATUS.READY].includes(derivedStatus)) {
      return res.status(400).json({ success: false, message: 'Workshop is not open for registration' })
    }
    res.json({ success: true, data: formatWorkshopResponse(workshop) })
  } catch (error) {
    handleControllerError(res, error, 'Unable to fetch workshop')
  }
}

export const getWorkshopById = async (req, res) => {
  try {
    const workshop = await WorkshopModel.findById(req.params.id)
    if (!workshop) {
      return res.status(404).json({ success: false, message: 'Workshop not found' })
    }
    res.json({ success: true, data: formatWorkshopResponse(workshop) })
  } catch (error) {
    handleControllerError(res, error, 'Unable to fetch workshop')
  }
}

export const updateWorkshop = async (req, res) => {
  try {
    const existing = await WorkshopModel.findById(req.params.id)
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Workshop not found' })
    }
    const isDraft = (req.body?.status || existing.status) === STATUS.DRAFT
    const payload = sanitizeWorkshopPayload({ ...existing.toObject(), ...req.body }, {
      isDraft,
      targetStatus: req.body?.status || existing.status,
    })

    existing.set({
      ...payload,
      updatedAt: new Date(),
      publishedAt: payload.status === STATUS.UPCOMING ? existing.publishedAt || new Date() : existing.publishedAt,
    })
    await existing.save()
    res.json({ success: true, data: formatWorkshopResponse(existing) })
  } catch (error) {
    handleControllerError(res, error, 'Unable to update workshop')
  }
}

export const publishWorkshop = async (req, res) => {
  try {
    const workshop = await WorkshopModel.findById(req.params.id)
    if (!workshop) {
      return res.status(404).json({ success: false, message: 'Workshop not found' })
    }
    const payload = sanitizeWorkshopPayload({ ...workshop.toObject(), status: STATUS.UPCOMING }, { isDraft: false, targetStatus: STATUS.UPCOMING })
    workshop.set({ ...payload, publishedAt: workshop.publishedAt || new Date(), updatedAt: new Date() })
    await workshop.save()
    res.json({ success: true, data: formatWorkshopResponse(workshop) })
  } catch (error) {
    handleControllerError(res, error, 'Unable to publish workshop')
  }
}

export const deleteWorkshop = async (req, res) => {
  try {
    await WorkshopModel.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (error) {
    handleControllerError(res, error, 'Unable to delete workshop')
  }
}

export const getWorkshopPaymentConfig = (req, res) => {
  if (!stripePublishableKey) {
    return res.status(503).json({ success: false, message: 'Payment gateway is not configured.' })
  }
  res.json({ success: true, data: { publishableKey: stripePublishableKey, currency: stripeCurrency } })
}

export const registerForWorkshop = async (req, res) => {
  try {
    const workshop = await WorkshopModel.findById(req.params.id)
    if (!workshop) {
      return res.status(404).json({ success: false, message: 'Workshop not found' })
    }

    const currentStatus = ensureStatus(workshop.status, workshop.date, workshop.startTime)
    const isOpenForRegistration = [STATUS.UPCOMING, STATUS.READY].includes(currentStatus)
    if (!isOpenForRegistration) {
      return res.status(400).json({ success: false, message: 'This workshop is not open for registration yet.' })
    }

    if (currentStatus === STATUS.READY) {
      workshop.status = STATUS.UPCOMING
      workshop.publishedAt = workshop.publishedAt || new Date()
    }

    if (workshop.capacity && workshop.enrolled >= workshop.capacity) {
      return res.status(400).json({ success: false, message: 'This workshop is already full.' })
    }

    const { fullName, email, phone, notes } = req.body || {}
    const participantName = fullName?.toString().trim()
    const normalizedEmail = email?.toString().trim()?.toLowerCase()
    const normalizedPhone = phone?.toString().trim()
    const normalizedNotes = notes?.toString().trim() || ''

    if (!participantName) {
      return res.status(400).json({ success: false, message: 'Please provide your full name.' })
    }
    if (!normalizedEmail) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email.' })
    }
    if (!normalizedPhone) {
      return res.status(400).json({ success: false, message: 'Please provide a phone number.' })
    }

    if (workshop.priceType === 'paid') {
      if (!stripe) {
        return res.status(500).json({ success: false, message: 'Payment gateway is not configured.' })
      }
      const paymentIntentId = req.body?.paymentIntentId
      if (!paymentIntentId) {
        return res.status(400).json({ success: false, message: 'Payment confirmation is required for paid workshops.' })
      }
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
      const expectedAmount = Math.round(Number(workshop.price) * 100)
      if (!paymentIntent || paymentIntent.status !== 'succeeded' || paymentIntent.amount_received < expectedAmount) {
        return res.status(400).json({ success: false, message: 'Payment was not completed. Please try again.' })
      }
    }

    const registration = await WorkshopRegistrationModel.create({
      workshop: workshop._id,
      user: getUserIdFromHeaders(req),
      workshopTitle: workshop.title,
      workshopDate: workshop.date,
      workshopStartTime: workshop.startTime,
      workshopDurationMinutes: workshop.durationMinutes,
      workshopCoverImage: workshop.coverImage,
      participantName,
      email: normalizedEmail,
      phone: normalizedPhone,
      notes: normalizedNotes,
    })

    const nextEnrolledCount = (workshop.enrolled || 0) + 1
    if (workshop.capacity) {
      workshop.enrolled = Math.min(workshop.capacity, nextEnrolledCount)
    } else {
      workshop.enrolled = nextEnrolledCount
    }
    await workshop.save()

    res.json({ success: true, data: { id: registration._id } })
  } catch (error) {
    handleControllerError(res, error, 'Unable to register for workshop')
  }
}

export const getMyWorkshopRegistrations = async (req, res) => {
  try {
    const userId = req.body?.userId
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Please sign in to view your workshops.' })
    }

    const registrations = await WorkshopRegistrationModel.find({ user: userId })
      .populate('workshop')
      .sort({ createdAt: -1 })

    const data = registrations.map((registration) => {
      const workshopDoc = registration.workshop && registration.workshop._id ? registration.workshop : null
      const derivedStatus = deriveRegistrationStatus(registration, workshopDoc)
      const plainWorkshop = workshopDoc?.toObject ? workshopDoc.toObject() : workshopDoc
      return {
        id: registration._id,
        workshopId: plainWorkshop?._id || registration.workshop?.toString?.() || registration.workshop,
        title: plainWorkshop?.title || registration.workshopTitle,
        facilitator: plainWorkshop?.facilitator || 'Facilitator TBA',
        date: plainWorkshop?.date || registration.workshopDate,
        startTime: plainWorkshop?.startTime || registration.workshopStartTime || '',
        durationMinutes: plainWorkshop?.durationMinutes || registration.workshopDurationMinutes,
        coverImage: plainWorkshop?.coverImage || registration.workshopCoverImage || '',
        status: derivedStatus,
        decisionStatus: registration.decisionStatus || 'pending',
        decisionNote: registration.decisionNote || '',
        createdAt: registration.createdAt,
        updatedAt: registration.updatedAt,
        priceType: plainWorkshop?.priceType || 'free',
        price: plainWorkshop?.price || 0,
      }
    })

    res.json({ success: true, data })
  } catch (error) {
    handleControllerError(res, error, 'Unable to load your workshop registrations')
  }
}

export const getAllWorkshopRegistrations = async (req, res) => {
  try {
    const registrations = await WorkshopRegistrationModel.find({})
      .populate('workshop')
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })

    const data = registrations.map((registration) => {
      const workshopDoc = registration.workshop && registration.workshop._id ? registration.workshop : null
      const plainWorkshop = workshopDoc?.toObject ? workshopDoc.toObject() : workshopDoc
      return {
        id: registration._id,
        workshopId: plainWorkshop?._id || registration.workshop?.toString?.() || registration.workshop,
        title: plainWorkshop?.title || registration.workshopTitle,
        facilitator: plainWorkshop?.facilitator || 'Facilitator TBA',
        date: plainWorkshop?.date || registration.workshopDate,
        startTime: plainWorkshop?.startTime || registration.workshopStartTime || '',
        durationMinutes: plainWorkshop?.durationMinutes || registration.workshopDurationMinutes,
        coverImage: plainWorkshop?.coverImage || registration.workshopCoverImage || '',
        participantName: registration.participantName,
        email: registration.email,
        phone: registration.phone,
        notes: registration.notes,
        decisionStatus: registration.decisionStatus,
        decisionNote: registration.decisionNote,
        status: deriveRegistrationStatus(registration, workshopDoc),
        createdAt: registration.createdAt,
        updatedAt: registration.updatedAt,
      }
    })

    res.json({ success: true, data })
  } catch (error) {
    handleControllerError(res, error, 'Unable to load registrations')
  }
}

export const createWorkshopPaymentIntent = async (req, res) => {
  try {
    const stripeClient = ensureStripeClient()
    const workshop = await WorkshopModel.findById(req.params.id)
    if (!workshop) {
      return res.status(404).json({ success: false, message: 'Workshop not found' })
    }
    if (workshop.priceType !== 'paid') {
      return res.status(400).json({ success: false, message: 'Payment is not required for this workshop.' })
    }
    const amount = Math.max(0, Math.round(Number(workshop.price) * 100))
    if (!amount) {
      return res.status(400).json({ success: false, message: 'Workshop price is invalid.' })
    }

    const { fullName, email } = req.body || {}
    const paymentIntent = await stripeClient.paymentIntents.create({
      amount,
      currency: stripeCurrency,
      description: `Workshop registration - ${workshop.title}`,
      metadata: {
        workshopId: workshop._id.toString(),
        workshopTitle: workshop.title,
      },
      receipt_email: email || undefined,
      automatic_payment_methods: { enabled: true },
    })

    res.json({ success: true, clientSecret: paymentIntent.client_secret })
  } catch (error) {
    handleControllerError(res, error, 'Unable to initiate payment')
  }
}

export const updateRegistrationDecision = async (req, res) => {
  try {
    const { registrationId } = req.params
    const { decisionStatus, decisionNote } = req.body
    const allowed = ['pending', 'approved', 'declined']
    if (!allowed.includes(decisionStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid decision status' })
    }

    const registration = await WorkshopRegistrationModel.findById(registrationId)
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' })
    }

    registration.decisionStatus = decisionStatus
    registration.decisionNote = decisionNote || ''
    registration.decidedAt = new Date()
    registration.decidedBy = req.body?.adminId || null
    await registration.save()

    res.json({ success: true, message: `Registration ${decisionStatus}` })
  } catch (error) {
    handleControllerError(res, error, 'Unable to update registration')
  }
}
