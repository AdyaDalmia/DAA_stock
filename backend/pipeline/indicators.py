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
