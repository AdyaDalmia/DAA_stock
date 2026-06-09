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
