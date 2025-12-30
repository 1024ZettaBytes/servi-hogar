import {
    TextField,
    InputAdornment,
    Checkbox,
    FormControlLabel,
    Grid,
    Typography,
    Alert,
  } from "@mui/material";
  import StarIcon from '@mui/icons-material/Star';
  import { FC } from "react";
  import PropTypes from "prop-types";
  import numeral from "numeral";
  import { PLAN_ORO } from "lib/consts/OBJ_CONTS";
  interface RentPeriodExtendProps {
    className?: string;
    label: string;
    selectedWeeks: number;
    useFreeWeeks: boolean;
    weekPrice: number;
    lateFee: number;
    freeWeeks?: any;
    isPlanOro?: boolean;
    onChangePeriod: Function;
  }
  const RentPeriodExtend: FC<RentPeriodExtendProps> = ({
    label,
    freeWeeks,
    onChangePeriod,
    weekPrice,
    selectedWeeks,
    useFreeWeeks,
    lateFee,
    isPlanOro = false
  }) => {
    const totalPrice = () => {
      if (isPlanOro) {
        return PLAN_ORO.PRICE + lateFee;
      }
      const weeksToPay =
      !useFreeWeeks ? (selectedWeeks) : (
        freeWeeks > selectedWeeks ? 0 : selectedWeeks - freeWeeks);
      const weeksCost = weeksToPay * weekPrice;

      return weeksCost + lateFee;
    };
    return (
      <>
        <Grid container p={1} spacing={1}>
          {isPlanOro && (
            <Grid item lg={12} mb={2}>
              <Alert 
                severity="info" 
                icon={<StarIcon sx={{ color: '#FFD700' }} />}
                sx={{ 
                  backgroundColor: '#FFF8E1',
                  border: '1px solid #FFD700'
                }}
              >
                <Typography variant="body2">
                  <strong>Plan Oro:</strong> Este cliente tiene una suscripción mensual. 
                  Solo puede extender exactamente {PLAN_ORO.WEEKS} semanas por ${PLAN_ORO.PRICE}.
                </Typography>
              </Alert>
            </Grid>
          )}
          <Grid item lg={2}>
          <TextField
                label={label}
                type="number"
                value={selectedWeeks}
                variant="outlined"
                size="small"
                disabled={isPlanOro}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="start">semana(s)</InputAdornment>
                  ),
                  inputProps: {
                    min: isPlanOro ? PLAN_ORO.WEEKS : 1,
                    max: isPlanOro ? PLAN_ORO.WEEKS : undefined,
                    style: { textAlign: "center" },
                  },
                }}
                onChange={(event)=>{onChangePeriod("selectedWeeks", Number(event.target.value))}}
              />
          </Grid>
          {freeWeeks > 0 && !isPlanOro && (
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
              {isPlanOro ? (
                <>Precio Plan Oro (4 semanas): {numeral(PLAN_ORO.PRICE).format(`$${PLAN_ORO.PRICE}0,0.00`)}</>
              ) : (
                <>Precio por semana: {numeral(weekPrice).format(`$${weekPrice}0,0.00`)}</>
              )}
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
    isPlanOro: PropTypes.bool,
    onChangePeriod: PropTypes.func.isRequired,
  };
  
  export default RentPeriodExtend;