function StockPill({ label, primary }) {
  return (
    <span style={{
      display: 'inline-block',
      background: primary ? '#4f46e5' : '#ede9fe',
      color: primary ? '#fff' : '#4338ca',
      padding: '0.3rem 0.85rem', borderRadius: 20,
      fontSize: '0.78rem', fontWeight: 700,
      border: `1px solid ${primary ? '#4f46e5' : '#ddd6fe'}`
    }}>
      {label}
    </span>
  )
}

export default function InfluenceGraph({ influence, symbol }) {
  const { influenced_stocks, bfs_levels } = influence

  return (
    <div>
      <div style={{ marginBottom: '0.25rem', fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>
        Stock Influence Graph
      </div>
      <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginBottom: '1.25rem' }}>
        BFS from {symbol} · O(V+E) &nbsp;·&nbsp; stocks that may be affected by news about {symbol}
      </div>

      {influenced_stocks.length === 0 ? (
        <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
          {symbol} is not in the influence graph. Try: RELIANCE · TCS · HDFCBANK · TATAMOTORS · SUNPHARMA
        </p>
      ) : (
        <>
          {/* BFS visual */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', padding: '1rem', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
            <StockPill label={symbol} primary />
            {bfs_levels.map((level, li) => (
              <div key={li} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ color: '#d1d5db', fontSize: '1.1rem' }}>→</span>
                {level.map(s => <StockPill key={s} label={s} primary={false} />)}
              </div>
            ))}
          </div>

          {/* Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Influenced Stock', 'BFS Distance', 'Impact Level'].map(h => (
                  <th key={h} style={{ padding: '0.65rem 1rem', textAlign: 'left', fontSize: '0.7rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e2e8f0' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {influenced_stocks.map((s, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ padding: '0.65rem 1rem', fontWeight: 700, color: '#111827' }}>{s.symbol}</td>
                  <td style={{ padding: '0.65rem 1rem', color: '#374151' }}>{s.distance}</td>
                  <td style={{ padding: '0.65rem 1rem' }}>{s.distance === 1 ? '🔴 Direct' : '🟡 Indirect'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}
