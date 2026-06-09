export default function SentimentPanel({ sentiment }) {
  const { sentiment_score, sentiment_label, headlines } = sentiment
  const pct = Math.round((sentiment_score + 1) * 50)  // map [-1,1] → [0,100]
  const color = sentiment_score > 0.2 ? '#16a34a' : sentiment_score < -0.2 ? '#dc2626' : '#d97706'

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>News Sentiment</span>
        <span style={{ background: color, color: '#fff', padding: '0.2rem 0.8rem', borderRadius: 20, fontSize: '0.82rem', fontWeight: 700 }}>
          {sentiment_label}
        </span>
        <span style={{ color, fontWeight: 700 }}>{sentiment_score.toFixed(3)}</span>
        <span style={{ color: '#9ca3af', fontSize: '0.78rem', marginLeft: 'auto' }}>TextBlob · O(L) per headline</span>
      </div>

      <div style={{ background: '#f3f4f6', borderRadius: 8, height: 10, marginBottom: '1.5rem', overflow: 'hidden' }}>
        <div style={{ background: color, width: `${pct}%`, height: '100%', borderRadius: 8, transition: 'width 0.3s' }} />
      </div>

      <div style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '0.75rem', fontWeight: 600 }}>
        Headlines
      </div>

      {headlines.length === 0 ? (
        <p style={{ color: '#9ca3af' }}>No headlines retrieved. Check your NEWSAPI_KEY.</p>
      ) : (
        headlines.map((h, i) => (
          <div key={i} style={{
            padding: '0.65rem 0', borderBottom: i < headlines.length - 1 ? '1px solid #f3f4f6' : 'none',
            display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start'
          }}>
            <span style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.4 }}>{h.text}</span>
            <span style={{
              fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'nowrap',
              color: h.score > 0 ? '#16a34a' : h.score < 0 ? '#dc2626' : '#9ca3af'
            }}>
              {h.score > 0 ? '+' : ''}{h.score.toFixed(2)}
            </span>
          </div>
        ))
      )}
    </div>
  )
}
