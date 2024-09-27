export const layStakeCalc = (back_odds: number, lay_odds: number, back_stake: number, exchange_com: number) => {
    return (back_stake * back_odds) / (lay_odds - (lay_odds * exchange_com))

}
export const liabilityCalc = (lay_stake: number, lay_odds: number) => {
    return lay_stake * (lay_odds - 1)
}
export const profitBookmakerWins = (back_stake: number, back_odds: number, liability: number) => {
    const bookmaker = back_stake * (back_odds - 1)
    const exchange = -1 * liability
    const profit = bookmaker + exchange
    return {bookmaker, exchange, profit}
}
export const profitExchangeWins = (back_stake: number, lay_stake: number, exchange_com: number) => {
    const bookmaker = -1 * back_stake
    const exchange = lay_stake - (lay_stake * exchange_com / 100)
    const profit = bookmaker + exchange
    return {bookmaker, exchange, profit}
}
export const ratingCalc = (back_odds: number, lay_odds: number, exchange_com: number = 0, back_stake: number = 10) => {
    const lay_stake = layStakeCalc(back_odds, lay_odds, back_stake, exchange_com)
    const profit_from_exchange = profitExchangeWins(back_stake, lay_stake, exchange_com)
    return ((back_stake + profit_from_exchange.profit) / back_stake * 100).toFixed(1)
}