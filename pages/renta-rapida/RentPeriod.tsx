import {
  TextField,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  Grid,
  Typography,
} from "@mui/material";
import { FC, useState } from "react";
import PropTypes from "prop-types";
import numeral from "numeral";
interface RentPeriodProps {
  className?: string;
  label: string;
  selectedWeeks: number;
  usePromo: boolean;
  useFreeWeeks: boolean;
  prices: any;
  freeWeeks?: any;
  onChangePeriod: Function;
}
const RentPeriod: FC<RentPeriodProps> = ({
  label,
  freeWeeks,
  onChangePeriod,
  prices,
  selectedWeeks,
  usePromo,
  useFreeWeeks,
}) => {
  const totalPrice = () => {
    let total = 0;
    const weeksToPay =
    !useFreeWeeks ? (selectedWeeks) : (
      freeWeeks > selectedWeeks ? 0 : selectedWeeks - freeWeeks);
    total = weeksToPay * prices.newWeekPrice;
    switch(weeksToPay){
      case 2 : 
        return prices.twoWeekPrice;
      case 3:
         return prices.threeWeekPrice;
    }
    return  total;
  };
  return (
    <>
      <Grid container p={1} spacing={1}>
        <Grid item lg={2}>
        <TextField
              label={label}
              type="number"
              value={selectedWeeks}
              variant="outlined"
              size="small"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="start">semana(s)</InputAdornment>
                ),
                inputProps: {
                  min:1,
                  max:3,
                  style: { textAlign: "center" },
                },
              }}
              onChange={(event)=>{onChangePeriod("selectedWeeks", Number(event.target.value))}}
            />
        </Grid>
        {freeWeeks > 0 && (
          <Grid item lg={3}>
            <FormControlLabel
              control={<Checkbox checked={useFreeWeeks} onChange={(event)=>{onChangePeriod("useFreeWeeks", event.target.checked)}}/>}
              label={`Usar semanas gratis por recomendados(${freeWeeks})`}
            />
          </Grid>
        )}
        <Grid item md={12} lg={12}></Grid>
        {selectedWeeks == 3 && (
          <Grid item lg={12}>
            <FormControlLabel
              control={<Checkbox checked={usePromo} onChange={(event)=>{onChangePeriod("usePromo", event.target.checked)}}/>}
              label={`4ta semana gratis por promoción`}
            />
          </Grid>
        )}
        <Grid item lg={3}>
          <Typography color="text.secondary" sx={{ pb: 1 }}>
            Precio por semana regular: {numeral(prices.newWeekPrice).format(`$${prices.newWeekPrice}0,0.00`)}
          </Typography>
        </Grid>
        <Grid item md={12} lg={12}></Grid>
        <Grid item lg={3}>
          <Typography fontWeight={"bold"} color="text.primary" sx={{ pb: 1 }}>
            Total: {numeral(totalPrice()).format(`$${totalPrice()}0,0.00`)}
          </Typography>
        </Grid>
      </Grid>
    </>
  );
};
RentPeriod.propTypes = {
  label: PropTypes.string.isRequired,
  selectedWeeks: PropTypes.number.isRequired,
  useFreeWeeks: PropTypes.bool.isRequired,
  prices: PropTypes.any.isRequired,
  freeWeeks: PropTypes.number,
  onChangePeriod: PropTypes.func.isRequired,
};

export default RentPeriod;
