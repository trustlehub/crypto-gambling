import {FilteredOdds, OddsCleaned, OutcomeData} from "../types";
import {CloudbetCompetition, CloudbetEvent} from "../types/Cloudbet";
import {CleanedPolymarketOdds, PolymarketOdds} from "../types/Polymarket";

import {ratingCalc} from "../utils/calc";

export const SanitizeOdds_Cloudbet_Polymarket = (polymarketOdds: PolymarketOdds[], cloudbetCompetitions: CloudbetCompetition[], balance: number): OddsCleaned[] => {
    const matched: OddsCleaned[] = []
    // remove events with null home and away teams in cloudbetCompetitions
    for (let cComp of cloudbetCompetitions) {
        cComp.events = cComp.events.filter((comp) => {
            return comp.home !== null && comp.away !== null
        })
    }


    let allOutcomes: string[] = []
    // @ts-ignore
    const filteredPolymarketOdds: CleanedPolymarketOdds[] = polymarketOdds.filter(market => {
        market.outcomes = JSON.parse(market.outcomes)
        if (market.clobTokenIds) {
            market.clobTokenIds = JSON.parse(market.clobTokenIds)
        }
        return !market.outcomes.includes("Yes") && !market.outcomes.includes("No") &&
            !market.outcomes.includes("Under") && !market.outcomes.includes("Over") &&
            !market.slug.includes("points") && !market.slug.includes("more")
    })
    console.log("all outcomes", allOutcomes)

    let filteredOdds: FilteredOdds = {}
    for (const cComp of cloudbetCompetitions) {
        for (const event of cComp.events) {
            for (let pOdds of filteredPolymarketOdds) {
                let eventMatched: boolean = false

                for (const outcome of pOdds.outcomes) { // if bot teams names in the outcomes are included in the event key of cloudbet, event is matched
                    if (event.key.includes(outcome.toLowerCase())) { // team name is in event key?
                        console.log("teams match", outcome.toLowerCase(), event.key)
                        if (new Date(event.cutoffTime).getTime() === new Date(pOdds.gameStartTime).getTime()) { // game start times match up?
                            eventMatched = true
                            console.log(outcome.toLowerCase(), event.key)
                        }else {
                            console.log("times don't match. possibly not the same event")
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
                                        clobTokenIds: pOdds.clobTokenIds,
                                        bestAsk: pOdds.bestAsk,
                                        orderMinSize: pOdds.orderMinSize,
                                        volume: pOdds.volume,
                                        conditionId: pOdds.conditionId
                                    }
                                },
                                cloudbet: {
                                    ...filteredOdds[event.key].cloudbet,
                                    [outcome]: {
                                        price: 0,
                                        maxStake: 0,
                                        minStake: 0,
                                        cloudbetParams: "",
                                        cloudbetMarketKey: "",
                                        eventId: "",
                                        teamData: {}
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
                                        clobTokenIds: pOdds.clobTokenIds,
                                        bestAsk: pOdds.bestAsk,
                                        orderMinSize: pOdds.orderMinSize,
                                        volume: pOdds.volume,
                                        conditionId: pOdds.conditionId
                                    }
                                },
                                cloudbet: {
                                    [outcome]: {
                                        price: 0,
                                        maxStake: 0,
                                        minStake: 0,
                                        cloudbetParams: "",
                                        cloudbetMarketKey: "",
                                        eventId: "",
                                        teamData: {}
                                    }
                                },
                            }
                        }
                    })

                    for (let marketsKey in event.markets) {
                        if (marketsKey.includes("moneyline")) {  // only interested in moneyline markets for now
                            const selectedMarket = event.markets[marketsKey]
                            for (const selection of selectedMarket.submarkets[Object.keys(selectedMarket.submarkets)[0]].selections) {
                                // @ts-ignore
                                const team_key = event[selection.outcome].key
                                for (const eventKey of Object.keys(filteredOdds)) {
                                    for (const teamName of Object.keys(filteredOdds[eventKey].cloudbet)) {
                                        if (team_key.includes(teamName)) {
                                            filteredOdds[eventKey].cloudbet[teamName].price = selection.price
                                            filteredOdds[eventKey].cloudbet[teamName].maxStake = selection.maxStake
                                            filteredOdds[eventKey].cloudbet[teamName].minStake = selection.minStake
                                            filteredOdds[eventKey].cloudbet[teamName].cloudbetParams = selection.params
                                            filteredOdds[eventKey].cloudbet[teamName].cloudbetMarketKey = marketsKey
                                            filteredOdds[eventKey].cloudbet[teamName].eventId = event.id.toString()
                                            filteredOdds[eventKey].cloudbet[teamName].teamData.home = event.home
                                            filteredOdds[eventKey].cloudbet[teamName].teamData.away = event.away
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
    console.log(filteredPolymarketOdds)
    console.log(filteredOdds)


    for (const odd in filteredOdds) {
        // cloudbet lay, poly back, backing A
        let bet_team: { [p: string]: OutcomeData } = filteredOdds[odd].polymarket
        let bet_team_name = Object.keys(bet_team)[0]
        let lay_team_name = Object.keys(bet_team)[1]
        let back_odds = filteredOdds[odd].polymarket[bet_team_name].price
        let lay_odds = filteredOdds[odd].cloudbet[lay_team_name].price
        let rating = ratingCalc(
            back_odds,
            lay_odds,
            0
        )
        matched.push({
            event: filteredOdds[odd].name,
            time: filteredOdds[odd].time,
            bet_team: bet_team_name,
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
            maxLay: filteredOdds[odd].cloudbet[lay_team_name].maxStake.toFixed(2) + " EUR",
            meta: {
                cloudbetParams: filteredOdds[odd].cloudbet[lay_team_name].cloudbetParams,
                cloudbetMarketKey: filteredOdds[odd].cloudbet[lay_team_name].cloudbetMarketKey,
                cloudbetEventId: filteredOdds[odd].cloudbet[lay_team_name].eventId,
                teamData: filteredOdds[odd].cloudbet[lay_team_name].teamData,
                outcomes: Object.keys(bet_team),
                clobTokenId: filteredOdds[odd].polymarket[bet_team_name].clobTokenIds[0],
                orderMinSize: filteredOdds[odd].polymarket[bet_team_name].orderMinSize,
                bestAsk: filteredOdds[odd].polymarket[bet_team_name].bestAsk,
                conditionId: filteredOdds[odd].polymarket[bet_team_name].conditionId
            }
        })

        // cloudbet lay, poly back, backing B
        bet_team = filteredOdds[odd].polymarket
        bet_team_name = Object.keys(bet_team)[1]
        lay_team_name = Object.keys(bet_team)[0]
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
            bet_team: bet_team_name,
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
            maxLay: filteredOdds[odd].cloudbet[lay_team_name].maxStake.toFixed(2) + " EUR",
            meta: {
                cloudbetParams: filteredOdds[odd].cloudbet[lay_team_name].cloudbetParams,
                cloudbetMarketKey: filteredOdds[odd].cloudbet[lay_team_name].cloudbetMarketKey,
                cloudbetEventId: filteredOdds[odd].cloudbet[lay_team_name].eventId,
                teamData: filteredOdds[odd].cloudbet[lay_team_name].teamData,
                outcomes: Object.keys(bet_team),
                clobTokenId: filteredOdds[odd].polymarket[bet_team_name].clobTokenIds[1],
                orderMinSize: filteredOdds[odd].polymarket[bet_team_name].orderMinSize,
                bestAsk: filteredOdds[odd].polymarket[bet_team_name].bestAsk,
                conditionId: filteredOdds[odd].polymarket[bet_team_name].conditionId
            }
        })

        // cloudbet back, poly lay, backing A
        bet_team = filteredOdds[odd].cloudbet
        bet_team_name = Object.keys(bet_team)[0]
        lay_team_name = Object.keys(bet_team)[1]
        back_odds = filteredOdds[odd].cloudbet[bet_team_name].price
        lay_odds = filteredOdds[odd].polymarket[lay_team_name].price
        rating = ratingCalc(
            back_odds,
            lay_odds,
            0
        )
        matched.push({
            event: filteredOdds[odd].name,
            time: filteredOdds[odd].time,
            bet_team: bet_team_name,
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
            maxLay: (balance / 1e6).toFixed(2) + " USD",
            meta: {
                cloudbetParams: filteredOdds[odd].cloudbet[bet_team_name].cloudbetParams,
                cloudbetMarketKey: filteredOdds[odd].cloudbet[bet_team_name].cloudbetMarketKey,
                cloudbetEventId: filteredOdds[odd].cloudbet[bet_team_name].eventId,
                teamData: filteredOdds[odd].cloudbet[bet_team_name].teamData,
                outcomes: Object.keys(bet_team),
                clobTokenId: filteredOdds[odd].polymarket[lay_team_name].clobTokenIds[1],
                orderMinSize: filteredOdds[odd].polymarket[lay_team_name].orderMinSize,
                bestAsk: filteredOdds[odd].polymarket[lay_team_name].bestAsk,
                conditionId: filteredOdds[odd].polymarket[lay_team_name].conditionId
            }
        })

        // cloudbet back, poly lay, backing B
        bet_team = filteredOdds[odd].cloudbet
        bet_team_name = Object.keys(bet_team)[1]
        lay_team_name = Object.keys(bet_team)[0]
        back_odds = filteredOdds[odd].cloudbet[bet_team_name].price
        lay_odds = filteredOdds[odd].polymarket[lay_team_name].price
        rating = ratingCalc(
            back_odds,
            lay_odds,
            0
        )
        matched.push({
            event: filteredOdds[odd].name,
            time: filteredOdds[odd].time,
            bet_team: bet_team_name,
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
            maxLay: (balance / 1e6).toFixed(2) + " USD",
            meta: {
                cloudbetParams: filteredOdds[odd].cloudbet[bet_team_name].cloudbetParams,
                cloudbetMarketKey: filteredOdds[odd].cloudbet[bet_team_name].cloudbetMarketKey,
                cloudbetEventId: filteredOdds[odd].cloudbet[bet_team_name].eventId,
                teamData: filteredOdds[odd].cloudbet[bet_team_name].teamData,
                outcomes: Object.keys(bet_team),
                clobTokenId: filteredOdds[odd].polymarket[lay_team_name].clobTokenIds[0],
                orderMinSize: filteredOdds[odd].polymarket[lay_team_name].orderMinSize,
                bestAsk: filteredOdds[odd].polymarket[lay_team_name].bestAsk,
                conditionId: filteredOdds[odd].polymarket[lay_team_name].conditionId
            }
        })
    }

    matched.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating))
    return matched
}