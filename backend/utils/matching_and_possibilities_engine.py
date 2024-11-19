import logging
from datetime import datetime
from itertools import product

from fuzzywuzzy import fuzz
from sqlalchemy.orm import joinedload

from db import Event, MatchedOutcome, Provider, Outcome, Market
from log import setup_logger

lg = setup_logger('matching_and_possibilities_engine', '/logs/matching.log', logging.DEBUG)


async def matching_and_possibilities_engine(events, db):
    matched_events: list[tuple[Event, Event]] = []
    sources = [
        *db.query(Event).join(Provider).filter(Event.matched == False, Provider.name == 'matchbook').options(
            joinedload(Event.outcomes),
            joinedload(Event.providers),
            joinedload(Event.markets), )
        .all(),
        *db.query(Event).join(Provider).filter(Event.matched == False, Provider.name == 'cloudbet').options(
            joinedload(Event.outcomes),
            joinedload(Event.providers),
            joinedload(Event.markets), )
        .all(),
        *db.query(Event).join(Provider).filter(Event.matched == False, Provider.name == 'polymarket').options(
            joinedload(Event.outcomes),
            joinedload(Event.providers),
            joinedload(Event.markets), )
        .all(),
    ]
    # Matching engine + possibilities engine

    # Get combinations of 2 event lists from the list of sources. This ensures 
    # all events from all apis are matched properly with each other

    for event1, event2 in product(sources, repeat=2):

        if event1 == event2:
            continue

            # Time difference is mainly how we recognise events are similar
        time_difference = (abs(
            datetime.fromisoformat(event2.start_time) - datetime.fromisoformat(event1.start_time))
                           .total_seconds())
        if time_difference == 0:
            matches = 0

            for team1 in event1.outcomes:
                for team2 in event2.outcomes:
                    similarity = fuzz.ratio(team1.name.lower(), team2.name.lower())
                    threshold = 50
                    if similarity > threshold:
                        matches += 1
                    if matches >= 2:
                        # Two teams matched as well. No need to loop again
                        break
                    lg.debug(f'similarity: {similarity} || team1:{team1.name}, team2:{team2.name}')

                if matches >= 2:
                    # Two teams matched as well. No need to loop again
                    break

            if matches >= 2:
                matched_events.append((event2, event1))
            lg.debug("\n" * 3)
        else:
            lg.debug(f"Didn't match events because of time mismatch. time diff: {time_difference} ")
            lg.debug(f"Events: {event1.name} and {event2.name}")
            lg.debug("=" * 10 + "\n" * 2)

    for event1, event2 in matched_events:

        lg.info(
            f" Matching {event1.name, event1.providers, event1.id} || {event2.name, event2.providers, event2.id} ...")
        lg.info(f" even1 outcomes: {len(event1.outcomes)}, even2 outcomes: {len(event2.outcomes)}")
        matched_outcomes = []
        for o1 in event1.outcomes:
            # select the each outcome from event 1, match with all outcomes from event 2
            mo = MatchedOutcome(
                outcomes=[o1]
            )
            got_a_match = False
            tried_outcomes = []
            for o2 in event2.outcomes:
                similarity = fuzz.ratio(o1.name.lower(), o2.name.lower())
                threshold = 50
                if similarity > threshold:
                    got_a_match = True
                    mo.outcomes.append(o2)
                    lg.info(
                        f"Matched outcomes:: {o1.name, o1.provider.name} || {similarity} \n")
                    matched_outcomes.append(mo)
                else:
                    lg.info(
                        f"Couldn't match outcomes:: {o1.name, o1.provider.name} || {o2.name, o2.provider.name} || {similarity} \n")
                    tried_outcomes.append({
                        o2.name: similarity
                    })

            if not got_a_match:
                lg.warn(
                    f"Couldn't find an outcome to {o1.name, o1.provider.name} \n")
                lg.warn(
                    f"tried: {tried_outcomes}")

            lg.info("=" * 20 + "\n" * 3)

        outcome1_list = []
        market1_list = []
        outcome2_list = []
        market2_list = []
        provider1 = Provider(
            name=event1.providers[0].name,
            is_exchange=event1.providers[0].is_exchange,
            is_bookmaker=event1.providers[0].is_bookmaker
        )
        provider2 = Provider(
            name=event2.providers[0].name,
            is_exchange=event2.providers[0].is_exchange,
            is_bookmaker=event2.providers[0].is_bookmaker
        )
        for market1 in event1.markets:
            outcome1 = market1.outcome
            o = Outcome(
                name=outcome1.name,
                verbose_name=outcome1.verbose_name,
                is_home=outcome1.is_home,
                is_away=outcome1.is_away,
                meta=outcome1.meta,
                provider=provider1
            )
            m = Market(
                outcome=o,
                odds=market1.odds,
                name=market1.name,
                meta=market1.meta
            )
            outcome1_list.append(
                o
            )
            market1_list.append(
                m
            )

    for market2 in event2.markets:
        outcome2 = market2.outcome
        o = Outcome(
            name=outcome2.name,
            verbose_name=outcome2.verbose_name,
            is_home=outcome2.is_home,
            is_away=outcome2.is_away,
            meta=outcome2.meta,
            provider=provider2
        )
        m = Market(
            outcome=o,
            odds=market2.odds,
            name=market2.name,
            meta=market2.meta
        )
        outcome2_list.append(
            o
        )
        market2_list.append(
            m
        )
    db.add_all(matched_outcomes)
    db.add(
        Event(
            providers=[provider1, provider2],
            name=event1.name,
            start_time=event1.start_time,
            meta={**(event1.meta if event1.meta is not None else {}),
                  **(event2.meta if event2.meta is not None else {})},
            markets=[*market1_list, market2_list],
            outcomes=[*outcome1_list, outcome2_list],
            last_updated=event1.last_updated,
            matched=True
        )
    )


    db.commit()
