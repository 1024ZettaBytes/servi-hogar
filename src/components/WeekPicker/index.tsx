import * as React from "react";
import PropTypes from "prop-types";
import dayjs from "dayjs";
import isBetweenPlugin from "dayjs/plugin/isBetween";
import weekday from "dayjs/plugin/weekday";
import { styled } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import { StaticDatePicker } from "@mui/x-date-pickers/StaticDatePicker";
import { PickersDay, PickersDayProps } from "@mui/x-date-pickers/PickersDay";
import DateFnsUtils from "@date-io/date-fns";
import locale from "date-fns/locale/es";
import { LocalizationProvider } from "@mui/x-date-pickers";

if (locale && locale.options) {
  locale.options.weekStartsOn = 1;
}
dayjs.extend(isBetweenPlugin);
dayjs.extend(weekday);

interface WeekPickerProps {
  selectedValue: Date;
  start: Date;
  end: Date;
  handleOnChange: Function;
}
interface CustomPickerDayProps extends PickersDayProps<Date> {
  dayIsBetween: boolean;
  isFirstDay: boolean;
  isLastDay: boolean;
}

const CustomPickersDay = styled(PickersDay, {
  shouldForwardProp: (prop) =>
    prop !== "dayIsBetween" && prop !== "isFirstDay" && prop !== "isLastDay",
})<CustomPickerDayProps>(({ theme, dayIsBetween, isFirstDay, isLastDay }) => ({
  ...(dayIsBetween && {
    borderRadius: 0,
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    "&:hover, &:focus": {
      backgroundColor: theme.palette.primary.dark,
    },
  }),
  ...(isFirstDay && {
    borderTopLeftRadius: "50%",
    borderBottomLeftRadius: "50%",
  }),
  ...(isLastDay && {
    borderTopRightRadius: "50%",
    borderBottomRightRadius: "50%",
  }),
})) as React.ComponentType<CustomPickerDayProps>;

const WeekPicker: React.FC<WeekPickerProps> = ({
  selectedValue,
  start,
  end,
  handleOnChange,
}) => {
  const renderWeekPickerDay = (
    date: Date,
    selectedDates: Array<Date | null>,
    pickersDayProps: PickersDayProps<Date>
  ) => {
    selectedDates.length;
    if (!selectedValue) {
      return <PickersDay {...pickersDayProps} />;
    }
    
    const isFirstDay = dayjs(date).isSame(start, "day");
    const isLastDay = dayjs(date).isSame(end, "day");
    const dayIsBetween = dayjs(date).isBetween(start, end, null, "[]");
    return (
      <CustomPickersDay
        {...pickersDayProps}
        disableMargin
        dayIsBetween={dayIsBetween}
        isFirstDay={isFirstDay}
        isLastDay={isLastDay}
      />
    );
  };

  return (
    <LocalizationProvider dateAdapter={DateFnsUtils} adapterLocale={locale}>
      <StaticDatePicker
        displayStaticWrapperAs="desktop"
        label="Semana"
        value={selectedValue}
        onChange={(newValue) => {
          handleOnChange(newValue);
        }}
        renderDay={renderWeekPickerDay}
        renderInput={(params) => <TextField {...params} />}
        inputFormat="'Semana de' MMM d"
      />
    </LocalizationProvider>
  );
};

WeekPicker.propTypes = {
  handleOnChange: PropTypes.func.isRequired,
  selectedValue: PropTypes.any.isRequired,
  start: PropTypes.any.isRequired,
  end: PropTypes.any.isRequired,
};

export default WeekPicker;
