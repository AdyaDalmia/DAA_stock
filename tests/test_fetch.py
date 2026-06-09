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
    import pipeline.fetch as fetch_module
    monkeypatch.setattr(fetch_module, "NEWSAPI_KEY", "")
    result = fetch_news("RELIANCE")
    assert result == []
