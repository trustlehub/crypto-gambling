import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from py_clob_client.client import ClobClient
from py_clob_client.clob_types import OrderArgs, OrderType, BalanceAllowanceParams, AssetType
from py_clob_client.constants import POLYGON
from py_clob_client.order_builder.constants import BUY, SELL
from pydantic import BaseModel

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)
# Initialize the Polymarket client
host = "https://clob.polymarket.com"
key = os.getenv("WALLET_PK")
chain_id = POLYGON

# Create CLOB client and get/set API credentials
client = ClobClient(host, key=key, chain_id=chain_id, funder="0xFDEba65dC5f32E2eA4BEF2927a1c494f32E19032",
                    signature_type=1)
client.set_api_creds(client.create_or_derive_api_creds())


# Pydantic model for order details
class OrderDetails(BaseModel):
    token_id: str
    side: str  # "buy" or "sell"
    size: float
    price: float
    outcome_price: float
    condition_id: str


@app.post("/trade/")
async def place_order(order: OrderDetails):
    try:
        # Determine order side
        side = BUY if order.side.lower() == "buy" else SELL

        print(order.size * order.price)
        # Place the order using py-clob-client

        market = client.get_market(
            condition_id=order.condition_id
        )

        for token in market['tokens']:
            
            if token['token_id'] == order.token_id:
                if token['price'] != order.outcome_price:
                    print(token['price'], order.outcome_price)
                    raise HTTPException(status_code=403,
                                        detail=f"Latest price was {token['price']} but bet placed for {order.price}. Try refreshing page")

        signed_order = client.create_order(OrderArgs(
            price=order.price,
            size=order.size,
            side=side,
            token_id=order.token_id
        )
        )
        resp = client.post_order(
            signed_order,
            OrderType.FOK)

        return {"status": "success", "response": resp}

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Order placement failed: {str(e)}")


@app.get("/balance/")
async def balance_check():
    resp = client.get_balance_allowance(
        params=BalanceAllowanceParams(asset_type=AssetType.COLLATERAL)
    )

    return resp


@app.post("/test/trade/")
async def place_order(order: OrderDetails):
    try:
        # Determine order side
        side = BUY if order.side.lower() == "buy" else SELL

        print(order.size * order.price)
        # Place the order using py-clob-client
        market = client.get_market(
            condition_id=order.condition_id
        )
        print(market)

        signed_order = client.create_order(OrderArgs(
            price=0.01,
            size=order.size,
            side=side,
            token_id=order.token_id
        )
        )
        resp = client.post_order(
            signed_order,
            OrderType.FOK)

        return {"status": "success", "response": resp}

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Order placement failed: {str(e)}")
# To run the app, use: uvicorn main:app --reload
