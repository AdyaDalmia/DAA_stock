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
