import aiohttp
import asyncio

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
                            retry_after = response.headers.get('Retry-After', None)
                            delay = int(retry_after) if retry_after else 1
                            await asyncio.sleep(delay)
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
                    return {  # Catch network errors and return empty data
                        'data': [],
                        'status': 200,
                        'statusText': 'OK',
                        'headers': {},
                        'config': {},
                        'request': {}
                    }


