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
