export default function IndicatorsPanel({ indicators }) {
  const { rsi, macd, macd_signal, sma20, sma50, high_30d, low_30d, high_52w, low_52w } = indicators

  const rows = [
    { label: 'RSI (14)',      value: rsi?.toFixed(2),           signal: rsi < 35 ? '🟢 Oversold' : rsi > 70 ? '🔴 Overbought' : '🟡 Neutral' },
    { label: 'MACD',          value: macd?.toFixed(4),           signal: macd > macd_signal ? '🟢 Bullish' : '🔴 Bearish' },
    { label: 'MACD Signal',   value: macd_signal?.toFixed(4),    signal: '—' },
    { label: 'SMA (20)',      value: `₹${sma20?.toFixed(2)}`,    signal: sma20 > sma50 ? '🟢 Above SMA50' : '🔴 Below SMA50' },
    { label: 'SMA (50)',      value: `₹${sma50?.toFixed(2)}`,    signal: '—' },
    { label: '30-Day High',   value: `₹${high_30d?.toFixed(2)}`, signal: '—' },
    { label: '30-Day Low',    value: `₹${low_30d?.toFixed(2)}`,  signal: '—' },
    { label: '52-Week High',  value: `₹${high_52w?.toFixed(2)}`, signal: '—' },
    { label: '52-Week Low',   value: `₹${low_52w?.toFixed(2)}`,  signal: '—' },
  ]

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ background: '#f8fafc' }}>
            {['Indicator', 'Value', 'Signal'].map(h => (
              <th key={h} style={{ padding: '0.65rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e2e8f0', color: '#9ca3af' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f3f4f6' }}>
              <td style={{ padding: '0.65rem 1rem', color: '#374151', fontWeight: 500 }}>{r.label}</td>
              <td style={{ padding: '0.65rem 1rem', fontWeight: 700, color: '#111827', fontFamily: 'monospace' }}>{r.value}</td>
              <td style={{ padding: '0.65rem 1rem', color: '#374151' }}>{r.signal}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
