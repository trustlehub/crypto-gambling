import React, {createContext, useContext, useEffect, useRef, useState} from 'react';
import {OddsCleaned} from "../types";
import {CleanedPolymarketOdds} from "../types/Polymarket";
import {CloudbetApiData, PolymarketApiData} from "./OddsApiService";
import {SanitizeOdds_Cloudbet_Polymarket} from "../sanitizers/OddsSanitizer";
import {BettingContextProps} from "../types/BettingContextProps";
import {BettingService} from "./BettingService";

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
    bettingService: new BettingService()

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
    const bettingService = useRef<BettingService>(defaultContextValues.bettingService)
    const repeatTillOddsListFull = async () => {
        let oddsList: CleanedPolymarketOdds[] = []
        const requests = [];

        for (let i = 0; i < 60; i++) {
            // Collect promises for network requests
            requests.push(PolymarketApiData(i));
        }

        try {
            // Resolve all network requests in parallel
            const results = await Promise.all(requests);

            // Flatten the result and concatenate with the current oddsList
            const allData = results.flat(); // Assuming each API call returns an array of odds
            oddsList = oddsList.concat(allData);

            // Filter out duplicates based on 'id'
            oddsList = oddsList.filter((item, index, self) =>
                index === self.findIndex((obj) => obj.id === item.id)
            );

        } catch (error) {
            console.error('Error fetching data:', error);
        }

        return oddsList;
    }

    const getOdds = async () => {
        const responses = await Promise.all([repeatTillOddsListFull(), CloudbetApiData()])
        const odds = SanitizeOdds_Cloudbet_Polymarket(responses[0], responses[1])
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
                bettingService: bettingService.current,
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
