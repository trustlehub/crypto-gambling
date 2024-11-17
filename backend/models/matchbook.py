from enum import Enum
from typing import List, Dict, Optional

from pydantic import BaseModel, RootModel

class MatchbookPrice(BaseModel):
    available_amount: float
    currency: str
    decimal_odds: float
    side: str
    odds_type: str
    exchange_type: str
    
    
class MatchbookRunner(BaseModel):
    withdrawn: bool
    prices: List[MatchbookPrice]
    last_price_update_time: str
    event_id: int
    id: int
    market_id: int
    name: str
    status: str
    event_participant_id: int
    
class MatchbookMarket(BaseModel):
    live: bool
    id: int
    event_id: int
    status: bool
    market_type: str
    volume: float
    runners: List[MatchbookRunner]
    last_price_update_time: str
    withdrawn: bool

class MatchbookEvent(BaseModel):
    id: int
    name: str
    start: str
    sport_id: int
    status: str # prolly an enum. figure it out
    volume: float
    markets: List[MatchbookMarket]

class MatchbookEvents(BaseModel):
    offset: int
    events: List[MatchbookEvent]
    per_page: int
    total: int
