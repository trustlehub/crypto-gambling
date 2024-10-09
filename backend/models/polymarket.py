from typing import List, Optional

from pydantic import BaseModel, RootModel


# PolymarketOdds Pydantic model
class PolymarketOdds(BaseModel):
    clobTokenIds: str
    id: str
    outcomes: str
    outcomePrices: str
    volumeNum: Optional[float] = None
    enableOrderBook: bool
    gameStartTime: Optional[str] = None
    question: str
    slug: str
    bestAsk: float
    orderMinSize: float
    volume: Optional[str] = None
    conditionId: str

    def __hash__(self):
        return hash(self.id)


class PolymarketResponse(RootModel):
    root: List[PolymarketOdds]


class CleanedPolymarketOdds(BaseModel):
    id: str
    outcomes: List[str]
    outcomePrices: List[str]
    volumeNum: float
    enableOrderBook: bool
    gameStartTime: str | None
    question: str
    slug: str
    bestAsk: float
    orderMinSize: float
    volume: str
    conditionId: str
    clobTokenIds: List[str]
