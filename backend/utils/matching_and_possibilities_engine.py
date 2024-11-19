import logging
from datetime import datetime
from itertools import combinations, product

from fuzzywuzzy import fuzz

from db import Event, MatchedOutcome
from log import setup_logger

lg = setup_logger('matching_and_possibilities_engine', '/logs/matching.log', logging.DEBUG)


async def matching_and_possibilities_engine(events, db):
    matched_events: list[tuple[Event, Event]] = []
    sources = [*events]
    # Matching engine + possibilities engine

    # Get combinations of 2 event lists from the list of sources. This ensures 
    # all events from all apis are matched properly with each other

    for list1, list2 in combinations(sources, 2):
        # For each pair, iterate over the Cartesian product of the events
        for event1, event2 in product(list1, list2):

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

        lg.info(f" Matching {event1.name, event1.providers} || {event2.name, event2.providers} ...")
        matched_outcomes = []
        for o1 in event1.outcomes:
            # select the each outcome from event 1, match with all outcomes from event 2
            mo = MatchedOutcome(
                outcomes=[o1]
            )
            got_a_match = False
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

            if not got_a_match:
                lg.warn(
                    f"Couldn't find an outcome to {o1.name, o1.provider.name} \n")

        db.add_all(matched_outcomes)
        db.add(
            Event(
                providers=[*event1.providers, *event2.providers],
                name=event1.name,
                start_time=event1.start_time,
                meta={**(event1.meta if event1.meta is not None else {}),
                      **(event2.meta if event2.meta is not None else {})},
                markets=[*event1.markets, *event2.markets],
                outcomes=[*event1.outcomes, *event2.outcomes],
                last_updated=event1.last_updated,
                matched=True
            )
        )

    db.commit()
