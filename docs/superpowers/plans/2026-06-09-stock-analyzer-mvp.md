# Smart Stock Analyzer MVP — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack Indian stock analysis platform that runs 5 DAA algorithms (Sliding Window, Segment Tree, TextBlob, BFS, Greedy) and produces BUY/SELL/HOLD recommendations with entry/exit/stop-loss prices.

**Architecture:** React (Vite) frontend on Vercel calls a single FastAPI `/analyze` endpoint on Render. The backend runs a 5-stage pipeline: Fetch → Indicators → Sentiment → Influence Graph → Decision Engine. Each stage is an independent module in `backend/pipeline/`.

**Tech Stack:** Python 3.11, FastAPI, yfinance, TextBlob, NewsAPI, React 18, Vite, Recharts, axios

---

## File Map

```
DAA_stock/
├── .gitignore
├── backend/
│   ├── main.py                   # FastAPI app, CORS, /health, /analyze
│   ├── requirements.txt
│   ├── .env                      # NEWSAPI_KEY (not committed)
│   └── pipeline/
│       ├── __init__.py
│       ├── fetch.py              # yfinance + NewsAPI
│       ├── indicators.py         # Sliding Window + Segment Tree
│       ├── sentiment.py          # TextBlob scoring
│       ├── graph.py              # Adjacency list + BFS
│       └── decision.py           # Greedy rule engine
├── tests/
│   ├── test_fetch.py
│   ├── test_indicators.py
│   ├── test_sentiment.py
│   ├── test_graph.py
│   └── test_decision.py
└── frontend/
    ├── vite.config.js
    ├── index.html
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── api/
        │   └── analyze.js        # axios wrapper for /analyze
        ├── pages/
        │   └── Home.jsx          # tab shell, state holder
        └── components/
            ├── SearchBar.jsx
            ├── RecommendationCard.jsx
            ├── PriceChart.jsx
            ├── IndicatorsPanel.jsx
            ├── SentimentPanel.jsx
            └── InfluenceGraph.jsx
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `.gitignore`
- Create: `backend/requirements.txt`
- Create: `backend/pipeline/__init__.py`
- Create: `backend/.env`

- [ ] **Step 1: Create .gitignore**

```
__pycache__/
*.pyc
.env
.venv/
node_modules/
dist/
.superpowers/
```

Save to `C:\PROJECTS\DAA_stock\.gitignore`

- [ ] **Step 2: Create backend/requirements.txt**

```
fastapi==0.111.0
uvicorn==0.30.1
yfinance==0.2.40
textblob==0.18.0
requests==2.32.3
python-dotenv==1.0.1
pytest==8.2.2
httpx==0.27.0
```

- [ ] **Step 3: Create virtual environment and install dependencies**

Run from `C:\PROJECTS\DAA_stock\backend\`:
```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python -m textblob.download_corpora
```

Expected: All packages install without error. TextBlob downloads punkt/brown corpora.

- [ ] **Step 4: Create backend/pipeline/__init__.py**

Empty file — makes `pipeline` a Python package.

```python
```

- [ ] **Step 5: Create backend/.env**

```
NEWSAPI_KEY=your_newsapi_key_here
```

Get a free key at https://newsapi.org/register (takes 30 seconds).

- [ ] **Step 6: Commit scaffold**

```bash
git add .gitignore backend/requirements.txt backend/pipeline/__init__.py
git commit -m "feat: backend project scaffold"
```

Note: do NOT git add `backend/.env`

---

## Task 2: fetch.py — Data Fetching

**Files:**
- Create: `backend/pipeline/fetch.py`
- Create: `tests/test_fetch.py`

- [ ] **Step 1: Write the failing tests**

Create `tests/test_fetch.py`:

```python
import pytest
import pandas as pd
import yfinance as yf
from pipeline.fetch import fetch_stock_data, fetch_news


def test_fetch_appends_ns_suffix(monkeypatch):
    """fetch_stock_data must append .NS to symbol before calling yfinance"""
    class MockTicker:
        def history(self, period):
            dates = pd.date_range("2024-01-01", periods=5)
            return pd.DataFrame(
                {"Close": [100.0, 101.0, 102.0, 103.0, 104.0],
                 "High": [105.0] * 5, "Low": [98.0] * 5},
                index=dates
            )

    captured = {}
    def mock_ticker(symbol):
        captured["symbol"] = symbol
        return MockTicker()

    monkeypatch.setattr(yf, "Ticker", mock_ticker)
    result = fetch_stock_data("RELIANCE")
    assert captured["symbol"] == "RELIANCE.NS"
    assert len(result["closes"]) == 5
    assert result["current_price"] == 104.0
    assert len(result["dates"]) == 5


def test_fetch_raises_on_empty_data(monkeypatch):
    """fetch_stock_data must raise ValueError when yfinance returns empty DataFrame"""
    class MockTicker:
        def history(self, period):
            return pd.DataFrame()

    monkeypatch.setattr(yf, "Ticker", lambda s: MockTicker())
    with pytest.raises(ValueError, match="No data found"):
        fetch_stock_data("INVALID123")


def test_fetch_news_returns_list_of_strings(monkeypatch):
    """fetch_news must return a list of headline strings"""
    import requests

    mock_response = {
        "articles": [
            {"title": "Reliance posts record profits"},
            {"title": "Markets rally on strong GDP"},
            {"title": None},  # should be filtered out
        ]
    }

    class MockResp:
        def raise_for_status(self): pass
        def json(self): return mock_response

    monkeypatch.setattr(requests, "get", lambda *a, **kw: MockResp())
    result = fetch_news("RELIANCE")
    assert len(result) == 2
    assert all(isinstance(h, str) for h in result)


def test_fetch_news_returns_empty_on_missing_key(monkeypatch):
    """fetch_news must return [] when NEWSAPI_KEY is empty"""
    import os
    monkeypatch.setenv("NEWSAPI_KEY", "")
    result = fetch_news("RELIANCE")
    assert result == []
```

- [ ] **Step 2: Run tests to verify they fail**

Run from `backend/` (with venv active):
```bash
cd C:\PROJECTS\DAA_stock\backend
pytest ../tests/test_fetch.py -v
```

Expected: `ModuleNotFoundError: No module named 'pipeline.fetch'`

- [ ] **Step 3: Implement fetch.py**

Create `backend/pipeline/fetch.py`:

```python
import os
import requests
import yfinance as yf
from dotenv import load_dotenv

