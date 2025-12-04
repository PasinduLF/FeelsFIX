const DATE_DISPLAY_OPTIONS = { month: 'long', day: 'numeric', year: 'numeric' }
const TIME_DISPLAY_OPTIONS = { hour: 'numeric', minute: '2-digit' }

const coerceDate = (value) => {
	if (!value) return null
	const parsed = new Date(value)
	if (Number.isNaN(parsed.getTime())) return null
	return parsed
}

const coerceDateTime = (dateValue, timeValue) => {
	const baseDate = coerceDate(dateValue)
	if (!baseDate) return null
	if (!timeValue) return baseDate
	const [hours, minutes] = timeValue.split(':').map((segment) => Number(segment))
	if (Number.isNaN(hours) || Number.isNaN(minutes)) return baseDate
	const combined = new Date(baseDate)
	combined.setHours(hours)
	combined.setMinutes(minutes)
	combined.setSeconds(0, 0)
	return combined
}

const formatDateLabel = (value) => {
	const parsed = coerceDate(value)
	if (!parsed) return 'Date TBA'
	return parsed.toLocaleDateString('en-US', DATE_DISPLAY_OPTIONS)
}

const formatTimeLabel = (value) => {
	if (!value) return 'Time TBA'
	const [hours, minutes] = value.split(':').map((segment) => Number(segment))
	if (Number.isNaN(hours) || Number.isNaN(minutes)) return value
	const date = new Date()
	date.setHours(hours)
	date.setMinutes(minutes)
	return date.toLocaleTimeString('en-US', TIME_DISPLAY_OPTIONS)
}

const formatDurationLabel = (minutes) => {
	const total = Number(minutes)
	if (!Number.isFinite(total) || total <= 0) return 'Duration TBA'
	const hrs = Math.floor(total / 60)
	const mins = total % 60
	if (hrs && mins) return `${hrs}h ${mins}m`
	if (hrs) return `${hrs}h`
	return `${mins}m`
}

const getDerivedStatus = (workshop = {}) => {
	const rawStatus = workshop.status || 'ready'
	// READY sessions surface as UPCOMING when the public page evaluates them.
	let derivedStatus = rawStatus === 'ready' ? 'upcoming' : rawStatus
	const eventMoment = coerceDateTime(workshop.date, workshop.startTime)
	if (eventMoment && eventMoment.getTime() < Date.now()) {
		return 'completed'
	}
	return derivedStatus
}

const getSeatsMeta = (workshop = {}) => {
	const capacity = Math.max(0, Number(workshop.capacity) || 0)
	const enrolled = Math.max(0, Number(workshop.enrolled) || 0)
	const seatsLeft = Math.max(0, capacity ? capacity - enrolled : capacity)
	const isFull = capacity > 0 && seatsLeft === 0
	return { capacity, enrolled, seatsLeft, isFull }
}

const getPriceLabel = (workshop = {}) => {
	if (workshop.priceType === 'paid') {
		const amount = Number(workshop.price || 0)
		return amount > 0 ? `Rs ${amount.toFixed(2)}` : 'Paid'
	}
	return 'Free'
}

const getCategoryLabel = (workshop = {}) => workshop.category || workshop.focusArea || 'General wellness'

const getLevelLabel = (workshop = {}) => workshop.level || workshop.experienceLevel || 'All levels'

const isRegistrationOpen = (workshop = {}) => {
	const derivedStatus = getDerivedStatus(workshop)
	const { isFull } = getSeatsMeta(workshop)
	if (isFull) return false
	if (!['ready', 'upcoming'].includes(derivedStatus)) return false
	const eventMoment = coerceDateTime(workshop.date, workshop.startTime)
	if (!eventMoment) return true
	return eventMoment.getTime() > Date.now()
}

const getStatusBadges = (workshop = {}) => {
	const badges = []
	const derivedStatus = getDerivedStatus(workshop)
	const { isFull } = getSeatsMeta(workshop)
	if (derivedStatus === 'completed') {
		badges.push({ label: 'Completed', intent: 'slate' })
	} else if (derivedStatus === 'upcoming') {
		badges.push({ label: 'Upcoming', intent: 'indigo' })
	} else {
		badges.push({ label: 'Status TBD', intent: 'slate' })
	}
	if (isFull) {
		badges.push({ label: 'Full', intent: 'rose' })
	}
	badges.push({ label: getPriceLabel(workshop), intent: workshop.priceType === 'paid' ? 'amber' : 'emerald' })
	return badges
}

const buildFilterOptions = (workshops = []) => {
	const categories = new Set()
	const levels = new Set()
	workshops.forEach((item) => {
		categories.add(getCategoryLabel(item))
		levels.add(getLevelLabel(item))
	})
	return {
		categories: Array.from(categories).sort(),
		levels: Array.from(levels).sort(),
	}
}

export {
	buildFilterOptions,
	formatDateLabel,
	formatDurationLabel,
	formatTimeLabel,
	getCategoryLabel,
	getDerivedStatus,
	getLevelLabel,
	getPriceLabel,
	getSeatsMeta,
	getStatusBadges,
	isRegistrationOpen,
}
