export const formatCurrency = (amount = 0, currency = 'LKR') => {
	try {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency,
			minimumFractionDigits: 2,
		}).format(Number(amount) || 0)
	} catch {
		return `${currency} ${(Number(amount) || 0).toFixed(2)}`
	}
}

const WorkshopInvoiceCard = ({ workshop = {}, serviceFee = 0, currency = 'LKR' }) => {
	const price = Number(workshop?.price || 0)
	const total = price + serviceFee

	return (
		<div className='rounded-2xl border border-slate-200 bg-white/80 backdrop-blur px-5 py-4 shadow-sm text-sm text-slate-600'>
			<div className='flex items-center justify-between pb-3 border-b border-slate-100'>
				<span>Workshop fee</span>
				<span className='font-semibold text-slate-900'>{formatCurrency(price, currency)}</span>
			</div>
			<div className='flex items-center justify-between py-3'>
				<span>Service fee</span>
				<span className='font-semibold text-slate-900'>{formatCurrency(serviceFee, currency)}</span>
			</div>
			<div className='mt-2 flex items-center justify-between rounded-xl bg-indigo-50 px-4 py-3 font-semibold text-indigo-700'>
				<span>Due today</span>
				<span>{formatCurrency(total, currency)}</span>
			</div>
		</div>
	)
}

export default WorkshopInvoiceCard

