import React, {useEffect, useState} from 'react';
import {HumanizeDurationLanguage, HumanizeDuration} from 'humanize-duration-ts';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    Modal,
    Box, Typography, Tooltip
} from '@mui/material';
import Calculator from './components/calculator';
import {useBetting} from "./services/BettingProvider";

const BasicTable: React.FC = () => {
    const [modalOpen, setmodalOpen] = useState(false)
    const [timeSinceLastRefresh, setTimeSinceLastRefresh] = useState<number>(0)
    const [timer, setTimer] = useState<NodeJS.Timer>()
    const langService: HumanizeDurationLanguage = new HumanizeDurationLanguage();
    const humanizer: HumanizeDuration = new HumanizeDuration(langService);
    const bettingProvider = useBetting()
    const {getOdds, setSelectedData, data} = bettingProvider
    useEffect(() => {
        getOdds()
    }, [])
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeSinceLastRefresh((p) => p + 1)
        }, 1000)
        setTimer(timer)
        return () => {
            clearInterval(timer)
        }
    }, []);

    return (
        <div>
            <Paper sx={{padding: 3}}>
                {`Time since last refresh: ${humanizer.humanize(timeSinceLastRefresh * 1000)}`}
            </Paper>
            <TableContainer component={Paper}>
                <Table sx={{minWidth: 650}} aria-label="simple table">
                    <TableHead>
                        <TableRow>
                            <TableCell>Time</TableCell>
                            <TableCell align="right">Event</TableCell>
                            <TableCell align="right">Bet</TableCell>
                            <TableCell align="right">Bookmaker</TableCell>
                            <TableCell align="right">Rating</TableCell>
                            <TableCell align="right">Odds</TableCell>
                            <TableCell align="right">Exchange</TableCell>
                            <TableCell align="right">Lay</TableCell>
                            <TableCell align="right">Avail</TableCell>
                            <TableCell align="right">Calc</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.map((row, i) => (
                            <TableRow key={i}>
                                <TableCell component="th" scope="row">
                                    {row.time}
                                </TableCell>
                                <TableCell align="right">
                                    <Typography variant={'body1'}>
                                        {row.event}
                                    </Typography>
                                    <Typography variant={'body2'}>
                                        {row.home_team} vs {row.away_team}
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">{row.bet_team}</TableCell>
                                <TableCell align="right">{row.bookmaker}</TableCell>
                                <TableCell align="right">{row.rating + "%"}</TableCell>
                                <Tooltip title={`Last updated: ${row.odds_last_update}`}>
                                    <TableCell align="right">{row.odds}</TableCell>
                                </Tooltip>
                                <TableCell align="right">{row.exchange}</TableCell>
                                <Tooltip title={`Last updated: ${row.lay_last_update}`}>
                                    <TableCell align="right">{row.lay}</TableCell>
                                </Tooltip>
                                <TableCell align="right">{row.maxLay}</TableCell>
                                <TableCell align="right"><Button onClick={() => {
                                    setSelectedData(row)
                                    setmodalOpen(true)
                                }}>Calc</Button></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <Modal
                open={modalOpen}
                onClose={() => setmodalOpen(false)}
            >
                <Box>
                    <Calculator/>
                </Box>

            </Modal>
        </div>
    );
}

export default BasicTable;