load_dotenv()

NEWSAPI_KEY = os.getenv("NEWSAPI_KEY", "")
NEWSAPI_URL = "https://newsapi.org/v2/everything"


def fetch_stock_data(symbol: str) -> dict:
    """Fetch 1 year of daily OHLCV data from Yahoo Finance (NSE).
    
    Time complexity: O(n) where n = trading days in 1 year (~252)
    """
    ticker = yf.Ticker(f"{symbol.upper()}.NS")
    hist = ticker.history(period="1y")

    if hist.empty:
        raise ValueError(f"No data found for {symbol}. Check the NSE symbol.")

    return {
        "closes": [float(v) for v in hist["Close"].tolist()],
        "highs": [float(v) for v in hist["High"].tolist()],
        "lows": [float(v) for v in hist["Low"].tolist()],
        "dates": [str(d.date()) for d in hist.index],
        "current_price": float(hist["Close"].iloc[-1]),
    }


def fetch_news(symbol: str) -> list[str]:
    """Fetch latest 10 news headlines for a stock symbol via NewsAPI.
    
    Returns [] if NEWSAPI_KEY is not set or request fails.
    """
    if not NEWSAPI_KEY:
        return []

    params = {
        "q": symbol,
        "language": "en",
        "pageSize": 10,
        "sortBy": "publishedAt",
        "apiKey": NEWSAPI_KEY,
    }

    try:
        resp = requests.get(NEWSAPI_URL, params=params, timeout=10)
        resp.raise_for_status()
        articles = resp.json().get("articles", [])
        return [a["title"] for a in articles if a.get("title")]
    except Exception:
        return []
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pytest ../tests/test_fetch.py -v
```

Expected: 4 passed

- [ ] **Step 5: Commit**

```bash
git add backend/pipeline/fetch.py tests/test_fetch.py
git commit -m "feat: fetch pipeline stage — yfinance + NewsAPI"
```

---

## Task 3: indicators.py — Sliding Window Algorithms

**Files:**
- Create: `backend/pipeline/indicators.py` (sliding window portion)
- Create: `tests/test_indicators.py` (sliding window tests)

- [ ] **Step 1: Write failing tests for sliding window**

Create `tests/test_indicators.py`:

```python
import pytest
from pipeline.indicators import sma, ema, rsi, macd


# --- SMA tests ---

def test_sma_basic():
    prices = [10.0, 20.0, 30.0, 40.0, 50.0]
    result = sma(prices, 3)
    assert result[0] is None
    assert result[1] is None
    assert result[2] == pytest.approx(20.0)
    assert result[3] == pytest.approx(30.0)
    assert result[4] == pytest.approx(40.0)


def test_sma_sliding_window_uses_running_sum():
    """Verify O(n) sliding window: result[i] = mean of prices[i-k+1:i+1]"""
    prices = list(range(1, 11))  # [1, 2, 3, ..., 10]
    result = sma(prices, 3)
    assert result[2] == pytest.approx(2.0)   # (1+2+3)/3
    assert result[5] == pytest.approx(5.0)   # (4+5+6)/3
    assert result[9] == pytest.approx(9.0)   # (8+9+10)/3


def test_sma_window_larger_than_data_returns_all_none():
    prices = [1.0, 2.0]
    result = sma(prices, 5)
    assert all(v is None for v in result)


# --- EMA tests ---

def test_ema_length_matches_input():
    prices = [float(i) for i in range(1, 31)]
    result = ema(prices, 12)
    assert len(result) == 30


def test_ema_first_value_is_sma():
    """EMA seeds with SMA of first `window` values"""
    prices = [10.0, 20.0, 30.0, 40.0, 50.0]
    result = ema(prices, 3)
    assert result[2] == pytest.approx(20.0)  # (10+20+30)/3


# --- RSI tests ---

def test_rsi_oversold_on_declining_prices():
    prices = [100.0 - i * 2 for i in range(20)]  # steadily declining
    result = rsi(prices)
    assert result < 40.0


def test_rsi_overbought_on_rising_prices():
    prices = [100.0 + i * 2 for i in range(20)]  # steadily rising
    result = rsi(prices)
    assert result > 60.0


def test_rsi_returns_100_on_no_losses():
    prices = [float(i) for i in range(1, 20)]  # always rising
    result = rsi(prices)
    assert result == 100.0


# --- MACD tests ---

def test_macd_returns_two_floats():
    prices = [float(i) + (i % 3) for i in range(50)]
    macd_val, signal_val = macd(prices)
    assert isinstance(macd_val, float)
    assert isinstance(signal_val, float)
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pytest ../tests/test_indicators.py -v
```

Expected: `ImportError: cannot import name 'sma' from 'pipeline.indicators'`

- [ ] **Step 3: Implement sliding window functions**

Create `backend/pipeline/indicators.py`:

```python
"""
Indicators module — Sliding Window and Segment Tree algorithms.

Sliding Window complexity: O(n) time, O(k) space
Segment Tree complexity:   O(n) build, O(log n) per range query
"""


# ─── SLIDING WINDOW ────────────────────────────────────────────────────────────

def sma(prices: list[float], window: int) -> list[float | None]:
    """Simple Moving Average via sliding window.
    
    Naive recalculation would be O(n*k). Sliding window maintains a running
    sum so each step is O(1), giving O(n) overall.
    """
    if len(prices) < window:
        return [None] * len(prices)

    result: list[float | None] = [None] * (window - 1)
    window_sum = sum(prices[:window])
    result.append(window_sum / window)

    for i in range(window, len(prices)):
        window_sum += prices[i] - prices[i - window]
        result.append(window_sum / window)

    return result


def ema(prices: list[float], window: int) -> list[float | None]:
    """Exponential Moving Average — seeds from SMA, then applies smoothing factor."""
    if len(prices) < window:
        return [None] * len(prices)

    k = 2 / (window + 1)
    result: list[float | None] = [None] * (window - 1)
    result.append(sum(prices[:window]) / window)  # seed with SMA

    for i in range(window, len(prices)):
        result.append(prices[i] * k + result[-1] * (1 - k))

    return result


