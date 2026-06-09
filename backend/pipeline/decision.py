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
