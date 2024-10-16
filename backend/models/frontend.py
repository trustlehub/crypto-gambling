from typing import Optional

from pydantic import BaseModel


class OddsCleaned(BaseModel):
    event: str
    time: str
    bet_team: str
    bookmaker: str
    exchange: str
    odds: float
    lay: float
    lay_outcome_id: int
    back_outcome_id: int
    avail: float
    home_team: str
    away_team: str
    odds_last_update: str
    lay_last_update: str
    rating: str
    maxLay: str
    meta: Optional[dict] = None
    lay_as_back: bool
