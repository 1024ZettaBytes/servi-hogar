import PropTypes from "prop-types";
import { useState } from "react";
import Dialog from "@mui/material/Dialog";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  Alert,
  Container,
  Skeleton,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { useGetRentById, getFetcher } from "../../../pages/api/useRequest";
import { changePayday } from "../../../lib/client/rentsFetch";
import { capitalizeFirstLetter, addDaysToDate, dateDiffInDays } from "lib/client/utils";
import { format } from "date-fns";
import es from "date-fns/locale/es";
import { WEEK_DAYS, PRICES } from "lib/consts/OBJ_CONTS";
import numeral from "numeral";
import OperationTime from "pages/renta-rapida/OperationTime";
const defaultInitialDate = (today: Date) => {
  today.setHours(8, 0, 0);
  return today;
};

const defaultEndDate = (today: Date) => {
  today.setHours(23, 0, 0);
  return today;
};
function SchedulePickupModal(props) {
  const { rentId, handleOnClose, open } = props;
  const { rent, rentByIdError } = useGetRentById(getFetcher, rentId);
  const [pickupTime, setPickupTime] = useState<any>({
    date: addDaysToDate(new Date(), 1),
    timeOption: "any",
    fromTime: defaultInitialDate(addDaysToDate(new Date(), 1)),
    endTime: defaultEndDate(addDaysToDate(new Date(), 1)),
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [hasErrorSubmitting, setHasErrorSubmitting] = useState<any>({
    error: false,
    msg: "",
  });
  const [selectedDay, setSelectedDay] = useState<any>(null);

  const submitButtonEnabled =
    rent &&
    pickupTime.date &&
    dateDiffInDays(new Date(), new Date(pickupTime.date)) >=0 &&
    (pickupTime.timeOption === "any" ||
      (pickupTime.fromTime &&
        pickupTime.endTime &&
        pickupTime.fromTime.getTime() <= pickupTime.endTime.getTime()));
  const handleOnSubmit = async () => {
    setHasErrorSubmitting({ error: false, msg: "" });
    setIsSubmitting(true);
    const result = await changePayday(rentId, selectedDay);
    setIsSubmitting(false);
    if (!result.error) {
      handleChangedDay(result.msg);
    } else {
      setHasErrorSubmitting({ error: true, msg: result.msg });
    }
  };

  const handleClose = () => {
    setHasErrorSubmitting({ error: false, msg: "" });
    setIsSubmitting(false);
    handleOnClose(false);
  };
  const handleChangedDay = (successMessage) => {
    handleOnClose(true, successMessage);
  };
  if (rent && !selectedDay) {
    const dayName = format(new Date(rent?.endDate), "eeee").toLowerCase();
    setSelectedDay(dayName);
  }
  const plusDays = () => {
    if (rent) {
      const day = format(new Date(rent?.endDate), "eeee").toLowerCase();
      if (selectedDay !== day) {
        const list = Object.keys(WEEK_DAYS);
        const currentIndex = list.indexOf(day);
        const newIndex = list.indexOf(selectedDay);
        return newIndex > currentIndex
          ? newIndex - currentIndex
          : list.length - (currentIndex - newIndex);
      }
      return 0;
    }
    return 0;
  };
  const onChangePickupTime = (id, value) => {
    if (
      (id === "fromTime" || id === "endTime") &&
      value.toString() === "Invalid Date"
    ) {
      value = null;
    }

    setPickupTime({ ...pickupTime, [id]: value });
  };
  const getExpiration = () => {
    if (!rent) return "";
    if (rent.remaining > 0) {
      return capitalizeFirstLetter(
        format(new Date(rent?.endDate), "LLLL dd yyyy", {
          locale: es,
        })
      );
    }
    if (rent.remaining === 0) {
      return "HOY";
    }
    return `VENCIDA (${Math.abs(rent.remaining)} día(s))`;
  };

  const addedDays = plusDays();
  const daysCost = addedDays * PRICES.day;
  const getTotalDebt = () => {
    let usedFree = false;
    let newBalance = 0;
    if (!rent) return { debt: 0, usedFree, newBalance: 0 };
    newBalance = rent.customer.balance;
    let debt = rent.customer.balance - daysCost; // deuda total despues de agregar recorrido
    if (debt < 0) {
      const toPay = daysCost;
      newBalance = debt;
      debt = daysCost;
      //if will use free week
      if (toPay >= 4 * PRICES.day && rent.customer.freeWeeks > 0) {
        usedFree = true;
        debt = debt - PRICES.week > 0 ? debt - PRICES.week : 0;
        newBalance = newBalance + PRICES.week;
      }
    } else {
      debt = daysCost;
      newBalance = rent.customer.balance - daysCost;
    }
    return { debt, usedFree, newBalance };
  };
  const totalDebt = getTotalDebt();

  return (
    <Dialog open={open} fullWidth={true} maxWidth={"md"} scroll={"body"}>
      <Card>
        <CardHeader title="Programar recolección" />
        <Divider />
        <CardContent>
          <Box>
            <Container maxWidth="lg">
              <Grid
                container
                direction="row"
                justifyContent="center"
                alignItems="stretch"
                spacing={4}
              >
                <Grid item xs={12}>
                  {rentByIdError ? (
                    <Alert severity="error">{rentByIdError?.message}</Alert>
                  ) : !rent ? (
                    <Skeleton
                      variant="rectangular"
                      width={"100%"}
                      height={500}
                      animation="wave"
                    />
                  ) : (
                    <>
                      <Grid container>
                        <Grid
                          item
                          xs={12}
                          sm={12}
                          lg={2}
                          mt={1}
                          sx={{ textAlign: { lg: "center" } }}
                        >
                          <Box>
                            <Typography gutterBottom variant="subtitle2">
                              # renta
                            </Typography>
                            <Typography color="black" gutterBottom>
                              {rent.num}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid
                          item
                          xs={12}
                          sm={12}
                          lg={4}
                          mt={1}
                          sx={{ textAlign: "left" }}
                        >
                          <Box>
                            <Typography gutterBottom variant="subtitle2">
                              Cliente
                            </Typography>
                            <Typography color="black" gutterBottom>
                              {rent?.customer?.name}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid
                          item
                          xs={12}
                          sm={12}
                          lg={2}
                          mt={1}
                          sx={{ textAlign: "center" }}
                        >
                          <Box>
                            <Typography gutterBottom variant="subtitle2">
                              Vencimiento
                            </Typography>
                            <Typography color="black" gutterBottom>
                              {getExpiration()}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid
                          item
                          xs={12}
                          sm={12}
                          lg={4}
                          mt={1}
                          sx={{ textAlign: { lg: "center" } }}
                        >
                          <Box>
                            <Typography gutterBottom variant="subtitle2">
                              Semanas consecutivas
                            </Typography>
                            <Typography color="black" gutterBottom>
                              {rent.totalWeeks}
                            </Typography>
                          </Box>
                        </Grid>

                        <Grid
                          item
                          xs={12}
                          sm={12}
                          lg={2}
                          mt={1}
                          sx={{ textAlign: { lg: "center" } }}
                        >
                          <Box>
                            <Typography gutterBottom variant="subtitle2">
                              Saldo de cliente
                            </Typography>
                            <Typography color="black" gutterBottom>
                              {numeral(rent.customer?.balance).format(
                                `$${rent.customer?.balance}0,0.00`
                              )}
                            </Typography>
                          </Box>
                        </Grid>

                        <Grid item xs={0} sm={0} lg={6} mt={1} />
                        <Grid
                          item
                          xs={12}
                          sm={12}
                          lg={4}
                          mt={1}
                          sx={{ textAlign: { lg: "center" } }}
                        >
                          <Box>
                            <Typography gutterBottom variant="subtitle2">
                              Semanas totales
                            </Typography>
                            <Typography color="black" gutterBottom>
                              {rent.customer?.totalRentWeeks}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item lg={2} mt={4}></Grid>
                        <OperationTime
                          fullWidth
                          date={pickupTime.date}
                          minDate={new Date()}
                          timeOption={pickupTime.timeOption}
                          fromTime={pickupTime.fromTime}
                          endTime={pickupTime.endTime}
                          onChangeTime={onChangePickupTime}
                        />
                      </Grid>
                    </>
                  )}
                </Grid>
                {hasErrorSubmitting.error && (
                  <Grid item lg={12}>
                    <Alert severity="error">{hasErrorSubmitting.msg}</Alert>
                  </Grid>
                )}
                <Grid item lg={12}>
                  <Grid
                    container
                    alignItems={"right"}
                    direction="row"
                    justifyContent="right"
                    spacing={2}
                  >
                    <Grid item>
                      <Button
                        size="large"
                        variant="outlined"
                        onClick={() => handleClose()}
                      >
                        Cancelar
                      </Button>
                    </Grid>
                    <Grid item>
                      <LoadingButton
                        loading={isSubmitting}
                        disabled={!submitButtonEnabled}
                        size="large"
                        variant="contained"
                        onClick={() => handleOnSubmit()}
                      >
                        Guardar
                      </LoadingButton>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Container>
          </Box>
        </CardContent>
      </Card>
    </Dialog>
  );
}

SchedulePickupModal.propTypes = {
  handleOnClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  rentId: PropTypes.string.isRequired,
};

export default SchedulePickupModal;
