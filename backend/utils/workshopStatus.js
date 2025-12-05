import { WORKSHOP_STATUS as STATUS } from '../models/workshopModel.js'

const normalizeTimeParts = (timeString) => {
  if (!timeString) return null
  const match = timeString.match(/(\d{1,2}):(\d{2})(?:\s*(am|pm))?/i)
  if (!match) return null
  let hours = Number(match[1])
  const minutes = Number(match[2])
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null
  const meridian = match[3]?.toLowerCase()
  if (meridian === 'pm' && hours < 12) hours += 12
  if (meridian === 'am' && hours === 12) hours = 0
  return { hours, minutes }
}

export const buildSessionDateTime = (dateValue, startTime) => {
  if (!dateValue) return null
  const parsedDate = new Date(dateValue)
  if (Number.isNaN(parsedDate.getTime())) return null
  if (startTime) {
    const parts = normalizeTimeParts(startTime)
    if (parts) {
      parsedDate.setHours(parts.hours, parts.minutes, 0, 0)
      return parsedDate
    }
  }
  return parsedDate
}

export const isSessionInPast = (dateValue, startTime) => {
  const sessionDate = buildSessionDateTime(dateValue, startTime)
  if (!sessionDate) return false
  return sessionDate.getTime() < Date.now()
}

export const ensureWorkshopStatus = (requestedStatus, dateValue, startTime) => {
  const normalizedStatus = typeof requestedStatus === 'string' ? requestedStatus.toLowerCase() : requestedStatus
  if (!normalizedStatus) return STATUS.READY
  if ([STATUS.DRAFT, STATUS.CANCELLED].includes(normalizedStatus)) return normalizedStatus
  if (normalizedStatus === STATUS.COMPLETED) return STATUS.COMPLETED
  if (normalizedStatus === STATUS.UPCOMING && isSessionInPast(dateValue, startTime)) {
    return STATUS.COMPLETED
  }
  if (normalizedStatus === STATUS.UPCOMING) return STATUS.UPCOMING
  if (normalizedStatus === STATUS.READY) return STATUS.READY
  return STATUS.READY
}

export const deriveRegistrationTimelineStatus = (registrationDoc, workshopDoc) => {
  if (!registrationDoc) return 'upcoming'
  if (registrationDoc.status === 'cancelled') return 'cancelled'
  if (registrationDoc.status === 'waitlist') return 'waitlist'
  const workshopStatus = workshopDoc ? ensureWorkshopStatus(workshopDoc.status, workshopDoc.date, workshopDoc.startTime) : null
  if (workshopStatus === STATUS.CANCELLED) return 'cancelled'
  if (workshopStatus === STATUS.COMPLETED) return 'completed'
  const referenceDate = workshopDoc?.date || registrationDoc.workshopDate
  const referenceTime = workshopDoc?.startTime || registrationDoc.workshopStartTime
  if (!referenceDate) return 'upcoming'
  return isSessionInPast(referenceDate, referenceTime) ? 'completed' : 'upcoming'
}
