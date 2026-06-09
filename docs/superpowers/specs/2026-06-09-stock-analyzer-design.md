# Smart Stock Entry/Exit Analyzer — Design Spec
**Date:** 2026-06-09  
**Scope:** MVP (demo-ready in 1 day)  
**Target Market:** Indian stock market (NSE)

---

## 1. Project Goal

A web-based stock analysis platform for Indian equities that applies classical DAA algorithms to generate objective BUY / SELL / HOLD recommendations with entry price, exit target, stop-loss, and risk score. Eliminates emotional trading through predefined algorithmic rules.

---

## 2. Architecture — Pipeline Design

```
React Frontend (Vercel)
        │
        │ POST /analyze { symbol }
        ▼
FastAPI Backend (Render.com)
        │
        ▼
┌─────────────────────────────────┐
│         Algorithm Pipeline      │
│                                 │
│  Stage 1: FETCH                 │
│  Stage 2: INDICATORS            │
│  Stage 3: SENTIMENT             │
│  Stage 4: INFLUENCE GRAPH (BFS) │
│  Stage 5: DECISION ENGINE       │
└─────────────────────────────────┘
```

Single FastAPI service. Each stage is an independent Python module in `backend/pipeline/`. Stages run sequentially; each receives the output of the previous stage.

---

## 3. DAA Algorithms

| Algorithm | Stage | Use Case | Complexity |
|---|---|---|---|
| **Sliding Window** | Indicators | SMA(20), SMA(50), EMA(12/26), RSI(14), MACD | O(n) time, O(k) space |
| **Segment Tree** | Indicators | 52-week high/low, 30-day high/low (range min/max queries) | O(n) build, O(log n) query |
| **TextBlob (String Processing)** | Sentiment | Polarity scoring on news headlines | O(L) per headline |
| **BFS** | Influence Graph | News impact propagation from searched stock through sector graph | O(V+E) |
| **Greedy** | Decision Engine | Weighted signal aggregation → optimal BUY/SELL/HOLD decision | O(1) per rule |

### Academic Justification Strategy
- **Sliding Window vs Naive:** Naive SMA recalculates full sum every step O(n²). Sliding window maintains a running sum O(n). Show this comparison in the report.
- **Segment Tree vs Linear Scan:** Linear scan for range max/min is O(n) per query. Segment tree is O(log n). With multiple queries per analysis, the speedup compounds.
- **Greedy Choice Property:** Each indicator signal is locally optimal (based on proven trading rules). The greedy aggregation produces a globally optimal recommendation — justify this in the report.
- **BFS over DFS for propagation:** BFS finds stocks influenced at distance 1 before distance 2 (level-order), which mirrors how news impact actually spreads in markets — immediate sector peers first.

---

## 4. Data Sources

| Data | Source | Library/Method |
|---|---|---|
| OHLCV price data | Yahoo Finance (NSE) | `yfinance` — symbol format: `RELIANCE.NS` |
| News headlines | NewsAPI (free tier) | REST API, 100 req/day limit |

**Note on Indian news:** MoneyControl and Economic Times scraping is deferred post-MVP due to time constraints. NewsAPI covers major Indian financial news adequately for the demo.

---

## 5. Pipeline Stage Specifications

### Stage 1 — Fetch (`fetch.py`)
- Input: stock symbol string (e.g. `"RELIANCE"`)
- Appends `.NS` suffix for NSE lookup
- Fetches 1 year of daily OHLCV data via `yfinance`
- Fetches up to 10 latest headlines via NewsAPI (query = symbol name)
- Output: `{ ohlcv: DataFrame, headlines: [str] }`

### Stage 2 — Indicators (`indicators.py`)
- Input: OHLCV DataFrame
- **Sliding Window:** Computes SMA(20), SMA(50), EMA(12), EMA(26), RSI(14), MACD signal line
- **Segment Tree:** Built on closing prices array. Queries: 30-day high, 30-day low, 52-week high, 52-week low
- Output: `{ sma20, sma50, ema12, ema26, rsi, macd, high_30d, low_30d, high_52w, low_52w, current_price }`

### Stage 3 — Sentiment (`sentiment.py`)
- Input: list of headlines
- Runs each headline through TextBlob `.sentiment.polarity`
- Aggregates: average polarity score across all headlines
- Output: `{ sentiment_score: float (-1.0 to 1.0), sentiment_label: "Bullish"|"Bearish"|"Neutral", headlines: [{ text, score }] }`

### Stage 4 — Influence Graph (`graph.py`)
- Pre-defined adjacency list of ~20 NSE stocks grouped by sector/conglomerate:
  ```
  RELIANCE → [JIOFIN, ONGC, BPCL]
  TCS      → [INFY, WIPRO, HCLTECH]
  JIOFIN   → [AIRTEL]
  HDFC     → [HDFCBANK, HDFCLIFE]
  TATAMOTORS → [TATASTEEL, TATAPOWER]
  ```
