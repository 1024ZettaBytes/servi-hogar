import Head from "next/head";
import { getSession } from "next-auth/react";
import { useState } from "react";
import SidebarLayout from "@/layouts/SidebarLayout";
import { validateServerSideSession } from "../../lib/auth";
import PageHeader from "@/components/PageHeader";
import PageTitleWrapper from "@/components/PageTitleWrapper";
import NextLink from "next/link";
import Image from "next/image";
import {
  Card,
  Container,
  Grid,
  Skeleton,
  Alert,
  Box,
  Typography,
  FormLabel,
  FormControlLabel,
  FormControl,
  InputLabel,
  FormGroup,
  Checkbox,
  TextField,
} from "@mui/material";
import Footer from "@/components/Footer";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import StepContent from "@mui/material/StepContent";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import { getFetcher, useGetPickupById } from "../api/useRequest";
import { ACCESORIES_LIST } from "../../lib/consts/OBJ_CONTS";
import NextBreadcrumbs from "@/components/Shared/BreadCrums";
import { LoadingButton } from "@mui/lab";
import { DesktopDatePicker } from "@mui/x-date-pickers";
import { completePickup } from "lib/client/pickupsFetch";
import { useRouter } from "next/router";
import React from "react";
import { MuiFileInput } from "mui-file-input";
import { dateDiffInDays } from "lib/client/utils";

