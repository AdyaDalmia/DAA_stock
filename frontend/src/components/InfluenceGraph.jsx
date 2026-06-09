function Node({ label, primary }) {
  return (
    <span style={{
      display: 'inline-block',
      background: primary ? '#6366f1' : '#e0e7ff',
      color: primary ? '#fff' : '#4338ca',
      padding: '0.3rem 0.8rem', borderRadius: 20,
      fontSize: '0.8rem', fontWeight: 700,
      border: '1px solid ' + (primary ? '#6366f1' : '#c7d2fe')
    }}>
      {label}
    </span>
  )
}

const th = { padding: '0.65rem 1rem', textAlign: 'left', fontSize: '0.78rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }
const td = { padding: '0.6rem 1rem', fontSize: '0.875rem' }

export default function InfluenceGraph({ influence, symbol }) {
  const { influenced_stocks, bfs_levels } = influence

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: '1.5rem' }}>
      <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.25rem' }}>
        Stock Influence Graph
      </div>
      <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '1.5rem' }}>
        BFS traversal from {symbol} — O(V+E) &nbsp;·&nbsp; shows which stocks may be affected by news
      </div>

      {influenced_stocks.length === 0 ? (
        <p style={{ color: '#9ca3af' }}>{symbol} is not in the influence graph. Try RELIANCE, TCS, HDFC, TATAMOTORS, SUNPHARMA.</p>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem', padding: '1rem', background: '#f9fafb', borderRadius: 8 }}>
            <Node label={symbol} primary />
            {bfs_levels.map((level, li) => (
              <div key={li} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ color: '#d1d5db', fontSize: '1.2rem' }}>→</span>
                {level.map(s => <Node key={s} label={s} primary={false} />)}
              </div>
            ))}
          </div>

          <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f9fafb' }}>
                <tr>
                  <th style={th}>Influenced Stock</th>
                  <th style={th}>BFS Distance</th>
                  <th style={th}>Influence Level</th>
                </tr>
              </thead>
              <tbody>
                {influenced_stocks.map((s, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={{ ...td, fontWeight: 700 }}>{s.symbol}</td>
                    <td style={td}>{s.distance}</td>
                    <td style={td}>{s.distance === 1 ? '🔴 Direct impact' : '🟡 Indirect impact'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
