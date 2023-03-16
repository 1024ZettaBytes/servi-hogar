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
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { useGetRentById, getFetcher } from "../../../pages/api/useRequest";
import { savePickup } from "../../../lib/client/pickupsFetch";
import {
  capitalizeFirstLetter,
  convertDateToLocal,
  convertDateToTZ,
  dateDiffInDays,
  formatTZDate,
} from "lib/client/utils";
import { format } from "date-fns";
import numeral from "numeral";
import OperationTime from "pages/renta-rapida/OperationTime";
const defaultInitialDate = (today: Date) => {
  today.setHours(8, 0, 0);
  return today;
};

const defaultEndDate = (today: Date) => {
  today.setHours(22, 0, 0);
  return today;
};

function SchedulePickupModal(props) {
  const { rentId, handleOnClose, open } = props;
  const { rent, rentByIdError } = useGetRentById(getFetcher, rentId);
  const [pickupTime, setPickupTime] = useState<any>({
    date: new Date(),
    timeOption: "any",
    fromTime: defaultInitialDate(convertDateToLocal(new Date())),
    endTime: defaultEndDate(convertDateToLocal(new Date())),
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [hasErrorSubmitting, setHasErrorSubmitting] = useState<any>({
    error: false,
    msg: "",
  });
  const [selectedDay, setSelectedDay] = useState<any>(null);
  const debt =
    (rent?.customer?.level?.dayPrice || 0) *
    Math.abs(
      (rent?.remaining || 0) - dateDiffInDays(new Date(), pickupTime.date)
    );
  const newbalance = (rent?.customer?.balance || 0) - debt;
  const submitButtonEnabled =
    rent &&
    pickupTime.date &&
    dateDiffInDays(new Date(), new Date(pickupTime.date)) >= 0 &&
    (pickupTime.timeOption === "any" ||
      (pickupTime.fromTime &&
        pickupTime.endTime &&
        pickupTime.fromTime.getTime() <= pickupTime.endTime.getTime()));

  const handleOnSubmit = async () => {
    setHasErrorSubmitting({ error: false, msg: "" });
    setIsSubmitting(true);
    const result = await savePickup({
      rentId,
      pickupTime: {
        ...pickupTime,
        date: convertDateToTZ(pickupTime.date),
        fromTime: convertDateToTZ(pickupTime.fromTime),
        endTime: convertDateToTZ(pickupTime.endTime),
      },
    });
    setIsSubmitting(false);
    if (!result.error) {
      handleSavedPickup(result.msg, result.pickup);
    } else {
      setHasErrorSubmitting({ error: true, msg: result.msg });
    }
  };

  const handleClose = () => {
    setHasErrorSubmitting({ error: false, msg: "" });
    setIsSubmitting(false);
    handleOnClose(false);
  };
  const handleSavedPickup = (successMessage, pickup) => {
    handleOnClose(
      true,
      {
        rent,
        pickupTime: {
          ...pickupTime,
          date: convertDateToTZ(pickupTime.date),
          fromTime: convertDateToTZ(pickupTime.fromTime),
          endTime: convertDateToTZ(pickupTime.endTime),
        },
        pickup,
      },
      successMessage
    );
  };
  if (rent && !selectedDay) {
    const dayName = format(new Date(rent?.endDate), "eeee").toLowerCase();
    setSelectedDay(dayName);
  }

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
        formatTZDate(new Date(rent?.endDate), "dddd DD MMMM YYYY")
      );
    }
    if (rent.remaining === 0) {
      return "HOY";
    }
    return `VENCIDA (${Math.abs(rent.remaining)} día(s))`;
  };

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
                      height={300}
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
                              # Equipo
                            </Typography>
                            <Typography color="black" gutterBottom>
                              {rent.machine?.machineNum}
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
                      {rent?.remaining < 0 && (
                        <Grid item lg={12}>
                          <Alert severity="warning">
                            Se generará una deuda de ${debt}.
                            <br />
                            El nuevo saldo será de ${newbalance}.
                          </Alert>
                        </Grid>
                      )}
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
                        disabled={isSubmitting}
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
