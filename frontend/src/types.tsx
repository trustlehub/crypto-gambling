interface Sport {
    id: string;
    sport_key: string;
    sport_title: string;
    commence_time: string;
    home_team: string;
    away_team: string;
    bookmakers: Bookmaker[];

}

interface Bookmaker {
    key: string;
    title: string;
    last_update: string;
    markets: Market[]
}

interface Market {
    key: 'h2h' | 'spreads' | 'totals' | 'outrights' | 'h2h_lay';
    last_update: string;
    outcomes: Outcome[];
}

interface Outcome {
    name: string;
    price: number;
}


interface OddsCleaned {
    event: string;
    time: string;
    bet_team: string;
    bookmaker: string;
    exchange: string;
    odds: number;
    lay: number;
    avail: number;
    home_team: string;
    away_team: string;
    odds_last_update: string;
    lay_last_update: string;
    lay_outcome_id: number;
    back_outcome_id: number;
    rating: string;
    maxLay: string;
    meta?: {
        [key: string]: any; 
    };
}

interface SportExtended extends Sport {

}

// sanitizer types
export interface OutcomeData {
    price: number;
    maxStake: number;
    minStake: number;
    [key: string]: any;
};

interface CloudbetOutcomeData extends OutcomeData {
    cloudbetParams: string
    cloudbetMarketKey: string
    eventId: string
}

interface PolymarketOutcomeData extends  OutcomeData {
    clobTokenIds: string[];
    orderMinSize: number;
    bestAsk: number;
    volume: string;
    
    
}

type EventOdds = {
    name: string;
    home_team: string;
    away_team: string;
    time: string; // You can use Date if it's a Date object
    polymarket: {
        [outcome: string]: PolymarketOutcomeData;
    };
    cloudbet: {
        [outcome: string]: CloudbetOutcomeData;
    };
};

type FilteredOdds = {
    [key: string]: EventOdds;
};
export type {Sport, OddsCleaned, SportExtended, Bookmaker, Market, Outcome, FilteredOdds}