def rsi(prices: list[float], window: int = 14) -> float:
    """Relative Strength Index — sliding window over gains/losses.
    
    RSI < 35 → oversold (potential BUY signal)
    RSI > 70 → overbought (potential SELL signal)
    """
    if len(prices) < window + 1:
        return 50.0  # neutral fallback

    deltas = [prices[i] - prices[i - 1] for i in range(1, len(prices))]
    recent = deltas[-window:]
    gains = [d for d in recent if d > 0]
    losses = [-d for d in recent if d < 0]

    avg_gain = sum(gains) / window
    avg_loss = sum(losses) / window

    if avg_loss == 0:
        return 100.0

    rs = avg_gain / avg_loss
    return 100.0 - (100.0 / (1 + rs))


def macd(prices: list[float]) -> tuple[float, float]:
    """MACD = EMA(12) - EMA(26). Signal = EMA(9) of MACD line.
    
    Returns (macd_value, signal_value) for the latest data point.
    """
    ema12 = ema(prices, 12)
    ema26 = ema(prices, 26)

    macd_line = []
    for e12, e26 in zip(ema12, ema26):
        if e12 is None or e26 is None:
            macd_line.append(None)
        else:
            macd_line.append(e12 - e26)

    valid_macd = [v for v in macd_line if v is not None]
    if len(valid_macd) < 9:
        return 0.0, 0.0

    signal_series = ema(valid_macd, 9)
    return float(valid_macd[-1]), float(signal_series[-1] or 0.0)
```

- [ ] **Step 4: Run tests**

```bash
pytest ../tests/test_indicators.py -v
```

Expected: All sliding window tests pass (MACD and EMA tests pass too since they're in same file).

---

## Task 4: indicators.py — Segment Tree

**Files:**
- Modify: `backend/pipeline/indicators.py` (add SegmentTree class + compute_indicators)
- Modify: `tests/test_indicators.py` (add Segment Tree tests)

- [ ] **Step 1: Add failing Segment Tree tests to test_indicators.py**

Append to `tests/test_indicators.py`:

```python
from pipeline.indicators import SegmentTree, compute_indicators


# --- Segment Tree tests ---

def test_segment_tree_range_max():
    """O(log n) range maximum query"""
    data = [3.0, 1.0, 4.0, 1.0, 5.0, 9.0, 2.0, 6.0]
    st = SegmentTree(data)
    assert st.query_max(0, 4) == pytest.approx(5.0)
    assert st.query_max(0, 7) == pytest.approx(9.0)
    assert st.query_max(5, 7) == pytest.approx(9.0)


def test_segment_tree_range_min():
    """O(log n) range minimum query"""
    data = [3.0, 1.0, 4.0, 1.0, 5.0, 9.0, 2.0, 6.0]
    st = SegmentTree(data)
    assert st.query_min(0, 4) == pytest.approx(1.0)
    assert st.query_min(2, 5) == pytest.approx(1.0)
    assert st.query_min(5, 7) == pytest.approx(2.0)


def test_segment_tree_single_element():
    st = SegmentTree([42.0])
    assert st.query_max(0, 0) == pytest.approx(42.0)
    assert st.query_min(0, 0) == pytest.approx(42.0)


def test_compute_indicators_returns_required_keys():
    stock_data = {
        "closes": [float(100 + i + (i % 5)) for i in range(260)],
        "current_price": 360.0,
    }
    result = compute_indicators(stock_data)
    for key in ["rsi", "macd", "macd_signal", "sma20", "sma50",
                "high_30d", "low_30d", "high_52w", "low_52w", "current_price"]:
        assert key in result, f"Missing key: {key}"
```

- [ ] **Step 2: Run tests to verify Segment Tree tests fail**

```bash
pytest ../tests/test_indicators.py -v -k "segment or compute"
```

Expected: `ImportError: cannot import name 'SegmentTree'`

- [ ] **Step 3: Add SegmentTree class and compute_indicators to indicators.py**

Append to `backend/pipeline/indicators.py`:

```python

# ─── SEGMENT TREE ──────────────────────────────────────────────────────────────

class SegmentTree:
    """Segment Tree for O(log n) range min/max queries.
    
    Build: O(n). Query: O(log n).
    
    Justification over linear scan: a single linear scan for range max is O(n).
    With a Segment Tree, after O(n) build, every query is O(log n). For an 
    analysis that issues multiple range queries (30-day high, 30-day low, 
    52-week high, 52-week low), the total cost is O(n + k*log n) vs O(k*n).
    """

    def __init__(self, data: list[float]):
        self.n = len(data)
        self._max = [float("-inf")] * (4 * self.n)
        self._min = [float("inf")] * (4 * self.n)
        if self.n > 0:
            self._build(data, 0, 0, self.n - 1)

    def _build(self, data: list[float], node: int, start: int, end: int) -> None:
        if start == end:
            self._max[node] = data[start]
            self._min[node] = data[start]
            return
        mid = (start + end) // 2
        self._build(data, 2 * node + 1, start, mid)
        self._build(data, 2 * node + 2, mid + 1, end)
        self._max[node] = max(self._max[2 * node + 1], self._max[2 * node + 2])
        self._min[node] = min(self._min[2 * node + 1], self._min[2 * node + 2])

    def query_max(self, l: int, r: int, node: int = 0, start: int = 0, end: int = -1) -> float:
        if end == -1:
            end = self.n - 1
        if r < start or end < l:
            return float("-inf")
        if l <= start and end <= r:
            return self._max[node]
        mid = (start + end) // 2
        return max(
            self.query_max(l, r, 2 * node + 1, start, mid),
            self.query_max(l, r, 2 * node + 2, mid + 1, end),
        )

    def query_min(self, l: int, r: int, node: int = 0, start: int = 0, end: int = -1) -> float:
        if end == -1:
            end = self.n - 1
        if r < start or end < l:
            return float("inf")
        if l <= start and end <= r:
            return self._min[node]
        mid = (start + end) // 2
        return min(
            self.query_min(l, r, 2 * node + 1, start, mid),
            self.query_min(l, r, 2 * node + 2, mid + 1, end),
        )


# ─── COMPUTE ALL INDICATORS ────────────────────────────────────────────────────

