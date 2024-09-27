import {FilteredOdds, OddsCleaned} from "../types";
import {CloudbetCompetition, CloudbetEvent} from "../types/Cloudbet";
import {CleanedPolymarketOdds} from "../types/Polymarket";

import {ratingCalc} from "../utils/calc";

export const SanitizeOdds_Cloudbet_Polymarket = (polymarketOdds: CleanedPolymarketOdds[], cloudbetCompetitions: CloudbetCompetition[]): OddsCleaned[] => {
    const matched: OddsCleaned[] = []
    // remove events with null home and away teams in cloudbetCompetitions
    for (let cComp of cloudbetCompetitions) {
        cComp.events = cComp.events.filter((comp) => {
            return comp.home !== null && comp.away !== null
        })
    }

    let filteredOdds: FilteredOdds = {}
    for (const cComp of cloudbetCompetitions) {
        for (const event of cComp.events) {
            for (let pOdds of polymarketOdds) {
                let eventMatched: boolean = false

                for (const outcome of pOdds.outcomes) { // if bot teams names in the outcomes are included in the event key of cloudbet, event is matched
                    if (event.key.includes(outcome.toLowerCase())) { // team name is in event key?
                        if (new Date(event.cutoffTime).getTime() === new Date(pOdds.gameStartTime).getTime()) { // game start times match up?
                            eventMatched = true
                            console.log(outcome.toLowerCase(), event.key)
                        }
                    } else { // if even one outcome is not in key, probably not our game. quit loop
                        break
                    }
                }

                if (eventMatched) {
                    console.log(pOdds.outcomes)
                    let outcomesPoly: string[] = pOdds.outcomes.map((element) => element.toLowerCase())
                    pOdds.outcomePrices = JSON.parse(pOdds.outcomePrices)
                    outcomesPoly.forEach((outcome, index) => {
                        if (filteredOdds[event.key]?.polymarket && filteredOdds[event.key]?.cloudbet) {

                            filteredOdds[event.key] = {
                                name: event.name,
                                time: event.cutoffTime,
                                home_team: event.home.name,
                                away_team: event.away.name,
                                polymarket: {
                                    ...filteredOdds[event.key].polymarket,
                                    [outcome]: {
                                        price: parseFloat((1 / parseFloat(pOdds.outcomePrices[index])).toFixed(3)),
                                        maxStake: 0,
                                        minStake: 0,
                                    }
                                },
                                cloudbet: {
                                    ...filteredOdds[event.key].cloudbet,
                                    [outcome]: {
                                        price: 0,
                                        maxStake: 0,
                                        minStake: 0,
                                    }
                                },
                            }
                        } else {

                            filteredOdds[event.key] = {
                                name: event.name,
                                time: event.cutoffTime,
                                home_team: event.home.name,
                                away_team: event.away.name,
                                polymarket: {
                                    [outcome]: {
                                        price: parseFloat((1 / parseFloat(pOdds.outcomePrices[index])).toFixed(3)),
                                        maxStake: 0,
                                        minStake: 0,
                                    }
                                },
                                cloudbet: {
                                    [outcome]: {
                                        price: 0,
                                        maxStake: 0,
                                        minStake: 0,
                                    }
                                },
                            }
                        }
                    })

                    for (let market in event.markets) {
                        if (market.includes("moneyline")) {  // only interested in moneyline markets for now
                            const selectedMarket = event.markets[market]
                            for (const selection of selectedMarket.submarkets[Object.keys(selectedMarket.submarkets)[0]].selections) {
                                // @ts-ignore
                                const team_key = event[selection.outcome].key
                                for (const eventKey of Object.keys(filteredOdds)) {
                                    for (const teamName of Object.keys(filteredOdds[eventKey].cloudbet)) {
                                        if (team_key.includes(teamName)) {
                                            filteredOdds[eventKey].cloudbet[teamName].price = selection.price
                                            filteredOdds[eventKey].cloudbet[teamName].maxStake = selection.maxStake
                                            filteredOdds[eventKey].cloudbet[teamName].minStake = selection.minStake

                                        }
                                    }
                                }

                            }
                        }
                    }
                    console.log(event.markets)

                }
            }
        }
    }
    console.log(cloudbetCompetitions)
    console.log(polymarketOdds)
    console.log(filteredOdds)
    console.log(filteredOdds)

    for (const odd in filteredOdds) {
        // cloudbet lay, poly back, backing A
        let bet_team = filteredOdds[odd].polymarket
        let back_odds = filteredOdds[odd].polymarket[Object.keys(bet_team)[0]].price
        let lay_odds = filteredOdds[odd].cloudbet[Object.keys(bet_team)[0]].price
        let rating = ratingCalc(
            back_odds,
            lay_odds,
            0
        )
        matched.push({
            event: filteredOdds[odd].name,
            time: filteredOdds[odd].time,
            bet_team: Object.keys(bet_team)[0],
            bookmaker: "Polymarket",
            exchange: "Cloudbet",
            odds: back_odds,
            lay: lay_odds,
            avail: 0,
            home_team: filteredOdds[odd].home_team,
            away_team: filteredOdds[odd].away_team,
            odds_last_update: new Date().toISOString(),
            lay_last_update: new Date().toISOString(),
            rating: rating,
        })

        // cloudbet lay, poly back, backing B
        bet_team = filteredOdds[odd].polymarket
        back_odds = filteredOdds[odd].polymarket[Object.keys(bet_team)[1]].price
        lay_odds = filteredOdds[odd].cloudbet[Object.keys(bet_team)[1]].price
        rating = ratingCalc(
            back_odds,
            lay_odds,
            0
        )
        matched.push({
            event: filteredOdds[odd].name,
            time: filteredOdds[odd].time,
            bet_team: Object.keys(bet_team)[1],
            bookmaker: "Polymarket",
            exchange: "Cloudbet",
            odds: back_odds,
            lay: lay_odds,
            avail: 0,
            home_team: filteredOdds[odd].home_team,
            away_team: filteredOdds[odd].away_team,
            odds_last_update: new Date().toISOString(),
            lay_last_update: new Date().toISOString(),
            rating: rating,
        })
        // cloudbet back, poly lay, backing A
        bet_team = filteredOdds[odd].cloudbet
        back_odds = filteredOdds[odd].cloudbet[Object.keys(bet_team)[0]].price
        lay_odds = filteredOdds[odd].polymarket[Object.keys(bet_team)[0]].price
        rating = ratingCalc(
            back_odds,
            lay_odds,
            0
        )
        matched.push({
            event: filteredOdds[odd].name,
            time: filteredOdds[odd].time,
            bet_team: Object.keys(bet_team)[0],
            bookmaker: "Cloudbet",
            exchange: "Polymarket",
            odds: back_odds,
            lay: lay_odds,
            avail: 0,
            home_team: filteredOdds[odd].home_team,
            away_team: filteredOdds[odd].away_team,
            odds_last_update: new Date().toISOString(),
            lay_last_update: new Date().toISOString(),
            rating: rating,
        })
        // cloudbet back, poly lay, backing B
        bet_team = filteredOdds[odd].cloudbet
        back_odds = filteredOdds[odd].cloudbet[Object.keys(bet_team)[1]].price
        lay_odds = filteredOdds[odd].polymarket[Object.keys(bet_team)[1]].price
        rating = ratingCalc(
            back_odds,
            lay_odds,
            0
        )
        matched.push({
            event: filteredOdds[odd].name,
            time: filteredOdds[odd].time,
            bet_team: Object.keys(bet_team)[1],
            bookmaker: "Cloudbet",
            exchange: "Polymarket",
            odds: back_odds,
            lay: lay_odds,
            avail: 0,
            home_team: filteredOdds[odd].home_team,
            away_team: filteredOdds[odd].away_team,
            odds_last_update: new Date().toISOString(),
            lay_last_update: new Date().toISOString(),
            rating: rating,
        })
    }

    console.log(matched)
    matched.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating))
    return matched
}