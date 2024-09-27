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
import {OddsCleaned} from './types';
import Calculator from './components/calculator';
import {CloudbetApiData, PolymarketApiData} from "./services/OddsApiService";
import {CleanedPolymarketOdds} from "./types/Polymarket";
import {SanitizeOdds_Cloudbet_Polymarket} from "./sanitizers/OddsSanitizer";

const BasicTable: React.FC = () => {
    const [data, setData] = useState<OddsCleaned[]>([])
    const [modalOpen, setmodalOpen] = useState(false)
    const [backOdds, setBackOdds] = useState<number>(0)
    const [layOdds, setLayOdds] = useState<number>(0)
    const [timeSinceLastRefresh, setTimeSinceLastRefresh] = useState<number>(0)
    const [timer, setTimer] = useState<NodeJS.Timer>()
    const langService: HumanizeDurationLanguage = new HumanizeDurationLanguage();
    const humanizer: HumanizeDuration = new HumanizeDuration(langService);
    useEffect(() => {
        const repeatTillOddsListFull = async () => {
            let oddsList: CleanedPolymarketOdds[] = []
            const requests = [];

            for (let i = 0; i < 60; i++) {
                // Collect promises for network requests
                requests.push(PolymarketApiData(i));
            }

            try {
                // Resolve all network requests in parallel
                const results = await Promise.all(requests);

                // Flatten the result and concatenate with the current oddsList
                const allData = results.flat(); // Assuming each API call returns an array of odds
                oddsList = oddsList.concat(allData);

                // Filter out duplicates based on 'id'
                oddsList = oddsList.filter((item, index, self) =>
                    index === self.findIndex((obj) => obj.id === item.id)
                );

            } catch (error) {
                console.error('Error fetching data:', error);
            }

            return oddsList;
        }

        const getOdds = async () => {
            const responses = await Promise.all([repeatTillOddsListFull(), CloudbetApiData()])
            const odds = SanitizeOdds_Cloudbet_Polymarket(responses[0], responses[1])
            setData(odds)
        }
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
                                <TableCell align="right"><Button onClick={() => {
                                    setBackOdds(row.odds)
                                    setLayOdds(row.lay)
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
                    <Calculator
                        back_odds={backOdds}
                        lay_odds={layOdds}
                    />
                </Box>

            </Modal>
        </div>
    );
}

export default BasicTable;
