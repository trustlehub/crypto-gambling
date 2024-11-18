from datetime import datetime
from itertools import combinations, product

from fuzzywuzzy import fuzz

from db import Event, MatchedOutcome


async def matching_and_possibilities_engine(events, db):
    matched_events: list[tuple[Event, Event]] = []
    sources = [*events]
    # Matching engine + possibilities engine

    # Get combinations of 2 event lists from the list of sources. This ensures 
    # all events from all apis are matched properly with each other

    for list1, list2 in combinations(sources, 2):
        # For each pair, iterate over the Cartesian product of the events
        for event1, event2 in product(list1, list2):

            # Time difference is mainly how we recognise events
            time_difference = (abs(
                datetime.fromisoformat(event2.start_time) - datetime.fromisoformat(event1.start_time))
                               .total_seconds())

            if time_difference == 0:
                matches = 0

                for c_team in event1.outcomes:
                    for p_team in event2.outcomes:
                        similarity = fuzz.ratio(c_team.name.lower(), p_team.name.lower())
                        threshold = 50
                        if similarity > threshold:
                            matches += 1
                        if matches >= 2:
                            break
                        print(f'similarity: {similarity} || c_team:{c_team.name}, p_team:{p_team.name}')

                    if matches >= 2:
                        break

                if matches >= 2:
                    matched_events.append((event2, event1))
                print("\n" * 3)
            else:
                print(f"Didn't match events because of time mismatch. time diff: {time_difference} ")
                print(f"Events: {event1.name} and {event2.name}")
                print("=" * 10 + "\n" * 4)

    for event1, event2 in matched_events:

        matched_outcomes = []
        for o1 in event1.outcomes:
            mo = MatchedOutcome(
                outcomes=[o1]
            )
            for o2 in event2.outcomes:
                similarity = fuzz.ratio(o1.name.lower(), o2.name.lower())
                threshold = 50
                if similarity > threshold:
                    mo.outcomes.append(o2)
                    matched_outcomes.append(mo)

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

        print(f"Matched: {event1.name} || {event2.name} ")
    db.commit()
