import * as React from "react";
import PropTypes from "prop-types";
import dayjs from "dayjs";
import isBetweenPlugin from "dayjs/plugin/isBetween";
import weekday from "dayjs/plugin/weekday";
import TextField from "@mui/material/TextField";
import DateFnsUtils from "@date-io/date-fns";
import locale from "date-fns/locale/es";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { capitalizeFirstLetter } from "lib/client/utils";

if (locale && locale.options) {
  locale.options.weekStartsOn = 1;
}
dayjs.extend(isBetweenPlugin);
dayjs.extend(weekday);

interface MonthPickerProps {
  selectedValue: Date;
  handleOnChange: Function;
}

const MonthPicker: React.FC<MonthPickerProps> = ({
  selectedValue,
  handleOnChange,
}) => {

  return (
    <LocalizationProvider dateAdapter={DateFnsUtils} adapterLocale={locale}>
      <DatePicker
          views={['year', 'month']}
          value={selectedValue}
          onChange={(newValue) => {
            handleOnChange(newValue);
          }}
          renderInput={(params) => {
            let customParams =  {...params};
            customParams.inputProps.value = capitalizeFirstLetter(customParams?.inputProps?.value + "");
            customParams.InputProps.disabled = true;
            return <TextField {...customParams }  helperText={null} />}}
        />
    </LocalizationProvider>
  );
};

MonthPicker.propTypes = {
  handleOnChange: PropTypes.func.isRequired,
  selectedValue: PropTypes.any.isRequired
};

export default MonthPicker;
