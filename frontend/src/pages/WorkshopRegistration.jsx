import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import Spinner from '../components/Spinner'
import { AppContext } from '../context/AppContext'
import WorkshopInvoiceCard from '../components/workshops/WorkshopInvoiceCard'
import {
	formatDateLabel,
	formatDurationLabel,
	formatTimeLabel,
	getPriceLabel,
	getSeatsMeta,
	getStatusBadges,
	isRegistrationOpen,
} from '../utils/workshopHelpers'

const badgeToneClasses = {
	indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
	emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
	amber: 'bg-amber-50 text-amber-700 border-amber-100',
	rose: 'bg-rose-50 text-rose-600 border-rose-100',
	slate: 'bg-slate-100 text-slate-600 border-slate-200',
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_REGEX = /^[+()\-\d\s]{7,20}$/
const NOTES_MAX_LENGTH = 600

const getStorageKey = (workshopId) => (workshopId ? `workshopRegistration:${workshopId}` : '')

const validateForm = (values) => {
	const errors = {}
	const fullName = values.fullName.trim()
	const email = values.email.trim().toLowerCase()
	const phone = values.phone.trim()
	const notes = values.notes.trim()

	if (!fullName) {
		errors.fullName = 'Full name is required'
	} else if (fullName.length < 2) {
		errors.fullName = 'Full name must include at least 2 characters'
	} else if (fullName.length > 80) {
		errors.fullName = 'Full name must be under 80 characters'
	}

	if (!email) {
		errors.email = 'Email is required'
	} else if (!EMAIL_REGEX.test(email)) {
		errors.email = 'Enter a valid email address'
	}

	if (!phone) {
		errors.phone = 'Phone number is required'
	} else if (!PHONE_REGEX.test(phone)) {
		errors.phone = 'Use digits, +, and simple separators only'
	}

	if (notes.length > NOTES_MAX_LENGTH) {
		errors.notes = `Notes must be under ${NOTES_MAX_LENGTH} characters`
	}

	return errors
}

const WorkshopRegistrationForm = () => {
	const { workshopId } = useParams()
	const navigate = useNavigate()
	const location = useLocation()
	const { backendUrl, token } = useContext(AppContext)
	const [workshop, setWorkshop] = useState(location.state?.workshop || null)
	const [loading, setLoading] = useState(!location.state?.workshop)
	const [submitting, setSubmitting] = useState(false)
	const [formData, setFormData] = useState({
		fullName: '',
		email: '',
		phone: '',
		notes: '',
	})
	const [errors, setErrors] = useState({})
	const [resumeAvailable, setResumeAvailable] = useState(false)
	const hasHydratedDraft = useRef(false)
	const storageKey = useMemo(() => getStorageKey(workshopId), [workshopId])

	const persistDraft = useCallback((payload) => {
		if (!storageKey) return
		try {
			sessionStorage.setItem(storageKey, JSON.stringify(payload))
		} catch (err) {
			console.warn('Unable to persist registration form', err)
		}
	}, [storageKey])

	const clearDraft = useCallback(() => {
		if (!storageKey) return
		try {
			sessionStorage.removeItem(storageKey)
		} catch (err) {
			console.warn('Unable to clear stored registration form', err)
		}
	}, [storageKey])

	useEffect(() => {
		if (workshop || !backendUrl) return
		const fetchWorkshop = async () => {
			setLoading(true)
			try {
				const { data } = await axios.get(`${backendUrl}/api/workshops/public/${workshopId}`)
				if (data.success) {
					setWorkshop(data.data)
				} else {
					toast.error(data.message || 'Unable to load workshop details')
				}
			} catch (error) {
				toast.error(error?.response?.data?.message || error.message || 'Unable to load workshop details')
			} finally {
				setLoading(false)
			}
		}

		fetchWorkshop()
	}, [backendUrl, workshop, workshopId])

	useEffect(() => {
		if (!storageKey || hasHydratedDraft.current) return
		try {
			const stored = sessionStorage.getItem(storageKey)
			if (stored) {
				const parsed = JSON.parse(stored)
				setFormData((prev) => ({ ...prev, ...parsed }))
				setResumeAvailable(true)
			}
			hasHydratedDraft.current = true
		} catch (error) {
			console.warn('Unable to hydrate saved registration', error)
		}
	}, [storageKey])

	const handleChange = (event) => {
		const { name, value } = event.target
		setFormData((prev) => {
			const next = { ...prev, [name]: value }
			persistDraft(next)
			return next
		})
		setErrors((prev) => ({ ...prev, [name]: '' }))
	}

	const priceLabel = useMemo(() => {
		if (!workshop) return 'Free session'
		const label = getPriceLabel(workshop)
		return workshop.priceType === 'paid' ? `Paid • ${label}` : 'Free session'
	}, [workshop])

	const handleSubmit = async (event) => {
		event.preventDefault()
		if (!backendUrl) {
			toast.error('Backend unavailable. Please try again later.')
			return
		}
		if (!workshop) {
			toast.error('Workshop details are still loading. Please wait a moment.')
			return
		}
		const registrationClosed = !isRegistrationOpen(workshop)
		if (registrationClosed) {
			toast.info('Registration is closed for this workshop.')
			return
		}
		const validationErrors = validateForm(formData)
		if (Object.keys(validationErrors).length) {
			setErrors(validationErrors)
			return
		}
		setSubmitting(true)
		try {
			const payload = {
				fullName: formData.fullName.trim(),
				email: formData.email.trim(),
				phone: formData.phone.trim(),
				notes: formData.notes.trim(),
			}
			const config = token ? { headers: { token } } : undefined
			const isPaidWorkshop = workshop?.priceType === 'paid'
			if (isPaidWorkshop) {
				persistDraft(payload)
				navigate(`/workshops/${workshopId}/payment`, { state: { workshop } })
				setSubmitting(false)
				return
			}

			const { data } = await axios.post(`${backendUrl}/api/workshops/${workshopId}/register`, payload, config)
			if (data.success) {
				clearDraft()
				setResumeAvailable(false)
				toast.success('Registration received! We will email you the session details shortly.')
				navigate('/my-workshops')
			} else {
				toast.error(data.message || 'Unable to submit registration')
			}
		} catch (error) {
			toast.error(error?.response?.data?.message || error.message || 'Unable to submit registration')
		} finally {
			setSubmitting(false)
		}
	}

	if (loading) {
		return (
			<div className='flex justify-center py-20'>
				<Spinner />
			</div>
		)
	}

	if (!workshop) {
		return (
			<div className='py-20 text-center text-slate-600'>
				<p className='text-lg font-medium'>We couldn’t find this workshop.</p>
				<button type='button' onClick={() => navigate('/workshops')} className='mt-4 text-indigo-600 font-semibold underline'>
					Back to workshops
				</button>
			</div>
		)
	}

	const { seatsLeft } = getSeatsMeta(workshop)
	const isPaidWorkshop = workshop?.priceType === 'paid'
	const submitLabel = isPaidWorkshop ? 'Continue to payment' : 'Submit registration'
	const registrationClosed = workshop ? !isRegistrationOpen(workshop) : false
	const submitDisabled = submitting || registrationClosed
	const statusBadges = getStatusBadges(workshop)

	return (
		<div className='relative mt-6 mb-16 overflow-hidden rounded-[40px] bg-gradient-to-br from-indigo-50 via-white to-rose-50 p-1 shadow-[0_25px_70px_rgba(15,23,42,0.08)]'>
			<div className='grid gap-10 rounded-[38px] bg-white/70 p-8 backdrop-blur lg:grid-cols-[1.8fr,1fr]'>
				<div className='rounded-3xl border border-white/70 bg-white/80 p-8 shadow-[0_20px_55px_rgba(15,23,42,0.05)]'>
					<p className='text-sm uppercase tracking-[0.3em] text-indigo-500'>Reserve a spot</p>
					<h1 className='text-3xl font-semibold text-slate-900 mt-2'>{workshop.title}</h1>
					<p className='text-slate-600 mt-2'>Share your contact information and we’ll confirm your seat via email.</p>

					{resumeAvailable && (
						<div className='mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700'>
							<p className='font-medium'>We found your saved details. Pick up where you left off.</p>
							<button type='button' onClick={() => { setFormData({ fullName: '', email: '', phone: '', notes: '' }); clearDraft(); setResumeAvailable(false) }} className='rounded-xl border border-emerald-300 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100'>
								Start over
							</button>
						</div>
					)}

					<form onSubmit={handleSubmit} className='mt-8 space-y-6'>
						<div>
							<label htmlFor='fullName' className='text-sm font-medium text-slate-700'>Full name</label>
							<input
								id='fullName'
								name='fullName'
								type='text'
								required
								value={formData.fullName}
								onChange={handleChange}
								className={`mt-2 w-full rounded-2xl border px-4 py-3 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none ${errors.fullName ? 'border-rose-300' : 'border-slate-200'}`}
								placeholder='Jane Doe'
							/>
							{errors.fullName && <p className='mt-1 text-xs text-rose-600'>{errors.fullName}</p>}
						</div>
						<div className='grid gap-4 md:grid-cols-2'>
							<div>
								<label htmlFor='email' className='text-sm font-medium text-slate-700'>Email</label>
								<input
									id='email'
									name='email'
									type='email'
									required
									value={formData.email}
									onChange={handleChange}
									className={`mt-2 w-full rounded-2xl border px-4 py-3 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none ${errors.email ? 'border-rose-300' : 'border-slate-200'}`}
									placeholder='you@example.com'
								/>
								{errors.email && <p className='mt-1 text-xs text-rose-600'>{errors.email}</p>}
							</div>
							<div>
								<label htmlFor='phone' className='text-sm font-medium text-slate-700'>Phone</label>
								<input
									id='phone'
									name='phone'
									type='tel'
									required
									value={formData.phone}
									onChange={handleChange}
									className={`mt-2 w-full rounded-2xl border px-4 py-3 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none ${errors.phone ? 'border-rose-300' : 'border-slate-200'}`}
									placeholder='+94 70 123 4567'
								/>
								{errors.phone && <p className='mt-1 text-xs text-rose-600'>{errors.phone}</p>}
							</div>
						</div>
						<div>
							<label htmlFor='notes' className='text-sm font-medium text-slate-700'>Anything we should know?</label>
							<textarea
								id='notes'
								name='notes'
								rows={4}
								value={formData.notes}
								onChange={handleChange}
								maxLength={NOTES_MAX_LENGTH}
								className={`mt-2 w-full rounded-2xl border px-4 py-3 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none ${errors.notes ? 'border-rose-300' : 'border-slate-200'}`}
								placeholder='Share goals, accessibility needs, or preferred topics.'
							/>
							{errors.notes && <p className='mt-1 text-xs text-rose-600'>{errors.notes}</p>}
						</div>
						{isPaidWorkshop && (
							<div className='space-y-4 rounded-2xl border border-indigo-100 bg-indigo-50/40 px-5 py-4'>
								<p className='text-sm font-medium text-slate-700'>This is a paid workshop.</p>
								<p className='text-sm text-slate-500'>After you submit your details, we’ll take you to a secure payment page to finish reserving your seat.</p>
								<WorkshopInvoiceCard workshop={workshop} />
							</div>
						)}
						<button
							type='submit'
							disabled={submitDisabled}
							className={`w-full rounded-2xl py-3 text-white font-semibold transition ${submitDisabled ? 'bg-slate-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
						>
							{submitLabel}
						</button>
						{registrationClosed && (
							<p className='text-xs text-slate-500 text-center'>Registration is currently closed. Check back for future cohorts.</p>
						)}
					</form>
				</div>

				<aside className='space-y-5'>
					<div className='rounded-3xl border border-white/60 bg-white/90 p-6 shadow-[0_20px_40px_rgba(15,23,42,0.05)]'>
						{workshop.coverImage && (
							<img src={workshop.coverImage} alt={workshop.title} className='w-full h-44 object-cover rounded-2xl mb-4 shadow-md' />
						)}
						<div className='flex flex-wrap gap-2 text-xs font-semibold'>
							{statusBadges.map((badge) => (
								<span key={`${badge.label}-${badge.intent}`} className={`px-3 py-1 rounded-full border ${badgeToneClasses[badge.intent] || badgeToneClasses.slate}`}>
									{badge.label}
								</span>
							))}
							<span className='px-3 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-100'>{priceLabel}</span>
						</div>
						<div className='mt-4 space-y-3 text-sm text-slate-600'>
						<div className='flex items-center justify-between'>
							<span className='font-medium text-slate-500'>Facilitator</span>
							<span>{workshop.facilitator}</span>
						</div>
						<div className='flex items-center justify-between'>
							<span className='font-medium text-slate-500'>Date</span>
							<span>{formatDateLabel(workshop.date)}</span>
						</div>
						<div className='flex items-center justify-between'>
							<span className='font-medium text-slate-500'>Time</span>
							<span>{formatTimeLabel(workshop.startTime)}</span>
						</div>
									<div className='flex items-center justify-between'>
										<span className='font-medium text-slate-500'>Duration</span>
									<span>{formatDurationLabel(workshop.durationMinutes)}</span>
									</div>
						<div className='flex items-center justify-between'>
							<span className='font-medium text-slate-500'>Seats left</span>
							<span>{seatsLeft}</span>
						</div>
					</div>
				</div>
				<div className='bg-indigo-600 text-white rounded-3xl p-6 space-y-3'>
					<p className='text-lg font-semibold'>Need help?</p>
					<p className='text-sm text-indigo-50'>Email us at feelsfix@gmail.com or call +94 70 123 4567 for group bookings.</p>
					<button
						type='button'
						onClick={() => navigate('/workshops')}
						className='w-full rounded-2xl bg-white/10 py-2 text-sm font-semibold tracking-wide hover:bg-white/20 transition'
					>
						Back to workshops
					</button>
				</div>
			</aside>
		</div>
	</div>
)
}

const WorkshopRegistration = () => {
	// The registration page only collects attendee details. Paid workshops continue to a separate payment page.
	return <WorkshopRegistrationForm />
}

export default WorkshopRegistration
