from datetime import datetime, timezone

from db import Provider, Market, Event, Outcome
from models.polymarket import CleanedPolymarketOdds


def polymarket_sanitizer(polymarket_data: list[CleanedPolymarketOdds]) -> tuple[list[Event], Provider]:
    polymarketProvider = Provider(
        name='polymarket',
        is_exchange=False,
        is_bookmaker=True
    )
    events: list[Event] = []
    for obj in polymarket_data:
        outcomes = []
        markets = []

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
            events.append(event)

    return events, polymarketProvider
