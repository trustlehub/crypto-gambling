import logging
from datetime import datetime, timezone
from typing import List

from db import Market, Outcome, Event, Provider
from log import setup_logger
from models.matchbook import MatchbookEvent


lg = setup_logger("matchbook_sanitizer",'/logs/matchbook_sanitizer.log', logging.DEBUG )
def matchbook_sanitizer(events: List[MatchbookEvent], db) -> tuple[list[Event], Provider]:
    event_list = []
    for event in events:

        matchbook_provider = Provider(
            name='matchbook',
            is_exchange=True,
            is_bookmaker=False
        )
        markets_list = []
        outcomes_list = []
        for market in event.markets:

            if market.market_type != "money_line":
                continue

            for runner in market.runners:
                # Runners are the team names (outcomes) in matchbook
                for price in runner.prices:
                    # Prices are the lay bets placed by other users
                    db_outcome = Outcome(
                        name=runner.name,
                        meta={
                            matchbook_provider.name: {
                                'volume': runner.volume,
                            }
                        },
                        provider=matchbook_provider,
                    )
                    outcomes_list.append(db_outcome)
                    markets_list.append(Market(
                        name=market.name,
                        odds=price.decimal_odds,
                        meta={
                            matchbook_provider.name: {
                                "volume": market.volume,
                                'last_updated': runner.last_price_update_time,
                                'withdrawn': (market.withdrawn if hasattr(market, 'withdrawn') else None),
                                'maxStake': price.available_amount,
                                'currency': price.currency
                            }
                        },
                        outcome=db_outcome

                    ))
        if len(outcomes_list) > 0 and len(markets_list) > 0:
            event = Event(
                name=event.name,
                last_updated=str(datetime.now(timezone.utc)),
                start_time=event.start,
                providers=[matchbook_provider, ],
                outcomes=outcomes_list,
                markets=markets_list,
                matched=False,
            )
            db.add(event)
            db.commit()
            lg.info(f"Adding {event.name}...")
            lg.info(f"outcomes: {outcomes_list}")
            lg.info(f"providers: {matchbook_provider}")
            lg.info(f"\n"*5)
            event_list.append(
                event
            )

    return event_list, matchbook_provider
