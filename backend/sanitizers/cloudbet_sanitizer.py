import logging
from datetime import datetime, timezone

from db import Provider, Market, Event, Outcome
from log import setup_logger
from models.cloudbet import CloudbetEvent

lg = setup_logger("cloudbet_sanitizer",'/logs/cloudbet_sanitizer.log', logging.DEBUG )
def cloudbet_sanitizer(cloudbet_data: list[CloudbetEvent], db) -> tuple[list[Event], Provider]:
    events: list[Event] = []
    for event in cloudbet_data:

        cloudbetprovider = Provider(
            name='cloudbet',
            is_exchange=False,
            is_bookmaker=True
        )
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

                lg.info(f"Adding {event.name}...")
                lg.info(f"outcomes: {[team_a,team_b]}")
                lg.info(f"providers: {[cloudbetprovider]}")
                lg.info(f"\n"*5)
                db.add(e)
                db.flush()
                events.append(e)
                break
    db.commit()
    return events, cloudbetprovider
