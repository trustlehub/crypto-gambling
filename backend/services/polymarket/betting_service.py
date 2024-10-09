import os

from py_clob_client.client import ClobClient
from py_clob_client.clob_types import OrderArgs, OrderType
from py_clob_client.constants import POLYGON
from py_clob_client.order_builder.constants import BUY
from sqlalchemy.orm import Session

from db import Outcome

# Initialize the Polymarket client
host = "https://clob.polymarket.com"
key = os.getenv("WALLET_PK")
chain_id = POLYGON

# Create CLOB client and get/set API credentials
client = ClobClient(host, key=key, chain_id=chain_id, funder="0xFDEba65dC5f32E2eA4BEF2927a1c494f32E19032",
                    signature_type=1)
client.set_api_creds(client.create_or_derive_api_creds())


async def polymarket_betting_service(outcome: Outcome, size: int, db: Session):
    try:
        # Determine order side
        side = BUY
        token_id = outcome.meta[outcome.provider.name]['clobTokenId']
        price = float("%.3f" % (1 / outcome.market.odds))

        # Place the order using py-clob-client
        market = client.get_market(
            condition_id=outcome.event.meta[outcome.provider.name]["conditionId"],
        )

        for token in market['tokens']:

            if token['token_id'] == token_id:
                if token['price'] != price:
                    print(token['price'], price)
                    raise Exception(
                        f"Latest price was {token['price']} but bet placed for {price}. Try refreshing page")

        signed_order = client.create_order(OrderArgs(
            price=price,
            size=size,
            side=side,
            token_id=token_id
        )
        )
        resp = client.post_order(
            signed_order,
            OrderType.FOK
        )

        return {"status": "success", "response": resp}

    except Exception as e:
        raise Exception(f"Order placement failed: {str(e)}")
