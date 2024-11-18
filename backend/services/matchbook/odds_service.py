import asyncio

from apis.matchbook import MatchbookApiInstance
from models.matchbook import MatchbookEvent, MatchbookEvents


async def fetch_all_events(api_instance: MatchbookApiInstance) -> list[MatchbookEvent]:
    url = 'https://api.matchbook.com/edge/rest/events?sport-ids=1&states=open&exchange-type=back-lay&side=lay'

    data = await api_instance.get(f'{url}')
    serialized_response = MatchbookEvents(**data)
    events = [*serialized_response.events]

    requests = []
    for i in range(serialized_response.per_page, serialized_response.total, serialized_response.per_page):
        requests.append(api_instance.get(f"{url}&offset={i}"))

    responses = await asyncio.gather(*requests)
    print(f"Got {len(responses)} responses from matchbook")

    for r in responses:
        data = await r.json()
        s = MatchbookEvents(**data)
        events.append(*s.events)

    for event in events:
        print(event.name)

    print(f"Got {len(events)} events from matchbook")

    return events