def compute_indicators(stock_data: dict) -> dict:
    """Run all indicator algorithms on stock price data.
    
    Returns a flat dict of all indicator values for the latest data point.
    """
    closes = stock_data["closes"]
    current = stock_data["current_price"]
    n = len(closes)

    sma20_series = sma(closes, 20)
    sma50_series = sma(closes, 50)
    macd_val, macd_sig = macd(closes)
    rsi_val = rsi(closes)

    st = SegmentTree(closes)

    return {
        "rsi": round(rsi_val, 2),
        "macd": round(macd_val, 4),
        "macd_signal": round(macd_sig, 4),
        "sma20": round(sma20_series[-1] or 0.0, 2),
        "sma50": round(sma50_series[-1] or 0.0, 2),
        "current_price": round(current, 2),
        "high_30d": round(st.query_max(max(0, n - 30), n - 1), 2),
        "low_30d": round(st.query_min(max(0, n - 30), n - 1), 2),
        "high_52w": round(st.query_max(0, n - 1), 2),
        "low_52w": round(st.query_min(0, n - 1), 2),
    }
```

- [ ] **Step 4: Run all indicator tests**

```bash
pytest ../tests/test_indicators.py -v
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add backend/pipeline/indicators.py tests/test_indicators.py
git commit -m "feat: indicators — sliding window (SMA/EMA/RSI/MACD) + segment tree (range queries)"
```

---

## Task 5: sentiment.py — TextBlob Scoring

**Files:**
- Create: `backend/pipeline/sentiment.py`
- Create: `tests/test_sentiment.py`

- [ ] **Step 1: Write failing tests**

Create `tests/test_sentiment.py`:

```python
from pipeline.sentiment import analyze_sentiment


def test_positive_headlines_return_bullish():
    headlines = [
        "Company posts record profits beating all estimates",
        "Stock surges to all-time high on strong earnings",
    ]
    result = analyze_sentiment(headlines)
    assert result["sentiment_score"] > 0
    assert result["sentiment_label"] == "Bullish"


def test_negative_headlines_return_bearish():
    headlines = [
        "Company faces massive losses and disappointing results",
        "Stock crashes amid fraud scandal and poor outlook",
    ]
    result = analyze_sentiment(headlines)
    assert result["sentiment_score"] < 0
    assert result["sentiment_label"] == "Bearish"


def test_empty_headlines_return_neutral():
    result = analyze_sentiment([])
    assert result["sentiment_score"] == 0.0
    assert result["sentiment_label"] == "Neutral"
    assert result["headlines"] == []


def test_result_contains_per_headline_scores():
    headlines = ["Great quarterly results", "Market crash feared"]
    result = analyze_sentiment(headlines)
    assert len(result["headlines"]) == 2
    for item in result["headlines"]:
        assert "text" in item
        assert "score" in item
        assert isinstance(item["score"], float)


def test_score_clamped_between_minus_one_and_one():
    headlines = ["good good good wonderful amazing excellent profit"]
    result = analyze_sentiment(headlines)
    assert -1.0 <= result["sentiment_score"] <= 1.0
```

- [ ] **Step 2: Run to verify failure**

```bash
pytest ../tests/test_sentiment.py -v
```

Expected: `ImportError: cannot import name 'analyze_sentiment'`

- [ ] **Step 3: Implement sentiment.py**

Create `backend/pipeline/sentiment.py`:

```python
"""
Sentiment analysis using TextBlob polarity scoring.

Algorithm: For each headline, TextBlob tokenizes the string and scores
each word against a pre-trained lexicon. The final score is the average
polarity across all headlines.

Time complexity: O(L) per headline where L = headline length.
Space complexity: O(H) where H = number of headlines.
"""

from textblob import TextBlob


def analyze_sentiment(headlines: list[str]) -> dict:
    """Score a list of news headlines and return aggregate sentiment.
    
    Returns:
        sentiment_score: float in [-1.0, 1.0]
        sentiment_label: "Bullish" | "Neutral" | "Bearish"
        headlines: list of { text, score } per headline
    """
    if not headlines:
        return {"sentiment_score": 0.0, "sentiment_label": "Neutral", "headlines": []}

    scored = []
    for text in headlines:
        polarity = TextBlob(text).sentiment.polarity
        scored.append({"text": text, "score": round(polarity, 3)})

    avg_score = sum(item["score"] for item in scored) / len(scored)
    avg_score = round(max(-1.0, min(1.0, avg_score)), 3)

    if avg_score > 0.2:
        label = "Bullish"
    elif avg_score < -0.2:
        label = "Bearish"
    else:
        label = "Neutral"

    return {
        "sentiment_score": avg_score,
        "sentiment_label": label,
        "headlines": scored,
    }
```

- [ ] **Step 4: Run tests**

```bash
pytest ../tests/test_sentiment.py -v
```

Expected: All 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add backend/pipeline/sentiment.py tests/test_sentiment.py
git commit -m "feat: sentiment pipeline stage — TextBlob scoring"
```

---

## Task 6: graph.py — BFS Influence Graph

**Files:**
- Create: `backend/pipeline/graph.py`
- Create: `tests/test_graph.py`

- [ ] **Step 1: Write failing tests**

Create `tests/test_graph.py`:

```python
from pipeline.graph import bfs_influence


def test_bfs_returns_direct_neighbours():
    result = bfs_influence("TCS")
    symbols = [s["symbol"] for s in result["influenced_stocks"]]
    assert "INFY" in symbols
    assert "WIPRO" in symbols
    assert "HCLTECH" in symbols


def test_bfs_does_not_include_source_stock():
    result = bfs_influence("TCS")
    symbols = [s["symbol"] for s in result["influenced_stocks"]]
    assert "TCS" not in symbols


def test_bfs_respects_max_depth_1():
    result = bfs_influence("TCS", max_depth=1)
    for s in result["influenced_stocks"]:
        assert s["distance"] == 1


def test_bfs_respects_max_depth_2():
    result = bfs_influence("RELIANCE", max_depth=2)
    for s in result["influenced_stocks"]:
        assert s["distance"] <= 2


def test_bfs_unknown_stock_returns_empty():
    result = bfs_influence("UNKNOWNXYZ")
    assert result["influenced_stocks"] == []
    assert result["bfs_levels"] == []


def test_bfs_levels_structure():
    result = bfs_influence("RELIANCE", max_depth=2)
    assert len(result["bfs_levels"]) >= 1
    # Level 1 stocks should be direct neighbours of RELIANCE
    level_1 = result["bfs_levels"][0]
    assert "JIOFIN" in level_1 or "ONGC" in level_1


def test_bfs_no_duplicates():
    result = bfs_influence("HDFC", max_depth=2)
    symbols = [s["symbol"] for s in result["influenced_stocks"]]
    assert len(symbols) == len(set(symbols))
```

- [ ] **Step 2: Run to verify failure**

```bash
pytest ../tests/test_graph.py -v
```

