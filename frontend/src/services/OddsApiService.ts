import {Bookmaker,  Market, OddsCleaned, Sport} from "../types";
import {AxiosResponse} from "axios";
import FilterRules from "../filterRules";
import {CloudbetCompetition, CloudbetCompetitionsResponse, } from "../types/Cloudbet";
import {CleanedPolymarketOdds, PolymarketOdds} from "../types/Polymarket";
import {polymarketapi} from "../apis/polymarket";
import {oddsapi} from "../apis/oddsapi";
import {cloudbetapi} from "../apis/cloudbet";
import {ratingCalc} from "../utils/calc";

export const OddsApiData = async () => {
    const cleanedData: OddsCleaned[] = []
    const response: AxiosResponse = await oddsapi.get(
        '/sports/cricket/odds/',
        {
            params: {
                regions: "us2,eu,us,au,uk",
                markets: 'h2h'
            }
        }
    )
    const data: Sport[] = response.data
    const sports_with_lay: Sport[] = data.filter((sport) => {
        return sport.bookmakers.find((bookmaker) => {
            return FilterRules.includes(bookmaker.key) && bookmaker.markets.find((market) => market.key === 'h2h_lay')
        })
    })
    sports_with_lay.forEach((sport) => {
        let exchanges: Bookmaker[] = sport.bookmakers.filter(bookmaker => {
            return bookmaker.markets.find((market) => market.key === 'h2h_lay')
        })

        exchanges.forEach(exchange => {
            // undefined is only for type checking. It won't be undefined as we filtered out all sports
            // which dont have lay markets
            let lay_market: Market | undefined = exchange.markets.find((m) => m.key === 'h2h_lay')
            lay_market?.outcomes.forEach((lay_outcome) => {
                sport.bookmakers.forEach((bookmaker) => {
                    if (FilterRules.includes(bookmaker.key)) {
                        bookmaker.markets.forEach((market) => {
                            if (market.key == 'h2h') {
                                market.outcomes.forEach(bookmaker_outcome => {
                                    if (bookmaker_outcome.name == lay_outcome.name) {
                                        let localizedDate = new Date(sport.commence_time).toLocaleString(undefined, {
                                            // year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: 'numeric',
                                            minute: 'numeric',
                                        });
                                        let localisedLayUpdate = new Date(exchange.last_update).toLocaleString(undefined, {
                                            // year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: 'numeric',
                                            minute: 'numeric',
                                        });
                                        let localisedOddsUpdate = new Date(market.last_update).toLocaleString(undefined, {
                                            // year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: 'numeric',
                                            minute: 'numeric',
                                        });
                                        cleanedData.push({
                                            time: localizedDate,
                                            event: sport.sport_title,
                                            bookmaker: bookmaker.title,
                                            bet_team: bookmaker_outcome.name,
                                            odds: bookmaker_outcome.price,
                                            lay: lay_outcome.price,
                                            avail: 10,
                                            maxLay: "10",
                                            exchange: exchange.title,
                                            home_team: sport.home_team,
                                            away_team: sport.away_team,
                                            odds_last_update: localisedOddsUpdate,
                                            lay_last_update: localisedLayUpdate,
                                            rating: ratingCalc(bookmaker_outcome.price, lay_outcome.price)
                                        })

                                    }
                                })
                            }
                        })
                    }
                })
            })

        })
    })

    cleanedData.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating))
    return cleanedData
}

export const PolymarketApiData = async (page: number) => {
    const response = await polymarketapi.get(
        `/markets?tag_id=1&closed=false&limit=100&related_tags=true&offset=${page}`
    )
    const data: PolymarketOdds[] = response.data
    return data
}

export const CloudbetApiData = async () => {
    const competitions= await cloudbetapi.get(
        `/v2/odds/sports/basketball`
    )
    const competitionsData: CloudbetCompetitionsResponse = competitions.data;
    const finalData: CloudbetCompetition[] = [];
    const requests = [];

    // Iterate over the categories and competitions to build the request list
    for (const cat of competitionsData.categories) {
        for (const com of cat.competitions) {
            // Push the network request promises to the array
            requests.push(
                cloudbetapi.get(`/v2/odds/competitions/${com.key}?players=true`)
            );
        }
    }

    try {
        // Resolve all requests in parallel using Promise.all
        const responses = await Promise.all(requests);

        // Extract data from each response and add to finalData
        responses.forEach((r) => {
            const data: CloudbetCompetition = r.data;
            finalData.push(data);
        });
    } catch (error) {
        console.error('Error fetching competition data:', error);
    }

    return finalData;
}