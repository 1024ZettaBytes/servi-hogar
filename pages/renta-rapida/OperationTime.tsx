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
interface OperationTimeProps {
  fullWidth?:boolean;
  className?: string;
  date: any;
  minDate: any;
  timeOption: string;
  fromTime?: any;
  endTime?: any;
  onChangeTime: Function;
}
const OperationTime: FC<OperationTimeProps> = ({
  fullWidth,
  minDate,
  date,
  onChangeTime,
  timeOption,
  fromTime,
  endTime
}) => {
  return (
    <>
      <Grid container p={1} spacing={1}>
        <Grid item lg={fullWidth ? 12: 2}>
          <DesktopDatePicker
            label="Fecha"
            inputFormat="dd/MM/yyyy"
            minDate={minDate}
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
OperationTime.propTypes = {
  fullWidth: PropTypes.bool.isRequired,
  date: PropTypes.object.isRequired,
  minDate: PropTypes.object.isRequired,
  timeOption: PropTypes.string.isRequired,
  onChangeTime: PropTypes.func.isRequired,
  fromTime: PropTypes.object,
  endTime: PropTypes.object,
};

export default OperationTime;
