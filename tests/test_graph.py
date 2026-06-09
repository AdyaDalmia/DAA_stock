from pipeline.graph import bfs_influence


def test_bfs_returns_direct_neighbours():
    result = bfs_influence("TCS")
    symbols = [s["symbol"] for s in result["influenced_stocks"]]
    assert "INFY" in symbols
    assert "WIPRO" in symbols
    assert "HCLTECH" in symbols


def test_bfs_does_not_include_source_stock():
    result = bfs_influence("TCS")
    symbols = [s["symbol"] for s in result["influenced_stocks"]]
    assert "TCS" not in symbols


def test_bfs_respects_max_depth_1():
    result = bfs_influence("TCS", max_depth=1)
    for s in result["influenced_stocks"]:
        assert s["distance"] == 1


def test_bfs_respects_max_depth_2():
    result = bfs_influence("RELIANCE", max_depth=2)
    for s in result["influenced_stocks"]:
        assert s["distance"] <= 2


def test_bfs_unknown_stock_returns_empty():
    result = bfs_influence("UNKNOWNXYZ")
    assert result["influenced_stocks"] == []
    assert result["bfs_levels"] == []


def test_bfs_levels_structure():
    result = bfs_influence("RELIANCE", max_depth=2)
    assert len(result["bfs_levels"]) >= 1
    # Level 1 stocks should be direct neighbours of RELIANCE
    level_1 = result["bfs_levels"][0]
    assert "JIOFIN" in level_1 or "ONGC" in level_1


def test_bfs_no_duplicates():
    result = bfs_influence("HDFC", max_depth=2)
    symbols = [s["symbol"] for s in result["influenced_stocks"]]
    assert len(symbols) == len(set(symbols))
