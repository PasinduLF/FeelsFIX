import { useContext, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import Spinner from '../components/Spinner'
import { AppContext } from '../context/AppContext'

const formatCurrency = (amount = 0) => {
	const formatter = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'LKR',
		minimumFractionDigits: 2,
	})
	return formatter.format(Number(amount) || 0)
}

const DummyCardPreview = () => (
	<div className='rounded-[28px] border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)] space-y-5'>
		<div>
			<p className='text-sm font-semibold text-slate-700'>Invoice</p>
			<div className='mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600'>
				{['VISA', 'Mastercard', 'JCB', 'AmEx'].map((brand) => (
					<span key={brand} className='rounded-full border border-slate-200 px-3 py-1 bg-white shadow-[0_4px_12px_rgba(148,163,184,0.25)]'>
						{brand}
					</span>
				))}
			</div>
		</div>
		<div className='space-y-3'>
			<label className='text-xs font-medium text-slate-500'>Card number</label>
			<div className='rounded-2xl border-[1.5px] border-white bg-slate-100 px-4 py-3 text-slate-400 shadow-inner'>1234 5678 9012 3456</div>
		</div>
		<div className='space-y-3'>
			<label className='text-xs font-medium text-slate-500'>Name on card</label>
			<div className='rounded-2xl border-[1.5px] border-white bg-slate-100 px-4 py-3 text-slate-400 shadow-inner'>Ex. John Website</div>
		</div>
		<div className='grid gap-3 md:grid-cols-2'>
			<div className='space-y-3'>
				<label className='text-xs font-medium text-slate-500'>Expiry date</label>
				<div className='rounded-2xl border-[1.5px] border-white bg-slate-100 px-4 py-3 text-slate-400 shadow-inner'>01 / 19</div>
			</div>
			<div className='space-y-3'>
				<label className='text-xs font-medium text-slate-500'>Security code</label>
				<div className='rounded-2xl border-[1.5px] border-white bg-slate-100 px-4 py-3 text-slate-400 shadow-inner'>•••</div>
			</div>
		</div>
		<button type='button' className='w-full rounded-2xl bg-indigo-100 py-2 text-indigo-600 font-semibold cursor-not-allowed shadow-inner'>Next</button>
	</div>
)

const InvoiceBreakdown = ({ workshop }) => {
	const price = Number(workshop?.price || 0)
	const serviceFee = 0
	const total = price + serviceFee
	return (
		<div className='rounded-2xl border border-slate-200 bg-white/80 backdrop-blur px-5 py-4 shadow-sm text-sm text-slate-600'>
			<div className='flex items-center justify-between pb-3 border-b border-slate-100'>
				<span>Workshop fee</span>
				<span className='font-semibold text-slate-900'>{formatCurrency(price)}</span>
			</div>
			<div className='flex items-center justify-between py-3'>
				<span>Service fee</span>
				<span className='font-semibold text-slate-900'>{formatCurrency(serviceFee)}</span>
			</div>
			<div className='mt-2 flex items-center justify-between rounded-xl bg-indigo-50 px-4 py-3 font-semibold text-indigo-700'>
				<span>Due today</span>
				<span>{formatCurrency(total)}</span>
			</div>
		</div>
	)
}

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

