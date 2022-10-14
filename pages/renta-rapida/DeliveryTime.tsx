import {
  TextField,
  FormControlLabel,
  Grid,
  FormLabel,
  RadioGroup,
  Radio,
} from "@mui/material";
import { FC } from "react";
import PropTypes from "prop-types";
import { DesktopDatePicker, DesktopTimePicker } from "@mui/x-date-pickers";
interface DeliveryTimeProps {
  className?: string;
  date: any;
  timeOption: string;
  fromTime?: any;
  endTime?: any;
  onChangeTime: Function;
}
const DeliveryTime: FC<DeliveryTimeProps> = ({
  date,
  onChangeTime,
  timeOption,
  fromTime,
  endTime
}) => {
  return (
    <>
      <Grid container p={1} spacing={1}>
        <Grid item lg={2}>
          <DesktopDatePicker
            label="Fecha de entrega"
            inputFormat="dd/MM/yyyy"
            value={date}
            onChange={(newValue) => {
                onChangeTime("date",newValue);
            }}
            renderInput={(params) => <TextField {...params} />}
          />
        </Grid>
        <Grid item md={12} lg={12} />
        <Grid item>
          <FormLabel id="demo-controlled-radio-buttons-group">Hora</FormLabel>
          <RadioGroup
          row
            aria-labelledby="demo-controlled-radio-buttons-group"
            name="controlled-radio-buttons-group"
            value={timeOption}
            onChange={(event)=>{
                onChangeTime("timeOption", event.target.value);
            }}
          >
            <FormControlLabel
              value="any"
              control={<Radio />}
              label="Cualquiera"
            />
            <FormControlLabel value="specific" control={<Radio />} label="Específica" />
          </RadioGroup>
        </Grid>
        { timeOption === "specific" &&
        <>
        <Grid item md={12} lg={12} />
        <Grid item>
        <DesktopTimePicker
          maxTime={endTime}
          label="Desde"
          value={fromTime}
          onChange={(newValue) => {
            onChangeTime("fromTime", newValue);
          }}
          renderInput={(params) => <TextField {...params} />}
        />
        
        </Grid>
        <Grid item>
        <DesktopTimePicker
          minTime={fromTime}
          label="Hasta"
          value={endTime}
          onChange={(newValue) => {
            onChangeTime("endTime", newValue);
          }}
          renderInput={(params) => <TextField {...params} />}
        />
        
        </Grid>
        </>
        }
      </Grid>
      
    </>
  );
};
DeliveryTime.propTypes = {
  date: PropTypes.object.isRequired,
  timeOption: PropTypes.string.isRequired,
  onChangeTime: PropTypes.func.isRequired,
  fromTime: PropTypes.object,
  endTime: PropTypes.object,
};

export default DeliveryTime;
