import asyncio
from datetime import datetime, timezone

from apis.cloudbet import CloudbetApiInstance
from db import Market,  Event, Provider, Base, engine, SessionLocal
from models.cloudbet import CloudbetEvent 


async def fetch_all_events(api_instance):
    try:
        # Fetch competitions data
        competitions_data = await api_instance.get('/v2/odds/sports/american_football')
        print(competitions_data)
        final_data = []
        requests = []

        # Iterate over the categories and competitions to build the request list
        for cat in competitions_data.get('categories', []):
            for com in cat.get('competitions', []):
                # Build the request URL for each competition
                requests.append(api_instance.get(f'/v2/odds/competitions/{com["key"]}?players=true'))

        # Resolve all requests in parallel
        responses = await asyncio.gather(*requests)

        # Extract data from each response and add to final_data
        for r in responses:
            for event in r.get("events", []):
                try:
                    if "home" not in event or "away" not in event:
                        continue
                    if event['home'] is None or event['away'] is None:
                        continue
                    cEvent = CloudbetEvent(**event)
                    final_data.append(cEvent)
                except Exception as e:
                    print(event)
                    print(e)
                    break

        return final_data

    except Exception as error:
        print('Error fetching competition data:', error)
        return []



