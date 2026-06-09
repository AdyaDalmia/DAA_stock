import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function PriceChart({ prices, dates, symbol }) {
  const data = prices.map((price, i) => ({
    date: dates[i]?.slice(5) ?? '',
    price: Math.round(price * 100) / 100,
  }))

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: '1.25rem' }}>
      <div style={{ fontWeight: 700, marginBottom: '0.75rem', color: '#111827' }}>
        {symbol} — 60-Day Close Price
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={9} />
          <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} width={65} />
          <Tooltip formatter={(v) => [`₹${v}`, 'Price']} />
          <Line type="monotone" dataKey="price" stroke="#6366f1" dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
