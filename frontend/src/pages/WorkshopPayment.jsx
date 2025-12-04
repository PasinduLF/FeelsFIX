import { useCallback, useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useElements, useStripe } from '@stripe/react-stripe-js'
import Spinner from '../components/Spinner'
import { AppContext } from '../context/AppContext'
import WorkshopInvoiceCard from '../components/workshops/WorkshopInvoiceCard'

const paymentMethods = [
  { label: 'Card', value: 'card', enabled: true },
  { label: 'Bank Transfer', value: 'bank', enabled: false },
  { label: 'Cryptocurrency', value: 'crypto', enabled: false },
]

const cardBrands = [
  { label: 'Mastercard', colors: ['#f79e1b', '#ff5f6d'] },
  { label: 'Visa', colors: ['#1a1f71', '#4f6bed'] },
  { label: 'Amex', colors: ['#2e77bb', '#6dc1ff'] },
]

const formatLongDate = (value) => {
  if (!value) return 'Date TBA'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'Date TBA'
  return parsed.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

const formatTimeLabel = (value) => {
  if (!value) return 'Time TBA'
  const [hours, minutes] = value.split(':').map((segment) => Number(segment))
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return value
  const date = new Date()
  date.setHours(hours)
  date.setMinutes(minutes)
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

const formatDurationLabel = (minutes) => {
  const duration = Number(minutes)
  if (!Number.isFinite(duration) || duration <= 0) return 'Duration TBA'
  const hrs = Math.floor(duration / 60)
  const mins = duration % 60
  if (hrs && mins) return `${hrs}h ${mins}m`
  if (hrs) return `${hrs}h`
  return `${mins}m`
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

  const handlePay = async (e) => {
    e.preventDefault()
    if (!stripe || !elements) {
      toast.error('Payment system is still loading. Please wait a moment.')
      return
    }
    setProcessing(true)
    try {
      const card = elements.getElement(CardElement)
      if (!card) throw new Error('Card input not available')

      const confirmation = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card,
          billing_details: {
            name: formData.fullName,
            email: formData.email,
            phone: formData.phone,
          },
        },
      })

      if (confirmation.error) {
        throw new Error(confirmation.error.message || 'Payment confirmation failed')
      }

      const paymentIntentId = confirmation.paymentIntent?.id
      if (!paymentIntentId) throw new Error('Payment did not complete successfully')

      const config = token ? { headers: { token } } : undefined
      const payload = { ...formData, paymentIntentId }
      const { data } = await axios.post(`${backendUrl}/api/workshops/${workshop._id || workshop.id}/register`, payload, config)
      if (data.success) {
        try {
          sessionStorage.removeItem(`workshopRegistration:${workshop._id || workshop.id}`)
        } catch (clearError) {
          console.warn('Unable to clear saved workshop registration data', clearError)
        }
        toast.success('Payment successful and registration complete. See My Workshops for details.')
        navigate('/my-workshops')
      } else {
        throw new Error(data.message || 'Registration failed after payment')
      }
    } catch (err) {
      toast.error(err?.message || 'Unable to complete payment')
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
            <span
              key={brand.label}
              className='flex h-10 items-center rounded-full px-4 text-sm font-semibold text-white'
              style={{ background: `linear-gradient(120deg, ${brand.colors[0]}, ${brand.colors[1]})` }}
            >
              {brand.label}
            </span>
          ))}
        </div>

        <div>
          <label className='text-sm font-medium text-slate-700'>Card details</label>
          <div className='mt-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4'>
            <CardElement options={{ hidePostalCode: true }} />
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

  const seatsLeft = Math.max(0, (Number(workshop?.capacity) || 0) - (Number(workshop?.enrolled) || 0))
  const infoTiles = [
    { label: 'Date', value: formatLongDate(workshop?.date) },
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
            <p className='text-sm text-slate-500'>Double-check the workshop details before confirming payment.</p>
          </div>
          <WorkshopInvoiceCard workshop={workshop || {}} />
          <div className='rounded-2xl bg-slate-50 p-4 text-sm text-slate-600'>
            <p className='font-semibold text-slate-700'>Attendee</p>
            <p className='mt-2 text-slate-800'>{formData.fullName}</p>
            <p className='text-xs text-slate-500'>{formData.email}</p>
            <p className='text-xs text-slate-500'>{formData.phone}</p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default WorkshopPayment
