from enum import Enum
from typing import List, Dict, Union, Optional
from pydantic import BaseModel, constr, RootModel


# Define your enums
class SideEnum(str, Enum):
    BACK = 'BACK'
    LAY = 'LAY'

class StatusEnum(str, Enum):
    SELECTION_DISABLED = 'SELECTION_DISABLED'
    SELECTION_ENABLED = 'SELECTION_ENABLED'
    
    
class CloudbetTeam(BaseModel):
    name: str
    key: str
    abbreviation: str
    nationality: str

class CloudbetSelection(BaseModel):
    outcome: str
    params: str
    price: float
    minStake: float
    maxStake: float
    side: SideEnum
    status: StatusEnum

class CloudbetSubmarket(BaseModel):
    selections: List[CloudbetSelection]
    sequence: str

class CloudbetMarket(BaseModel):
    submarkets: Dict[str, CloudbetSubmarket]
    
class CloudbetMarkets(RootModel):
    root: Dict[str, CloudbetMarket]

class CloudbetCompetitionWithCategory(BaseModel):
    description: Optional[str] = None
    key: str
    name: str
    
class CloudbetEvent(BaseModel):
    away: CloudbetTeam
    home: CloudbetTeam
    markets: CloudbetMarkets
    name: str
    status: str
    cutoffTime: str
    key: str
    id: int
    competition: Optional[CloudbetCompetitionWithCategory] = None

class CloudbetCompetition(BaseModel):
    events: List[CloudbetEvent]
    name: str
    key: str


