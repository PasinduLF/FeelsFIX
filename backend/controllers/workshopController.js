import jwt from 'jsonwebtoken'
import Stripe from 'stripe'
import WorkshopModel, { WORKSHOP_STATUS as STATUS } from '../models/workshopModel.js'
import WorkshopRegistrationModel from '../models/workshopRegistrationModel.js'
import { ensureWorkshopStatus, deriveRegistrationTimelineStatus } from '../utils/workshopStatus.js'
import { normalizeWorkshopPayload } from '../utils/workshopValidation.js'

const DEFAULT_STRIPE_PUBLISHABLE_KEY = 'pk_test_51SaUlLGsnHBQEtELEXOjrwQKzYSnhqwtHIqHRt6p2xgnW88rGpVHDdoDGEucI5HmqN3mXYHAVAMLme4U6noKDxcI00581SsjAo'
const DEFAULT_STRIPE_SECRET_KEY = 'sk_test_51SaUlLGsnHBQEtELDU59944GY3Jv0oqtgdsFzQHVXA3qRi60A3u3xJu7yfUq0yN2zoVQ8ouMmpaJzwscQBx46iWa00pGUhkkls'
const DEFAULT_STRIPE_CURRENCY = 'lkr'

const stripeSecret = process.env.STRIPE_SECRET_KEY || DEFAULT_STRIPE_SECRET_KEY
const stripeCurrency = process.env.STRIPE_CURRENCY || DEFAULT_STRIPE_CURRENCY
const stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLIC_KEY || DEFAULT_STRIPE_PUBLISHABLE_KEY
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''
const stripe = stripeSecret ? new Stripe(stripeSecret) : null

const deriveWorkshopPayload = (payload, options = {}) => {
  const normalized = normalizeWorkshopPayload(payload, options)
  const ensuredStatus = ensureWorkshopStatus(normalized.status, normalized.date, normalized.startTime)
  return { ...normalized, status: ensuredStatus }
}