const WorkshopRegistrationForm = ({ gatewayStatus }) => {
	const { workshopId } = useParams()
	const navigate = useNavigate()
	const location = useLocation()
	const { backendUrl, token } = useContext(AppContext)
	const stripe = useStripe()
	const elements = useElements()
	const [workshop, setWorkshop] = useState(location.state?.workshop || null)
	const [loading, setLoading] = useState(!location.state?.workshop)
	const [submitting, setSubmitting] = useState(false)
	const [paymentInProgress, setPaymentInProgress] = useState(false)
	const [formData, setFormData] = useState({
		fullName: '',
		email: '',
		phone: '',
		notes: '',
		cardName: '',
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
			let paymentIntentId = null
			const isPaidWorkshop = workshop?.priceType === 'paid'
			if (isPaidWorkshop) {
				if (!stripe || !elements) {
					toast.error('Payment gateway still loading. Please wait a moment.')
					setSubmitting(false)
					return
				}
				if (!gatewayStatus?.configured) {
					toast.error(gatewayStatus?.message || 'Payment gateway is not configured.')
					setSubmitting(false)
					return
				}
				setPaymentInProgress(true)
				try {
					const intentResponse = await axios.post(
						`${backendUrl}/api/workshops/${workshopId}/payment-intent`,
						payload,
						config
					)
					if (!intentResponse.data?.success) {
						throw new Error(intentResponse.data?.message || 'Unable to initiate payment')
					}
					const cardElement = elements.getElement(CardNumberElement)
					const expiryElement = elements.getElement(CardExpiryElement)
					const cvcElement = elements.getElement(CardCvcElement)
					if (!cardElement) {
						throw new Error('Unable to load card input. Please refresh and try again.')
					}
					const cardholderName = formData.cardName.trim() || payload.fullName
					const confirmation = await stripe.confirmCardPayment(intentResponse.data.clientSecret, {
						payment_method: {
							card: cardElement,
							billing_details: {
								name: cardholderName,
								email: payload.email,
								phone: payload.phone,
							},
						},
					})
					if (confirmation.error) {
						throw new Error(confirmation.error.message)
					}
					paymentIntentId = confirmation.paymentIntent.id
					cardElement.clear()
					expiryElement?.clear?.()
					cvcElement?.clear?.()
				} catch (paymentError) {
					toast.error(paymentError?.message || 'Payment failed. Please try again.')
					setPaymentInProgress(false)
					setSubmitting(false)
					return
				} finally {
					setPaymentInProgress(false)
				}
			}

			const registrationPayload = paymentIntentId ? { ...payload, paymentIntentId } : payload
			const { data } = await axios.post(`${backendUrl}/api/workshops/${workshopId}/register`, registrationPayload, config)
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
	const submitLabel = isPaidWorkshop ? (paymentInProgress ? 'Processing payment…' : 'Pay & reserve seat') : 'Submit registration'
	const stripeReady = Boolean(stripe) && Boolean(elements)
	const submitDisabled =
		submitting ||
		paymentInProgress ||
		(isPaidWorkshop && (gatewayStatus?.loading || !gatewayStatus?.configured || !stripeReady))
	const showGatewayWarning = isPaidWorkshop && gatewayStatus?.configured === false

	const brandBadges = [
		{ label: 'VISA', bg: 'bg-slate-100', text: 'text-slate-700' },
		{ label: 'Mastercard', bg: 'bg-slate-100', text: 'text-slate-700' },
		{ label: 'JCB', bg: 'bg-slate-100', text: 'text-slate-700' },
		{ label: 'AmEx', bg: 'bg-slate-100', text: 'text-slate-700' },
	]

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
							gatewayStatus?.configured ? (
								<div className='space-y-4'>
									<label className='text-sm font-medium text-slate-700'>Card payment</label>
									<div className='rounded-2xl border border-slate-200 px-4 py-4 bg-white space-y-4 focus-within:border-indigo-400'>
										<div className='flex flex-wrap gap-2 text-xs font-semibold text-slate-600'>
											{brandBadges.map((brand) => (
												<span key={brand.label} className={`rounded-full px-3 py-1 ${brand.bg} ${brand.text}`}>
													{brand.label}
												</span>
											))}
										</div>
										<div className='space-y-2'>
											<label className='text-xs font-medium text-slate-500'>Card number</label>
											<div className='rounded-xl border border-slate-200 px-3 py-2 bg-slate-50'>
												<CardNumberElement
													options={{
														placeholder: '1234 5678 9012 3456',
														style: {
															base: {
																fontSize: '16px',
																color: '#0f172a',
																'::placeholder': { color: '#94a3b8' },
															},
															invalid: { color: '#dc2626' },
														},
													}}
												/>
											</div>
										</div>
										<div className='space-y-2'>
											<label htmlFor='cardName' className='text-xs font-medium text-slate-500'>Name on card</label>
											<input
												id='cardName'
												name='cardName'
												type='text'
												required
												value={formData.cardName}
												onChange={handleChange}
												placeholder='Ex. John Website'
												className='w-full rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none'
											/>
										</div>
										<div className='grid gap-3 md:grid-cols-2'>
											<div className='space-y-2'>
												<label className='text-xs font-medium text-slate-500'>Expiry date</label>
												<div className='rounded-xl border border-slate-200 px-3 py-2 bg-slate-50'>
													<CardExpiryElement
														options={{
															placeholder: 'MM / YY',
															style: {
																base: {
																	fontSize: '15px',
																	color: '#0f172a',
																	'::placeholder': { color: '#94a3b8' },
																},
																invalid: { color: '#dc2626' },
															},
														}}
													/>
												</div>
											</div>
											<div className='space-y-2'>
												<label className='text-xs font-medium text-slate-500'>Security code</label>
												<div className='rounded-xl border border-slate-200 px-3 py-2 bg-slate-50'>
													<CardCvcElement
														options={{
															placeholder: 'CVC',
															style: {
																base: {
																	fontSize: '15px',
																	color: '#0f172a',
																	'::placeholder': { color: '#94a3b8' },
																},
																invalid: { color: '#dc2626' },
															},
														}}
													/>
												</div>
											</div>
										</div>
									</div>
									<p className='text-sm text-slate-500'>You'll be charged <span className='font-semibold text-slate-900'>Rs {Number(workshop.price || 0).toFixed(2)}</span> once the payment succeeds.</p>
									<InvoiceBreakdown workshop={workshop} />
								</div>
							) : (
								<div className='space-y-3'>
									<label className='text-sm font-medium text-slate-700'>Card payment (demo preview)</label>
									<DummyCardPreview />
									<p className='text-sm text-slate-500'>Live card processing isn’t connected yet. This preview illustrates how payments will look once the gateway is enabled.</p>
									{showGatewayWarning && (
										<p className='text-sm text-rose-500'>
											{gatewayStatus?.message || "Payment gateway isn't configured yet. Contact support to complete paid registrations."}
										</p>
									)}
									<InvoiceBreakdown workshop={workshop} />
								</div>
							)
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
	const { backendUrl } = useContext(AppContext)
	const [stripePromise, setStripePromise] = useState(null)
	const [gatewayStatus, setGatewayStatus] = useState({ loading: true, configured: null, message: '' })

	useEffect(() => {
		let isMounted = true

		const fetchGatewayConfig = async () => {
			if (!backendUrl) {
				setGatewayStatus({ loading: false, configured: false, message: 'Backend unavailable. Please try again later.' })
				return
			}
			setGatewayStatus((prev) => ({ ...prev, loading: true }))
			try {
				const { data } = await axios.get(`${backendUrl}/api/workshops/payment/config`)
				if (!isMounted) return
				if (data.success && data.data?.publishableKey) {
					setStripePromise(loadStripe(data.data.publishableKey))
					setGatewayStatus({ loading: false, configured: true, message: '' })
				} else {
					setGatewayStatus({
						loading: false,
						configured: false,
						message: data.message || 'Payment gateway is not configured.',
					})
				}
			} catch (error) {
				if (!isMounted) return
				setGatewayStatus({
					loading: false,
					configured: false,
					message: error?.response?.data?.message || error?.message || 'Unable to reach payment gateway.',
				})
			}
		}

		fetchGatewayConfig()

		return () => {
			isMounted = false
		}
	}, [backendUrl])

	return (
		<Elements stripe={stripePromise}>
			<WorkshopRegistrationForm gatewayStatus={gatewayStatus} />
		</Elements>
	)
}

export default WorkshopRegistration
