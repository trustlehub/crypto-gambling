from datetime import datetime, timezone
from itertools import permutations

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from requests import Session

from apis.cloudbet import CloudbetApiInstance
from apis.polymarket import PolymarketApiInstance
from db import SessionLocal, Base, engine, Outcome, Event
from models.frontend import OddsCleaned
from sanitizers.cloudbet_sanitizer import cloudbet_sanitizer
from sanitizers.polymarket_sanitizer import polymarket_sanitizer
from services.cloudbet.betting_service import cloudbet_betting_service
from services.cloudbet.odds_service import fetch_all_events as fetch_cloudbet_data
from services.polymarket.betting_service import polymarket_betting_service
from services.polymarket.odds_service import fetch_all_events as fetch_polymarket_data
from utils.calculations import rating_calc
from utils.matching_and_possibilities_engine import matching_and_possibilities_engine

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)
Base.metadata.create_all(bind=engine)

# Creating the instance with base URL and API key
cloudbet_api = CloudbetApiInstance({
    'baseURL': 'https://sports-api.cloudbet.com/pub',
    'apiKey': "eyJhbGciOiJSUzI1NiIsImtpZCI6IkhKcDkyNnF3ZXBjNnF3LU9rMk4zV05pXzBrRFd6cEdwTzAxNlRJUjdRWDAiLCJ0eXAiOiJKV1QifQ.eyJhY2Nlc3NfdGllciI6InRyYWRpbmciLCJleHAiOjIwNDI0NDY5OTgsImlhdCI6MTcyNzA4Njk5OCwianRpIjoiYzc2ZTExNGItMDQyNS00YTU3LWE2ZWEtMjk3Yzg4NjM1NzVhIiwic3ViIjoiMGZiYjRjNjctMTExZi00ZTgxLTk0NGItMTMyNmNlMTQyYjhmIiwidGVuYW50IjoiY2xvdWRiZXQiLCJ1dWlkIjoiMGZiYjRjNjctMTExZi00ZTgxLTk0NGItMTMyNmNlMTQyYjhmIn0.ZTOj6aLXmyhxRn_G1ZtRgcRzoczrpz7n4DtcUKAZCfC9TbTByiAfAGb6IZ0C5yrn4yCPmaxn2SlA8Hi1Ie6iE4c-NbcyopPPq3-v4XR8-tE6bjNnTt_1OomqVdBM2TAmrwdAjc8F05QFUIav4WvPds-X08DQ3iIBiG7z-G1TiU1JdhJoMh58mmXNP4qrWz0Kk7woH4aefQqXwxtcG1BciaZxArR3BX-xWGHUWIDf76Kd5lqOA1wif7JCstOZX7tWAxsOLJlXbnU4RXz3K45dte2tXc3GB5hIdvB0PEg_a8-pmg12dhft4RjfitUEBwNktuvdGe2ZCLZpqC0DcSUXwQ"
})

polymarket_api = PolymarketApiInstance()


# Dependency for getting the session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Pydantic model for order details
class OrderDetails(BaseModel):
    size: float


@app.post("/trade/{outcome_id}")
async def place_order(request: OrderDetails, outcome_id: int, db: Session = Depends(get_db)):
    try:
        outcome = db.query(Outcome).filter(Outcome.id == outcome_id).first()
        provider_name = outcome.provider.name
        if provider_name == 'polymarket':
            r = await polymarket_betting_service(
                outcome=outcome,
                db=db,
                size=int(request.size)
            )
            return r
        elif provider_name == 'cloudbet':
            r = await cloudbet_betting_service(
                outcome=outcome,
                cloudbet_api=cloudbet_api,
                stake=str(request.size),
            )
            return r
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Order placement failed: {str(e)}")


@app.get("/get_events/")
async def get_events(db: Session = Depends(get_db)):
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)

    polymarket_data = await fetch_polymarket_data(polymarket_api, 30)
    cloudbet_data = await fetch_cloudbet_data(cloudbet_api)

    polymarket_events, polymarket_provider = polymarket_sanitizer(polymarket_data)
    cloudbet_events, cloudbet_provider = cloudbet_sanitizer(cloudbet_data)

    await matching_and_possibilities_engine(cloudbet_events, polymarket_events, db)

    events = db.query(Event).filter(Event.matched == True).all()
    final_odds: list[OddsCleaned] = []
    total = 0
    for event in events:
        outcomes: list[Outcome] = event.outcomes
        for o1, o2 in permutations(outcomes, 2):
            if o2 in o1.matched_outcome.outcomes:
                print("skipping this combination: same team")
                continue
            elif o1.provider_id == o2.provider_id:
                print("skipping this combination: same provider")
            else:
                final_odds.append(
                    # o1 is the bet_team and o2 is the lay team. so o1's provider is 
                    # bookmaker and o2's provider is exchange
                    OddsCleaned(
                        event=o1.event.name,
                        time=o1.event.start_time,
                        bet_team=o1.name,
                        bookmaker=o1.provider.name,
                        exchange=o2.provider.name,
                        odds=o1.market.odds,
                        lay=o2.market.odds,
                        avail="10",
                        home_team=o1.name,
                        away_team=o2.name,
                        odds_last_update=datetime.now(tz=timezone.utc).isoformat(),
                        lay_last_update=datetime.now(tz=timezone.utc).isoformat(),
                        lay_as_back=o2.provider.is_bookmaker,
                        rating=rating_calc(
                            o1.market.odds,
                            o2.market.odds,
                            0
                        ),
                        maxLay="%.2f" % o2.market.meta[o2.provider.name]['maxStake']
                               + " " + o2.market.meta[o2.provider.name]['currency'],
                        back_outcome_id=o1.id,
                        lay_outcome_id=o2.id,
                        meta={
                            o1.provider.name: {
                                **(o1.meta[o1.provider.name] if o1.meta is not None else {}),
                                **(o1.market.meta[o1.provider.name] if o1.market.meta is not None else {}),
                                **(o1.event.meta[o1.provider.name] if o1.event.meta is not None else {}),
                            },
                            o2.provider.name: {
                                **(o2.meta[o2.provider.name] if o2.meta is not None else {}),
                                **(o2.market.meta[o2.provider.name] if o2.market.meta is not None else {}),
                                **(o2.event.meta[o2.provider.name] if o2.event.meta is not None else {}),
                            }
                        },
                    )
                )
                total += 1

    return sorted(final_odds, key=lambda x: float(x.rating), reverse=True)
