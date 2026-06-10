export default function SentimentPanel({ sentiment }) {
  const { sentiment_score, sentiment_label, headlines } = sentiment
  const pct = Math.round((sentiment_score + 1) * 50)
  const color = sentiment_score > 0.2 ? '#16a34a' : sentiment_score < -0.2 ? '#dc2626' : '#d97706'
  const bg    = sentiment_score > 0.2 ? '#dcfce7' : sentiment_score < -0.2 ? '#fee2e2' : '#fef3c7'

  return (
    <div>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>News Sentiment</span>
        <span style={{ background: bg, color, padding: '0.2rem 0.75rem', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700 }}>
          {sentiment_label}
        </span>
        <span style={{ color, fontWeight: 700, fontSize: '0.85rem' }}>{sentiment_score.toFixed(3)}</span>
        <span style={{ marginLeft: 'auto', color: '#9ca3af', fontSize: '0.72rem' }}>TextBlob · O(L) per headline</span>
      </div>

      {/* Score bar */}
      <div style={{ background: '#f1f5f9', borderRadius: 8, height: 8, marginBottom: '1.25rem', overflow: 'hidden' }}>
        <div style={{ background: color, width: `${pct}%`, height: '100%', borderRadius: 8, transition: 'width 0.4s ease' }} />
      </div>

      {/* Headlines */}
      <div style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: '0.6rem' }}>
        Headlines
      </div>
      {headlines.length === 0 ? (
        <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No headlines found. Check your NEWSAPI_KEY.</p>
      ) : (
        <div>
          {headlines.map((h, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start',
              padding: '0.65rem 0', borderBottom: i < headlines.length - 1 ? '1px solid #f3f4f6' : 'none'
            }}>
              <span style={{ fontSize: '0.85rem', color: '#374151', lineHeight: 1.5 }}>{h.text}</span>
              <span style={{
                fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'nowrap', fontFamily: 'monospace',
                color: h.score > 0 ? '#16a34a' : h.score < 0 ? '#dc2626' : '#9ca3af'
              }}>
                {h.score > 0 ? '+' : ''}{h.score.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
