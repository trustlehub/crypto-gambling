from apis.matchbook import MatchbookApiInstance
from db import Outcome
from models.matchbook import MatchbookRunner


async def matchbook_betting_service(outcome: Outcome, stake: str, matchbook_api: MatchbookApiInstance):
    event_id = outcome.meta['matchbook']['event_id']
    market_id = outcome.meta['matchbook']['market_id']
    runner_id = outcome.meta['matchbook']['runner_id']
    odds = outcome.market.odds

    # checking whether price is still same
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
        raise Exception(f"Odds have changed for {outcome.name}")

    response = await matchbook_api.post('https://api.matchbook.com/edge/rest/v2/offers',
                                        {
                                            "odds-type": "DECIMAL",
                                            "exchange-type": "back-lay",
                                            "offers": [
                                                {
                                                    "runner-id": runner_id,
                                                    "side": "lay",
                                                    "odds": odds,
                                                    "stake": stake,
                                                }
                                            ]
                                        }
                                        )
    return response
