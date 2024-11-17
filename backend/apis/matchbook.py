import aiohttp


class MatchbookApiInstance:
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
        self.session = aiohttp.ClientSession(headers={"session-token": f"{self.token}"})

    async def get(self, endpoint: str, **kwargs):
        """Make a request with the active session."""
        # if not self.session:
        #     raise Exception("Client is not authenticated. Call `authenticate` first.")
        self.session = aiohttp.ClientSession(headers={
            "accept": "application/json",
            "content-type": "application/json",
        })
       
        async with self.session.request('get', f"{endpoint}", **kwargs) as response:
            if response.status == 200:
                return await response.json()
            else:
                response_text = await response.text()
                raise Exception(f"Request failed: {response.status} {response_text}")

    async def close(self):
        """Close the session."""
        if self.session:
            await self.session.close()
