import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Modal, Box } from '@mui/material';
import api from './apis';
import { AxiosInstance, AxiosResponse } from 'axios';
import { Bookmaker, Market, OddsCleaned, Sport } from './types';
import Calculator from './components/calculator';

interface Data {
  name: string;
  calories: number;
  fat: number;
  carbs: number;
  protein: number;
}

const BasicTable: React.FC = () => {
  const [data, setData] = useState<OddsCleaned[]>([]) 
  const [modalOpen, setmodalOpen] = useState(false)
  const [backOdds, setBackOdds] = useState<number>(0)
  const [layOdds, setLayOdds] = useState<number>(0)
  useEffect(() => {
    if (api) {

      const apicall = async () =>{
        const cleanedData: OddsCleaned[]  = []
        const response: AxiosResponse = await api.get(
          '/sports/cricket/odds/',
          {
            params:{
              regions:'au',
            }
          }
        )
        const data: Sport[] = response.data
        const sports_with_lay: Sport[] = data.filter((sport)=>{
          return sport.bookmakers.find((bookmaker)=>{ 
            return bookmaker.markets.find((market)=>market.key=='h2h_lay')
          })
        })
        sports_with_lay.forEach((sport) =>{
          let exchanges: Bookmaker[] = sport.bookmakers.filter(bookmaker =>{
            return bookmaker.markets.find((market)=>market.key=='h2h_lay')
          })
          
          exchanges.forEach(exchange =>{
            // undefined is only for type checking. It won't be undefined as we filtered out all sports
            // which dont have lay markets
            let lay_market: Market | undefined = exchange.markets.find((m)=> m.key == 'h2h_lay')
            lay_market?.outcomes.forEach((lay_outcome)=>{
              sport.bookmakers.forEach((bookmaker)=>{
                bookmaker.markets.forEach((market)=>{
                  if (market.key == 'h2h'){
                    market.outcomes.forEach(bookmaker_outcome => {
                      if (bookmaker_outcome.name == lay_outcome.name) {
                        let localizedDate = new Date(sport.commence_time).toLocaleString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: 'numeric',
                        });
                        cleanedData.push({
                          time: localizedDate,
                          event: sport.sport_title,
                          bookmaker: bookmaker.title,
                          bet_team: bookmaker_outcome.name,
                          odds: bookmaker_outcome.price,
                          lay: lay_outcome.price,
                          avail: 10,
                          exchange: exchange.title
                        })
                        
                      }
                    })
                  }
                })
              })
            })

          })

        })

        setData(cleanedData)
      }
      apicall()

    }
    
  }, [])
  
  return (
    <div>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              <TableCell align="right">Event</TableCell>
              <TableCell align="right">Bet</TableCell>
              <TableCell align="right">Bookmaker</TableCell>
              <TableCell align="right">Odds</TableCell>
              <TableCell align="right">Exchange</TableCell>
              <TableCell align="right">Lay</TableCell>
              <TableCell align="right">Calc</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row,i) => (
              <TableRow key={i}>
                <TableCell component="th" scope="row">
                  {row.time}
                </TableCell>
                <TableCell align="right">{row.event}</TableCell>
                <TableCell align="right">{row.bet_team}</TableCell>
                <TableCell align="right">{row.bookmaker}</TableCell>
                <TableCell align="right">{row.odds}</TableCell>
                <TableCell align="right">{row.exchange}</TableCell>
                <TableCell align="right">{row.lay}</TableCell>
                <TableCell align="right"><Button onClick={()=>{
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
        onClose={()=>setmodalOpen(false)}
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
