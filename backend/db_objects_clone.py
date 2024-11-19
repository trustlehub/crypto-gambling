import json
from typing import Optional, List, Dict, Union

class PrintableBase:
    def to_dict(self) -> Dict[str, any]:
        return self.__dict__

    def __repr__(self) -> str:
        return json.dumps(self.to_dict(), indent=4)


class Provider(PrintableBase):
    def __init__(
            self,
            name: str,
            is_exchange: bool,
            is_bookmaker: bool,
            meta: Optional[Dict[str, any]] = None,
            event_id: Optional[int] = None,
    ) -> None:
        self.name: str = name
        self.is_exchange: bool = is_exchange
        self.is_bookmaker: bool = is_bookmaker
        self.meta: Optional[Dict[str, any]] = meta
        self.event_id: Optional[int] = event_id
        self.events: Optional[Event] = None


class Outcome(PrintableBase):
    def __init__(
            self,
            name: str,
            verbose_name: Optional[str],
            is_home: Optional[bool],
            is_away: Optional[bool],
            meta: Optional[Dict[str, any]] = None,
    ) -> None:
        self.name: str = name
        self.verbose_name: Optional[str] = verbose_name
        self.is_home: Optional[bool] = is_home
        self.is_away: Optional[bool] = is_away
        self.meta: Optional[Dict[str, any]] = meta
        self.provider: Optional[Provider] = None
        self.event: Optional[Event] = None
        self.market: Optional[Market] = None
        self.matched_outcome: Optional[MatchedOutcome] = None


class Market(PrintableBase):
    def __init__(
            self,
            odds: float,
            name: str,
            meta: Optional[Dict[str, any]] = None,
    ) -> None:
        self.odds: float = odds
        self.name: str = name
        self.meta: Optional[Dict[str, any]] = meta
        self.outcome: Optional[Outcome] = None
        self.event: Optional[Event] = None


class Event(PrintableBase):
    def __init__(
            self,
            name: str,
            start_time: str,
            last_updated: str,
            competition: Optional[str],
            meta: Optional[Dict[str, Union[str, int, float, bool]]] = None,
    ) -> None:
        self.name: str = name
        self.start_time: str = start_time
        self.last_updated: str = last_updated
        self.competition: Optional[str] = competition
        self.meta: Optional[Dict[str, Union[str, int, float, bool]]] = meta
        self.providers: List[Provider] = []
        self.markets: List[Market] = []
        self.outcomes: List[Outcome] = []


class MatchedOutcome(PrintableBase):
    def __init__(self) -> None:
        self.outcomes: List[Outcome] = []
