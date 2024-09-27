// Import required modules for HTTP requests
import axios, {AxiosInstance, AxiosResponse} from 'axios';
import {v4 as uuidv4} from 'uuid';
import {cloudbetapi} from "../apis/cloudbet";

// Cloudbet and Polymarket API URLs
const CLOUD_BET_BASE_URL = 'https://api.cloudbet.com';

interface BetResponse {
    success: boolean;
    message: string;
    data?: any;
}

export class BettingService {
    private cloudbetApi: AxiosInstance;
    // private polymarketApi: AxiosInstance;

    constructor() {
        this.cloudbetApi = cloudbetapi;
        // this.polymarketApi = polymarketApi;
    }

    // Place a bet on Cloudbet
    async placeCloudbetBet(eventId: string, marketUrl: string, price: string, stake: string, currency: string = "PLAY_EUR"): Promise<AxiosResponse> {
        const referenceId = uuidv4()
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
    }

    // Place a bet on Polymarket
    // async placePolymarketBet(marketId: string, outcome: string, stake: number): Promise<BetResponse> {
    //     try {
    //         const response = await axios.post(
    //             `${POLY_MARKET_BASE_URL}/v1/bets`,
    //             {
    //                 marketId,
    //                 outcome,
    //                 stake,
    //             },
    //             {
    //                 headers: {
    //                     'Authorization': `Bearer ${this.polymarketApiKey}`,
    //                     'Content-Type': 'application/json',
    //                 },
    //             }
    //         );
    //         return {
    //             success: true,
    //             message: 'Bet placed successfully on Polymarket',
    //             data: response.data,
    //         };
    //     } catch (error) {
    //         return {
    //             success: false,
    //             message: `Polymarket error: ${error.message}`,
    //         };
    //     }
    // }
}
