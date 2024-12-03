import logging
import os

import aiohttp
from py_clob_client.client import ClobClient
from py_clob_client.constants import POLYGON

from apis.cloudbet import CloudbetApiInstance
from apis.matchbook import MatchbookApiInstance
from apis.polymarket import PolymarketApiInstance
from log import setup_logger
from models.cloudbet import CloudbetEvent
from models.frontend import OddsCleaned
from models.matchbook import MatchbookRunner
from sanitizers.cloudbet_sanitizer import cloudbet_sanitizer

cloudbet_api = CloudbetApiInstance({
    'baseURL': 'https://sports-api.cloudbet.com/pub',
    'apiKey': "eyJhbGciOiJSUzI1NiIsImtpZCI6IkhKcDkyNnF3ZXBjNnF3LU9rMk4zV05pXzBrRFd6cEdwTzAxNlRJUjdRWDAiLCJ0eXAiOiJKV1QifQ.eyJhY2Nlc3NfdGllciI6InRyYWRpbmciLCJleHAiOjIwNDI0NDY5OTgsImlhdCI6MTcyNzA4Njk5OCwianRpIjoiYzc2ZTExNGItMDQyNS00YTU3LWE2ZWEtMjk3Yzg4NjM1NzVhIiwic3ViIjoiMGZiYjRjNjctMTExZi00ZTgxLTk0NGItMTMyNmNlMTQyYjhmIiwidGVuYW50IjoiY2xvdWRiZXQiLCJ1dWlkIjoiMGZiYjRjNjctMTExZi00ZTgxLTk0NGItMTMyNmNlMTQyYjhmIn0.ZTOj6aLXmyhxRn_G1ZtRgcRzoczrpz7n4DtcUKAZCfC9TbTByiAfAGb6IZ0C5yrn4yCPmaxn2SlA8Hi1Ie6iE4c-NbcyopPPq3-v4XR8-tE6bjNnTt_1OomqVdBM2TAmrwdAjc8F05QFUIav4WvPds-X08DQ3iIBiG7z-G1TiU1JdhJoMh58mmXNP4qrWz0Kk7woH4aefQqXwxtcG1BciaZxArR3BX-xWGHUWIDf76Kd5lqOA1wif7JCstOZX7tWAxsOLJlXbnU4RXz3K45dte2tXc3GB5hIdvB0PEg_a8-pmg12dhft4RjfitUEBwNktuvdGe2ZCLZpqC0DcSUXwQ"
})
lg = setup_logger("test", "/logs/test.log", logging.DEBUG)
polymarket_api = PolymarketApiInstance()

matchbook_api = MatchbookApiInstance()

# get odds from API
HOST = "http://209.250.228.247:8000"

# Initialize the Polymarket client
host = "https://clob.polymarket.com"
key = os.getenv("WALLET_PK")
chain_id = POLYGON

# Create CLOB client and get/set API credentials
client = ClobClient(host, key=key, chain_id=chain_id, funder="0xFDEba65dC5f32E2eA4BEF2927a1c494f32E19032",
                    signature_type=1)
client.set_api_creds(client.create_or_derive_api_creds())


# compare with odds from actual APIs
async def get_odds() -> list[OddsCleaned]:
    async with aiohttp.ClientSession() as session:
        async with session.get(f"{HOST}/get_events") as response:
            odds = await response.json()
            cleaned_odds = []
            for odd in odds:
                cleaned_odds.append(OddsCleaned(**odd))
            return cleaned_odds


async def check_odds_cloudbet(event, outcome):
    lg.debug("fetching cloudbet odds")
    name = event.event
    confirmation_response = await cloudbet_api.get(f'/v2/odds/events/{event.meta['cloudbet']["eventId"]}')
    event = CloudbetEvent(
        **confirmation_response
    )
    sanitized_events, providers = cloudbet_sanitizer([event], None, no_commit=True)
    event = sanitized_events[0]

    # checking whether price has changed
    for o in event.outcomes:
        if o.is_home and outcome['is_home'] or o.is_away and outcome['is_away']:
            if o.market.odds != outcome['market']['odds']:
                lg.error(
                    f"Cloudbet odds error: Latest price was {o.market.odds} but odds are {outcome['market']['odds']} for event {name}")

    lg.debug("cloudbet odds ok")


async def check_odds_matchbook(event, outcome):
    event_id = event.meta['matchbook']['event_id']
    market_id = event.meta['matchbook']['market_id']
    runner_id = event.meta['matchbook']['runner_id']
    odds = outcome['market']['odds']

    # checking whether price is still same
    lg.debug("fetching matchbook odds")
    price_check = await matchbook_api.get(
        f"https://api.matchbook.com/edge/rest/events/{event_id}/markets/{market_id}/runners/{runner_id}"
        f"?include-prices=true&exchange-type=back-lay&side=lay")
    matchbook_runner = MatchbookRunner(**price_check)

    odds_available = False
    for price in matchbook_runner.prices:
        if price.decimal_odds == odds:
            odds_available = True
            break
    if not odds_available:
        lg.error(
            f"Matchbook odds error: Odds have changed for {event.event}; expected {odds} but got {[price.decimal_odds for price in matchbook_runner.prices]}")
    else:
        lg.debug("matchbook odds ok")


async def check_odds_polymarket(event, outcome):
    # Determine order side
    token_id = event.meta['polymarket']['clobTokenId']
    price = float("%.3f" % (1 / outcome['market']['odds']))
    condition_id = event.meta['polymarket']['conditionId']
    # Place the order using py-clob-client
    lg.debug("fetching polymarket odds")
    market = client.get_market(
        condition_id=condition_id,
    )

    for token in market['tokens']:

        if token['token_id'] == token_id:
            if token['price'] != price:
                lg.error(f"Polymarket odds error: Latest price was {token['price']} provided odds: {price} for event {event.event}")

    lg.debug("polymarket odds ok")


async def task(event):
    lay_outcome = event.lay_outcome_id
    back_outcome = event.back_outcome_id
    requests = [
        aiohttp.ClientSession().get(url=f"{HOST}/outcomes/{lay_outcome}"),
        aiohttp.ClientSession().get(url=f"{HOST}/outcomes/{back_outcome}"),
    ]
    outcomes = await asyncio.gather(*requests)
    json_outcomes = []
    for outcome in outcomes:
        o = await outcome.json()
        json_outcomes.append(o)

    lg.debug(f"Checking odds for event {event.event}")
    for outcome in json_outcomes:
        if outcome is None:
            continue
        if outcome['provider']['name'] == "cloudbet":
            await check_odds_cloudbet(event, outcome)
        elif outcome['provider']['name'] == "matchbook":
            await check_odds_matchbook(event, outcome)
        elif outcome['provider']['name'] == "polymarket":
            await check_odds_polymarket(event, outcome)
    lg.debug(f"Finished checking odds for event {event.event}")


async def main():
    odds = await get_odds()
    lg.debug("Finished fetching odds")
    for event in odds:
        await task(event)


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())
    lg.debug("Finished checking odds")
