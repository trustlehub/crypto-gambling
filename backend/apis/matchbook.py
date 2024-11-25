import aiohttp


class MatchbookApiInstance:
    def __init__(self):
        self.session = None
        self.token = None

    async def authenticate(self, username: str, password: str):
        """Authenticate and store the token."""
        async with aiohttp.ClientSession(headers={
            'content-type': 'application/json',
            'accept': 'application/json'
        }) as session:
            async with session.post("https://api.matchbook.com/bpapi/rest/security/session",
                                    json={'username': username, "password": password}) as response:
                if response.status == 200:
                    data = await response.json()
                    self.token = data.get("session-token")  # Adjust the key based on your API response
                else:
                    raise Exception(f"Authentication failed: {response.status} {await response.text()}")


    async def get(self, endpoint: str, **kwargs):
        """Make a request with the active session."""

        async with aiohttp.ClientSession(headers={
            'content-type': 'application/json',
            'accept': 'application/json'
        }).get(f"{endpoint}", **kwargs) as response:
            if response.status == 200:
                return await response.json()
            else:
                response_text = await response.text()
                raise Exception(f"Request failed: {response.status} {response_text}")

    async def post(self, endpoint: str, data: dict, authenticated: bool = False, **kwargs):
        """Make a request with the active session."""

        async with aiohttp.ClientSession(headers={
            'content-type': 'application/json',
            'accept': 'application/json',
            'session-token': f"{self.token}" if authenticated else None
        }).post(f"{endpoint}", json=data, **kwargs, ) as response:
            if response.status == 200:
                return await response.json()
            else:
                response_text = await response.text()
                raise Exception(f"Request failed: {response.status} {response_text}")

    async def close(self):
        """Close the session."""
        if self.session:
            await self.session.close()