- BFS from searched stock (max depth 2)
- Output: `{ influenced_stocks: [{ symbol, distance }], bfs_path: [[level_0], [level_1], [level_2]] }`

### Stage 5 — Decision Engine (`decision.py`)
- Input: all outputs from stages 2–4
- **Greedy scoring rules:**

| Condition | Score |
|---|---|
| RSI < 35 (oversold) | +2 |
| RSI > 70 (overbought) | -2 |
| MACD > Signal line (bullish crossover) | +2 |
| MACD < Signal line | -2 |
| Current price within 5% of 52W low | +2 |
| Current price within 5% of 52W high | -1 |
| SMA20 > SMA50 (uptrend) | +1 |
| SMA20 < SMA50 (downtrend) | -1 |
| Sentiment score > 0.2 | +1 |
| Sentiment score < -0.2 | -1 |

- **Decision thresholds:** Score ≥ 4 → BUY, Score ≤ -3 → SELL, else HOLD
- **Price targets:**
  - Entry = current price
  - Target = entry × 1.10 (10% upside) if BUY
  - Stop-loss = entry × 0.97 (3% downside) if BUY
  - Risk score = "Low" (score ≥ 6), "Medium" (3–5), "High" (< 3)
- Output: `{ recommendation, entry, target, stop_loss, risk_score, total_score, signals: [{ rule, value, score }] }`

---

## 6. API Endpoints

| Method | Endpoint | Request | Response |
|---|---|---|---|
| POST | `/analyze` | `{ "symbol": "RELIANCE" }` | Full pipeline output (all stage results combined) |
| GET | `/health` | — | `{ "status": "ok" }` |

Single endpoint keeps the backend simple and the frontend easy to wire up.

---

## 7. Frontend — React + Vite

**Pages:** Single page (`/`) with stock search.

**Components:**
- `SearchBar` — text input + Analyze button
- `RecommendationCard` — BUY/SELL/HOLD badge, entry/target/stop-loss, risk score
- `PriceChart` — line chart of closing prices (Recharts `LineChart`)
- `IndicatorsPanel` — RSI gauge, MACD value, SMA crossover status, 52W high/low from Segment Tree
- `SentimentPanel` — score bar, top 5 headlines with individual polarity scores
- `InfluenceGraph` — text list of influenced stocks grouped by BFS level (no canvas/D3 for MVP)

**Tab structure (Layout B):**
1. **Overview** — RecommendationCard + PriceChart
2. **Indicators** — IndicatorsPanel (all technical signals)
3. **News** — SentimentPanel
4. **Influence** — InfluenceGraph (BFS output)

---

## 8. Deployment

| Component | Platform | Config |
|---|---|---|
| Frontend | Vercel (free) | Auto-deploy from `frontend/` directory on GitHub push |
| Backend | Render.com (free) | Web service, `uvicorn main:app`, `backend/` as root |
| Environment vars | Render dashboard | `NEWSAPI_KEY=<key>` |

**CORS:** FastAPI configured to allow Vercel frontend origin.  
**Cold starts:** Render free tier spins down after 15 min inactivity — acceptable for demo.

---

## 9. Project Structure

```
DAA_stock/
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── SearchBar.jsx
│   │   │   ├── RecommendationCard.jsx
│   │   │   ├── PriceChart.jsx
│   │   │   ├── IndicatorsPanel.jsx
│   │   │   ├── SentimentPanel.jsx
│   │   │   └── InfluenceGraph.jsx
│   │   └── pages/
│   │       └── Home.jsx
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── pipeline/
│       ├── __init__.py
│       ├── fetch.py
│       ├── indicators.py
│       ├── sentiment.py
│       ├── graph.py
│       └── decision.py
└── docs/
    └── superpowers/specs/
        └── 2026-06-09-stock-analyzer-design.md
```

---

## 10. Out of Scope (Post-MVP)

- MoneyControl / Economic Times scraping
- Trie-based keyword sentiment filter
- DFS influence chain detection
- Candlestick chart (using line chart instead)
- D3/canvas influence graph visualization
- User authentication or watchlists
- Historical recommendation tracking

---

## 11. Build Order (Tomorrow)

1. FastAPI skeleton + `/analyze` endpoint stub + CORS (30 min)
2. `fetch.py` — yfinance + NewsAPI working (45 min)
3. `indicators.py` — Sliding Window + Segment Tree (60 min)
4. `sentiment.py` — TextBlob scoring (30 min)
5. `graph.py` — hardcoded adjacency list + BFS (45 min)
6. `decision.py` — greedy rule engine (30 min)
7. React frontend — all components + tabs wired to backend (90 min)
8. Deploy Render + Vercel, fix CORS, end-to-end test (45 min)

**Total: ~6 hours**
