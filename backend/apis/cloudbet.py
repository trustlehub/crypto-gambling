import aiohttp


class CloudbetApiInstance:
    def __init__(self, config):
        self.base_url = config['baseURL']
        self.api_key = config['apiKey']
        self.headers = {
            'Content-Type': 'application/json',
            'X-API-Key': self.api_key
        }

    async def post(self, endpoint:str, data:dict):
        async with aiohttp.ClientSession(headers=self.headers) as session:
            async with session.post(f'{self.base_url}{endpoint}',json=data) as response:

                if response.status == 200:
                    return await response.json()
                else:
                    text = await response.text()
                    raise Exception(text)
            
    async def get(self, endpoint):
        url = f"{self.base_url}{endpoint}"
        async with aiohttp.ClientSession(headers=self.headers) as session:
            async with session.get(url) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    raise Exception(f"Failed to fetch data: {response.status}")


