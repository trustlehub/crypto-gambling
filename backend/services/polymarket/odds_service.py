import asyncio
import json
from typing import List

from models.polymarket import PolymarketResponse, CleanedPolymarketOdds


async def fetch_all_events(api_instance, number_of_requests) -> List[CleanedPolymarketOdds]:
    try:
        requests = []
        # Fetch data from Polymarket API
        for i in range(1, number_of_requests):
            requests.append(api_instance.get(
                f'/markets?tag_id=100639&closed=false&limit=100&related_tags=true&offset={i}'
            ))
        results = await asyncio.gather(*requests)

        # Extract data
        data: list[CleanedPolymarketOdds] = []
        seen = set()
        for result in results:
            odds = PolymarketResponse(result)
            for odd in odds.root:
                if odd.gameStartTime is not None and odd.id not in seen:
                    seen.add(odd.id)
                    odd.outcomes = json.loads(odd.outcomes)
                    odd.outcomePrices = json.loads(odd.outcomePrices)
                    odd.clobTokenIds = json.loads(odd.clobTokenIds)
                    data.append(odd)

        return data

    except Exception as error:
        print('Error fetching Polymarket data:', error)
        return []
