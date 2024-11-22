import asyncio
import logging

from apis.matchbook import MatchbookApiInstance
from log import setup_logger
from models.matchbook import MatchbookEvent, MatchbookEvents

lg = setup_logger("matchbook_odds_service", "/logs/matchbook_odds_service.log", logging.DEBUG)
async def fetch_all_events(api_instance: MatchbookApiInstance) -> list[MatchbookEvent]:
    url = 'https://api.matchbook.com/edge/rest/events?sport-ids=1&states=open&exchange-type=back-lay&side=lay'

    data = await api_instance.get(f'{url}')
    serialized_response = MatchbookEvents(**data)
    events = [*serialized_response.events]

    requests = []
    for i in range(serialized_response.per_page, serialized_response.total, serialized_response.per_page):
        requests.append(api_instance.get(f"{url}&offset={i}"))

    responses = await asyncio.gather(*requests)
    lg.info(f"Got {len(responses)} responses from matchbook")

    for data in responses:
        s = MatchbookEvents(**data)
        events.extend(s.events)

    for event in events:
        print(event.name)

    lg.info(f"Got {len(events)} events from matchbook")
    
    await api_instance.close()

    return events
