import Head from "next/head";
import { getSession } from "next-auth/react";
import { useState } from "react";
import SidebarLayout from "@/layouts/SidebarLayout";
import { validateServerSideSession } from "../../lib/auth";
import PageHeader from "@/components/PageHeader";
import PageTitleWrapper from "@/components/PageTitleWrapper";
import {
  Card,
  Container,
  Grid,
  Skeleton,
  Alert,
  Box,
  Typography,
} from "@mui/material";
import Footer from "@/components/Footer";
import AddCustomerModal from "@/components/AddCustomerModal";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import StepContent from "@mui/material/StepContent";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import AddIcon from "@mui/icons-material/Add";
import {
  useGetAllCustomersForRent,
  getFetcher,
  useGetCities,
  useGetAllCustomers,
  useGetPrices,
} from "../api/useRequest";
import { useSnackbar } from "notistack";
import { addDaysToDate, dateDiffInDays } from "../../lib/client/utils";
import NextBreadcrumbs from "@/components/Shared/BreadCrums";
import TablaClientesRenta from "./TablaClientesRenta";
import RentPeriod from "./RentPeriod";
import OperationTime from "./OperationTime";
import { LoadingButton } from "@mui/lab";
import { saveRent } from "lib/client/rentsFetch";
import FormatModal from "@/components/FormatModal";
import { getFormatForDelivery } from "../../lib/consts/OBJ_CONTS";
import { markWasSentDelivery } from "lib/client/deliveriesFetch";

const defaultInitialDate = (today: Date) => {
  today.setHours(8, 0, 0);
  return today;
};

