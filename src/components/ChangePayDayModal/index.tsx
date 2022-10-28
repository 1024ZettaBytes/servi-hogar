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
import { capitalizeFirstLetter, addDaysToDate } from "lib/client/utils";
import { format } from "date-fns";
import es from "date-fns/locale/es";
import { WEEK_DAYS, PRICES } from "lib/consts/OBJ_CONTS";
import numeral from "numeral";
function ChangePayDaymodal(props) {
  const { rentId, handleOnClose, open } = props;
  const { rent, rentByIdError } = useGetRentById(getFetcher, rentId);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [hasErrorSubmitting, setHasErrorSubmitting] = useState<any>({
    error: false,
    msg: "",
  });
  const [selectedDay, setSelectedDay] = useState<any>(null);

  const submitButtonEnabled = rent?.endDate
    ? selectedDay !== format(new Date(rent?.endDate), "eeee").toLowerCase()
    : false;

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
  
  const addedDays = plusDays();
  const daysCost = addedDays * PRICES.day;
  const getTotalDebt = () => {
    let usedFree = false;
    let newBalance = 0;
    if (!rent)
    return {debt:0, usedFree, newBalance: 0};
    newBalance = rent.customer.balance;
    let debt = rent.customer.balance - daysCost; // deuda total despues de agregar recorrido
      if(debt < 0){
        const toPay = daysCost;
        newBalance = debt;
        debt = daysCost;
        //if will use free week
        if(toPay >= (4 * PRICES.day) && rent.customer.freeWeeks > 0){
          usedFree = true;
          debt = (debt - PRICES.week)>0 ? (debt - PRICES.week):0;
          newBalance = newBalance + PRICES.week;
        }
      }else{
       debt =  daysCost;
       newBalance = rent.customer.balance - daysCost
      }
      return {debt, usedFree, newBalance};    
  };
  const totalDebt = getTotalDebt()

  return (
    <Dialog open={open} fullWidth={true} maxWidth={"md"} scroll={"body"}>
      <Card>
        <CardHeader title="Cambiar día de pago" />
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
                          sx={{ textAlign: "left" }}
                        >
                          <Box>
                            <Typography gutterBottom variant="subtitle2">
                              Vencimiento
                            </Typography>
                            <Typography color="black" gutterBottom>
                              {capitalizeFirstLetter(
                                format(
                                  new Date(rent?.endDate),
                                  "LLLL dd yyyy",
                                  {
                                    locale: es,
                                  }
                                )
                              )}
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
                              Semanas gratis
                            </Typography>
                            <Typography color="black" gutterBottom>
                              {rent.customer?.freeWeeks}
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

                        <Grid
                          item
                          xs={12}
                          sm={12}
                          lg={3}
                          mt={1}
                          sx={{ textAlign: { lg: "left" } }}
                        >
                          <Box>
                            <Typography gutterBottom variant="subtitle2">
                              ¿Ha cambiado el dia de pago anteriormente?
                            </Typography>
                            <Typography color="black" gutterBottom>
                              {rent.customer.payDayChanged ? "Sí" : "No"}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={0} sm={0} lg={1} mt={1} />
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

                        <Grid item lg={2} mt={4}>
                          {rent?.endDate ? (
                            <FormControl sx={{ width: "100%" }}>
                              <InputLabel id="day-id">Día de pago*</InputLabel>
                              <Select
                                labelId="day-id"
                                label="Día de pago*"
                                id="day"
                                name="day"
                                required
                                autoComplete="off"
                                size="medium"
                                value={selectedDay || ""}
                                onChange={(event) => {
                                  setSelectedDay(event.target.value);
                                }}
                              >
                                {Object.keys(WEEK_DAYS).map((dayKey) => (
                                  <MenuItem key={dayKey} value={dayKey}>
                                    {WEEK_DAYS[dayKey]}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          ) : (
                            <Skeleton
                              variant="text"
                              sx={{ fontSize: "1rem", width: "100px" }}
                            />
                          )}
                        </Grid>
                        {addedDays > 0 && (
                          <>
                            <Grid item xs={12} sm={12} lg={12} mt={1}>
                              <Alert severity="warning">
                               
                                
                                {totalDebt.usedFree
                                  ? "Se utilizará 1 semana gratis para cubrir el costo "
                                  : `Se quitarán $${totalDebt.debt} del saldo del cliente para compensar los días restantes.`}
                                <br/>
                                El nuevo saldo será de $
                                {totalDebt.debt >= 0 ? rent.customer.balance - totalDebt.debt : totalDebt.debt}
                              </Alert>
                            </Grid>
                            <Grid item lg={10} />
                            <Grid item lg={9}></Grid>
                            <Grid
                              item
                              xs={12}
                              sm={12}
                              lg={3}
                              mt={1}
                              sx={{ textAlign: { lg: "center" } }}
                            >
                              <Box>
                                <Typography gutterBottom variant="h5">
                                  Nueva fecha de vencimiento
                                </Typography>
                                <Typography color="black" gutterBottom>
                                  {capitalizeFirstLetter(
                                    format(
                                      addDaysToDate(
                                        new Date(rent?.endDate),
                                        addedDays
                                      ),
                                      "LLLL dd yyyy",
                                      {
                                        locale: es,
                                      }
                                    )
                                  )}
                                </Typography>
                              </Box>
                            </Grid>
                          </>
                        )}
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

ChangePayDaymodal.propTypes = {
  handleOnClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  rentId: PropTypes.string.isRequired,
};

export default ChangePayDaymodal;
