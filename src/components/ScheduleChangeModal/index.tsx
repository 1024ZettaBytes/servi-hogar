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
  TextField,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { useGetRentById, getFetcher } from "../../../pages/api/useRequest";
import { saveChange } from "../../../lib/client/changesFetch";
import {
  capitalizeFirstLetter,
  addDaysToDate,
  dateDiffInDays,
  formatTZDate,
  convertDateToLocal,
  convertDateToTZ,
} from "lib/client/utils";
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
function ScheduleChangeModal(props) {
  const { rentId, handleOnClose, open } = props;
  const { rent, rentByIdError } = useGetRentById(getFetcher, rentId);
  const [changeTime, setChangeTime] = useState<any>({
    date: addDaysToDate(new Date(), 1),
    timeOption: "any",
    fromTime: defaultInitialDate(
      convertDateToLocal(addDaysToDate(new Date(), 1))
    ),
    endTime: defaultEndDate(convertDateToLocal(addDaysToDate(new Date(), 1))),
  });
  const [reason, setReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [hasErrorSubmitting, setHasErrorSubmitting] = useState<any>({
    error: false,
    msg: "",
  });

  const submitButtonEnabled =
    rent &&
    changeTime.date &&
    reason.trim() !== "" &&
    dateDiffInDays(new Date(), new Date(changeTime.date)) >= 0 &&
    (changeTime.timeOption === "any" ||
      (changeTime.fromTime &&
        changeTime.endTime &&
        changeTime.fromTime.getTime() <= changeTime.endTime.getTime()));

  const handleOnSubmit = async () => {
    setHasErrorSubmitting({ error: false, msg: "" });
    setIsSubmitting(true);
    const result = await saveChange({
      rentId,
      changeTime: {
        ...changeTime,
        date: convertDateToTZ(changeTime.date),
        fromTime: convertDateToTZ(changeTime.fromTime),
        endTime: convertDateToTZ(changeTime.endTime),
      },
      reason,
    });
    setIsSubmitting(false);
    if (!result.error) {
      handleSavedChange(result.msg, result.change);
    } else {
      setHasErrorSubmitting({ error: true, msg: result.msg });
    }
  };

  const handleClose = () => {
    setHasErrorSubmitting({ error: false, msg: "" });
    setIsSubmitting(false);
    handleOnClose(false);
  };
  const handleSavedChange = (successMessage, change) => {
    handleOnClose(true, { rent, changeTime: {
      ...changeTime,
      date: convertDateToTZ(changeTime.date),
      fromTime: convertDateToTZ(changeTime.fromTime),
      endTime: convertDateToTZ(changeTime.endTime),
    }, reason, change }, successMessage);
  };


  const onChangeTime = (id, value) => {
    if (
      (id === "fromTime" || id === "endTime") &&
      value.toString() === "Invalid Date"
    ) {
      value = null;
    }

    setChangeTime({ ...changeTime, [id]: value });
  };
  const getExpiration = () => {
    if (!rent) return "";
    if (rent.remaining > 0) {
      return capitalizeFirstLetter(
        formatTZDate(new Date(rent?.endDate), "MMMM DD YYYY")
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
        <CardHeader title="Programar cambio de equipo" />
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
                          date={changeTime.date}
                          minDate={new Date()}
                          timeOption={changeTime.timeOption}
                          fromTime={changeTime.fromTime}
                          endTime={changeTime.endTime}
                          onChangeTime={onChangeTime}
                        />
                        <Grid item lg={6}>
                          <TextField
                            sx={{ marginTop: 2 }}
                            autoComplete="off"
                            required
                            label={"Razón del cambio"}
                            multiline
                            rows={3}
                            value={reason}
                            onChange={(event) => {
                              setReason(event.target.value);
                            }}
                            autoFocus
                            fullWidth={true}
                          />
                        </Grid>
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

ScheduleChangeModal.propTypes = {
  handleOnClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  rentId: PropTypes.string.isRequired,
};

export default ScheduleChangeModal;
