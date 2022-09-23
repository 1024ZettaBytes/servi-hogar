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
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import {
  useGetAllCustomers,
  getFetcher,
  useGetCities,
} from "../api/useRequest";
import { useSnackbar } from "notistack";

import NextBreadcrumbs from "@/components/Shared/BreadCrums";
import TablaClientesRenta from "./TablaClientesRenta";

function RentaRapida() {
  const paths = ["Inicio", "Renta Rápida"];
  const { enqueueSnackbar } = useSnackbar();
  const { customerList, customerError } = useGetAllCustomers(getFetcher);
  const { citiesList, citiesError } = useGetCities(getFetcher);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<any>(null);
  const generalError = customerError || citiesError;
  const completeData = customerList && citiesList;
  const steps = [
    {
      label: "Seleccione un cliente",
    },
    {
      label: "Tiempo de renta",
      description:
        "An ad group contains one or more ads which target a shared set of keywords.",
    },
    {
      label: "Entrega",
      description: `Try out different ad text to see what brings in the most customers,
                and learn how to enhance your ads using features like ad extensions.
                If you run into any problems with your ads, find out how to tell if
                they're running and how to resolve approval issues.`,
    },
  ];
  const handleClickOpen = () => {
    setModalIsOpen(true);
  };
const getSelectedCustomer = (id, cList) =>{
  return cList.find(c => c._id.toString() === id);
}
const selectedCustomer = getSelectedCustomer(selectedId, customerList ? customerList : []) || null;
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
  const [activeStep, setActiveStep] = useState(0);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
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
                      <StepLabel
                        optional={
                          index === 2 ? (
                            <Typography variant="caption">
                              Último paso
                            </Typography>
                          ) : null
                        }
                      >
                        {step.label}
                      </StepLabel>
                      <StepContent>
                        {index === 0 && (
                          <>
                            <Grid container >
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
                              selectedCustomer={selectedCustomer}
                              onSelectCustomer={setSelectedId}
                            />
                              </Grid>
                            </Grid>
                            
                          </>
                        )}
                        <Box sx={{ mb: 2 }}>
                          <div>
                            <Button
                              disabled={!selectedCustomer}
                              variant="contained"
                              onClick={handleNext}
                              sx={{ mt: 1, mr: 1 }}
                            >
                              {index === steps.length - 1
                                ? "Rentar"
                                : "Siguiente"}
                            </Button>
                            {index > 0 && (
                              <Button
                                onClick={handleBack}
                                sx={{ mt: 1, mr: 1 }}
                              >
                                Back
                              </Button>
                            )}
                          </div>
                        </Box>
                      </StepContent>
                    </Step>
                  ))}
                </Stepper>

                {activeStep === steps.length && (
                  <Paper square elevation={0} sx={{ p: 3 }}>
                    <Typography>
                      All steps completed - you&apos;re finished
                    </Typography>
                    <Button onClick={handleReset} sx={{ mt: 1, mr: 1 }}>
                      Reset
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