Expected: `ImportError: cannot import name 'bfs_influence'`

- [ ] **Step 3: Implement graph.py**

Create `backend/pipeline/graph.py`:

```python
"""
Stock Influence Graph using BFS traversal.

Nodes = NSE stock symbols.
Edges = sector/conglomerate relationships (pre-defined adjacency list).

BFS is chosen over DFS for influence propagation because BFS explores
all stocks at distance 1 before distance 2, mirroring how news actually
spreads in markets (immediate sector peers are impacted first).

Time complexity: O(V + E) where V = vertices visited, E = edges traversed.
Space complexity: O(V) for the visited set and BFS queue.
"""

from collections import deque

# Undirected adjacency list — sector and conglomerate relationships
STOCK_GRAPH: dict[str, list[str]] = {
    # Reliance group
    "RELIANCE":   ["JIOFIN", "ONGC", "BPCL"],
    "JIOFIN":     ["RELIANCE", "AIRTEL"],
    "ONGC":       ["RELIANCE", "BPCL"],
    "BPCL":       ["ONGC", "RELIANCE"],
    # Telecom
    "AIRTEL":     ["JIOFIN"],
    # IT sector
    "TCS":        ["INFY", "WIPRO", "HCLTECH"],
    "INFY":       ["TCS", "WIPRO", "HCLTECH"],
    "WIPRO":      ["TCS", "INFY"],
    "HCLTECH":    ["TCS", "INFY"],
    # Banking
    "HDFCBANK":   ["HDFC", "HDFCLIFE", "ICICIBANK"],
    "HDFC":       ["HDFCBANK", "HDFCLIFE"],
    "HDFCLIFE":   ["HDFC", "HDFCBANK"],
    "ICICIBANK":  ["HDFCBANK", "AXISBANK"],
    "AXISBANK":   ["ICICIBANK"],
    # Tata group
    "TATAMOTORS": ["TATASTEEL", "TATAPOWER", "TCS"],
    "TATASTEEL":  ["TATAMOTORS", "TATAPOWER"],
    "TATAPOWER":  ["TATAMOTORS", "TATASTEEL"],
    # Pharma
    "SUNPHARMA":  ["DRREDDY", "CIPLA"],
    "DRREDDY":    ["SUNPHARMA", "CIPLA"],
    "CIPLA":      ["SUNPHARMA", "DRREDDY"],
}


def bfs_influence(symbol: str, max_depth: int = 2) -> dict:
    """BFS traversal from symbol to find influenced stocks within max_depth hops.
    
    Args:
        symbol: NSE stock symbol (case-insensitive)
        max_depth: maximum BFS depth (default 2)
    
    Returns:
        influenced_stocks: list of { symbol, distance }
        bfs_levels: list of lists, each inner list = stocks at that BFS depth
    """
    symbol = symbol.upper()

    if symbol not in STOCK_GRAPH:
        return {"influenced_stocks": [], "bfs_levels": []}

    visited: set[str] = {symbol}
    queue: deque[tuple[str, int]] = deque([(symbol, 0)])
    influenced: list[dict] = []
    levels: list[list[str]] = [[] for _ in range(max_depth + 1)]

    while queue:
        node, depth = queue.popleft()

        if depth > 0:
            levels[depth].append(node)
            influenced.append({"symbol": node, "distance": depth})

        if depth < max_depth:
            for neighbour in STOCK_GRAPH.get(node, []):
                if neighbour not in visited:
                    visited.add(neighbour)
                    queue.append((neighbour, depth + 1))

    return {
        "influenced_stocks": influenced,
        "bfs_levels": [lvl for lvl in levels if lvl],
    }
```

- [ ] **Step 4: Run tests**

```bash
pytest ../tests/test_graph.py -v
```

Expected: All 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add backend/pipeline/graph.py tests/test_graph.py
git commit -m "feat: influence graph — BFS O(V+E) over NSE sector relationships"
```

---

## Task 7: decision.py — Greedy Rule Engine

**Files:**
- Create: `backend/pipeline/decision.py`
- Create: `tests/test_decision.py`

- [ ] **Step 1: Write failing tests**

Create `tests/test_decision.py`:

```python
from pipeline.decision import decide


def _make_indicators(rsi=50, macd=0, macd_signal=0, sma20=200, sma50=200,
                     current_price=200, high_52w=300, low_52w=100):
    return {
        "rsi": rsi, "macd": macd, "macd_signal": macd_signal,
        "sma20": sma20, "sma50": sma50, "current_price": current_price,
        "high_52w": high_52w, "low_52w": low_52w,
    }


def _make_sentiment(score=0.0):
    return {"sentiment_score": score}


def test_strong_buy_signal():
    indicators = _make_indicators(rsi=30, macd=5, macd_signal=3,
                                  sma20=200, sma50=190, current_price=105,
                                  high_52w=200, low_52w=100)
    result = decide(indicators, _make_sentiment(0.5), {})
    assert result["recommendation"] == "BUY"


def test_strong_sell_signal():
    indicators = _make_indicators(rsi=75, macd=-5, macd_signal=3,
                                  sma20=180, sma50=200, current_price=193,
                                  high_52w=200, low_52w=100)
    result = decide(indicators, _make_sentiment(-0.5), {})
    assert result["recommendation"] == "SELL"


def test_buy_targets_are_above_entry():
    indicators = _make_indicators(rsi=30, macd=5, macd_signal=2,
                                  sma20=210, sma50=200, current_price=105,
                                  high_52w=200, low_52w=100)
    result = decide(indicators, _make_sentiment(0.4), {})
    assert result["target"] > result["entry"]
    assert result["stop_loss"] < result["entry"]


def test_sell_targets_are_below_entry():
    indicators = _make_indicators(rsi=75, macd=-5, macd_signal=2,
                                  sma20=180, sma50=200, current_price=193,
                                  high_52w=200, low_52w=100)
    result = decide(indicators, _make_sentiment(-0.4), {})
    assert result["target"] < result["entry"]
    assert result["stop_loss"] > result["entry"]


def test_result_has_required_keys():
    result = decide(_make_indicators(), _make_sentiment(), {})
    for key in ["recommendation", "entry", "target", "stop_loss",
                "risk_score", "total_score", "signals"]:
        assert key in result


def test_signals_list_is_non_empty():
    result = decide(_make_indicators(rsi=30), _make_sentiment(), {})
    assert len(result["signals"]) > 0
    for sig in result["signals"]:
        assert "rule" in sig and "value" in sig and "score" in sig


