def lay_stake_calc(back_odds: float, lay_odds: float, back_stake: float, exchange_com: float) -> float:
    return (back_stake * back_odds) / (lay_odds - (lay_odds * exchange_com))


def max_back_stake_calc(max_lay: float, lay_odds: float, back_odds: float, exchange_com: float) -> float:
    return (max_lay * (lay_odds - (lay_odds * exchange_com))) / back_odds


def liability_calc(lay_stake: float, lay_odds: float) -> float:
    return lay_stake * (lay_odds - 1)


def profit_bookmaker_wins(back_stake: float, back_odds: float, liability: float) -> dict:
    bookmaker = back_stake * (back_odds - 1)
    exchange = -1 * liability
    profit = bookmaker + exchange
    return {'bookmaker': bookmaker, 'exchange': exchange, 'profit': profit}


def profit_exchange_wins(back_stake: float, lay_stake: float, exchange_com: float) -> dict:
    bookmaker = -1 * back_stake
    exchange = lay_stake - (lay_stake * exchange_com / 100)
    profit = bookmaker + exchange
    return {'bookmaker': bookmaker, 'exchange': exchange, 'profit': profit}


def rating_calc(back_odds: float, lay_odds: float, exchange_com: float = 0, back_stake: float = 10) -> str:
    lay_stake = lay_stake_calc(back_odds, lay_odds, back_stake, exchange_com)
    profit_from_exchange = profit_exchange_wins(back_stake, lay_stake, exchange_com)
    return f"{((back_stake + profit_from_exchange['profit']) / back_stake * 100):.1f}"
