import {OddsCleaned} from "../types";

export interface BettingContextProps {
    back_odds_input: number;
    setBack_odds_input: React.Dispatch<React.SetStateAction<number>>;
    lay_odds_input: number;
    setLay_odds_input: React.Dispatch<React.SetStateAction<number>>;
    bookmaker_com: number;
    setBookmaker_com: React.Dispatch<React.SetStateAction<number>>;
    exchange_com: number;
    setExchange_com: React.Dispatch<React.SetStateAction<number>>;
    back_stake: number;
    setBack_stake: React.Dispatch<React.SetStateAction<number>>;
    back_win: {
        bookmaker: number;
        exchange: number;
        profit: number;
    };
    setBack_win: React.Dispatch<React.SetStateAction<{ bookmaker: number; exchange: number; profit: number }>>;
    lay_win: {
        bookmaker: number;
        exchange: number;
        profit: number;
    };
    setLay_win: React.Dispatch<React.SetStateAction<{ bookmaker: number; exchange: number; profit: number }>>;
    lay_stake: number;
    setLay_stake: React.Dispatch<React.SetStateAction<number>>;
    liability: number;
    setLiability: React.Dispatch<React.SetStateAction<number>>;
    data: OddsCleaned[];
    setData: React.Dispatch<React.SetStateAction<OddsCleaned[]>>;
    getOdds: () => Promise<void>;
    selectedData: OddsCleaned | null;
    setSelectedData: React.Dispatch<React.SetStateAction<OddsCleaned | null>>;
}