const defaultEndDate = (today: Date) => {
  today.setHours(22, 0, 0);
  return today;
};
const defaultData = () => {
  return {
    rentPeriod: {
      selectedWeeks: 1,
      useFreeWeeks: true,
    },
    deliveryTime: {
      date: addDaysToDate(new Date(), 1),
      timeOption: "any",
      fromTime: defaultInitialDate(addDaysToDate(new Date(), 1)),
      endTime: defaultEndDate(addDaysToDate(new Date(), 1)),
    },
    selectedCustomer: null,
  };
};
function RentaRapida() {
  const paths = ["Inicio", "Renta Rápida"];
  const { enqueueSnackbar } = useSnackbar();
  const { customersForRentList, customersForRentError } = useGetAllCustomersForRent(getFetcher);
  const { customerList, customerError } = useGetAllCustomers(getFetcher);
  const {prices, pricesError } = useGetPrices(getFetcher);
  const { citiesList, citiesError } = useGetCities(getFetcher);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [formatIsOpen, setFormatIsOpen] = useState(false);
  const [rentPeriod, setRentPeriod] = useState(defaultData().rentPeriod);
  const [deliveryTime, setDeliveryTime] = useState(defaultData().deliveryTime);
  const [selectedId, setSelectedCustomer] = useState<any>(
    defaultData().selectedCustomer
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [customerRent, setCustomerRent] = useState<any>(null);
  const [hasErrorSubmitting, setHasErrorSubmitting] = useState<any>({
    error: false,
    msg: "",
  });
  const [activeStep, setActiveStep] = useState(0);
  const generalError = customerError || citiesError || customersForRentError || pricesError;
  const completeData = customerList && citiesList && customersForRentList && prices;
  const steps = [
    {
      label: "Seleccione un cliente",
    },
    {
      label: "Tiempo de renta",
    },
    {
      label: "Entrega",
    },
  ];
  const checkEnabledButton = (selectedCustomer, rentPeriod) => {
    if (activeStep === 0) return selectedCustomer;
    if (activeStep === 1)
      return selectedCustomer && rentPeriod.selectedWeeks > 0;
    if (activeStep === 2)
      return (
        selectedCustomer &&
        deliveryTime.date &&
        dateDiffInDays(new Date(), new Date(deliveryTime.date)) >= 0 &&
        (deliveryTime.timeOption === "any" ||
          (deliveryTime.fromTime &&
            deliveryTime.endTime &&
            deliveryTime.fromTime.getTime() <= deliveryTime.endTime.getTime()))
      );
  };

  const handleClickOpen = () => {
    setModalIsOpen(true);
  };

  const onChangePeriod = (id, value) => {
    setRentPeriod({ ...rentPeriod, [id]: value });
  };

  const onChangeDeliverTime = (id, value) => {
    if (
      (id === "fromTime" || id === "endTime") &&
      value.toString() === "Invalid Date"
    ) {
      value = null;
    }

    setDeliveryTime({ ...deliveryTime, [id]: value });
  };
  const getSelectedCustomer = (id, cList) => {
    return cList.find((c) => c._id.toString() === id);
  };
  const selectedCustomer =
    getSelectedCustomer(selectedId, customerList ? customerList : []) || null;

  const handleClose = (addedCustomer, successMessage = null) => {
    setModalIsOpen(false);
    if (addedCustomer && successMessage) {
      enqueueSnackbar(successMessage, {
        variant: "success",
        anchorOrigin: {
          vertical: "top",
          horizontal: "center",
        },
        autoHideDuration: 1500,
      });
    }
  };
  const nextButtonEnabled = checkEnabledButton(selectedCustomer, rentPeriod);

  const handleOnRentSubmit = async () => {
    setHasErrorSubmitting({ error: false, msg: "" });
    setIsSubmitting(true);
    setCustomerRent(selectedCustomer);
    const result = await saveRent({
      customerId: selectedId,
      rentPeriod,
      deliveryTime,
    });
    const rent = { ...result.rent, customer: selectedCustomer, delivery: result.delivery };
    
    setCustomerRent(rent);
    setIsSubmitting(false);
    if (!result.error) {
      handleNext();
      setFormatIsOpen(true);
    } else {
      setHasErrorSubmitting({ error: true, msg: result.msg });
    }
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setSelectedCustomer(defaultData().selectedCustomer);
    setRentPeriod(defaultData().rentPeriod);
    setDeliveryTime(defaultData().deliveryTime);
    setCustomerRent(null);
  };
  return (
    <>
      <Head>
        <title>Nueva renta</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader title={"Nueva Renta"} sutitle={""} />
        <NextBreadcrumbs paths={paths} lastLoaded={true} />
      </PageTitleWrapper>
      <Container maxWidth="lg">
        <Grid
          container
          direction="row"
          justifyContent="center"
          alignItems="stretch"
          spacing={4}
        >
          <Grid item xs={12}>
            {generalError ? (
              <Alert severity="error">
                {customerError?.message || citiesError?.message || pricesError?.message}
              </Alert>
            ) : !completeData ? (
              <Skeleton
                variant="rectangular"
                width={"100%"}
                height={500}
                animation="wave"
              />
            ) : (
              <Card sx={{ p: 2 }}>
                <Stepper
                  activeStep={activeStep}
                  orientation="vertical"
                  sx={{ backgroundColor: "transparent" }}
                >
                  {steps.map((step, index) => (
                    <Step key={step.label}>
                      <StepLabel>{step.label}</StepLabel>
                      <StepContent>
                        {activeStep === 0 && (
                          <>
                            <Grid container>
                              <Grid item xs={12} md={4} lg={4}></Grid>
                              <Grid item xs={12} md={4} lg={4}>
                                <Box flex={1} p={2}>
                                  <Button
                                    fullWidth
                                    startIcon={<AddIcon />}
                                    size="medium"
                                    variant="contained"
                                    sx={{ marginTop: 1 }}
                                    onClick={handleClickOpen}
                                  >
                                    Nuevo
                                  </Button>
                                </Box>
                              </Grid>
                              <Grid item xs={12} md={4} lg={4}></Grid>
                              <Grid item xs={12} md={12} lg={12}>
                                <TablaClientesRenta
                                  customerList={customersForRentList}
                                  citiesList={citiesList}
                                  selectedCustomer={selectedCustomer}
                                  onSelectCustomer={setSelectedCustomer}
                                />
                              </Grid>
                            </Grid>
                          </>
                        )}
                        {activeStep === 1 ? (
                          selectedCustomer ? (
                            <RentPeriod
                              label="Se rentará por"
                              selectedWeeks={rentPeriod.selectedWeeks}
                              useFreeWeeks={rentPeriod.useFreeWeeks}
                              freeWeeks={selectedCustomer.freeWeeks}
                              weekPrice={prices.newWeekPrice}
                              onChangePeriod={onChangePeriod}
                            />
                          ) : (
                            <Typography>
                              El cliente seleccionado ya no está disponible,
                              seleccione otro por favor.
                            </Typography>
                          )
                        ) : null}
                        {activeStep === 2 ? (
                          selectedCustomer ? (
                            <>
                              <OperationTime
                                date={deliveryTime.date}
                                minDate={new Date()}
                                timeOption={deliveryTime.timeOption}
                                fromTime={deliveryTime.fromTime}
                                endTime={deliveryTime.endTime}
                                onChangeTime={onChangeDeliverTime}
                              />
                              {hasErrorSubmitting.error && (
                                <Alert severity="error">
                                  {hasErrorSubmitting.msg}
                                </Alert>
                              )}
                            </>
                          ) : (
                            <Typography>
                              El cliente seleccionado ya no está disponible,
                              seleccione otro por favor.
                            </Typography>
                          )
                        ) : null}
                        <Box sx={{ mb: 2 }}>
                          <div>
                            {index > 0 && (
                              <Button
                                disabled={isSubmitting}
                                onClick={handleBack}
                                sx={{ mt: 1, mr: 1 }}
                              >
                                Atrás
                              </Button>
                            )}
                            <LoadingButton
                              loading={isSubmitting}
                              disabled={!nextButtonEnabled}
                              variant="contained"
                              onClick={
                                activeStep < steps.length - 1
                                  ? handleNext
                                  : handleOnRentSubmit
                              }
                              sx={{ mt: 1, mr: 1 }}
                            >
                              {index === steps.length - 1
                                ? "Rentar"
                                : "Siguiente"}
                            </LoadingButton>
                          </div>
                        </Box>
                      </StepContent>
                    </Step>
                  ))}
                </Stepper>

                {activeStep === steps.length && (
                  <Paper square elevation={0} sx={{ p: 3 }}>
                    <Alert severity="success">
                      Se generó una renta nueva para el cliente{" "}
                      {customerRent?.customer?.name}
                    </Alert>
                    <Button onClick={handleReset} sx={{ mt: 1, mr: 1 }}>
                      Agendar nueva
                    </Button>
                  </Paper>
                )}
              </Card>
            )}
          </Grid>
        </Grid>
      </Container>
      {modalIsOpen && completeData ? (
        <AddCustomerModal
          open={modalIsOpen}
          handleOnClose={handleClose}
          citiesList={citiesList}
          customerList={customerList}
        />
      ) : null}

      {formatIsOpen && (
        <FormatModal
          open={formatIsOpen}
          selectedId={customerRent?.delivery?._id}
          title="Formato de entrega"
          text={customerRent.delivery?.wasSent ? "ENVIADO":null}
          textColor="green"
          formatText={getFormatForDelivery(customerRent, customerRent.delivery, deliveryTime)}
          onAccept={() => {
            setFormatIsOpen(false);
          }}
          onSubmitAction={markWasSentDelivery}
        />
      )}
      <Footer />
    </>
  );
}

RentaRapida.getLayout = (page) => <SidebarLayout>{page}</SidebarLayout>;

export async function getServerSideProps({ req, resolvedUrl }) {
  let props = await validateServerSideSession(getSession, req, resolvedUrl);
  return props;
}
export default RentaRapida;
