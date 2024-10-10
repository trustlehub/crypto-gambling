import os
import uuid

from apis.cloudbet import CloudbetApiInstance
from db import Outcome
from models.cloudbet import CloudbetEvent
from sanitizers.cloudbet_sanitizer import cloudbet_sanitizer


async def cloudbet_betting_service(outcome: Outcome, stake: str, cloudbet_api: CloudbetApiInstance):
    dev = os.environ.get('DEV')
    if dev is None:
        currency = "USDC"
    else:
        currency = 'PLAY_EUR'
    referenceId = str(uuid.uuid4())
    event_id = outcome.event.meta[outcome.provider.name]['eventId']
    confirmation_response = await cloudbet_api.get(f'/v2/odds/events/{event_id}')
    event = CloudbetEvent(
        **confirmation_response
    )
    sanitized_events, providers = cloudbet_sanitizer([event])
    event = sanitized_events[0]

    # checking whether price has changed
    for o in event.outcomes:
        if o.is_home and outcome.is_home or o.is_away and outcome.is_away:
            if o.market.odds != outcome.market.odds:
                raise Exception(
                    f"Latest price was {o.market.odds} but bet placed for {outcome.market.odds}. Try refreshing page")

    _outcome = "home" if outcome.is_home else "away"

    response = await cloudbet_api.post('/v3/bets/place',
                                       {
                                           "currency": currency,
                                           "eventId": str(event_id),
                                           "marketUrl": f'{outcome.market.meta[outcome.provider.name]["marketKey"]}/{_outcome}',
                                           "price": str(outcome.market.odds),
                                           "stake": str(stake),
                                           "referenceId": referenceId,
                                           "side": "BACK"
                                       }
                                       )
    return response
  
