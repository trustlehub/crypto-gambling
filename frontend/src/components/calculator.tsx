import React, {useEffect, useState} from "react";
import {Box, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography} from "@mui/material";

const style = {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '60vw',
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
};

const lay_stake_calc = (back_odds: number, lay_odds: number, back_stake: number, exchange_com: number) => {
    return (back_stake * back_odds) / (lay_odds - (lay_odds * exchange_com))

}
const liability_calc = (lay_stake: number, lay_odds: number) => {
    return lay_stake * (lay_odds - 1)
}

const profit_bookmaker_wins = (back_stake: number, back_odds: number, liability: number) => {
    const bookmaker = back_stake * (back_odds - 1)
    const exchange = -1 * liability
    const profit = bookmaker + exchange
    return {bookmaker, exchange, profit}
}

const profit_exchange_wins = (back_stake: number, lay_stake: number, exchange_com:number) => {
    const bookmaker = -1 * back_stake
    const exchange = lay_stake - (lay_stake * exchange_com/ 100)
    const profit = bookmaker + exchange
    return {bookmaker, exchange, profit}
}
const Calculator= ({back_odds, lay_odds}:{back_odds: number,  lay_odds: number}) => {
    const [back_odds_input, setBack_odds_input] = useState(back_odds)
    const [lay_odds_input, setLay_odds_input] = useState(lay_odds)
    const [bookmaker_com, setBookmaker_com] = useState(0)
    const [exchange_com, setExchange_com] = useState(0)
    const [back_stake, setBack_stake] = useState(10)
    const [back_win, setBack_win] = useState({
        bookmaker: 0,
        exchange:0,
        profit:0
    })
    const [lay_win, setLay_win] = useState({
        bookmaker: 0,
        exchange:0,
        profit:0
    })
    const [lay_stake, setLay_stake] = useState(0)
    const [liability, setLiability] = useState(0)

    useEffect(() => {   
        const lay = lay_stake_calc(
            back_odds_input,
            lay_odds_input,
            back_stake,
            exchange_com
        )
        const liability = liability_calc(
            lay, 
            lay_odds_input
        )
        setLiability(liability)
        setLay_stake(lay)
        setLay_win(profit_exchange_wins(
            back_stake,
            lay,
            exchange_com
        ))    
        setBack_win(profit_bookmaker_wins(back_stake, back_odds_input, liability))
        
    }, [back_odds_input,lay_odds_input, bookmaker_com, exchange_com, back_stake  ]);
    return <Box sx={{...style}}>
        <Box sx={{display: 'grid', gridAutoFlow: 'column',}}>
            <Box sx={{minHeight: '80px', minWidth: '100px', }}>
                <Typography variant='h5'>
                    Bookmaker
                </Typography>
                <TextField
                    label="Odds"
                    value={back_odds_input}
                    type={'number'}
                    onChange={event => setBack_odds_input(parseInt((event.target.value)))}
                />
                <TextField
                    label="Stake"
                    value={back_stake}
                    type={'number'}
                    onChange={event => setBack_stake(parseInt((event.target.value)))}
                />
                <TextField
                    label="Com %"
                    value={bookmaker_com}
                    type={'number'}
                    onChange={event => setBookmaker_com(parseInt((event.target.value)))}
                />
                <Typography variant='body1'>
                    Bet {back_stake} at odds of {back_odds_input}
                </Typography>
            </Box>
            <Box sx={{minHeight: '80px', minWidth: '100px', }}>
                <Typography variant='h5'>
                    Exchange
                </Typography>
                <TextField
                    label="Odds"
                    value={lay_odds_input}
                    type={'number'}
                    onChange={event => setLay_odds_input(parseInt((event.target.value)))}
                />
                <TextField
                    label="Com %"
                    value={exchange_com}
                    type={'number'}
                    onChange={event => setExchange_com(parseInt((event.target.value)))}
                />
                <Typography variant='body1'>
                   Lay {lay_stake} at odds of {lay_odds_input} 
                </Typography>
            </Box>
        </Box>
        <Box>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell></TableCell>
                        <TableCell>Bookmaker</TableCell>
                        <TableCell>Exchange</TableCell>
                        <TableCell>Profit</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    <TableRow>
                        <TableCell>Bookmaker bet(back) wins</TableCell>
                        <TableCell>{back_win.bookmaker}</TableCell>
                        <TableCell>{back_win.exchange}</TableCell>
                        <TableCell>{back_win.profit}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Exchange bet(lay) wins</TableCell>
                        <TableCell>{lay_win.bookmaker}</TableCell>
                        <TableCell>{lay_win.exchange}</TableCell>
                        <TableCell>{lay_win.profit}</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </Box>
    </Box>
}

export default Calculator
