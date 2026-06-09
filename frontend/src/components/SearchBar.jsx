import { useState } from 'react'

export default function SearchBar({ onAnalyze, loading }) {
  const [symbol, setSymbol] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (symbol.trim()) onAnalyze(symbol.trim().toUpperCase())
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.75rem' }}>
      <input
        value={symbol}
        onChange={e => setSymbol(e.target.value)}
        placeholder="Enter NSE symbol — e.g. RELIANCE, TCS, INFY"
        style={{
          flex: 1, padding: '0.65rem 1rem',
          border: '1px solid #d1d5db', borderRadius: 8, fontSize: '1rem'
        }}
      />
      <button
        type="submit"
        disabled={loading || !symbol.trim()}
        style={{
          padding: '0.65rem 1.5rem', background: '#6366f1', color: '#fff',
          border: 'none', borderRadius: 8, cursor: 'pointer',
          fontWeight: 700, opacity: loading ? 0.7 : 1
        }}
      >
        {loading ? 'Analyzing...' : 'Analyze ▶'}
      </button>
    </form>
  )
}
