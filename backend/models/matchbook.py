from typing import List

from pydantic import BaseModel, ConfigDict


class UnderscoreAliasModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=lambda field: field.replace('_', '-')
    )


class MatchbookPrice(UnderscoreAliasModel):
    available_amount: float
    currency: str
    decimal_odds: float
    side: str
    odds_type: str
    exchange_type: str


class MatchbookRunner(UnderscoreAliasModel):
    withdrawn: bool
    prices: List[MatchbookPrice]
    last_price_update_time: str
    event_id: int
    id: int
    market_id: int
    name: str
    status: str
    event_participant_id: int


class MatchbookMarket(UnderscoreAliasModel):
    live: bool
    id: int
    event_id: int
    status: str
    market_type: str
    volume: float
    runners: List[MatchbookRunner]


class MatchbookEvent(UnderscoreAliasModel):
    id: int
    name: str
    start: str
    sport_id: int
    status: str  # prolly an enum. figure it out
    volume: float
    markets: List[MatchbookMarket]


class MatchbookEvents(UnderscoreAliasModel):
    offset: int
    events: List[MatchbookEvent]
    per_page: int
    total: int
