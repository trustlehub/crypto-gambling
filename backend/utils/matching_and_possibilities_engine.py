from datetime import datetime
from itertools import combinations, product

from fuzzywuzzy import fuzz

from db import Event, MatchedOutcome


async def matching_and_possibilities_engine(cloudbet_events, polymarket_events, db):
    matched_events: list[tuple[Event, Event]] = []
    sources = [polymarket_events, cloudbet_events]
    # Matching engine + possibilities engine
    for list1, list2 in combinations(sources, 2):
        # For each pair, iterate over the Cartesian product of the events
        for event1, event2 in product(list1, list2):
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
                meta={**event1.meta, **event2.meta},
                markets=[*event1.markets, *event2.markets],
                outcomes=[*event1.outcomes, *event2.outcomes],
                last_updated=event1.last_updated,
                matched=True
            )
        )

        print(event1.name, event2.name)
    db.commit()
