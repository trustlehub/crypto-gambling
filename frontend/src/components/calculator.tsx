import React, {useContext, useEffect, useState} from "react";
import {Box, Button, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography} from "@mui/material";
import {layStakeCalc, liabilityCalc, maxBackStakeCalc, profitBookmakerWins, profitExchangeWins} from "../utils/calc";
import {useBetting} from "../services/BettingProvider";

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

const baseUrl = process.env.REACT_APP_BASE_URL;
const Calculator = () => {
    const bettingProvider = useBetting()
    const {selectedData} = bettingProvider
    const [back_odds_input, setBack_odds_input] = useState(selectedData?.odds || 0)
    const [lay_odds_input, setLay_odds_input] = useState(selectedData?.lay || 0)
    const [bookmaker_com, setBookmaker_com] = useState(0)
    const [exchange_com, setExchange_com] = useState(0)
    const [back_stake, setBack_stake] = useState(10)
    const [back_win, setBack_win] = useState({
        bookmaker: 0,
        exchange: 0,
        profit: 0
    })
    const [lay_win, setLay_win] = useState({
        bookmaker: 0,
        exchange: 0,
        profit: 0
    })
    const [lay_stake, setLay_stake] = useState(0)
    const [liability, setLiability] = useState(0)

    const [typing, setTyping] = useState(false)
    const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timer>()
    const [info, setInfo] = useState<{ status: "error" | "good" | null, info: string }>({
        status: null,
        info: ""
    })

    const timeout = 1000
    useEffect(() => {
        if (selectedData) {
            const maxBackStake = maxBackStakeCalc(
                parseFloat(selectedData?.maxLay),
                selectedData?.lay,
                selectedData?.odds,
                0
            )
            if (!typing) {
                if (selectedData?.bookmaker === "polymarket") {
                    if (selectedData.meta) {
                        const roundedValue = Math.round(back_stake / selectedData?.odds) * selectedData?.odds
                        setBack_stake(roundedValue)
                    }
                }

                if (back_stake > maxBackStake) {
                    setBack_stake(maxBackStake)
                }

            }
        }

    }, [typing]);
    useEffect(() => {

        const lay = layStakeCalc(
            back_odds_input,
            lay_odds_input,
            back_stake,
            exchange_com
        )
        const liability = liabilityCalc(
            lay,
            lay_odds_input
        )
        setLiability(liability)
        setLay_stake(lay)
        setLay_win(profitExchangeWins(
            back_stake,
            lay,
            exchange_com
        ))
        setBack_win(profitBookmakerWins(back_stake, back_odds_input, liability))
    }, [back_stake, lay_stake, back_odds_input, lay_odds_input]);
    return <Box sx={{...style}}>
        <Box sx={{display: 'grid', gridAutoFlow: 'column',}}>
            <Box sx={{minHeight: '80px', minWidth: '100px',}}>
                <Typography variant='h5'>
                    Bookmaker
                </Typography>
                <Typography>
                    {selectedData?.bookmaker}
                </Typography>
                <TextField
                    label="Odds"
                    value={back_odds_input}
                    type={'number'}
                    onChange={event => {
                        setTyping(true)
                        clearTimeout(typingTimeout)
                        setTypingTimeout(setTimeout(() => {
                            setTyping(false)
                        }, timeout))
                        setBack_odds_input(parseFloat((event.target.value)))
                    }}
                />
                <TextField
                    label="Stake"
                    value={back_stake}
                    type={'number'}
                    onChange={event => {
                        setTyping(true)
                        clearTimeout(typingTimeout)
                        setTypingTimeout(setTimeout(() => {
                            setTyping(false)
                        }, timeout))
                        setBack_stake(parseFloat((event.target.value)))
                    }}
                />
                <TextField
                    label="Com %"
                    value={bookmaker_com}
                    type={'number'}
                    onChange={event => {
                        setTyping(true)
                        clearTimeout(typingTimeout)
                        setTypingTimeout(setTimeout(() => {
                            setTyping(false)
                        }, timeout))
                        setBookmaker_com(parseFloat((event.target.value)))
                    }}
                />
                <Typography variant='body1'>
                    Bet {back_stake.toFixed(2)} at odds of {back_odds_input}
                </Typography>
                <Button
                    onClick={async () => {
                        console.log(selectedData)
                        if (selectedData?.meta) {
                            const minSize = selectedData?.meta[selectedData.bookmaker].orderMinSize
                            const response = await fetch(`${baseUrl}/trade/${selectedData?.back_outcome_id}`, {
                                method: "POST",
                                body: JSON.stringify({
                                    size: minSize ? Math.round(back_stake / minSize) : back_stake,
                                }),
                                headers: {
                                    'Content-Type': "application/json"
                                }
                            })

                            if (response.status == 200) {
                                setInfo({
                                    status: "good",
                                    info: "Bet placed succesfully"

                                })
                            } else {
                                setInfo({
                                    status: "error",
                                    info: await response.text()

                                })
                            }
                        }
                    }}
                >
                    Place bets
                </Button>

            </Box>
            <Box sx={{minHeight: '80px', minWidth: '100px',}}>
                <Typography variant='h5'>
                    Exchange
                </Typography>
                <Typography>
                    {selectedData?.exchange}
                </Typography>
                <TextField
                    label="Odds"
                    value={lay_odds_input}
                    type={'number'}
                    onChange={event => {
                        setTyping(true)
                        clearTimeout(typingTimeout)
                        setTypingTimeout(setTimeout(() => {
                            setTyping(false)
                        }, timeout))
                        setLay_odds_input(parseFloat((event.target.value)))
                    }}
                />
                <TextField
                    label="Com %"
                    value={exchange_com}
                    type={'number'}
                    onChange={event => {
                        setTyping(true)
                        clearTimeout(typingTimeout)
                        setTypingTimeout(setTimeout(() => {
                            setTyping(false)
                        }, timeout))
                        setExchange_com(parseFloat((event.target.value)))
                    }}
                />
                <Typography variant='body1'>
                    Lay {lay_stake.toFixed(2)} at odds of {lay_odds_input}
                </Typography>
                <Typography variant='subtitle2'>
                    Liability: {liability.toFixed(2)}
                </Typography>

                <Button onClick={async () => {
                    console.log(selectedData)
                    if (selectedData?.meta) {
                        const minSize = selectedData?.meta[selectedData.exchange].orderMinSize
                        const response = await fetch(`${baseUrl}/trade/${selectedData?.lay_outcome_id}`, {
                            method: "POST",
                            body: JSON.stringify({
                                size: minSize ? Math.round(lay_stake / minSize) : lay_stake,
                            }),
                            headers: {
                                'Content-Type': "application/json"
                            }
                        })
                        if (response.status == 200) {
                            setInfo({
                                status: "good",
                                info: "Bet placed succesfully"

                            })
                        } else {
                            setInfo({
                                status: "error",
                                info: await response.text()

                            })
                        }
                    }
                }}>
                    Place bets
                </Button>
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
                        <TableCell>{back_win.bookmaker.toFixed(2)}</TableCell>
                        <TableCell>{back_win.exchange.toFixed(2)}</TableCell>
                        <TableCell>{back_win.profit.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Exchange bet(lay) wins</TableCell>
                        <TableCell>{lay_win.bookmaker.toFixed(2)}</TableCell>
                        <TableCell>{lay_win.exchange.toFixed(2)}</TableCell>
                        <TableCell>{lay_win.profit.toFixed(2)}</TableCell>
                    </TableRow>
                </TableBody>
            </Table>

        </Box>
        <Box sx={info.status == "good" ? {display: "flex", backgroundColor: "green"} : {backgroundColor: "red"}}>
            {info.status != null ? info.info : null}
        </Box>
    </Box>
}

export default Calculator
