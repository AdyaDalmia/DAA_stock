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