function RecoleccionPendiente() {
  const router = useRouter();
  const { pickupId } = router.query;
  const { pickup, pickupByIdError } = useGetPickupById(getFetcher, pickupId);
  const [pickupDate, setPickupDate] = useState<any>(new Date());
  const [whitDebt, setWhitDebt] = useState<boolean>(true);
  const [pickedAccesories, setPickedAccesories] = useState<any>({});
  const [attached, setAttached] = useState<any>({
    tag: { file: null, url: null },
  });

  const [badFormat, setBadFormat] = useState<any>({
    tag: false,
  });
  const paths = ["Inicio", "Recolecciones pendientes", `${pickup?.rent?.num}`];
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [hasErrorSubmitting, setHasErrorSubmitting] = useState<any>({
    error: false,
    msg: "",
  });
  const debt =
    (pickup?.rent?.customer?.level?.dayPrice || 0) *
    Math.abs(
      (pickup?.rent?.remaining || 0) - dateDiffInDays(new Date(), pickupDate)
    );
  const newbalance = (pickup?.rent?.customer?.balance || 0) - debt;
  const [activeStep, setActiveStep] = useState(0);
  const generalError = pickupByIdError;
  const completeData = pickup;

  const steps = [
    {
      label: "Fecha de recolección",
    },
    {
      label: "Equipo y accesorios recolectados",
    },
  ];

  const checkEnabledButton = () => {
    if (activeStep === 0) return pickupDate.toString() !== "Invalid Date";
    if (activeStep === 1) return attached.tag.file;
    return true;
  };

  const nextButtonEnabled = checkEnabledButton();

  const handleOnSubmit = async (event) => {
    setHasErrorSubmitting({ error: false, msg: "" });
    setIsSubmitting(true);
    const result = await completePickup(attached, {
      pickupId,
      pickedAccesories,
    });
    setIsSubmitting(false);
    if (!result.error) {
      handleNext(event);
    } else {
      setHasErrorSubmitting({ error: true, msg: result.msg });
    }
  };

  const handleNext = (event) => {
    event.preventDefault();
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  return (
    <>
      <Head>
        <title>Completar recolección</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader title={"Completar recolección"} sutitle={""} />
        <NextBreadcrumbs
          paths={paths}
          lastLoaded={!pickupByIdError && pickup}
        />
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
              <Alert severity="error">{pickupByIdError?.message}</Alert>
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
                        <Box
                          component="form"
                          onSubmit={
                            activeStep < steps.length - 1
                              ? handleNext
                              : handleOnSubmit
                          }
                        >
                          {activeStep === 0 && (
                            <Grid container>
                              <Grid item lg={12} m={1}>
                                <DesktopDatePicker
                                  label="Fecha de recolección*"
                                  inputFormat="dd/MM/yyyy"
                                  value={pickupDate}
                                  maxDate={new Date()}
                                  onChange={(newValue) => {
                                    setPickupDate(newValue);
                                  }}
                                  renderInput={(params) => (
                                    <TextField {...params} />
                                  )}
                                />
                              </Grid>
                              <Grid item xs={12} sm={12} lg={12} m={1}>
                                <FormControl
                                  component="fieldset"
                                  variant="standard"
                                >
                                  <FormLabel component="legend">
                                    Generar deuda
                                  </FormLabel>
                                  <FormGroup>
                                    <FormControlLabel
                                      control={
                                        <Checkbox
                                          checked={whitDebt}
                                          onChange={(event) => {
                                            setWhitDebt(event.target.checked);
                                          }}
                                        />
                                      }
                                      label={`Deuda de $${debt} (Vencida hace ${Math.abs(pickup?.rent.remaining)} día(s))`}
                                    />
                                  </FormGroup>
                                </FormControl>
                              </Grid>
                            </Grid>
                          )}
                          {activeStep === 1 && (
                            <Grid container>
                              <Grid
                                item
                                xs={2}
                                sm={2}
                                lg={1}
                                mt={1}
                                textAlign="center"
                              >
                                <InputLabel id="machine-id">
                                  # Equipo
                                </InputLabel>
                              </Grid>
                              <Grid item xs={12} sm={12} lg={12} />
                              <Grid
                                item
                                xs={2}
                                sm={2}
                                lg={1}
                                textAlign="center"
                              >
                                <Typography color="black" fontWeight="bold">
                                  {pickup.rent.machine.machineNum}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={12} lg={12} />
                              {pickup.rent.accesories && (
                                <Grid item xs={9} sm={6} lg={12} m={2}>
                                  <FormControl
                                    component="fieldset"
                                    variant="standard"
                                  >
                                    <FormLabel component="legend">
                                      Accesorios
                                    </FormLabel>
                                    <FormGroup>
                                      {Object.keys(pickup.rent.accesories).map(
                                        (key) =>
                                          pickup.rent.accesories[key] ? (
                                            <FormControlLabel
                                              key={key}
                                              control={
                                                <Checkbox
                                                  checked={
                                                    pickedAccesories[key]
                                                      ? true
                                                      : false
                                                  }
                                                  onChange={(event) => {
                                                    setPickedAccesories({
                                                      ...pickedAccesories,
                                                      [key]:
                                                        event.target.checked,
                                                    });
                                                  }}
                                                />
                                              }
                                              label={ACCESORIES_LIST[key]}
                                            />
                                          ) : null
                                      )}
                                    </FormGroup>
                                  </FormControl>
                                </Grid>
                              )}
                              {attached.tag?.url &&
                                !attached.tag.file.name.includes("pdf") && (
                                  <Grid item lg={12} m={1}>
                                    <Image
                                      src={attached.tag.url}
                                      alt="Picture of the author"
                                      width={300}
                                      height={400}
                                    />
                                  </Grid>
                                )}
                              <Grid item lg={4} m={1}>
                                <MuiFileInput
                                  required={!attached.tag.file}
                                  placeholder={"No seleccionada"}
                                  label={"Foto de frente"}
                                  value={attached.tag?.file}
                                  onChange={(file) => {
                                    if (
                                      file &&
                                      !file.type.includes("image/") &&
                                      !file.type.includes("/pdf")
                                    ) {
                                      setBadFormat({
                                        ...badFormat,
                                        tag: true,
                                      });
                                      setAttached({
                                        ...attached,
                                        tag: {
                                          ...attached.tag,
                                          error: true,
                                        },
                                      });
                                      return;
                                    }
                                    const url = file
                                      ? URL.createObjectURL(file)
                                      : null;
                                    setAttached({
                                      ...attached,
                                      tag: { file, url, error: false },
                                    });
                                  }}
                                />
                              </Grid>
                              <Grid item lg={12} />
                              {attached.tag?.error && (
                                <Grid item lg={4} m={1}>
                                  <Typography color="error">
                                    Seleccione un archivo válido(*.jpg, *.jpeg,
                                    *.png).
                                  </Typography>
                                </Grid>
                              )}
                              {hasErrorSubmitting.error && (
                                <Grid item lg={6} m={1}>
                                  <Alert severity="error">
                                    {hasErrorSubmitting.msg}
                                  </Alert>
                                </Grid>
                              )}
                            </Grid>
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
                                type="submit"
                                loading={isSubmitting}
                                disabled={!nextButtonEnabled}
                                variant="contained"
                                sx={{ mt: 1, mr: 1 }}
                              >
                                {index === steps.length - 1
                                  ? "Recolectada"
                                  : "Siguiente"}
                              </LoadingButton>
                            </div>
                          </Box>
                        </Box>
                      </StepContent>
                    </Step>
                  ))}
                </Stepper>

                {activeStep === steps.length && (
                  <Paper square elevation={0} sx={{ p: 3 }}>
                    <Alert severity="success">
                      La recolección fue completada
                    </Alert>
                    <NextLink href="/recolecciones-pendientes">
                      <Button sx={{ mt: 1, mr: 1 }}>
                        Lista de recolecciones pendientes
                      </Button>
                    </NextLink>
                  </Paper>
                )}
              </Card>
            )}
          </Grid>
        </Grid>
      </Container>
      <Footer />
    </>
  );
}

RecoleccionPendiente.getLayout = (page) => (
  <SidebarLayout>{page}</SidebarLayout>
);

export async function getServerSideProps({ req, resolvedUrl }) {
  let props = await validateServerSideSession(getSession, req, resolvedUrl);
  return props;
}
export default RecoleccionPendiente;
