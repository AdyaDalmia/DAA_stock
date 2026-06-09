const COLOR = { BUY: '#16a34a', SELL: '#dc2626', HOLD: '#d97706' }
const BG    = { BUY: '#dcfce7', SELL: '#fee2e2', HOLD: '#fef3c7' }

export default function RecommendationCard({ result }) {
  const { recommendation, entry, target, stop_loss, risk_score, total_score, signals } = result

  const color = COLOR[recommendation]
  const bg = BG[recommendation]

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: '1.5rem' }}>
      <div style={{
        background: bg, color, borderRadius: 8, padding: '0.75rem',
        textAlign: 'center', fontSize: '1.6rem', fontWeight: 800, marginBottom: '1rem'
      }}>
        {recommendation}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
        {[
          { label: 'Entry', value: `₹${entry}`, color: '#374151' },
          { label: 'Target', value: `₹${target}`, color: '#16a34a' },
          { label: 'Stop-loss', value: `₹${stop_loss}`, color: '#dc2626' },
          { label: 'Risk', value: risk_score, color: '#374151' },
        ].map(({ label, value, color: c }) => (
          <div key={label} style={{ background: '#f9fafb', padding: '0.6rem 0.8rem', borderRadius: 8 }}>
            <div style={{ fontSize: '0.72rem', color: '#9ca3af', textTransform: 'uppercase' }}>{label}</div>
            <div style={{ fontWeight: 700, color: c, fontSize: '1rem', marginTop: '0.1rem' }}>{value}</div>
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '0.75rem' }}>
        <div style={{ fontSize: '0.72rem', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          Signals &nbsp;·&nbsp; Score: {total_score}
        </div>
        {signals.map((s, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.2rem 0' }}>
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