const formatWorkshopResponse = (workshopDoc) => {
  if (!workshopDoc) return null
  const workshop = workshopDoc.toObject ? workshopDoc.toObject() : workshopDoc
  const derivedStatus = ensureWorkshopStatus(workshop.status, workshop.date, workshop.startTime)
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
    const payload = deriveWorkshopPayload(req.body, { isDraft, targetStatus: req.body?.status })
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
    const filtered = enriched.filter((workshop) => {
      if (requestedStatuses.includes(workshop.status)) return true
      return workshop.status === STATUS.READY && requestedStatuses.includes(STATUS.UPCOMING)
    })

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
    const derivedStatus = ensureWorkshopStatus(workshop.status, workshop.date, workshop.startTime)
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
    const payload = deriveWorkshopPayload({ ...existing.toObject(), ...req.body }, {
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
    const payload = deriveWorkshopPayload({ ...workshop.toObject(), status: STATUS.UPCOMING }, { isDraft: false, targetStatus: STATUS.UPCOMING })
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
    let workshop = await WorkshopModel.findById(req.params.id)
    if (!workshop) {
      return res.status(404).json({ success: false, message: 'Workshop not found' })
    }

    const currentStatus = ensureWorkshopStatus(workshop.status, workshop.date, workshop.startTime)
    const isOpenForRegistration = [STATUS.UPCOMING, STATUS.READY].includes(currentStatus)
    if (!isOpenForRegistration) {
      return res.status(400).json({ success: false, message: 'This workshop is not open for registration yet.' })
    }

    const statusChangedToUpcoming = currentStatus === STATUS.READY
    if (statusChangedToUpcoming) {
      workshop.status = STATUS.UPCOMING
      workshop.publishedAt = workshop.publishedAt || new Date()
    }

    const { fullName, email, phone, notes, joinWaitlist } = req.body || {}
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

    const shouldTrackCapacity = workshop.capacity && workshop.capacity > 0
    const wantsWaitlist = Boolean(joinWaitlist)
    let waitlisted = false
    let seatReserved = !shouldTrackCapacity

    if (shouldTrackCapacity) {
      const updateDoc = {
        $inc: { enrolled: 1 },
        ...(statusChangedToUpcoming ? { $set: { status: workshop.status, publishedAt: workshop.publishedAt } } : {}),
      }
      const incremented = await WorkshopModel.findOneAndUpdate(
        { _id: workshop._id, enrolled: { $lt: workshop.capacity } },
        updateDoc,
        { new: true }
      )

      if (incremented) {
        seatReserved = true
        workshop = incremented
      } else if (!wantsWaitlist) {
        return res.status(409).json({
          success: false,
          message: 'This workshop is already full. Resubmit with joinWaitlist=true to join the waiting list.',
        })
      } else {
        waitlisted = true
        if (statusChangedToUpcoming) {
          await WorkshopModel.updateOne(
            { _id: workshop._id },
            { $set: { status: workshop.status, publishedAt: workshop.publishedAt } }
          )
        }
      }
    } else {
      const updateDoc = {
        $inc: { enrolled: 1 },
        ...(statusChangedToUpcoming ? { $set: { status: workshop.status, publishedAt: workshop.publishedAt } } : {}),
      }
      workshop = await WorkshopModel.findByIdAndUpdate(workshop._id, updateDoc, { new: true })
      seatReserved = true
    }

    let paymentIntentId = null
    let paymentSnapshot = null
    let paymentStatus = workshop.priceType === 'paid' ? 'pending' : 'succeeded'
    let paymentAmount = 0
    let paymentCurrency = stripeCurrency
    let paymentMethodType = ''
    let paymentMetadata = {}

    if (workshop.priceType === 'paid') {
      if (!stripe) {
        return res.status(500).json({ success: false, message: 'Payment gateway is not configured.' })
      }
      paymentIntentId = req.body?.paymentIntentId
      if (!paymentIntentId) {
        return res.status(400).json({ success: false, message: 'Payment confirmation is required for paid workshops.' })
      }

      const existingRegistration = await WorkshopRegistrationModel.findOne({ paymentIntentId })
      if (existingRegistration) {
        return res.json({ success: true, data: { id: existingRegistration._id, duplicate: true } })
      }

      paymentSnapshot = await stripe.paymentIntents.retrieve(paymentIntentId)
      const expectedAmount = Math.round(Number(workshop.price) * 100)
      if (
        !paymentSnapshot ||
        paymentSnapshot.status !== 'succeeded' ||
        paymentSnapshot.amount_received < expectedAmount ||
        (paymentSnapshot.metadata?.workshopId && paymentSnapshot.metadata.workshopId !== workshop._id.toString())
      ) {
        return res.status(400).json({ success: false, message: 'Payment was not completed. Please try again.' })
      }

      paymentStatus = paymentSnapshot.status
      paymentAmount = paymentSnapshot.amount_received
      paymentCurrency = paymentSnapshot.currency
      paymentMethodType = paymentSnapshot.payment_method_types?.[0] || ''
      paymentMetadata = paymentSnapshot.metadata || {}
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
      status: waitlisted ? 'waitlist' : 'upcoming',
      waitlisted,
      paymentIntentId,
      paymentStatus,
      paymentAmount,
      paymentCurrency,
      paymentMethodType,
      metadata: paymentMetadata,
    })

    if (waitlisted || !seatReserved) {
      return res.json({ success: true, data: { id: registration._id, waitlisted: true } })
    }

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
      const derivedStatus = deriveRegistrationTimelineStatus(registration, workshopDoc)
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
        waitlisted: registration.waitlisted,
        paymentStatus: registration.paymentStatus,
        paymentIntentId: registration.paymentIntentId,
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
    const {
      status,
      decisionStatus,
      workshopId,
      participant,
      page = 1,
      pageSize = 25,
    } = req.query

    const query = {}
    const normalizeArrayParam = (value) => {
      if (!value) return null
      return Array.isArray(value) ? value : [value]
    }

    const statusFilters = normalizeArrayParam(status)
    if (statusFilters) {
      query.status = { $in: statusFilters }
    }

    const decisionFilters = normalizeArrayParam(decisionStatus)
    if (decisionFilters) {
      query.decisionStatus = { $in: decisionFilters }
    }

    if (workshopId) {
      query.workshop = workshopId
    }

    if (participant) {
      const regex = new RegExp(participant, 'i')
      query.$or = [{ participantName: regex }, { email: regex }, { phone: regex }]
    }

    const limit = Math.min(100, Math.max(1, Number(pageSize) || 25))
    const pageNumber = Math.max(1, Number(page) || 1)
    const skip = (pageNumber - 1) * limit

    const [registrations, total] = await Promise.all([
      WorkshopRegistrationModel.find(query)
        .populate('workshop')
        .populate('user', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      WorkshopRegistrationModel.countDocuments(query),
    ])

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
        status: deriveRegistrationTimelineStatus(registration, workshopDoc),
        waitlisted: registration.waitlisted,
        paymentStatus: registration.paymentStatus,
        paymentIntentId: registration.paymentIntentId,
        paymentAmount: registration.paymentAmount,
        paymentCurrency: registration.paymentCurrency,
        paymentMethodType: registration.paymentMethodType,
        createdAt: registration.createdAt,
        updatedAt: registration.updatedAt,
      }
    })

    res.json({ success: true, data, pagination: { page: pageNumber, pageSize: limit, total } })
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
    const userId = getUserIdFromHeaders(req)
    const metadata = {
      workshopId: workshop._id.toString(),
      workshopTitle: workshop.title,
      price: (amount / 100).toString(),
      currency: stripeCurrency,
    }
    if (fullName) metadata.participantName = fullName
    if (userId) metadata.userId = userId

    const paymentIntent = await stripeClient.paymentIntents.create({
      amount,
      currency: stripeCurrency,
      description: `Workshop registration - ${workshop.title}`,
      metadata,
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

export const updateRegistrationDecisionBatch = async (req, res) => {
  try {
    const { registrationIds, decisionStatus, decisionNote } = req.body || {}
    if (!Array.isArray(registrationIds) || registrationIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Provide at least one registration id.' })
    }
    const allowed = ['pending', 'approved', 'declined']
    if (!allowed.includes(decisionStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid decision status' })
    }

    const result = await WorkshopRegistrationModel.updateMany(
      { _id: { $in: registrationIds } },
      {
        $set: {
          decisionStatus,
          decisionNote: decisionNote || '',
          decidedAt: new Date(),
          decidedBy: req.body?.adminId || null,
        },
      }
    )

    res.json({ success: true, updated: result.modifiedCount })
  } catch (error) {
    handleControllerError(res, error, 'Unable to update registrations')
  }
}

export const handleWorkshopPaymentWebhook = async (req, res) => {
  if (!stripe || !stripeWebhookSecret) {
    return res.status(503).json({ success: false, message: 'Stripe webhook is not configured.' })
  }

  const signature = req.headers['stripe-signature']
  let event

  try {
    event = stripe.webhooks.constructEvent(req.body, signature, stripeWebhookSecret)
  } catch (err) {
    console.error('Stripe webhook signature verification failed', err)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  const handleIntentUpdate = async (intent) => {
    if (!intent?.id) return
    const update = {
      paymentStatus: intent.status,
      paymentAmount: intent.amount_received || intent.amount || 0,
      paymentCurrency: intent.currency,
      paymentMethodType: intent.payment_method_types?.[0] || '',
      processedByWebhook: true,
    }
    await WorkshopRegistrationModel.findOneAndUpdate({ paymentIntentId: intent.id }, { $set: update })
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
    case 'payment_intent.payment_failed':
    case 'payment_intent.processing':
      await handleIntentUpdate(event.data.object)
      break
    default:
      break
  }

  res.json({ received: true })
}
