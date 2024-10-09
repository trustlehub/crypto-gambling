from datetime import datetime, timezone

from db import Provider, Market, Event, Outcome
from models.cloudbet import CloudbetEvent


def cloudbet_sanitizer(cloudbet_data: list[CloudbetEvent]) -> tuple[list[Event], Provider]:
    cloudbetprovider = Provider(
        name='cloudbet',
        is_exchange=True,
        is_bookmaker=True
    )
    events: list[Event] = []
    for event in cloudbet_data:
        markets = []
        for market_key, market in event.markets.root.items():
            if "moneyline" in market_key:
                for submarket in market.submarkets.values():
                    for selection in submarket.selections:
                        if selection.outcome == 'home':
                            team_a = Outcome(
                                name=event.home.name,
                                is_home=True,
                                is_away=False,
                                provider=cloudbetprovider
                            )
                            markets.append(
                                Market(
                                    outcome=team_a,
                                    odds=selection.price,
                                    name='moneyline',
                                    meta={
                                        cloudbetprovider.name : {
                                            'minStake': selection.minStake,
                                            'maxStake': selection.maxStake,
                                            'params': selection.params,
                                            'currency': "EUR",
                                            'marketKey': market_key
                                        }
                                    }
                                )
                            )
                        elif selection.outcome == 'away':
                            team_b = Outcome(
                                name=event.away.name,
                                is_home=False,
                                is_away=True,
                                provider=cloudbetprovider
                            )
                            markets.append(
                                Market(
                                    outcome=team_b,
                                    odds=selection.price,
                                    name='moneyline',
                                    meta={
                                        cloudbetprovider.name : {
                                            'minStake': selection.minStake,
                                            'maxStake': selection.maxStake,
                                            'params': selection.params,
                                            'currency': "EUR",
                                            'marketKey': market_key
                                        }
                                    }
                                )
                            )

                e = Event(
                    providers=[cloudbetprovider],
                    outcomes=[team_a, team_b],
                    name=event.name,
                    start_time=event.cutoffTime,
                    last_updated=datetime.now(tz=timezone.utc).isoformat(),
                    competition="" if event.competition is None else event.competition.name,
                    meta={
                        cloudbetprovider.name: {
                            "marketKey": f'{market_key}',
                            "eventId": event.id
                        }
                    },
                    markets=markets,
                    matched=False,
                )
                print(f'{event.name}: {event.id}')
                events.append(e)
                break

    return events, cloudbetprovider
