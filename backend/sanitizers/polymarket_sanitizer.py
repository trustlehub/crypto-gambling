import logging
from datetime import datetime, timezone

from db import Provider, Market, Event, Outcome
from log import setup_logger
from models.polymarket import CleanedPolymarketOdds

lg = setup_logger("poly_sanitizer", '/logs/poly_sanitizer.log', logging.DEBUG)


def polymarket_sanitizer(polymarket_data: list[CleanedPolymarketOdds], db) -> tuple[list[Event], Provider]:
    events: list[Event] = []
    for obj in polymarket_data:
        outcomes = []
        markets = []

        polymarketProvider = Provider(
            name='polymarket',
            is_exchange=False,
            is_bookmaker=True
        )
        event_has_team_names_as_outcome = True
        for index, team in enumerate(obj.outcomes):
            if team == "Over" or team == "Under" or team == "Yes" or team == "No":
                event_has_team_names_as_outcome = False
                break

            t = Outcome(
                name=team,
                provider=polymarketProvider,
                meta={
                    polymarketProvider.name: {
                        "clobTokenId": obj.clobTokenIds[index]
                    }
                }
            )
            outcomes.append(t)
            markets.append(
                Market(
                    outcome=t,
                    odds=float('%.3f' % (1 / float(obj.outcomePrices[index]))),
                    name='moneyline',
                    meta={
                        polymarketProvider.name: {
                            "maxStake": obj.volumeNum or 0,
                            "minStake": obj.orderMinSize * float(obj.outcomePrices[index]),
                            "currency": "USD",
                        }
                    }
                )
            )
        if event_has_team_names_as_outcome:
            event = Event(
                name=obj.question,
                last_updated=datetime.now(tz=timezone.utc).isoformat(),
                start_time=obj.gameStartTime,
                meta={
                    polymarketProvider.name: {
                        "tokenId": obj.clobTokenIds,
                        "bestAsk": obj.bestAsk,
                        "volume": obj.volume,
                        "orderMinSize": obj.orderMinSize,
                        "conditionId": obj.conditionId
                    }
                },
                providers=[polymarketProvider, ],
                outcomes=outcomes,
                markets=markets,
                matched=False
            )

            db.add(event)
            db.commit()
            lg.info(f"Adding {event.name}...")
            lg.info(f"outcomes: {outcomes}")
            lg.info(f"providers: {polymarketProvider}")
            lg.info(f"\n" * 5)
            events.append(event)

    return events, polymarketProvider
