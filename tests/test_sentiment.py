from pipeline.sentiment import analyze_sentiment


def test_positive_headlines_return_bullish():
    headlines = [
        "Excellent fantastic profits — best results ever",
        "Outstanding earnings, wonderful performance, strong growth",
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
