# StockSense — Smart Stock Entry/Exit Analyzer

> A **Design and Analysis of Algorithms (DAA)** lab project that applies classical algorithms to generate BUY / SELL / HOLD recommendations for NSE Indian stocks with entry price, exit target, stop-loss, and risk score.

---

## What It Does

1. You enter an NSE ticker (e.g. `RELIANCE`, `TCS`, `HDFCBANK`)
2. The backend fetches 1 year of price data + latest news headlines
3. Five algorithm stages run in a pipeline and produce a recommendation
4. The React frontend shows the result across four tabs — Overview, Indicators, News, Influence

---

## DAA Algorithms Used

| Algorithm | Stage | What It Computes | Complexity |
|---|---|---|---|
| **Sliding Window** | Technical Indicators | SMA(20), SMA(50), EMA(12/26), RSI(14), MACD | O(n) time · O(k) space |
| **Segment Tree** | Technical Indicators | 52-week high/low, 30-day high/low (range min/max queries) | O(n) build · O(log n) query |
| **BFS** | Influence Graph | News impact propagation across sector-linked stocks | O(V + E) |
| **Greedy** | Decision Engine | Weighted signal aggregation → BUY / SELL / HOLD | O(1) per rule |
| **String Processing** | Sentiment | TextBlob polarity scoring per news headline | O(L) per headline |

### Academic Justification

- **Sliding Window vs Naïve SMA:** Naïve recomputes the full sum every step → O(n²). Sliding window maintains a running sum → O(n).
- **Segment Tree vs Linear Scan:** Linear scan for range max/min is O(n) per query. Segment tree reduces this to O(log n). With multiple queries per analysis the speedup compounds.
- **BFS over DFS for influence propagation:** BFS finds stocks at distance 1 before distance 2 (level-order), which mirrors how news actually spreads — immediate sector peers first.
- **Greedy Choice Property:** Each indicator signal is locally optimal (based on proven trading rules). The greedy aggregation produces a globally consistent recommendation.

---

## Architecture

```
React Frontend (Vercel)
        │
        │  POST /analyze { symbol }
        ▼
FastAPI Backend (Render.com)
        │
        ▼
┌────────────────────────────────────┐
│          Algorithm Pipeline        │
│                                    │
│  Stage 1 — FETCH                   │  yfinance (.NS) + NewsAPI
│  Stage 2 — INDICATORS              │  Sliding Window + Segment Tree
│  Stage 3 — SENTIMENT               │  TextBlob
│  Stage 4 — INFLUENCE GRAPH (BFS)   │  Sector adjacency + BFS
│  Stage 5 — DECISION ENGINE         │  Greedy scoring rules
└────────────────────────────────────┘
```

---

## Project Structure

```
DAA_stock/
├── backend/
│   ├── main.py                  ← FastAPI app
│   ├── requirements.txt
│   ├── render.yaml              ← Render.com deploy config
│   └── pipeline/
│       ├── fetch.py             ← Stage 1: yfinance + NewsAPI
│       ├── indicators.py        ← Stage 2: Sliding Window + Segment Tree
│       ├── sentiment.py         ← Stage 3: TextBlob sentiment
│       ├── graph.py             ← Stage 4: BFS influence graph
│       └── decision.py         ← Stage 5: Greedy decision engine
├── frontend/
│   ├── src/
│   │   ├── pages/Home.jsx
│   │   ├── components/
│   │   │   ├── SearchBar.jsx
│   │   │   ├── RecommendationCard.jsx
│   │   │   ├── PriceChart.jsx
│   │   │   ├── IndicatorsPanel.jsx
│   │   │   ├── SentimentPanel.jsx
│   │   │   └── InfluenceGraph.jsx
│   │   └── api/analyze.js
│   └── vercel.json              ← Vercel deploy config
└── tests/
    ├── test_fetch.py
    ├── test_indicators.py
    ├── test_sentiment.py
    ├── test_graph.py
    └── test_decision.py         ← 36 tests total
```

---

## Local Setup

### Backend

```bash
cd backend
pip install -r requirements.txt

# Create .env file
echo "NEWSAPI_KEY=your_key_here" > .env

uvicorn main:app --reload
# API runs at http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install

# Create .env.local
echo "VITE_API_URL=http://localhost:8000" > .env.local

npm run dev
# App runs at http://localhost:5173
```

### Run Tests

```bash
cd backend
pytest tests/ -v
# 36 tests, all passing
```

---

## Deployment

### Backend → Render.com

1. Go to [render.com](https://render.com) → **New → Web Service**
2. Connect this GitHub repo
3. **Root Directory:** `backend`
4. **Build Command:** `pip install -r requirements.txt`
5. **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add environment variable: `NEWSAPI_KEY` = your key from [newsapi.org](https://newsapi.org/register)
7. Deploy — note your service URL (e.g. `https://stocksense-api.onrender.com`)

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project** → import this repo
2. **Root Directory:** `frontend`
3. Add environment variable: `VITE_API_URL` = your Render URL from above
4. Deploy

---

## Supported NSE Symbols (Influence Graph)

The BFS influence graph covers these stocks and their sector relationships:

`RELIANCE` · `TCS` · `INFY` · `WIPRO` · `HCLTECH` · `HDFCBANK` · `ICICIBANK` · `TATAMOTORS` · `TATASTEEL` · `TATAPOWER` · `SUNPHARMA` · `DRREDDY` · `CIPLA` · `ONGC` · `BPCL` · `JIOFIN` · `AIRTEL` · `HDFC` · `HDFCLIFE`

Any valid NSE symbol can be analyzed — the influence graph simply won't show connections for unlisted ones.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, Recharts, Axios |
| Backend | Python 3.11, FastAPI, Uvicorn |
| Price Data | yfinance (Yahoo Finance NSE) |
| News Data | NewsAPI (free tier — 100 req/day) |
| Sentiment | TextBlob |
| Hosting | Vercel (frontend) + Render.com (backend) |
