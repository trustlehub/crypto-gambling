import logging

import aiohttp
import asyncio
from log import setup_logger

lg = setup_logger("polymarket_api", "/logs/polymarket_api.log", logging.DEBUG)
class PolymarketApiInstance:
    def __init__(self):
        self.base_url = 'https://gamma-api.polymarket.com'

    async def get(self, endpoint):
        url = f"{self.base_url}{endpoint}"
        async with aiohttp.ClientSession() as session:
            while True:
                try:
                    async with session.get(url) as response:
                        if response.status == 200:
                            return await response.json()
                        elif response.status == 429:  # Rate-limited
                            lg.debug("Rate limited on Polymarket")
                            retry_after = response.headers.get('Retry-After', None)
                            delay = int(retry_after) if retry_after else 1
                            await asyncio.sleep(delay)
                            lg.debug(f"Retrying after {delay} seconds")
                            continue
                        else:
                            return {  # Default error response handling
                                'data': [],
                                'status': 200,
                                'statusText': 'OK',
                                'headers': {},
                                'config': {},
                                'request': {}
                            }
                except aiohttp.ClientError as error:
                    lg.error(f"Error fetching data from Polymarket: {error}")
                    return {  # Catch network errors and return empty data
                        'data': [],
                        'status': 200,
                        'statusText': 'OK',
                        'headers': {},
                        'config': {},
                        'request': {}
                    }


