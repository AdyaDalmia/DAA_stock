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
