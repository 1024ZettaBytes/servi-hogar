import Head from "next/head";
import { getSession, useSession } from "next-auth/react";
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
  FormLabel,
  FormControlLabel,
  FormControl,
  InputLabel,
  FormGroup,
  Checkbox,
  RadioGroup,
  Radio,
  TextField,
  Select,
  MenuItem,
  Typography,
} from "@mui/material";
import Footer from "@/components/Footer";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import StepContent from "@mui/material/StepContent";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import {
  getFetcher,
  useGetChangeById,
  useGetMachinesForRent,
  useGetWarehouseMachines,
} from "../api/useRequest";
import { ACCESORIES_LIST } from "../../lib/consts/OBJ_CONTS";
import NextBreadcrumbs from "@/components/Shared/BreadCrums";
import { LoadingButton } from "@mui/lab";
import { completeChange } from "lib/client/changesFetch";
import { useRouter } from "next/router";
import React from "react";
import { MuiFileInput } from "mui-file-input";
import { DesktopDatePicker } from "@mui/x-date-pickers";
import { convertDateToLocal, convertDateToTZ, setDateToEnd, setDateToInitial, setDateToMid, compressImage } from "lib/client/utils";

function CambioPendiente({ session }) {
  const router = useRouter();
  const { changeId } = router.query;
  const { change, changeByIdError } = useGetChangeById(getFetcher, changeId);
  const { machinesData, machinesError } = useGetMachinesForRent(getFetcher);
  const { warehouseMachines: allWarehouseMachines } = useGetWarehouseMachines(getFetcher, 'EN_VEHICULO', 'minimal');
  const { data: sessionData, update: updateSession } = useSession();
  const [changeDate, setChangeDate] = useState<any>(new Date());
  const [changedAccesories, setChangedAccesories] = useState<any>({});
  const [selectedWarehouseMachine, setSelectedWarehouseMachine] = useState<string>("");
  const [attached, setAttached] = useState<any>({
    tag: { file: null, url: null },
  });
  
  // Use client-side session data if available, otherwise fall back to server-side session
  const currentUser = sessionData?.user || session?.user;
  const isBlocked = currentUser?.isBlocked === true;
  
  const [badFormat, setBadFormat] = useState<any>({
    tag: false,
  });
  const paths = ["Inicio", "Cambios pendientes", `${change?.totalNumber}`];
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [wasFixed, setWasFixed] = useState<boolean>(false);
  const [hasErrorSubmitting, setHasErrorSubmitting] = useState<any>({
    error: false,
    msg: "",
  });
  const [activeStep, setActiveStep] = useState(0);
  const generalError = changeByIdError || machinesError;
  const completeData = change && machinesData;

  const steps = [
    {
      label: "Resultado",
    },
  ];

  const checkEnabledButton = () => {
    const dateValid = changeDate 
    ? ( changeDate.toString() !== "Invalid Date" && changeDate <= setDateToEnd(new Date()) )
    : change?.date && new Date(change?.date) <= setDateToEnd(new Date()) ;
    if (change?.isReplacement && !selectedWarehouseMachine) return false;
    return dateValid;
  };

  const nextButtonEnabled = checkEnabledButton();

  const handleOnSubmit = async (event) => {
    event.preventDefault();
    setHasErrorSubmitting({ error: false, msg: "" });
    setIsSubmitting(true);
    const { problemDesc, solutionDesc, newMachine } = event.target;
    const isReplacementChange = change?.isReplacement === true;
    const sendAttachment = isReplacementChange || !wasFixed;
    const result = await completeChange(sendAttachment ? attached : null, {
      changeId,
      wasFixed: isReplacementChange ? false : wasFixed,
      changeDate:  setDateToMid(changeDate ? convertDateToTZ(changeDate) : change?.date),
      problemDesc: problemDesc?.value,
      solutionDesc: solutionDesc?.value,
      newMachine: isReplacementChange ? undefined : newMachine?.value,
      changedAccesories: isReplacementChange ? {} : changedAccesories,
      warehouseMachineRef: isReplacementChange ? selectedWarehouseMachine : undefined,
    });
    setIsSubmitting(false);
    if (!result.error) {
      // Update session to get latest user data (including isBlocked status)
      await updateSession();
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
        <title>Completar cambio</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader title={"Completar cambio"} sutitle={""} />
        <NextBreadcrumbs
          paths={paths}
          lastLoaded={!changeByIdError && change}
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
            {isBlocked && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="h4" gutterBottom>
                  Usuario Bloqueado
                </Typography>
                <Typography>
                  Tu cuenta ha sido bloqueada por exceder el tiempo permitido entre vueltas (más de 35 minutos). 
                  Por favor contacta al administrador para resolver esta situación.
                </Typography>
              </Alert>
            )}
            {generalError ? (
              <Alert severity="error">
                {changeByIdError?.message || machinesError?.message}
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
                <Grid container sx={{ mb: 2 }}>
                  <Grid item lg={1} container>
                    <Grid item xs={2} sm={2} lg={12} mt={1} textAlign="center">
                      <InputLabel># Equipo</InputLabel>
                    </Grid>
                    <Grid item xs={12} sm={12} lg={12} />
                    <Grid item xs={2} sm={2} lg={12} textAlign="center">
                      <Typography color="black" fontWeight="bold">
                        {change?.rent?.machine?.machineNum}
                      </Typography>
                    </Grid>
                  </Grid>
                  <Grid item container lg={10}>
                    <Grid item xs={2} sm={2} lg={1} mt={1} textAlign="center">
                      <InputLabel>Cliente</InputLabel>
                    </Grid>
                    <Grid item xs={12} sm={12} lg={12} />
                    <Grid item xs={12} sm={2} lg={12}>
                      <Typography color="black" fontWeight="bold">
                        {change?.rent?.customer?.name}
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>
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
                                  label="Fecha de cambio"
                                  inputFormat="dd/MM/yyyy"
                                  value={changeDate || convertDateToLocal(new Date(change.date))}
                                  minDate={setDateToInitial(convertDateToLocal(new Date()))}
                                  maxDate={new Date()}
                                  onChange={(newValue) => {
                                    setChangeDate(newValue);
                                  }}
                                  renderInput={(params) => (
                                    <TextField {...params} />
                                  )}
                                />
                              </Grid>
                              <Grid item xs={12} sm={12} lg={12} m={1}>
                                {change?.isReplacement ? (
                                  <>
                                    <Alert severity="info" sx={{ mb: 1 }}>
                                      <Typography variant="subtitle2" gutterBottom>
                                        Reemplazo con máquina de almacén
                                      </Typography>
                                      <Typography variant="body2">
                                        Seleccione la máquina de almacén que dejará al cliente.
                                        El equipo actual pasará al almacén como repuesta.
                                      </Typography>
                                    </Alert>
                                    <FormControl fullWidth required sx={{ mt: 1 }}>
                                      <InputLabel>Máquina de almacén</InputLabel>
                                      <Select
                                        value={selectedWarehouseMachine}
                                        label="Máquina de almacén"
                                        onChange={(e) => setSelectedWarehouseMachine(e.target.value)}
                                      >
                                        {(allWarehouseMachines || []).map((wm) => (
                                          <MenuItem key={wm._id} value={wm._id}>
                                            #{wm.entryNumber} — {wm.brand} - {wm.serialNumber}
                                          </MenuItem>
                                        ))}
                                      </Select>
                                    </FormControl>
                                    {(allWarehouseMachines || []).length === 0 && (
                                      <Alert severity="warning" sx={{ mt: 1 }}>
                                        No hay máquinas de almacén cargadas en vehículos.
                                        Primero cargue una desde la página de Almacén.
                                      </Alert>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <FormLabel id="demo-controlled-radio-buttons-group">
                                      ¿Arreglado en el lugar?
                                    </FormLabel>
                                    <RadioGroup
                                      row
                                      aria-labelledby="demo-controlled-radio-buttons-group"
                                      name="controlled-radio-buttons-group"
                                      value={wasFixed ? "yes" : "no"}
                                      onChange={(event) => {
                                        setWasFixed(event.target.value === "yes");
                                      }}
                                    >
                                      <FormControlLabel
                                        value="yes"
                                        control={<Radio />}
                                        label="Sí"
                                      />
                                      <FormControlLabel
                                        value="no"
                                        control={<Radio />}
                                        label="No"
                                      />
                                    </RadioGroup>
                                  </>
                                )}
                              </Grid>
                              <Grid item xs={12} sm={6} lg={4} m={1}>
                                <TextField
                                  autoComplete="off"
                                  required
                                  label={"Describa el problema"}
                                  id="problemDesc"
                                  name="problemDesc"
                                  multiline
                                  rows={3}
                                  fullWidth={true}
                                />
                              </Grid>

                              {wasFixed && (
                                <>
                                  <Grid item xs={12} sm={6} lg={4} m={1}>
                                    <TextField
                                      autoComplete="off"
                                      required
                                      label={"Describa como se solucionó"}
                                      id="solutionDesc"
                                      name="solutionDesc"
                                      multiline
                                      rows={3}
                                      fullWidth={true}
                                    />
                                  </Grid>
                                  <Grid item xs={9} sm={6} lg={12} m={1}>
                                    <FormControl
                                      component="fieldset"
                                      variant="standard"
                                    >
                                      <FormLabel component="legend">
                                        Accesorios cambiados
                                      </FormLabel>
                                      <FormGroup>
                                        {Object.keys(ACCESORIES_LIST).map(
                                          (key) => (
                                            <FormControlLabel
                                              key={key}
                                              control={
                                                <Checkbox
                                                  checked={
                                                    changedAccesories[key]
                                                      ? true
                                                      : false
                                                  }
                                                  onChange={(event) => {
                                                    setChangedAccesories({
                                                      ...changedAccesories,
                                                      [key]:
                                                        event.target.checked,
                                                    });
                                                  }}
                                                />
                                              }
                                              label={ACCESORIES_LIST[key]}
                                            />
                                          )
                                        )}
                                      </FormGroup>
                                    </FormControl>
                                  </Grid>
                                </>
                              )}
                              <Grid item xs={0} sm={12} lg={12} />
                              {!wasFixed && !change?.isReplacement && (
                                <>
                                  <Grid item xs={4} sm={1} lg={2} m={1}>
                                    <FormControl
                                      sx={{
                                        width: "100%",
                                        textAlign: "center",
                                      }}
                                    >
                                      <InputLabel id="machine-id">
                                        Nuevo equipo*
                                      </InputLabel>
                                      <Select
                                        labelId="machine-id"
                                        label="Nuevo equipo*"
                                        id="newMachine"
                                        name="newMachine"
                                        required
                                        defaultValue=""
                                        size="medium"
                                      >
                                        {machinesData
                                          ? machinesData.map((machine) => (
                                              <MenuItem
                                                key={machine._id}
                                                value={machine._id}
                                              >
                                                {machine.machineNum}
                                              </MenuItem>
                                            ))
                                          : null}
                                      </Select>
                                    </FormControl>
                                  </Grid>
                                </>
                              )}
                              {((!wasFixed && !change?.isReplacement) || change?.isReplacement) && (
                                <>
                                  <Grid container>
                                    {attached.tag?.url &&
                                      !attached.tag.file.name.includes(
                                        "pdf"
                                      ) && (
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
                                        label={change?.isReplacement ? "Foto del equipo dejado" : "Foto de etiqueta"}
                                        value={attached.tag?.file}
                                        onChange={async (file) => {
                                          if (!file) {
                                            setAttached({
                                              ...attached,
                                              tag: { file: null, url: null, error: false },
                                            });
                                            return;
                                          }
                                          
                                          if (
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
                                          
                                          // Skip compression for PDF files
                                          if (file.type.includes("/pdf")) {
                                            const url = URL.createObjectURL(file);
                                            setAttached({
                                              ...attached,
                                              tag: { file, url, error: false },
                                            });
                                          } else {
                                            // Use compression helper for images
                                            const result = await compressImage(file);
                                            if (result) {
                                              setAttached({
                                                ...attached,
                                                tag: { file: result.file, url: result.url, error: false },
                                              });
                                            } else {
                                              // Fallback to original file
                                              const url = URL.createObjectURL(file);
                                              setAttached({
                                                ...attached,
                                                tag: { file, url, error: false },
                                              });
                                            }
                                          }
                                          setBadFormat({
                                            ...badFormat,
                                            tag: false,
                                          });
                                        }}
                                      />
                                    </Grid>
                                    <Grid item lg={12} />
                                    {attached.tag?.error && (
                                      <Grid item lg={4} m={1}>
                                        <Typography color="error">
                                          Seleccione un archivo válido(*.jpg,
                                          *.jpeg, *.png).
                                        </Typography>
                                      </Grid>
                                    )}
                                  </Grid>
                                </>
                              )}
                              {hasErrorSubmitting.error && (
                                <>
                                  <Grid item xs={12} sm={12} lg={12} />
                                  <Grid item lg={6} m={1}>
                                    <Alert severity="error">
                                      {hasErrorSubmitting.msg}
                                    </Alert>
                                  </Grid>
                                </>
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
                                disabled={!nextButtonEnabled || isBlocked}
                                variant="contained"
                                sx={{ mt: 1, mr: 1 }}
                              >
                                {index === steps.length - 1
                                  ? "Completar"
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
                    <Alert severity="success">El cambio fue completado</Alert>
                    <NextLink href="/cambios-pendientes">
                      <Button sx={{ mt: 1, mr: 1 }}>
                        Lista de cambios pendientes
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

CambioPendiente.getLayout = (page) => <SidebarLayout>{page}</SidebarLayout>;

export async function getServerSideProps({ req, resolvedUrl }) {
  let props = await validateServerSideSession(getSession, req, resolvedUrl);
  return props;
}
export default CambioPendiente;
