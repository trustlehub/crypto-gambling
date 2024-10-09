import React, {createContext, useContext, useEffect, useRef, useState} from 'react';
import {OddsCleaned} from "../types";
import {BettingContextProps} from "../types/BettingContextProps";

// Create a context
const defaultContextValues: BettingContextProps = {
    back_odds_input: 0,
    setBack_odds_input: () => {
    },
    lay_odds_input: 0,
    setLay_odds_input: () => {
    },
    bookmaker_com: 0,
    setBookmaker_com: () => {
    },
    exchange_com: 0,
    setExchange_com: () => {
    },
    back_stake: 10,
    setBack_stake: () => {
    },
    back_win: {bookmaker: 0, exchange: 0, profit: 0},
    setBack_win: () => {
    },
    lay_win: {bookmaker: 0, exchange: 0, profit: 0},
    setLay_win: () => {
    },
    lay_stake: 0,
    setLay_stake: () => {
    },
    liability: 0,
    setLiability: () => {
    },
    data: [],
    setData: () => {
    },
    getOdds: async () => {
    },
    selectedData: null,
    setSelectedData: () => {
    },

};
const BettingContext = createContext<BettingContextProps>(defaultContextValues); //TODO: add a proper default and type

// Create a provider component
export const BettingProvider = ({children}: { children: React.ReactNode }) => {
    const [back_odds_input, setBack_odds_input] = useState(0); // initialize as needed
    const [lay_odds_input, setLay_odds_input] = useState(0); // initialize as needed
    const [bookmaker_com, setBookmaker_com] = useState(0);
    const [exchange_com, setExchange_com] = useState(0);
    const [back_stake, setBack_stake] = useState(10);
    const [back_win, setBack_win] = useState({
        bookmaker: 0,
        exchange: 0,
        profit: 0,
    });
    const [lay_win, setLay_win] = useState({
        bookmaker: 0,
        exchange: 0,
        profit: 0,
    });
    const [lay_stake, setLay_stake] = useState(0);
    const [liability, setLiability] = useState(0);
    const [data, setData] = useState<OddsCleaned[]>([])
    const [selectedData, setSelectedData] = useState<OddsCleaned | null>(null)

    const getOdds = async () => {
        const response = await fetch("http://localhost:8000/get_events/")
        const odds = await response.json();
        setData(odds)
    }
    return (
        <BettingContext.Provider
            value={{
                back_odds_input,
                setBack_odds_input,
                lay_odds_input,
                setLay_odds_input,
                bookmaker_com,
                setBookmaker_com,
                exchange_com,
                setExchange_com,
                back_stake,
                setBack_stake,
                back_win,
                setBack_win,
                lay_win,
                setLay_win,
                lay_stake,
                setLay_stake,
                liability,
                setLiability,
                data,
                setData,
                getOdds,
                selectedData,
                setSelectedData,
            }}
        >
            {children}
        </BettingContext.Provider>
    );
};

// Custom hook for easy access to context
export const useBetting = () => {
    return useContext(BettingContext);
};
