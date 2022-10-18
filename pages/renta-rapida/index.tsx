import Head from "next/head";
import { getSession } from "next-auth/react";
import { useState } from "react";
import SidebarLayout from "@/layouts/SidebarLayout";
import { validateServerSideSession } from "../../lib/auth";
import PageHeader from "@/components/PageHeader";
import PageTitleWrapper from "@/components/PageTitleWrapper";
import { Card, Container, Grid, Skeleton, Alert, Box } from "@mui/material";
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
} from "../api/useRequest";
import { useSnackbar } from "notistack";

import NextBreadcrumbs from "@/components/Shared/BreadCrums";
import TablaClientesRenta from "./TablaClientesRenta";
import RentPeriod from "./RentPeriod";
import DeliveryTime from "./DeliveryTime";
import { LoadingButton } from "@mui/lab";
import { saveRent } from "lib/client/rentsFetch";

const defaultInitialDate = (today: Date) => {
  today.setHours(8, 0, 0);
  return today;
};

const defaultEndDate = (today: Date) => {
  today.setHours(22, 0, 0);
  return today;
};
const defaultData = {
  rentPeriod: {
    selectedWeeks: 1,
    useFreeWeeks: true,
  },
  deliveryTime: {
    date: addDays(new Date(), 1),
    timeOption: "any",
    fromTime: defaultInitialDate(addDays(new Date(), 1)),
    endTime: defaultEndDate(addDays(new Date(), 1)),
  },
  selectedCustomer: null,
};
function addDays(date: Date, days: number) {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
function RentaRapida() {
  const paths = ["Inicio", "Renta Rápida"];
  const { enqueueSnackbar } = useSnackbar();
  const { customerList, customerError } = useGetAllCustomersForRent(getFetcher);
  const { citiesList, citiesError } = useGetCities(getFetcher);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [rentPeriod, setRentPeriod] = useState(defaultData.rentPeriod);
  const [deliveryTime, setDeliveryTime] = useState(defaultData.deliveryTime);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(defaultData.selectedCustomer);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [hasErrorSubmitting, setHasErrorSubmitting] = useState<any>({
    error: false,
    msg: "",
  });
  const [activeStep, setActiveStep] = useState(0);
  const generalError = customerError || citiesError;
  const completeData = customerList && citiesList;
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
    if (activeStep === 1) return rentPeriod.selectedWeeks > 0;
    if (activeStep === 2)
      return (
        deliveryTime.timeOption === "any" ||
        (deliveryTime.fromTime &&
          deliveryTime.endTime &&
          deliveryTime.fromTime.getTime() <= deliveryTime.endTime.getTime())
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
    const result = await saveRent({
      customerId : selectedCustomer._id,
      rentPeriod,
      deliveryTime,
    });
    setIsSubmitting(false);
    if (!result.error) {
      handleNext();
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
    setSelectedCustomer(defaultData.selectedCustomer);
    setRentPeriod(defaultData.rentPeriod);
    setDeliveryTime(defaultData.deliveryTime);
  };
  return (
    <>
      <Head>
        <title>Clientes</title>
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
                {customerError?.message || citiesError?.message}
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
                                  customerList={customerList}
                                  citiesList={citiesList}
                                  selectedCustomer={selectedCustomer}
                                  onSelectCustomer={setSelectedCustomer}
                                />
                              </Grid>
                            </Grid>
                          </>
                        )}
                        {activeStep === 1 && (
                          <RentPeriod
                            selectedWeeks={rentPeriod.selectedWeeks}
                            useFreeWeeks={rentPeriod.useFreeWeeks}
                            freeWeeks={selectedCustomer.freeWeeks}
                            weekPrice={139.0}
                            onChangePeriod={onChangePeriod}
                          />
                        )}
                        {activeStep === 2 && (
                          <>
                            <DeliveryTime
                              date={deliveryTime.date}
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
                        )}
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
                      {selectedCustomer.name}
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
