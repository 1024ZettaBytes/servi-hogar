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
import AddPaymentModal from "../AddPaymentModal";
import RentPeriodExtend from "./RentPeriodExtend";
import { LoadingButton } from "@mui/lab";
import {
  useGetRentById,
  getFetcher,
  refreshData,
} from "../../../pages/api/useRequest";
import { extendRent } from "../../../lib/client/rentsFetch";
import { capitalizeFirstLetter, addDaysToDate, formatTZDate } from "lib/client/utils";
import numeral from "numeral";
import { useSnackbar } from "notistack";
import { ROUTES } from "lib/consts/API_URL_CONST";
function ExtendRentModal(props) {
  const { enqueueSnackbar } = useSnackbar();
  const { rentId, handleOnClose, open } = props;
  const { rent, rentByIdError } = useGetRentById(getFetcher, rentId);
  const [rentPeriod, setRentPeriod] = useState({
    selectedWeeks: 1,
    useFreeWeeks: true,
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [hasErrorSubmitting, setHasErrorSubmitting] = useState<any>({
    error: false,
    msg: "",
  });
  const [paymentModalIsOpen, setPaymentModalIsOpen] = useState<boolean>(false);

  const onChangePeriod = (id, value) => {
    setRentPeriod({ ...rentPeriod, [id]: value });
  };
  const checkCustomerBalance = () => {
    return rent
      ? rent.customer?.balance >=
          (rentPeriod.selectedWeeks -
            (rentPeriod.useFreeWeeks ? rent.customer.freeWeeks : 0)) *
            rent.customer?.level?.weekPrice
      : 0;
  };

  const customerHasBalance = checkCustomerBalance();

  const getToPay = (): number => {
    return (
      (rentPeriod.selectedWeeks -
        (rentPeriod.useFreeWeeks ? rent.customer.freeWeeks : 0)) *
        rent.customer?.level?.weekPrice -
      rent.customer?.balance
    );
  };
  const checkEnabledButton = () => {
    return (
      rent &&
      rentPeriod.selectedWeeks &&
      rentPeriod.selectedWeeks > 0 &&
      (customerHasBalance || rent.customer.balance + getToPay() === 0)
    );
  };
  const submitButtonEnabled = checkEnabledButton();
  const handleOnSubmit = async (event) => {
    event.preventDefault();
    setHasErrorSubmitting({ error: false, msg: "" });
    setIsSubmitting(true);
    const result = await extendRent({
      rentId,
      rentPeriod,
    });
    setIsSubmitting(false);
    if (!result.error) {
      handleSavedCustomer(result.msg);
    } else {
      setHasErrorSubmitting({ error: true, msg: result.msg });
    }
  };
  const handleClosePaymentModal = (addedPayment, successMessage = null) => {
    setPaymentModalIsOpen(false);
    if (addedPayment && successMessage) {
      enqueueSnackbar(successMessage, {
        variant: "success",
        anchorOrigin: {
          vertical: "top",
          horizontal: "center",
        },
        autoHideDuration: 1500,
      });
    }
    refreshData(ROUTES.RENT_BY_ID_API.replace(":id", rentId));
  };
  const handleClose = () => {
    setHasErrorSubmitting({ error: false, msg: "" });
    setIsSubmitting(false);
    handleOnClose(false);
  };
  const handleSavedCustomer = (successMessage) => {
    handleOnClose(true, successMessage);
  };

  return (
    <Dialog open={open} fullWidth={true} maxWidth={"md"} scroll={"body"}>
      <Card>
        <CardHeader title="Extender tiempo de renta" />
        <Divider />
        <CardContent>
          <Box component="form" onSubmit={handleOnSubmit}>
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
                          sx={{ textAlign: "left" }}
                        >
                          <Box>
                            <Typography gutterBottom variant="subtitle2">
                              Vencimiento
                            </Typography>
                            <Typography color="black" gutterBottom>
                              {capitalizeFirstLetter(
                                formatTZDate(
                                  new Date(rent?.endDate),
                                  "MMMM DD YYYY"
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

                        <Grid item lg={12} mt={4}>
                          <RentPeriodExtend
                            label={"Extender"}
                            selectedWeeks={rentPeriod.selectedWeeks}
                            useFreeWeeks={rentPeriod.useFreeWeeks}
                            freeWeeks={rent.customer?.freeWeeks}
                            weekPrice={rent.customer?.level?.weekPrice}
                            onChangePeriod={onChangePeriod}
                          />
                        </Grid>
                        {!customerHasBalance &&
                          (Math.abs(rent.customer?.balance) !== getToPay() ||
                            rent.customer.balance > 0) && (
                            <Grid item lg={12}>
                              <Alert
                                severity="warning"
                                action={
                                  <Button
                                    fullWidth
                                    size="medium"
                                    variant="outlined"
                                    onClick={() => setPaymentModalIsOpen(true)}
                                  >
                                    NUEVO PAGO
                                  </Button>
                                }
                              >
                                El cliente no tiene el saldo suficiente, por
                                favor agregue un pago nuevo de ${getToPay()}
                              </Alert>
                            </Grid>
                          )}
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
                              Nueva fecha de pago
                            </Typography>
                            <Typography color="black" gutterBottom>
                              {capitalizeFirstLetter(
                                formatTZDate(
                                  addDaysToDate(
                                    new Date(rent?.endDate),
                                    rentPeriod.selectedWeeks * 7
                                  ),
                                  "MMMM DD YYYY"
                                )
                              )}
                            </Typography>
                          </Box>
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
                        onClick={() => handleClose()}
                      >
                        Cancelar
                      </Button>
                    </Grid>
                    <Grid item>
                      <LoadingButton
                        type="submit"
                        loading={isSubmitting}
                        disabled={!submitButtonEnabled}
                        size="large"
                        variant="contained"
                      >
                        Guardar
                      </LoadingButton>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Container>
          </Box>
          {paymentModalIsOpen && (
            <AddPaymentModal
              handleOnClose={handleClosePaymentModal}
              open={paymentModalIsOpen}
              customerId={rent.customer?._id}
              reason={"RENT_EXT"}
              amount={getToPay()}
            />
          )}
        </CardContent>
      </Card>
    </Dialog>
  );
}

ExtendRentModal.propTypes = {
  handleOnClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  rentId: PropTypes.string.isRequired,
};

export default ExtendRentModal;
