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
                                    data={'username': username, "password": password}) as response:
                if response.status == 200:
                    data = await response.json()
                    self.token = data.get("session-token")  # Adjust the key based on your API response
                else:
                    raise Exception(f"Authentication failed: {response.status} {await response.text()}")

        # Keep an active session
        self.session = aiohttp.ClientSession(headers={"session-token": f"{self.token},",
                                                      'content-type': 'application/json',
                                                      'accept': 'application/json'
                                                      })

    async def get(self, endpoint: str, authenticated: bool = False, **kwargs):
        """Make a request with the active session."""
        if not self.session and authenticated:
            raise Exception("Client is not authenticated. Call `authenticate` first.")

        session = (aiohttp.ClientSession(headers={
            'content-type': 'application/json',
            'accept': 'application/json'
        }) if not self.session or not authenticated else self.session)
        async with session.get(f"{endpoint}", **kwargs) as response:
            if response.status == 200:
                return await response.json()
            else:
                response_text = await response.text()
                raise Exception(f"Request failed: {response.status} {response_text}")
        if not self.session or authenticated:
            await session.close()

    async def post(self, endpoint: str, data: dict, authenticated: bool = False, **kwargs):
        """Make a request with the active session."""
        if not self.session and authenticated:
            raise Exception("Client is not authenticated. Call `authenticate` first.")

        session = (aiohttp.ClientSession(headers={
            'content-type': 'application/json',
            'accept': 'application/json'
        }) if not self.session or not authenticated else self.session)

        async with session.post(f"{endpoint}", json=data, **kwargs, ) as response:
            if response.status == 200:
                return await response.json()
            else:
                response_text = await response.text()
                raise Exception(f"Request failed: {response.status} {response_text}")

        if not self.session or authenticated:
            await session.close()

    async def close(self):
        """Close the session."""
        if self.session:
            await self.session.close()
