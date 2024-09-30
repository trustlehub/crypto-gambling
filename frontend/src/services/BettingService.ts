// Import required modules for HTTP requests
import axios, {Axios, AxiosError, AxiosInstance, AxiosResponse} from 'axios';
import {v4 as uuidv4} from 'uuid';
import {cloudbetapi} from "../apis/cloudbet";
import {CloudbetEvent} from "../types/Cloudbet";

// Cloudbet and Polymarket API URLs
const CLOUD_BET_BASE_URL = 'https://api.cloudbet.com';

interface BetResponse {
    success: boolean;
    message: string;
    data?: any;
}

export class BettingService {
    private cloudbetApi: AxiosInstance;
    private polymarketBetApi: AxiosInstance

    constructor() {
        this.cloudbetApi = cloudbetapi;
        this.polymarketBetApi = axios.create({
            baseURL: process.env.REACT_APP_POLYMARKET_BET_BASEURL || 'http://localhost:8000',
        })
        // this.polymarketApi = polymarketApi;
    }


    // Place a bet on Cloudbet
    async placeCloudbetBet(eventId: string, marketUrl: string, price: string, stake: string, outcome: string, currency: string = "PLAY_EUR"): Promise<AxiosResponse> {
        currency = process.env.REACT_APP_DEV === "true" ? "PLAY_EUR" : 'USDC'
        const referenceId = uuidv4()
        const cResponse = await cloudbetapi.get(
            `/v2/odds/events/${eventId}`
        )
        const data: CloudbetEvent = cResponse.data;
        for (let marketsKey in data.markets) {
            if (marketsKey.includes("moneyline")) {  // only interested in moneyline markets for now
                const selectedMarket = data.markets[marketsKey]
                for (const selection of selectedMarket.submarkets[Object.keys(selectedMarket.submarkets)[0]].selections) {
                    // @ts-ignore
                    if (selection.outcome === outcome) {
                        if (parseFloat(price) !== selection.price) {
                            console.log("got error")
                            return Promise.reject(
                                new AxiosError(
                                    `Bet laid for ${price} but latest price is ${selection.price}. Try refreshing the page`
                                )
                            )

                        }
                    }
                }
            }
        }

        try {
            const response = await cloudbetapi.post(
                "/v3/bets/place",
                {
                    currency,
                    eventId,
                    marketUrl,
                    price,
                    stake,
                    referenceId
                },
            );
            return response
        } catch (e) {
            return Promise.reject(e);
        }
    }

    // Place a bet on Polymarket
    placePolymarketBet(tokenId: string, price: number, size: number, conditionId: string, outcome_price: number, side: string = "buy", test = true) {
        test = process.env.REACT_APP_DEV === "true"
        if (test) {
            const response = this.polymarketBetApi.post("/test/trade", {
                price: price,
                size: size,
                side: side,
                token_id: tokenId,
                condition_id: conditionId,
                outcome_price: outcome_price
            })
            return response
        }

        const response = this.polymarketBetApi.post("/trade", {
            price: price,
            size: size,
            side: side,
            token_id: tokenId,
            condition_id: conditionId,
            outcome_price: outcome_price
        })
        return response
    }
}