def test_risk_score_values():
    result = decide(_make_indicators(), _make_sentiment(), {})
    assert result["risk_score"] in ("Low", "Medium", "High")
```

- [ ] **Step 2: Run to verify failure**

```bash
pytest ../tests/test_decision.py -v
```

Expected: `ImportError: cannot import name 'decide'`

- [ ] **Step 3: Implement decision.py**

Create `backend/pipeline/decision.py`:

```python
"""
Greedy Decision Engine.

Each indicator signal is evaluated as a locally optimal scoring rule.
The greedy choice property holds because each rule is based on well-established
technical analysis thresholds — applying all passing rules maximises the 
signal accuracy of the final recommendation.

Time complexity: O(1) — constant number of rules evaluated.
Space complexity: O(1)
"""


def decide(indicators: dict, sentiment: dict, influence: dict) -> dict:
    """Apply greedy scoring rules to produce BUY/SELL/HOLD recommendation.
    
    Args:
        indicators: output of compute_indicators()
        sentiment:  output of analyze_sentiment()
        influence:  output of bfs_influence() — reserved for future use
    
    Returns:
        recommendation, entry, target, stop_loss, risk_score, total_score, signals
    """
    score = 0
    signals = []

    # Rule 1: RSI — oversold/overbought
    rsi_val = indicators["rsi"]
    if rsi_val < 35:
        score += 2
        signals.append({"rule": "RSI oversold (<35)", "value": round(rsi_val, 2), "score": 2})
    elif rsi_val > 70:
        score -= 2
        signals.append({"rule": "RSI overbought (>70)", "value": round(rsi_val, 2), "score": -2})

    # Rule 2: MACD crossover
    macd_val = indicators["macd"]
    macd_sig = indicators["macd_signal"]
    if macd_val > macd_sig:
        score += 2
        signals.append({"rule": "MACD bullish crossover", "value": round(macd_val, 4), "score": 2})
    else:
        score -= 2
        signals.append({"rule": "MACD bearish", "value": round(macd_val, 4), "score": -2})

    # Rule 3: Price vs 52-week extremes (Segment Tree output)
    current = indicators["current_price"]
    low_52w = indicators["low_52w"]
    high_52w = indicators["high_52w"]

    if current <= low_52w * 1.05:
        score += 2
        signals.append({"rule": "Near 52W low (Segment Tree)", "value": round(current, 2), "score": 2})
    if current >= high_52w * 0.95:
        score -= 1
        signals.append({"rule": "Near 52W high (Segment Tree)", "value": round(current, 2), "score": -1})

    # Rule 4: SMA trend direction
    sma20 = indicators["sma20"]
    sma50 = indicators["sma50"]
    if sma20 > sma50:
        score += 1
        signals.append({"rule": "SMA20 > SMA50 (uptrend)", "value": round(sma20, 2), "score": 1})
    else:
        score -= 1
        signals.append({"rule": "SMA20 < SMA50 (downtrend)", "value": round(sma20, 2), "score": -1})

    # Rule 5: News sentiment
    sent = sentiment.get("sentiment_score", 0.0)
    if sent > 0.2:
        score += 1
        signals.append({"rule": "Positive news sentiment", "value": round(sent, 3), "score": 1})
    elif sent < -0.2:
        score -= 1
        signals.append({"rule": "Negative news sentiment", "value": round(sent, 3), "score": -1})

    # Decision threshold
    if score >= 4:
        recommendation = "BUY"
    elif score <= -3:
        recommendation = "SELL"
    else:
        recommendation = "HOLD"

    # Price targets
    entry = round(current, 2)
    if recommendation == "BUY":
        target = round(entry * 1.10, 2)
        stop_loss = round(entry * 0.97, 2)
    elif recommendation == "SELL":
        target = round(entry * 0.90, 2)
        stop_loss = round(entry * 1.03, 2)
    else:
        target = round(entry * 1.05, 2)
        stop_loss = round(entry * 0.97, 2)

    # Risk score
    if score >= 6:
        risk = "Low"
    elif score >= 2:
        risk = "Medium"
    else:
        risk = "High"

    return {
        "recommendation": recommendation,
        "entry": entry,
        "target": target,
        "stop_loss": stop_loss,
        "risk_score": risk,
        "total_score": score,
        "signals": signals,
    }
```

- [ ] **Step 4: Run tests**

```bash
pytest ../tests/test_decision.py -v
```

Expected: All 7 tests pass.

- [ ] **Step 5: Run full test suite**

```bash
pytest ../tests/ -v
```

Expected: All tests pass across all modules.

- [ ] **Step 6: Commit**

```bash
git add backend/pipeline/decision.py tests/test_decision.py
git commit -m "feat: greedy decision engine — BUY/SELL/HOLD with price targets"
```

---

## Task 8: main.py — FastAPI App + Pipeline Wiring

**Files:**
- Create: `backend/main.py`

- [ ] **Step 1: Create main.py**

Create `backend/main.py`:

```python
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from pipeline.fetch import fetch_stock_data, fetch_news
from pipeline.indicators import compute_indicators
from pipeline.sentiment import analyze_sentiment
from pipeline.graph import bfs_influence
from pipeline.decision import decide

load_dotenv()

