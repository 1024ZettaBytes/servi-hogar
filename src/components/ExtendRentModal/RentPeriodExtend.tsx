import {
    TextField,
    InputAdornment,
    Checkbox,
    FormControlLabel,
    Grid,
    Typography,
  } from "@mui/material";
  import { FC } from "react";
  import PropTypes from "prop-types";
  import numeral from "numeral";
  interface RentPeriodExtendProps {
    className?: string;
    label: string;
    selectedWeeks: number;
    useFreeWeeks: boolean;
    weekPrice: number;
    lateFee: number;
    freeWeeks?: any;
    onChangePeriod: Function;
  }
  const RentPeriodExtend: FC<RentPeriodExtendProps> = ({
    label,
    freeWeeks,
    onChangePeriod,
    weekPrice,
    selectedWeeks,
    useFreeWeeks,
    lateFee
  }) => {
    const totalPrice = () => {
      const weeksToPay =
      !useFreeWeeks ? (selectedWeeks) : (
        freeWeeks > selectedWeeks ? 0 : selectedWeeks - freeWeeks);
      const weeksCost = weeksToPay * weekPrice;

      return weeksCost + lateFee;
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
                label={`Usar semanas gratis(${freeWeeks})`}
              />
            </Grid>
          )}
          <Grid item md={12} lg={12}></Grid>
          <Grid item lg={3}>
            <Typography color="text.secondary" sx={{ pb: 1 }}>
              Precio por semana: {numeral(weekPrice).format(`$${weekPrice}0,0.00`)}
            </Typography>
          </Grid>
          <Grid item md={12} lg={12}></Grid>
          <Grid item lg={3}>
            <Typography color="text.secondary" sx={{ pb: 1 }}>
              Recargos por retraso: {numeral(lateFee).format(`$${lateFee}0,0.00`)}
            </Typography>
          </Grid>
          <Grid item md={12} lg={12}></Grid>
          <Grid item lg={3}>
            <Typography color="text.primary" sx={{ pb: 1 }}>
              Total: {numeral(totalPrice()).format(`$${totalPrice()}0,0.00`)}
            </Typography>
          </Grid>
        </Grid>
      </>
    );
  };
  RentPeriodExtend.propTypes = {
    label: PropTypes.string.isRequired,
    selectedWeeks: PropTypes.number.isRequired,
    useFreeWeeks: PropTypes.bool.isRequired,
    weekPrice: PropTypes.number.isRequired,
    freeWeeks: PropTypes.number,
    onChangePeriod: PropTypes.func.isRequired,
  };
  
  export default RentPeriodExtend;