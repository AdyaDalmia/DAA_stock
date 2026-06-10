import { useState } from 'react'
import { analyzeStock } from '../api/analyze'
import RecommendationCard from '../components/RecommendationCard'
import PriceChart from '../components/PriceChart'
import IndicatorsPanel from '../components/IndicatorsPanel'
import SentimentPanel from '../components/SentimentPanel'
import InfluenceGraph from '../components/InfluenceGraph'

const TABS = ['Overview', 'Indicators', 'News', 'Influence']

const REC_COLOR = { BUY: '#16a34a', SELL: '#dc2626', HOLD: '#d97706' }
const REC_BG    = { BUY: '#dcfce7', SELL: '#fee2e2', HOLD: '#fef3c7' }

export default function Home() {
  const [symbol, setSymbol] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('Overview')

  async function handleAnalyze(e) {
    e.preventDefault()
    if (!symbol.trim()) return
    setLoading(true)
    setError(null)
    try {
      const data = await analyzeStock(symbol.trim().toUpperCase())
      setResult(data)
      setActiveTab('Overview')
    } catch (err) {
      setError(err.response?.data?.detail || 'Stock not found. Try a valid NSE symbol (e.g. RELIANCE, TCS).')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* ── Navbar ── */}
      <nav style={{
        background: '#fff', borderBottom: '1px solid #e2e8f0',
        padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.3rem' }}>📈</span>
          <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#111827' }}>StockSense</span>
          <span style={{ color: '#9ca3af', fontSize: '0.72rem', marginLeft: '0.25rem' }}>DAA Stock Analyzer</span>
        </div>
        <form onSubmit={handleAnalyze} style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            value={symbol}
            onChange={e => setSymbol(e.target.value.toUpperCase())}
            placeholder="NSE symbol e.g. RELIANCE"
            style={{
              background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8,
              padding: '0.4rem 0.9rem', fontSize: '0.85rem', color: '#111827',
              width: 220, outline: 'none'
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? '#a5b4fc' : '#4f46e5', color: '#fff',
              border: 'none', borderRadius: 8, padding: '0.4rem 1.1rem',
              fontSize: '0.85rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Analyzing...' : 'Analyze ▶'}
          </button>
        </form>
      </nav>

      {/* ── Body ── */}
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '1.5rem 1.5rem' }}>

        {/* Error */}
        {error && (
          <div style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        {/* Empty state */}
        {!result && !error && !loading && (
          <div style={{ textAlign: 'center', padding: '5rem 1rem', color: '#9ca3af' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#374151', marginBottom: '0.5rem' }}>Enter an NSE symbol to get started</div>
            <div style={{ fontSize: '0.875rem' }}>Try RELIANCE · TCS · HDFCBANK · INFY · TATAMOTORS</div>
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {['RELIANCE','TCS','HDFCBANK','INFY','SUNPHARMA'].map(s => (
                <button key={s} onClick={() => { setSymbol(s) }}
                  style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.35rem 0.9rem', fontSize: '0.78rem', color: '#4f46e5', fontWeight: 600, cursor: 'pointer' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '5rem 1rem', color: '#9ca3af' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
            <div style={{ fontWeight: 600, color: '#374151' }}>Running pipeline...</div>
            <div style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Fetch → Indicators → Sentiment → BFS → Decision</div>
          </div>
        )}

        {/* Results */}
        {result && (
          <>
            {/* Stock header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#111827' }}>{result.symbol}</h2>
              <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>NSE · ₹{result.current_price?.toFixed(2)}</span>
              <span style={{
                marginLeft: 'auto',
                background: REC_BG[result.recommendation] || '#f3f4f6',
                color: REC_COLOR[result.recommendation] || '#374151',
                padding: '0.25rem 1rem', borderRadius: 20, fontWeight: 700, fontSize: '0.9rem'
              }}>
                ● {result.recommendation}
              </span>
            </div>

            {/* Tabs */}
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '1rem', overflow: 'hidden' }}>
              <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', padding: '0 0.5rem' }}>
                {TABS.map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)} style={{
                    padding: '0.75rem 1.1rem', border: 'none', background: 'transparent', cursor: 'pointer',
                    fontSize: '0.85rem', fontWeight: activeTab === tab ? 700 : 500,
                    color: activeTab === tab ? '#4f46e5' : '#6b7280',
                    borderBottom: activeTab === tab ? '2px solid #4f46e5' : '2px solid transparent',
                    marginBottom: -1
                  }}>
                    {tab}
                  </button>
                ))}
              </div>
              <div style={{ padding: '1.25rem' }}>
                {activeTab === 'Overview' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.25rem' }}>
                    <RecommendationCard result={result} />
                    <PriceChart prices={result.prices} dates={result.dates} symbol={result.symbol} />
                  </div>
                )}
                {activeTab === 'Indicators' && <IndicatorsPanel indicators={result.indicators} />}
                {activeTab === 'News' && <SentimentPanel sentiment={result.sentiment} />}
                {activeTab === 'Influence' && <InfluenceGraph influence={result.influence} symbol={result.symbol} />}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