app = FastAPI(title="StockSense API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    symbol: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    """Run the full 5-stage DAA pipeline for a given NSE stock symbol."""
    symbol = req.symbol.strip().upper()

    # Stage 1: Fetch
    try:
        stock_data = fetch_stock_data(symbol)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    headlines = fetch_news(symbol)

    # Stage 2: Indicators (Sliding Window + Segment Tree)
    indicators = compute_indicators(stock_data)

    # Stage 3: Sentiment (TextBlob)
    sentiment = analyze_sentiment(headlines)

    # Stage 4: Influence Graph (BFS)
    influence = bfs_influence(symbol)

    # Stage 5: Decision Engine (Greedy)
    decision = decide(indicators, sentiment, influence)

    return {
        "symbol": symbol,
        "current_price": stock_data["current_price"],
        "prices": stock_data["closes"][-60:],
        "dates": stock_data["dates"][-60:],
        **decision,
        "indicators": indicators,
        "sentiment": sentiment,
        "influence": influence,
    }
```

- [ ] **Step 2: Start the server and verify /health**

Run from `backend/` with venv active:
```bash
uvicorn main:app --reload --port 8000
```

In a new terminal:
```bash
curl http://localhost:8000/health
```

Expected: `{"status":"ok"}`

- [ ] **Step 3: Test /analyze with a real NSE symbol**

```bash
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d "{\"symbol\": \"TCS\"}"
```

Expected: JSON response with `recommendation`, `entry`, `target`, `stop_loss`, `indicators`, `sentiment`, `influence` keys. No 500 errors.

- [ ] **Step 4: Commit**

```bash
git add backend/main.py
git commit -m "feat: FastAPI app — /health and /analyze endpoints wiring full pipeline"
```

---

## Task 9: React Frontend — Scaffold + API Client

**Files:**
- Create: `frontend/` (via Vite)
- Create: `frontend/src/api/analyze.js`
- Create: `frontend/src/App.jsx`
- Create: `frontend/src/pages/Home.jsx`
- Create: `frontend/src/components/SearchBar.jsx`
- Create: `frontend/.env.local`

- [ ] **Step 1: Scaffold Vite React project**

Run from `C:\PROJECTS\DAA_stock\`:
```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm install recharts axios
```

- [ ] **Step 2: Create frontend/.env.local**

```
VITE_API_URL=http://localhost:8000
```

- [ ] **Step 3: Create frontend/src/api/analyze.js**

```js
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export async function analyzeStock(symbol) {
  const response = await axios.post(`${API_URL}/analyze`, { symbol })
  return response.data
}
```

- [ ] **Step 4: Replace frontend/src/App.jsx**

```jsx
import Home from './pages/Home'

function App() {
  return <Home />
}

export default App
```

- [ ] **Step 5: Create frontend/src/components/SearchBar.jsx**

```jsx
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
```

- [ ] **Step 6: Create frontend/src/pages/Home.jsx (tab shell only)**

```jsx
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

          {/* Components added in subsequent tasks */}
          {activeTab === 'Overview' && <div style={{ color: '#6b7280' }}>Overview coming in next task...</div>}
          {activeTab === 'Indicators' && <div style={{ color: '#6b7280' }}>Indicators coming soon...</div>}
          {activeTab === 'News' && <div style={{ color: '#6b7280' }}>News coming soon...</div>}
          {activeTab === 'Influence' && <div style={{ color: '#6b7280' }}>Influence graph coming soon...</div>}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 7: Start frontend and verify it loads**

```bash
cd frontend
npm run dev
```

Open http://localhost:5173. Expected: Search bar renders, no console errors. Typing a symbol and clicking Analyze should hit the backend (keep backend running on port 8000) and show "Overview coming in next task..." after loading.

- [ ] **Step 8: Commit**

```bash
git add frontend/
git commit -m "feat: React frontend scaffold — search bar, tab shell, API client"
```

---

## Task 10: RecommendationCard + PriceChart (Overview Tab)

**Files:**
- Create: `frontend/src/components/RecommendationCard.jsx`
- Create: `frontend/src/components/PriceChart.jsx`
- Modify: `frontend/src/pages/Home.jsx`

- [ ] **Step 1: Create RecommendationCard.jsx**

```jsx
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
```

- [ ] **Step 2: Create PriceChart.jsx**

```jsx
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function PriceChart({ prices, dates, symbol }) {
  const data = prices.map((price, i) => ({
    date: dates[i]?.slice(5) ?? '',
    price: Math.round(price * 100) / 100,
  }))

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: '1.25rem' }}>
      <div style={{ fontWeight: 700, marginBottom: '0.75rem', color: '#111827' }}>
        {symbol} — 60-Day Close Price
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={9} />
          <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} width={65} />
          <Tooltip formatter={(v) => [`₹${v}`, 'Price']} />
          <Line type="monotone" dataKey="price" stroke="#6366f1" dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 3: Wire Overview tab in Home.jsx**

Replace the Overview tab placeholder in `frontend/src/pages/Home.jsx`. Add imports at the top of the file:

```jsx
import RecommendationCard from '../components/RecommendationCard'
import PriceChart from '../components/PriceChart'
```

Replace the Overview tab rendering block:

```jsx
{activeTab === 'Overview' && (
  <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem' }}>
    <RecommendationCard result={result} />
    <PriceChart prices={result.prices} dates={result.dates} symbol={result.symbol} />
  </div>
)}
```

- [ ] **Step 4: Verify in browser**

Open http://localhost:5173, search "RELIANCE", click Analyze. Expected: Overview tab shows BUY/SELL/HOLD card on the left and a price line chart on the right.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/RecommendationCard.jsx frontend/src/components/PriceChart.jsx frontend/src/pages/Home.jsx
git commit -m "feat: Overview tab — RecommendationCard + PriceChart"
```

---

## Task 11: IndicatorsPanel (Indicators Tab)

**Files:**
- Create: `frontend/src/components/IndicatorsPanel.jsx`
- Modify: `frontend/src/pages/Home.jsx`

- [ ] **Step 1: Create IndicatorsPanel.jsx**

```jsx
const th = { padding: '0.65rem 1rem', textAlign: 'left', fontSize: '0.78rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }
const td = { padding: '0.6rem 1rem', fontSize: '0.875rem' }

export default function IndicatorsPanel({ indicators }) {
  const { rsi, macd, macd_signal, sma20, sma50, high_30d, low_30d, high_52w, low_52w } = indicators

  const rows = [
    { label: 'RSI (14)',       value: rsi,          signal: rsi < 35 ? '🟢 Oversold' : rsi > 70 ? '🔴 Overbought' : '🟡 Neutral', algo: 'Sliding Window · O(n)' },
    { label: 'MACD',           value: macd,          signal: macd > macd_signal ? '🟢 Bullish crossover' : '🔴 Bearish', algo: 'Sliding Window · O(n)' },
    { label: 'MACD Signal',    value: macd_signal,   signal: '', algo: 'Sliding Window · O(n)' },
    { label: 'SMA (20)',       value: `₹${sma20}`,   signal: sma20 > sma50 ? '🟢 Above SMA50' : '🔴 Below SMA50', algo: 'Sliding Window · O(n)' },
    { label: 'SMA (50)',       value: `₹${sma50}`,   signal: '', algo: 'Sliding Window · O(n)' },
    { label: '30-Day High',    value: `₹${high_30d}`, signal: '', algo: 'Segment Tree · O(log n)' },
    { label: '30-Day Low',     value: `₹${low_30d}`,  signal: '', algo: 'Segment Tree · O(log n)' },
    { label: '52-Week High',   value: `₹${high_52w}`, signal: '', algo: 'Segment Tree · O(log n)' },
    { label: '52-Week Low',    value: `₹${low_52w}`,  signal: '', algo: 'Segment Tree · O(log n)' },
  ]

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ background: '#f9fafb' }}>
          <tr>
            <th style={th}>Indicator</th>
            <th style={th}>Value</th>
            <th style={th}>Signal</th>
            <th style={{ ...th, color: '#6366f1' }}>Algorithm</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderTop: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
              <td style={td}>{r.label}</td>
              <td style={{ ...td, fontWeight: 700 }}>{r.value}</td>
              <td style={td}>{r.signal}</td>
              <td style={{ ...td, color: '#6366f1', fontSize: '0.75rem' }}>{r.algo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Wire Indicators tab in Home.jsx**

Add import at top of `Home.jsx`:
```jsx
import IndicatorsPanel from '../components/IndicatorsPanel'
```

Replace the Indicators tab placeholder:
```jsx
{activeTab === 'Indicators' && <IndicatorsPanel indicators={result.indicators} />}
```

- [ ] **Step 3: Verify in browser — search any stock, click Indicators tab**

Expected: Table shows RSI, MACD, SMA values with signal interpretation and algorithm name in purple.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/IndicatorsPanel.jsx frontend/src/pages/Home.jsx
git commit -m "feat: Indicators tab — sliding window + segment tree results"
```

---

## Task 12: SentimentPanel (News Tab)

**Files:**
- Create: `frontend/src/components/SentimentPanel.jsx`
- Modify: `frontend/src/pages/Home.jsx`

- [ ] **Step 1: Create SentimentPanel.jsx**

```jsx
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

      {/* Score bar */}
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
```

- [ ] **Step 2: Wire News tab in Home.jsx**

Add import:
```jsx
import SentimentPanel from '../components/SentimentPanel'
```

Replace placeholder:
```jsx
{activeTab === 'News' && <SentimentPanel sentiment={result.sentiment} />}
```

- [ ] **Step 3: Verify in browser**

Expected: News tab shows Bullish/Bearish/Neutral label, score bar, and per-headline polarity scores.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/SentimentPanel.jsx frontend/src/pages/Home.jsx
git commit -m "feat: News tab — TextBlob sentiment panel with per-headline scores"
```

---

## Task 13: InfluenceGraph (Influence Tab)

**Files:**
- Create: `frontend/src/components/InfluenceGraph.jsx`
- Modify: `frontend/src/pages/Home.jsx`

- [ ] **Step 1: Create InfluenceGraph.jsx**

```jsx
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
          {/* Visual BFS tree */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem', padding: '1rem', background: '#f9fafb', borderRadius: 8 }}>
            <Node label={symbol} primary />
            {bfs_levels.map((level, li) => (
              <div key={li} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ color: '#d1d5db', fontSize: '1.2rem' }}>→</span>
                {level.map(s => <Node key={s} label={s} primary={false} />)}
              </div>
            ))}
          </div>

          {/* Table */}
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
```

- [ ] **Step 2: Wire Influence tab in Home.jsx**

Add import:
```jsx
import InfluenceGraph from '../components/InfluenceGraph'
```

Replace placeholder:
```jsx
{activeTab === 'Influence' && <InfluenceGraph influence={result.influence} symbol={result.symbol} />}
```

- [ ] **Step 3: Verify in browser**

Search "RELIANCE". Click Influence tab. Expected: Purple RELIANCE node → arrows to JIOFIN, ONGC, BPCL (depth 1), then further nodes at depth 2. Table below shows BFS distances.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/InfluenceGraph.jsx frontend/src/pages/Home.jsx
git commit -m "feat: Influence tab — BFS stock influence graph visualization"
```

---

## Task 14: Deploy to Render + Vercel

**Files:**
- Create: `backend/render.yaml` (optional but helpful)

- [ ] **Step 1: Push to GitHub**

```bash
git remote add origin https://github.com/<your-username>/DAA_stock.git
git push -u origin master
```

- [ ] **Step 2: Deploy backend to Render**

1. Go to https://render.com → New → Web Service
2. Connect your GitHub repo
3. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt && python -m textblob.download_corpora`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Environment Variables:** Add `NEWSAPI_KEY = <your_key>`
4. Click Deploy. Wait ~3 minutes.
5. Copy the service URL — looks like `https://daa-stock.onrender.com`

- [ ] **Step 3: Test deployed backend**

```bash
curl https://daa-stock.onrender.com/health
```

Expected: `{"status":"ok"}`

- [ ] **Step 4: Update frontend to use deployed backend**

Create `frontend/.env.production`:
```
VITE_API_URL=https://daa-stock.onrender.com
```

Commit:
```bash
git add frontend/.env.production
git commit -m "config: set production API URL for Vercel deploy"
git push
```

- [ ] **Step 5: Deploy frontend to Vercel**

1. Go to https://vercel.com → New Project → Import from GitHub
2. Settings:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `dist` (auto-detected)
3. Click Deploy. Wait ~1 minute.
4. Copy the Vercel URL — looks like `https://daa-stock.vercel.app`

- [ ] **Step 6: Test full end-to-end**

Open the Vercel URL in browser. Search "TCS". Expected: Full analysis loads — recommendation card, price chart, indicators, news sentiment, influence graph all populated.

- [ ] **Step 7: Final commit**

```bash
git add .
git commit -m "feat: MVP complete — full DAA stock analyzer deployed"
git push
```

---

## Quick Reference — All Algorithms for DAA Report

| Algorithm | File | Time Complexity | Space Complexity | Justification vs Alternative |
|---|---|---|---|---|
| Sliding Window | `indicators.py` | O(n) | O(k) | vs naive O(n·k) sum recalculation |
| Segment Tree | `indicators.py` | O(n) build, O(log n) query | O(n) | vs O(n) per query linear scan |
| TextBlob String Scoring | `sentiment.py` | O(L) per headline | O(H) | vs manual regex: O(P·L) for P patterns |
| BFS (Graph traversal) | `graph.py` | O(V+E) | O(V) | vs DFS: BFS gives level-order = natural news spread |
| Greedy Rule Aggregation | `decision.py` | O(1) | O(1) | vs DP/exhaustive: greedy choice property holds for independent signals |
