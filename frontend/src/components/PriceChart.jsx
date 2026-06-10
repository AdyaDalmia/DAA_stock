import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function PriceChart({ prices, dates, symbol }) {
  const data = prices.map((price, i) => ({
    date: dates[i]?.slice(5) ?? '',
    price: Math.round(price * 100) / 100,
  }))

  return (
    <div>
      <div style={{ fontWeight: 700, marginBottom: '0.75rem', color: '#111827', fontSize: '0.9rem' }}>
        {symbol} — 60-Day Price
      </div>
      <ResponsiveContainer width="100%" height={210}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} interval={9} axisLine={false} tickLine={false} />
          <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#9ca3af' }} width={65} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(v) => [`₹${v}`, 'Price']}
            contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.8rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}
          />
          <Area type="monotone" dataKey="price" stroke="#6366f1" strokeWidth={2} fill="url(#priceGrad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
