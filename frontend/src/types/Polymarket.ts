export interface PolymarketOdds {
    clobTokenIds: string;
    id: string
    outcomes: string
    outcomePrices: string
    volumeNum: number
    enableOrderBook: boolean
    gameStartTime: string
    question: string
    slug: string
    bestAsk: number;
    orderMinSize: number;
    volume: string
    conditionId: string
}

export interface CleanedPolymarketOdds extends Omit<PolymarketOdds, 'outcomes' | "clobTokenIds">{
    outcomes: string[]
    clobTokenIds: string[]
}
