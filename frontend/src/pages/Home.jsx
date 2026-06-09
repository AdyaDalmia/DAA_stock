import { useState } from 'react'
import SearchBar from '../components/SearchBar'
import { analyzeStock } from '../api/analyze'

const TABS = ['Overview', 'Indicators', 'News', 'Influence']

export default function Home() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('Overview')

  async function handleAnalyze(symbol) {
    setLoading(true)
    setError(null)
    try {
      const data = await analyzeStock(symbol)
      setResult(data)
      setActiveTab('Overview')
    } catch (e) {
      setError(e.response?.data?.detail || 'Stock not found. Try a valid NSE symbol (e.g. RELIANCE, TCS).')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>
        📈 StockSense — DAA Stock Analyzer
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Algorithms: Sliding Window · Segment Tree · BFS · TextBlob · Greedy
      </p>

      <SearchBar onAnalyze={handleAnalyze} loading={loading} />

      {error && (
        <p style={{ color: '#dc2626', marginTop: '1rem', padding: '0.75rem', background: '#fee2e2', borderRadius: 8 }}>
          {error}
        </p>
      )}

      {result && (
        <div style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '2px solid #e5e7eb', marginBottom: '1.5rem' }}>
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '0.5rem 1.2rem', border: 'none', cursor: 'pointer',
                  background: activeTab === tab ? '#6366f1' : 'transparent',
                  color: activeTab === tab ? '#fff' : '#6b7280',
                  borderRadius: '6px 6px 0 0',
                  fontWeight: activeTab === tab ? 700 : 400,
                  fontSize: '0.9rem'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'Overview' && <div style={{ color: '#6b7280' }}>Overview coming in next task...</div>}
          {activeTab === 'Indicators' && <div style={{ color: '#6b7280' }}>Indicators coming soon...</div>}
          {activeTab === 'News' && <div style={{ color: '#6b7280' }}>News coming soon...</div>}
          {activeTab === 'Influence' && <div style={{ color: '#6b7280' }}>Influence graph coming soon...</div>}
        </div>
      )}
    </div>
  )
}
