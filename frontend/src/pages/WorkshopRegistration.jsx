import { useContext, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import Spinner from '../components/Spinner'
import { AppContext } from '../context/AppContext'
import WorkshopInvoiceCard from '../components/workshops/WorkshopInvoiceCard'

const formatDate = (value) => {
	if (!value) return 'Date TBA'
	const parsed = new Date(value)
	if (Number.isNaN(parsed.getTime())) return value
	return parsed.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

const formatTime = (value) => {
	if (!value) return 'Time TBA'
	const [hrs, mins] = value.split(':').map((segment) => Number(segment))
	if (Number.isNaN(hrs) || Number.isNaN(mins)) return value
	const date = new Date()
	date.setHours(hrs)
	date.setMinutes(mins)
	return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
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

	const handleChange = (event) => {
		const { name, value } = event.target
		setFormData((prev) => ({ ...prev, [name]: value }))
	}

	const priceLabel = useMemo(() => {
		if (!workshop || workshop.priceType !== 'paid') return 'Free session'
		return `Paid • Rs ${Number(workshop.price || 0).toFixed(2)}`
	}, [workshop])

	const handleSubmit = async (event) => {
		event.preventDefault()
		if (!backendUrl) {
			toast.error('Backend unavailable. Please try again later.')
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
				// Save form data and redirect to the dedicated payment page
				try {
					sessionStorage.setItem(`workshopRegistration:${workshopId}`, JSON.stringify(payload))
				} catch (err) {
					console.warn('Unable to persist registration form', err)
				}
				navigate(`/workshops/${workshopId}/payment`, { state: { workshop } })
				setSubmitting(false)
				return
			}

			const { data } = await axios.post(`${backendUrl}/api/workshops/${workshopId}/register`, payload, config)
			if (data.success) {
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

	const seatsLeft = Math.max(0, (Number(workshop.capacity) || 0) - (Number(workshop.enrolled) || 0))
	const isPaidWorkshop = workshop?.priceType === 'paid'
	const submitLabel = isPaidWorkshop ? 'Continue to payment' : 'Submit registration'
	const submitDisabled = submitting

	return (
		<div className='relative mt-6 mb-16 overflow-hidden rounded-[40px] bg-gradient-to-br from-indigo-50 via-white to-rose-50 p-1 shadow-[0_25px_70px_rgba(15,23,42,0.08)]'>
			<div className='grid gap-10 rounded-[38px] bg-white/70 p-8 backdrop-blur lg:grid-cols-[1.8fr,1fr]'>
				<div className='rounded-3xl border border-white/70 bg-white/80 p-8 shadow-[0_20px_55px_rgba(15,23,42,0.05)]'>
					<p className='text-sm uppercase tracking-[0.3em] text-indigo-500'>Reserve a spot</p>
					<h1 className='text-3xl font-semibold text-slate-900 mt-2'>{workshop.title}</h1>
					<p className='text-slate-600 mt-2'>Share your contact information and we’ll confirm your seat via email.</p>

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
								className='mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none'
								placeholder='Jane Doe'
							/>
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
									className='mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none'
									placeholder='you@example.com'
								/>
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
									className='mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none'
									placeholder='+94 70 123 4567'
								/>
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
								className='mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none'
								placeholder='Share goals, accessibility needs, or preferred topics.'
							/>
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
							className={`w-full rounded-2xl py-3 text-white font-semibold transition ${submitDisabled ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
						>
							{submitLabel}
						</button>
					</form>
				</div>

				<aside className='space-y-5'>
					<div className='rounded-3xl border border-white/60 bg-white/90 p-6 shadow-[0_20px_40px_rgba(15,23,42,0.05)]'>
						{workshop.coverImage && (
							<img src={workshop.coverImage} alt={workshop.title} className='w-full h-44 object-cover rounded-2xl mb-4 shadow-md' />
						)}
						<div className='flex flex-wrap gap-2 text-xs font-semibold'>
							<span className='px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100'>Upcoming</span>
							<span className='px-3 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-100'>{priceLabel}</span>
						</div>
						<div className='mt-4 space-y-3 text-sm text-slate-600'>
						<div className='flex items-center justify-between'>
							<span className='font-medium text-slate-500'>Facilitator</span>
							<span>{workshop.facilitator}</span>
						</div>
						<div className='flex items-center justify-between'>
							<span className='font-medium text-slate-500'>Date</span>
							<span>{formatDate(workshop.date)}</span>
						</div>
						<div className='flex items-center justify-between'>
							<span className='font-medium text-slate-500'>Time</span>
							<span>{formatTime(workshop.startTime)}</span>
						</div>
									<div className='flex items-center justify-between'>
										<span className='font-medium text-slate-500'>Duration</span>
										<span>{formatDuration(workshop.durationMinutes)}</span>
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
