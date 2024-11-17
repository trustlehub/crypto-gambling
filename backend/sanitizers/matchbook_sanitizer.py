from datetime import datetime, timezone
from typing import List

from db import Market, Outcome, Event, Provider
from models.matchbook import MatchbookEvent


def matchbook_sanitizer(events: List[MatchbookEvent]) -> tuple[list[Event], Provider]:
    matchbook_provider = Provider(
        name='matchbook',
        is_exchange=True,
        is_bookmaker=False
    )
    event_list =[]
    for event in events:
        markets_list = []
        outcomes_list = []
        for market in event.markets:

            if market.market_type != "money_line":
                continue

            for runner in market.runners:
                for price in runner.prices:
                    db_outcome = Outcome(
                        name=runner.name,
                        meta={
                            'volume': runner.volume,
                        },
                    )
                    outcomes_list.append(db_outcome)
                    markets_list.append(Market(
                        name=market.name,
                        odds=price.decimal_odds,
                        meta={
                            "volume": market.volume,
                            'last_updated': market.last_price_update_time,
                            'withdrawn': market.withdrawn,
                        },
                        outcome=db_outcome 

                    ))
        event_list.append(
            Event(
                name=event.name,
                last_updated=str(datetime.now(timezone.utc)),
                start_time=event.start,
                providers=[matchbook_provider, ],
                outcomes=outcomes_list,
                markets=markets_list,
                matched=False
            )
        ) 
        return event_list, matchbook_provider
