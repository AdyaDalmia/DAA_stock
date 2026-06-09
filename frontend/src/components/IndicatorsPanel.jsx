const th = { padding: '0.65rem 1rem', textAlign: 'left', fontSize: '0.78rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }
const td = { padding: '0.6rem 1rem', fontSize: '0.875rem' }

export default function IndicatorsPanel({ indicators }) {
  const { rsi, macd, macd_signal, sma20, sma50, high_30d, low_30d, high_52w, low_52w } = indicators

  const rows = [
    { label: 'RSI (14)',       value: rsi,          signal: rsi < 35 ? '🟢 Oversold' : rsi > 70 ? '🔴 Overbought' : '🟡 Neutral', algo: 'Sliding Window · O(n)' },
    { label: 'MACD',           value: macd,          signal: macd > macd_signal ? '🟢 Bullish crossover' : '🔴 Bearish', algo: 'Sliding Window · O(n)' },
    { label: 'MACD Signal',    value: macd_signal,   signal: '', algo: 'Sliding Window · O(n)' },
    { label: 'SMA (20)',       value: `₹${sma20}`,   signal: sma20 > sma50 ? '🟢 Above SMA50' : '🔴 Below SMA50', algo: 'Sliding Window · O(n)' },
    { label: 'SMA (50)',       value: `₹${sma50}`,   signal: '', algo: 'Sliding Window · O(n)' },
    { label: '30-Day High',    value: `₹${high_30d}`, signal: '', algo: 'Segment Tree · O(log n)' },
    { label: '30-Day Low',     value: `₹${low_30d}`,  signal: '', algo: 'Segment Tree · O(log n)' },
    { label: '52-Week High',   value: `₹${high_52w}`, signal: '', algo: 'Segment Tree · O(log n)' },
    { label: '52-Week Low',    value: `₹${low_52w}`,  signal: '', algo: 'Segment Tree · O(log n)' },
  ]

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ background: '#f9fafb' }}>
          <tr>
            <th style={th}>Indicator</th>
            <th style={th}>Value</th>
            <th style={th}>Signal</th>
            <th style={{ ...th, color: '#6366f1' }}>Algorithm</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderTop: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
              <td style={td}>{r.label}</td>
              <td style={{ ...td, fontWeight: 700 }}>{r.value}</td>
              <td style={td}>{r.signal}</td>
              <td style={{ ...td, color: '#6366f1', fontSize: '0.75rem' }}>{r.algo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
