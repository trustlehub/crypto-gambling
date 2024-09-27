export interface PolymarketOdds {
    id: string
    outcomes: string
    outcomePrices: string
    volumeNum: number
    enableOrderBook: boolean
    gameStartTime: string
    question: string
}

export interface CleanedPolymarketOdds extends Omit<PolymarketOdds, 'outcomes'>{
    outcomes: string[]
}
