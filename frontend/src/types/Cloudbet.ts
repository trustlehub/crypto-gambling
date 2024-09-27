export type CloudbetTeam = {
    name: string
    key: string
}
export type CloudbetSelection = {
    outcome: string
    params: string
    price: number
    minStake: number
    maxStake: number
    side: 'BACK' | 'LAY'
    status: 'SELECTION_DISABLED' | 'SELECTION_ENABLED'
    
}
export type CloudbetMarket = {
    submarkets: {
        [key: string]: {
            selections: CloudbetSelection[]
            sequence: string
        }
    }
}
export type CloudbetMarkets = {
    [key: string]: CloudbetMarket
}
export type CloudbetEvent = {
    away: CloudbetTeam
    home: CloudbetTeam
    markets: CloudbetMarkets
    name: string
    status: string
    cutoffTime: string
    key: string
}
export type CloudbetCompetition = {
    category: {
        name: string
        key: string
    }
    events: CloudbetEvent[]
    name: string
    key: string
}

export interface CloudbetOddsResponse {
    competitions: CloudbetCompetition[]
}

export interface CloudbetCompetitionsResponse {
    categories: {
        competitions: {
            name: string
            key: string
            eventCount: number
        }[]
        key: string
        name: string
    }[]
    key: string
    name: string
}