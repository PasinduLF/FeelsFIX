import { useContext, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { AdminContext } from '../../context/AdminContext'
import { assets } from '../../assets/assets'
import Spinner from '../../components/Spinner'

const formatCurrency = (value = 0, currency = 'LKR') => {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value || 0)
  } catch (error) {
    return `${currency} ${(Number(value) || 0).toFixed(2)}`
  }
}

const formatDateTime = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const statusTone = {
  succeeded: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  processing: 'bg-sky-50 text-sky-700 border-sky-200',
  requires_action: 'bg-orange-50 text-orange-700 border-orange-200',
  Declined: 'bg-rose-50 text-rose-700 border-rose-200',
  failed: 'bg-rose-50 text-rose-700 border-rose-200',
  refunded: 'bg-slate-50 text-slate-600 border-slate-200',
}

const StatusPill = ({ status }) => (
  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold capitalize ${statusTone[status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
    {status.replace('_', ' ')}
  </span>
)

const MonthlyRevenueChart = ({ labels = [], stripe = [], bank = [] }) => {
  const maxValue = Math.max(...stripe, ...bank, 1)

  return (
    <div className='rounded-3xl border border-slate-100 bg-white p-5 shadow-sm'>
      <div className='flex items-center justify-between'>
        <div>
          <p className='text-sm font-semibold text-slate-500'>Monthly revenue</p>
          <p className='text-lg font-semibold text-slate-900'>Stripe vs Bank transfers</p>
        </div>
        <div className='flex gap-4 text-xs font-semibold text-slate-500'>
          <span className='flex items-center gap-1'><span className='h-2 w-2 rounded-full bg-indigo-500' />Stripe</span>
          <span className='flex items-center gap-1'><span className='h-2 w-2 rounded-full bg-emerald-500' />Bank</span>
        </div>
      </div>
      <div className='mt-8 flex h-60 items-end gap-4'>
        {labels.map((label, index) => {
          const stripeHeight = (stripe[index] / maxValue) * 100
          const bankHeight = (bank[index] / maxValue) * 100
          return (
            <div key={label} className='flex flex-1 flex-col items-center gap-2 text-xs text-slate-500'>
              <div className='flex w-full flex-1 items-end gap-1'>
                <span className='inline-block w-1/2 rounded-full bg-indigo-500' style={{ height: `${stripeHeight}%` }} />
                <span className='inline-block w-1/2 rounded-full bg-emerald-500' style={{ height: `${bankHeight}%` }} />
              </div>
              <span>{label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const StatusBreakdown = ({ title, data = {}, totalCount = 0 }) => (
  <div className='rounded-3xl border border-slate-100 bg-white p-5 shadow-sm'>
    <p className='text-sm font-semibold text-slate-500'>{title}</p>
    <div className='mt-4 space-y-4'>
      {Object.entries(data).map(([key, value]) => {
        const percent = totalCount ? Math.round((value.count / totalCount) * 100) : 0
        return (
          <div key={key}>
            <div className='flex items-center justify-between text-sm font-semibold text-slate-700'>
              <span className='capitalize'>{key.replace('_', ' ')}</span>
              <span>{value.count} · {percent}%</span>
            </div>
            <div className='mt-2 h-2 rounded-full bg-slate-100'>
              <div className='h-full rounded-full bg-indigo-500' style={{ width: `${percent}%` }} />
            </div>
            <p className='text-xs text-slate-500 mt-1'>Amount: {formatCurrency(value.amount)}</p>
          </div>
        )
      })}
    </div>
  </div>
)

const RecentTable = ({ title, rows = [] }) => (
  <div className='rounded-3xl border border-slate-100 bg-white p-5 shadow-sm'>
    <div className='flex items-center justify-between'>
      <p className='text-sm font-semibold text-slate-500'>{title}</p>
      <p className='text-xs text-slate-400'>Last 5 payments</p>
    </div>
    <div className='mt-4 space-y-4'>
      {rows.length === 0 && <p className='text-sm text-slate-500'>No recent activity</p>}
      {rows.map((row) => (
        <div key={row.id} className='flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-b-0'>
          <div>
            <p className='text-sm font-semibold text-slate-900'>{row.name || 'Unknown'}</p>
            <p className='text-xs text-slate-500'>{row.reference || '—'}</p>
          </div>
          <div className='text-right'>
            <p className='text-sm font-semibold text-slate-900'>{formatCurrency(row.amount, row.currency)}</p>
            <p className='text-xs text-slate-400'>{formatDateTime(row.createdAt)}</p>
          </div>
          <StatusPill status={row.status} />
        </div>
      ))}
    </div>
  </div>
)

const FinanceDashboard = () => {
  const { backendUrl } = useContext(AdminContext)
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!backendUrl) return
    const fetchMetrics = async () => {
      setLoading(true)
      try {
        const { data } = await axios.get(`${backendUrl}/api/payments/finance-dashboard`)
        if (data.success) {
          setMetrics(data.data)
        } else {
          toast.error(data.message || 'Unable to load finance dashboard')
        }
      } catch (error) {
        toast.error(error?.response?.data?.message || error.message || 'Unable to load finance dashboard')
      } finally {
        setLoading(false)
      }
    }
    fetchMetrics()
  }, [backendUrl])

  const pendingAmount = useMemo(() => {
    if (!metrics) return 0
    const stripePending = ['pending', 'processing', 'requires_action'].reduce((sum, key) => sum + (metrics.statusBreakdown?.stripe?.[key]?.amount || 0), 0)
    const bankPending = metrics.statusBreakdown?.bank?.Pending?.amount || 0
    return stripePending + bankPending
  }, [metrics])

  const pendingCount = useMemo(() => {
    if (!metrics) return 0
    const stripePending = ['pending', 'processing', 'requires_action'].reduce((sum, key) => sum + (metrics.statusBreakdown?.stripe?.[key]?.count || 0), 0)
    const bankPending = metrics.statusBreakdown?.bank?.Pending?.count || 0
    return stripePending + bankPending
  }, [metrics])

  const kpis = useMemo(() => {
    if (!metrics) return []
    return [
      {
        label: 'Total revenue',
        value: formatCurrency(metrics.totals?.combined?.amount, metrics.totals?.combined?.currency),
        hint: `${metrics.totals?.combined?.count || 0} payments`,
        icon: assets.earning_icon,
      },
      {
        label: 'Stripe (card) revenue',
        value: formatCurrency(metrics.totals?.stripe?.amount, metrics.totals?.stripe?.currency),
        hint: `${metrics.totals?.stripe?.count || 0} successful charges`,
        icon: assets.appointments_icon,
      },
      {
        label: 'Bank transfer revenue',
        value: formatCurrency(metrics.totals?.bank?.amount, metrics.totals?.bank?.currency),
        hint: `${metrics.totals?.bank?.count || 0} approved transfers`,
        icon: assets.list_icon,
      },
      {
        label: 'Pending settlements',
        value: formatCurrency(pendingAmount, metrics.totals?.combined?.currency),
        hint: `${pendingCount} awaiting review`,
        icon: assets.people_icon,
      },
    ]
  }, [metrics, pendingAmount, pendingCount])

  if (loading) {
    return (
      <div className='p-6 w-full'>
        <div className='flex items-center gap-3 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm'>
          <Spinner />
          <p className='text-sm font-semibold text-slate-600'>Loading finance dashboard…</p>
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className='p-6 w-full'>
        <div className='rounded-3xl border border-rose-100 bg-rose-50 p-6 text-rose-700'>
          Unable to load finance data. Please confirm the backend server is running.
        </div>
      </div>
    )
  }

  const stripeStatuses = metrics.statusBreakdown?.stripe || {}
  const bankStatuses = metrics.statusBreakdown?.bank || {}
  const stripeStatusTotal = Object.values(stripeStatuses).reduce((sum, entry) => sum + entry.count, 0)
  const bankStatusTotal = Object.values(bankStatuses).reduce((sum, entry) => sum + entry.count, 0)

  return (
    <div className='w-full p-6 space-y-6'>
      <header className='flex flex-wrap items-center justify-between gap-4'>
        <div>
          <p className='text-xs font-semibold uppercase tracking-[0.3em] text-indigo-400'>Finance</p>
          <h1 className='text-3xl font-semibold text-slate-900'>Stripe & Bank Payment Dashboard</h1>
          <p className='text-sm text-slate-500'>Live overview of all settlements and outstanding transactions.</p>
        </div>
        <div className='text-right text-xs text-slate-500'>
          <p>Last updated</p>
          <p className='font-semibold'>{formatDateTime(metrics.generatedAt)}</p>
        </div>
      </header>

      <section className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        {kpis.map((card) => (
          <div key={card.label} className='rounded-3xl border border-slate-100 bg-white p-5 shadow-sm'>
            <div className='flex items-center justify-between'>
              <p className='text-sm font-semibold text-slate-500'>{card.label}</p>
              <img src={card.icon} alt='' className='h-8 w-8 opacity-80' />
            </div>
            <p className='mt-4 text-2xl font-semibold text-slate-900'>{card.value}</p>
            <p className='text-sm text-slate-500'>{card.hint}</p>
          </div>
        ))}
      </section>

      <section className='grid gap-6 lg:grid-cols-[1.7fr,1fr]'>
        <MonthlyRevenueChart labels={metrics.monthlySeries?.labels} stripe={metrics.monthlySeries?.stripe} bank={metrics.monthlySeries?.bank} />
        <StatusBreakdown title='Stripe payments' data={stripeStatuses} totalCount={stripeStatusTotal} />
        <StatusBreakdown title='Bank transfers' data={bankStatuses} totalCount={bankStatusTotal} />
      </section>

      <section className='grid gap-6 lg:grid-cols-2'>
        <RecentTable title='Latest card payments' rows={metrics.recentActivity?.stripe} />
        <RecentTable title='Latest bank transfers' rows={metrics.recentActivity?.bank} />
      </section>
    </div>
  )
}

export default FinanceDashboard
