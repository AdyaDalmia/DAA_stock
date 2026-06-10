const COLOR = { BUY: '#16a34a', SELL: '#dc2626', HOLD: '#d97706' }
const BG    = { BUY: '#dcfce7', SELL: '#fee2e2', HOLD: '#fef3c7' }

export default function RecommendationCard({ result }) {
  const { recommendation, entry, target, stop_loss, risk_score, total_score, signals } = result
  const color = COLOR[recommendation] || '#374151'
  const bg    = BG[recommendation] || '#f3f4f6'

  return (
    <div>
      {/* BUY/SELL/HOLD badge */}
      <div style={{
        background: bg, color, borderRadius: 10, padding: '0.6rem',
        textAlign: 'center', fontSize: '1.5rem', fontWeight: 900, marginBottom: '1rem', letterSpacing: 2
      }}>
        {recommendation}
      </div>

      {/* Price grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '1rem' }}>
        {[
          { label: 'Entry',     value: `₹${Number(entry).toFixed(2)}`,      color: '#111827' },
          { label: 'Target',    value: `₹${Number(target).toFixed(2)}`,     color: '#16a34a' },
          { label: 'Stop-loss', value: `₹${Number(stop_loss).toFixed(2)}`,  color: '#dc2626' },
          { label: 'Risk',      value: risk_score,                           color: '#111827' },
        ].map(({ label, value, color: c }) => (
          <div key={label} style={{ background: '#f8fafc', padding: '0.6rem 0.75rem', borderRadius: 8, border: '1px solid #f3f4f6' }}>
            <div style={{ fontSize: '0.65rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
            <div style={{ fontWeight: 700, color: c, fontSize: '0.92rem', marginTop: '0.15rem' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Signals */}
      <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '0.75rem' }}>
        <div style={{ fontSize: '0.65rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
          Signals &nbsp;·&nbsp; Score: {total_score > 0 ? `+${total_score}` : total_score}
        </div>
        {signals.map((s, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', padding: '0.22rem 0', borderBottom: i < signals.length - 1 ? '1px solid #f9fafb' : 'none' }}>
            <span style={{ color: '#374151' }}>{s.rule}</span>
            <span style={{ fontWeight: 700, color: s.score > 0 ? '#16a34a' : '#dc2626' }}>
              {s.score > 0 ? `+${s.score}` : s.score}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
