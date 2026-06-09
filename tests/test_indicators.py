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


# --- Segment Tree tests ---

from pipeline.indicators import SegmentTree, compute_indicators


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
