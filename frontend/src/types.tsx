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
    rating: string;

}

interface SportExtended extends Sport {

}

export type {Sport, OddsCleaned, SportExtended, Bookmaker, Market, Outcome}
