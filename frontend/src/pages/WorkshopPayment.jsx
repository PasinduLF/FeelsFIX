import { useCallback, useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useElements, useStripe } from '@stripe/react-stripe-js'
import Spinner from '../components/Spinner'
import { AppContext } from '../context/AppContext'
import WorkshopInvoiceCard from '../components/workshops/WorkshopInvoiceCard'
import { assets } from '../assets/assets'
import { formatDateLabel, formatDurationLabel, formatTimeLabel, getSeatsMeta } from '../utils/workshopHelpers'

const paymentMethods = [
  { label: 'Card', value: 'card', enabled: true },
  { label: 'Bank Transfer', value: 'bank', enabled: false },
  { label: 'Cryptocurrency', value: 'crypto', enabled: false },
]

const cardBrands = [
  { label: 'Mastercard', image: assets.mastercard_logo },
  { label: 'Visa', image: assets.visa_logo },
  { label: 'Amex', image: assets.amex_logo },
]

const cardElementStyles = {
  style: {
    base: {
      fontSize: '16px',
      color: '#0f172a',
      '::placeholder': {
        color: '#94a3b8',
      },
      fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
  },
  showIcon: true,
  iconStyle: 'solid',
}

const paymentErrorSuggestions = {
  card: 'Please double-check your card details or try a different card.',
  network: 'Check your internet connection and try again.',
  backend: 'Our server could not confirm the registration. Please retry in a moment or contact support.',
  generic: 'You can retry or reach out to support if the issue persists.',
}

const derivePaymentError = (error) => {
  if (!error) {
    return { category: 'generic', message: 'Something went wrong. Please try again.' }
  }
  if (error?.type === 'card_error' || error?.code === 'card_declined') {
    return { category: 'card', message: error.message || 'Your card was declined.' }
  }
  if (error?.type === 'validation_error') {
    return { category: 'card', message: error.message || 'The card details look invalid.' }
  }
  const isAxiosLike = typeof error === 'object' && error !== null && (error?.isAxiosError || error?.response || error?.request)
  if (isAxiosLike) {
    if (error?.response) {
      return { category: 'backend', message: error.response?.data?.message || 'The server rejected the request after payment.' }
    }
    return { category: 'network', message: 'Network error. Please check your connection.' }
  }
  return { category: 'generic', message: error?.message || 'Unable to complete payment.' }
}

const GatewayErrorPanel = ({ message, onRetry, retrying }) => (
  <div className='rounded-3xl border border-rose-100 bg-rose-50/70 p-6 text-rose-700'>
    <p className='text-lg font-semibold'>Stripe gateway unavailable</p>
    <p className='mt-2 text-sm text-rose-600'>{message || 'We could not connect to the payment service. Check that the backend server is reachable.'}</p>
    <div className='mt-5 flex flex-wrap gap-3'>
      <button
        type='button'
        onClick={onRetry}
        disabled={retrying}
        className={`rounded-2xl px-4 py-2 font-semibold text-white transition ${retrying ? 'bg-rose-300 cursor-not-allowed' : 'bg-rose-500 hover:bg-rose-600'}`}
      >
        {retrying ? 'Retrying…' : 'Retry Stripe connection'}
      </button>
      <p className='text-xs text-rose-500'>Startup the backend with `npm run server` and ensure it exposes /api/workshops/payment/config.</p>
    </div>
  </div>
)

const PaymentForm = ({ clientSecret, formData, workshop, token, backendUrl }) => {
  const stripe = useStripe()
  const elements = useElements()
  const navigate = useNavigate()
  const [processing, setProcessing] = useState(false)
  const [method, setMethod] = useState('card')
  const [paymentState, setPaymentState] = useState('idle')
  const [inlineError, setInlineError] = useState(null)

  const confirmPaymentIntent = useCallback(async () => {
    if (!stripe || !elements) throw new Error('Payment system is still loading. Please wait a moment.')
    const cardNumberElement = elements.getElement(CardNumberElement)
    if (!cardNumberElement) throw new Error('Card input not available')

    let result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardNumberElement,
        billing_details: {
          name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
        },
      },
    })

    if (result.error) {
      const needsAction = result.error.payment_intent?.status === 'requires_action'
      if (!needsAction) {
        throw result.error
      }
      result = await stripe.confirmCardPayment(clientSecret)
    }

    let paymentIntent = result.paymentIntent

    if (paymentIntent?.status === 'requires_action') {
      const actionResult = await stripe.confirmCardPayment(clientSecret)
      if (actionResult.error) {
        throw actionResult.error
      }
      paymentIntent = actionResult.paymentIntent
    }

    if (!paymentIntent || paymentIntent.status !== 'succeeded') {
      throw new Error('Payment did not complete successfully.')
    }

    return paymentIntent
  }, [clientSecret, elements, formData.email, formData.fullName, formData.phone, stripe])

  const handlePay = async (e) => {
    e.preventDefault()
    if (!stripe || !elements) {
      toast.error('Payment system is still loading. Please wait a moment.')
      return
    }
    setProcessing(true)
    setInlineError(null)
    setPaymentState('processing')
    try {
      const paymentIntent = await confirmPaymentIntent()

      const config = token ? { headers: { token } } : undefined
      const payload = { ...formData, paymentIntentId: paymentIntent.id }
      setPaymentState('finalizing')
      const { data } = await axios.post(`${backendUrl}/api/workshops/${workshop._id || workshop.id}/register`, payload, config)
      if (data.success) {
        try {
          sessionStorage.removeItem(`workshopRegistration:${workshop._id || workshop.id}`)
        } catch (clearError) {
          console.warn('Unable to clear saved workshop registration data', clearError)
        }
        setPaymentState('succeeded')
        toast.success('Payment successful and registration complete. See My Workshops for details.')
        navigate('/my-workshops')
      } else {
        throw new Error(data.message || 'Registration failed after payment')
      }
    } catch (err) {
      const friendly = derivePaymentError(err)
      setInlineError(friendly)
      setPaymentState('error')
      const prefix = friendly.category === 'card' ? 'Card error: ' : friendly.category === 'network' ? 'Network issue: ' : friendly.category === 'backend' ? 'Server issue: ' : ''
      toast.error(`${prefix}${friendly.message}`)
    } finally {
      setProcessing(false)
    }
  }

  const handleMethodSelect = (value, enabled) => {
    if (!enabled) {
      toast.info('Only card payments are available right now.')
      return
    }
    setMethod(value)
  }

  const priceLabel = workshop?.priceType === 'paid'
    ? `Rs ${Number(workshop?.price || 0).toFixed(2)}`
    : 'Free session'

  return (
    <form onSubmit={handlePay} className='space-y-6'>
      <div className='rounded-[32px] border border-slate-100 bg-white p-8 shadow-[0_25px_65px_rgba(15,23,42,0.07)] space-y-6'>
        <div>
          <p className='text-xs font-semibold uppercase tracking-[0.3em] text-slate-400'>Payment</p>
          <h3 className='mt-2 text-2xl font-semibold text-slate-900'>Secure checkout</h3>
          <p className='text-sm text-slate-500'>Complete your reservation using your preferred method.</p>
        </div>

        <div>
          <p className='text-xs font-semibold text-slate-500 mb-3'>Pay with</p>
          <div className='flex flex-wrap gap-3'>
            {paymentMethods.map((option) => (
              <button
                key={option.value}
                type='button'
                onClick={() => handleMethodSelect(option.value, option.enabled)}
                className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${method === option.value ? 'border-slate-900 text-slate-900' : 'border-slate-200 text-slate-500 hover:border-slate-400'} ${option.enabled ? '' : 'opacity-60 cursor-not-allowed'}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className='flex flex-wrap gap-3'>
          {cardBrands.map((brand) => (
            <span key={brand.label} className='flex h-12 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-1 shadow-sm'>
              <img src={brand.image} alt={brand.label} className='h-8 w-auto object-contain' loading='lazy' />
            </span>
          ))}
        </div>

        <div>
          <label className='text-sm font-medium text-slate-700'>Card details</label>
          <div className='mt-2 rounded-2xl border border-slate-200 bg-slate-50'>
            <div className='flex items-center gap-3 border-b border-slate-200 px-4 py-3'>
              <CardNumberElement options={{ ...cardElementStyles, showIcon: true }} className='flex-1' />
              <button type='button' onClick={() => toast.info('Autofill requires your browser wallet.')} className='rounded-xl bg-emerald-600 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-emerald-700'>
                Autofill link
              </button>
            </div>
            <div className='grid grid-cols-2 gap-0 border-t border-slate-100'>
              <div className='border-r border-slate-100 px-4 py-3'>
                <p className='text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1'>Expiry (MM/YY)</p>
                <CardExpiryElement options={cardElementStyles} />
              </div>
              <div className='px-4 py-3'>
                <p className='text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1'>CVC</p>
                <CardCvcElement options={cardElementStyles} />
              </div>
            </div>
          </div>
        </div>

        <div className='rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between text-sm font-semibold text-slate-700'>
          <span>Total due</span>
          <span>{priceLabel}</span>
        </div>

        <div className='flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4'>
          <button type='button' onClick={() => navigate(-1)} className='rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-400'>
            Back
          </button>
          <button type='submit' disabled={processing} className={`rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(16,185,129,0.4)] transition ${processing ? 'opacity-60 cursor-not-allowed' : 'hover:bg-emerald-600'}`}>
            {processing ? 'Processing…' : `Pay ${priceLabel}`}
          </button>
        </div>

        {paymentState === 'processing' && (
          <p className='text-xs text-slate-500 text-center'>Processing payment… do not refresh this page.</p>
        )}
        {paymentState === 'finalizing' && (
          <p className='text-xs text-slate-500 text-center'>Payment succeeded. Finalizing your registration…</p>
        )}
        {inlineError && (
          <div className='rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700'>
            <p className='font-semibold'>
              {inlineError.category === 'card' && 'Card error'}
              {inlineError.category === 'network' && 'Network issue'}
              {inlineError.category === 'backend' && 'Server issue'}
              {inlineError.category === 'generic' && 'Payment error'}
            </p>
            <p className='mt-1'>{inlineError.message}</p>
            <p className='mt-2 text-xs text-rose-600'>{paymentErrorSuggestions[inlineError.category] || paymentErrorSuggestions.generic}</p>
          </div>
        )}
      </div>
    </form>
  )
}

const WorkshopPayment = () => {
  const { backendUrl, token } = useContext(AppContext)
  const { workshopId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [workshop, setWorkshop] = useState(null)
  const [formData, setFormData] = useState(null)
  const [stripePromise, setStripePromise] = useState(null)
  const [clientSecret, setClientSecret] = useState(null)
  const [gatewayStatus, setGatewayStatus] = useState({ loading: true, available: false, message: '' })

  const requestGatewayConfig = useCallback(async ({ showToast } = {}) => {
    if (!backendUrl) {
      const message = 'Backend unavailable. Please configure VITE_BACKEND_URL.'
      if (showToast) toast.error(message)
      setGatewayStatus({ loading: false, available: false, message })
      return
    }
    setGatewayStatus((prev) => ({ ...prev, loading: true }))
    try {
      const cfg = await axios.get(`${backendUrl}/api/workshops/payment/config`)
      if (cfg.data?.success && cfg.data.data?.publishableKey) {
        setStripePromise(loadStripe(cfg.data.data.publishableKey))
        setGatewayStatus({ loading: false, available: true, message: '' })
      } else {
        throw new Error(cfg.data?.message || 'Payment gateway not configured.')
      }
    } catch (err) {
      const friendly = err?.response?.data?.message || err?.message || 'Unable to reach payment gateway'
      if (showToast) toast.error(friendly)
      setGatewayStatus({ loading: false, available: false, message: friendly })
    }
  }, [backendUrl])

  useEffect(() => {
    const load = async () => {
      if (!backendUrl) {
        const message = 'Backend unavailable. Please configure VITE_BACKEND_URL.'
        toast.error(message)
        setGatewayStatus({ loading: false, available: false, message })
        setLoading(false)
        return
      }

      // Load previously saved form data
      try {
        const raw = sessionStorage.getItem(`workshopRegistration:${workshopId}`)
        if (!raw) {
          toast.error('Please complete the registration form first.')
          navigate(`/workshops/${workshopId}/register`)
          return
        }
        setFormData(JSON.parse(raw))
      } catch (err) {
        console.warn('Unable to load saved registration', err)
      }

      try {
        const wk = await axios.get(`${backendUrl}/api/workshops/public/${workshopId}`)
        if (wk.data?.success) setWorkshop(wk.data.data)
      } catch (err) {
        console.warn(err)
      }

      await requestGatewayConfig()
      setLoading(false)
    }

    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backendUrl, workshopId, requestGatewayConfig])

  useEffect(() => {
    const createIntent = async () => {
      if (!backendUrl || !formData || !gatewayStatus.available) return
      try {
        const { data } = await axios.post(`${backendUrl}/api/workshops/${workshopId}/payment-intent`, { fullName: formData.fullName, email: formData.email })
        if (data?.success && data.clientSecret) setClientSecret(data.clientSecret)
        else toast.error(data?.message || 'Unable to initiate payment')
      } catch (err) {
        toast.error(err?.response?.data?.message || err.message || 'Unable to initiate payment')
      }
    }
    createIntent()
  }, [backendUrl, formData, workshopId, gatewayStatus.available])

  if (loading) return <div className='py-16'><Spinner /></div>
  if (!formData) return null

  const { seatsLeft, capacity } = getSeatsMeta(workshop || {})
  const infoTiles = [
    { label: 'Date', value: formatDateLabel(workshop?.date) },
    { label: 'Time', value: formatTimeLabel(workshop?.startTime) },
    { label: 'Duration', value: formatDurationLabel(workshop?.durationMinutes) },
    { label: 'Seats left', value: seatsLeft ? `${seatsLeft} seats` : 'Waitlist' },
  ]
  const heroDescription = workshop?.description || 'A simple and responsive payment experience to lock in your spot.'
  const priceHighlight = workshop?.priceType === 'paid' ? `Rs ${Number(workshop?.price || 0).toFixed(2)}` : 'Free session'

  return (
    <div className='my-12 grid gap-12 xl:grid-cols-[1.05fr,0.95fr] items-start'>
      <section className='rounded-[48px] border border-slate-100 bg-slate-50 p-10 shadow-[0_35px_80px_rgba(15,23,42,0.06)] space-y-8'>
        <div className='space-y-4'>
          <p className='text-xs font-semibold uppercase tracking-[0.4em] text-slate-400'>FeelsFIX Workshop</p>
          <h1 className='text-4xl md:text-5xl font-semibold text-slate-900 leading-tight'>Payment Gateway Experience</h1>
          <p className='max-w-2xl text-lg text-slate-600'>Complete a secure payment to reserve your seat for <span className='font-semibold text-slate-900'>{workshop?.title}</span>. {heroDescription}</p>
        </div>

        <div className='grid gap-4 sm:grid-cols-2'>
          {infoTiles.map((tile) => (
            <div key={tile.label} className='rounded-2xl border border-white/60 bg-white/80 px-5 py-4 shadow-[0_15px_35px_rgba(15,23,42,0.04)]'>
              <p className='text-xs font-semibold uppercase tracking-wide text-slate-400'>{tile.label}</p>
              <p className='mt-2 text-xl font-semibold text-slate-900'>{tile.value}</p>
            </div>
          ))}
        </div>

        <div className='flex flex-wrap items-center gap-4 rounded-3xl border border-white/60 bg-white px-6 py-5 shadow-[0_25px_55px_rgba(15,23,42,0.05)]'>
          <div>
            <p className='text-xs font-semibold uppercase tracking-wide text-slate-400'>Investment</p>
            <p className='text-3xl font-semibold text-slate-900'>{priceHighlight}</p>
          </div>
          <span className='h-10 w-px bg-slate-200' />
          <div>
            <p className='text-xs font-semibold uppercase tracking-wide text-slate-400'>Facilitator</p>
            <p className='text-lg font-semibold text-slate-800'>{workshop?.facilitator || 'Facilitator TBA'}</p>
          </div>
          <div className='mt-4 flex-1 text-right md:mt-0'>
            <button type='button' onClick={() => navigate('/workshops')} className='inline-flex items-center rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-500'>
              Explore more workshops
            </button>
          </div>
        </div>
      </section>

      <section className='space-y-6'>
        {gatewayStatus.available ? (
          stripePromise && clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PaymentForm clientSecret={clientSecret} formData={formData} workshop={workshop} token={token} backendUrl={backendUrl} />
            </Elements>
          ) : (
            <div className='rounded-[32px] border border-slate-100 bg-white p-8 shadow-[0_25px_65px_rgba(15,23,42,0.07)] space-y-4 text-center'>
              <p className='text-sm font-semibold text-slate-600'>Preparing secure payment…</p>
              <Spinner />
            </div>
          )
        ) : gatewayStatus.loading ? (
          <div className='rounded-[32px] border border-slate-100 bg-white p-8 shadow-[0_25px_65px_rgba(15,23,42,0.07)] space-y-4 text-center'>
            <p className='text-sm font-semibold text-slate-600'>Connecting to Stripe…</p>
            <Spinner />
          </div>
        ) : (
          <GatewayErrorPanel message={gatewayStatus.message} retrying={gatewayStatus.loading} onRetry={() => requestGatewayConfig({ showToast: true })} />
        )}

        <div className='rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_25px_60px_rgba(15,23,42,0.05)] space-y-6'>
          <div>
            <p className='text-base font-semibold text-slate-900'>Order summary</p>
            <p className='text-sm text-slate-500'>Review everything before you confirm payment.</p>
          </div>
          <div className='rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-700 space-y-4'>
            <div className='flex flex-wrap items-start justify-between gap-4'>
              <div>
                <p className='text-xs uppercase tracking-wide text-slate-500'>Workshop</p>
                <p className='text-lg font-semibold text-slate-900'>{workshop?.title || 'Workshop TBA'}</p>
                <p>{formatDateLabel(workshop?.date)} · {formatTimeLabel(workshop?.startTime)}</p>
                <p>{formatDurationLabel(workshop?.durationMinutes)}</p>
              </div>
              <div className='text-right'>
                <p className='text-xs uppercase tracking-wide text-slate-500'>Seats</p>
                <p className='font-semibold text-slate-900'>{seatsLeft > 0 ? `${seatsLeft} available` : 'Waitlist only'}</p>
                {capacity ? <p className='text-xs text-slate-500'>{capacity} total</p> : <p className='text-xs text-slate-500'>Capacity not limited</p>}
              </div>
            </div>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div>
                <p className='text-xs uppercase tracking-wide text-slate-500'>Price</p>
                <p className='font-semibold text-slate-900'>{priceHighlight}</p>
              </div>
              <div>
                <p className='text-xs uppercase tracking-wide text-slate-500'>Attendee</p>
                <p className='font-semibold text-slate-900'>{formData.fullName}</p>
                <p className='text-xs text-slate-500'>{formData.email}</p>
                <p className='text-xs text-slate-500'>{formData.phone}</p>
              </div>
            </div>
          </div>
          <WorkshopInvoiceCard workshop={workshop || {}} />
        </div>
      </section>
    </div>
  )
}

export default WorkshopPayment
