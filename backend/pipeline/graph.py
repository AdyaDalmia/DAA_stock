"""
Stock Influence Graph using BFS traversal.

Nodes = NSE stock symbols.
Edges = sector/conglomerate relationships (pre-defined adjacency list).

BFS is chosen over DFS for influence propagation because BFS explores
all stocks at distance 1 before distance 2, mirroring how news actually
spreads in markets (immediate sector peers are impacted first).

Time complexity: O(V + E) where V = vertices visited, E = edges traversed.
Space complexity: O(V) for the visited set and BFS queue.
"""

from collections import deque

# Undirected adjacency list — sector and conglomerate relationships
STOCK_GRAPH: dict[str, list[str]] = {
    # Reliance group
    "RELIANCE":   ["JIOFIN", "ONGC", "BPCL"],
    "JIOFIN":     ["RELIANCE", "AIRTEL"],
    "ONGC":       ["RELIANCE", "BPCL"],
    "BPCL":       ["ONGC", "RELIANCE"],
    # Telecom
    "AIRTEL":     ["JIOFIN"],
    # IT sector
    "TCS":        ["INFY", "WIPRO", "HCLTECH"],
    "INFY":       ["TCS", "WIPRO", "HCLTECH"],
    "WIPRO":      ["TCS", "INFY"],
    "HCLTECH":    ["TCS", "INFY"],
    # Banking
    "HDFCBANK":   ["HDFC", "HDFCLIFE", "ICICIBANK"],
    "HDFC":       ["HDFCBANK", "HDFCLIFE"],
    "HDFCLIFE":   ["HDFC", "HDFCBANK"],
    "ICICIBANK":  ["HDFCBANK", "AXISBANK"],
    "AXISBANK":   ["ICICIBANK"],
    # Tata group
    "TATAMOTORS": ["TATASTEEL", "TATAPOWER", "TCS"],
    "TATASTEEL":  ["TATAMOTORS", "TATAPOWER"],
    "TATAPOWER":  ["TATAMOTORS", "TATASTEEL"],
    # Pharma
    "SUNPHARMA":  ["DRREDDY", "CIPLA"],
    "DRREDDY":    ["SUNPHARMA", "CIPLA"],
    "CIPLA":      ["SUNPHARMA", "DRREDDY"],
}


def bfs_influence(symbol: str, max_depth: int = 2) -> dict:
    """BFS traversal from symbol to find influenced stocks within max_depth hops.

    Args:
        symbol: NSE stock symbol (case-insensitive)
        max_depth: maximum BFS depth (default 2)

    Returns:
        influenced_stocks: list of { symbol, distance }
        bfs_levels: list of lists, each inner list = stocks at that BFS depth
    """
    symbol = symbol.upper()

    if symbol not in STOCK_GRAPH:
        return {"influenced_stocks": [], "bfs_levels": []}

    visited: set[str] = {symbol}
    queue: deque[tuple[str, int]] = deque([(symbol, 0)])
    influenced: list[dict] = []
    levels: list[list[str]] = [[] for _ in range(max_depth + 1)]

    while queue:
        node, depth = queue.popleft()

        if depth > 0:
            levels[depth].append(node)
            influenced.append({"symbol": node, "distance": depth})

        if depth < max_depth:
            for neighbour in STOCK_GRAPH.get(node, []):
                if neighbour not in visited:
                    visited.add(neighbour)
                    queue.append((neighbour, depth + 1))

    return {
        "influenced_stocks": influenced,
        "bfs_levels": [lvl for lvl in levels if lvl],
    }
