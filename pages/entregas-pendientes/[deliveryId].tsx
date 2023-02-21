import Head from "next/head";
import { getSession } from "next-auth/react";
import { useState } from "react";
import SidebarLayout from "@/layouts/SidebarLayout";
import { validateServerSideSession } from "../../lib/auth";
import { convertDateToLocal, convertDateToTZ, validateMapsUrl } from "../../lib/client/utils";
import PageHeader from "@/components/PageHeader";
import PageTitleWrapper from "@/components/PageTitleWrapper";
import Image from "next/image";
import { MuiFileInput } from "mui-file-input";
import NextLink from "next/link";

import {
  Card,
  Container,
  Grid,
  Skeleton,
  Alert,
  Box,
  Typography,
  TextField,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  MenuItem,
  Select,
  InputLabel,
  FormGroup,
  Checkbox,
  InputAdornment,
} from "@mui/material";
import Footer from "@/components/Footer";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import StepContent from "@mui/material/StepContent";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import {
  useGetMachinesForRent,
  getFetcher,
  useGetCities,
  useGetDeliveryById,
} from "../api/useRequest";
import { ACCESORIES_LIST } from "../../lib/consts/OBJ_CONTS";
import NextBreadcrumbs from "@/components/Shared/BreadCrums";
import { LoadingButton } from "@mui/lab";
import { completeDelivery } from "lib/client/deliveriesFetch";
import { useRouter } from "next/router";
import React from "react";
import { DesktopDatePicker } from "@mui/x-date-pickers";
function RentaRapida() {
  const router = useRouter();
  const { deliveryId } = router.query;
  const { delivery, deliveryByIdError } = useGetDeliveryById(
    getFetcher,
    deliveryId
  );
  const customer = delivery?.rent?.customer;
  const paths = ["Inicio", "Entregas pendientes", `${delivery?.totalNumber}`];
  const [customerToEdit, setCustomerToEdit] = useState<any>({ isSet: false });
  const [deliveredMachine, setDeliveredMachine] = useState<string>(null);
  const [deliveryDate, setDeliveryDate] = useState<any>(null);
  const [payment, setPayment] = useState<number>(-1);
  const [isOk, setIsOk] = useState<any>({
    info: true,
    residence: true,
  });
  const { machinesData, machinesError } = useGetMachinesForRent(getFetcher);
  const { citiesList, citiesError } = useGetCities(getFetcher);
  const [leftAccesories, setLeftAccesories] = useState<any>({});
  const [attached, setAttached] = useState<any>({
    contract: { file: null, url: null },
    front: { file: null, url: null },
    board: { file: null, url: null },
    tag: { file: null, url: null },
  });

  const [badFormat, setBadFormat] = useState<any>({
    contract: false,
    front: false,
    board: false,
    tag: false,
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [hasErrorSubmitting, setHasErrorSubmitting] = useState<any>({
    error: false,
    msg: "",
  });
  const [activeStep, setActiveStep] = useState(0);
  const generalError = deliveryByIdError || citiesError || machinesError;
  const completeData = delivery && citiesList;

  const steps = [
    {
      label: "Verifique los datos del cliente",
    },
    {
      label: "Equipo y accesorios",
    },
    {
      label: "Entrega",
    },
  ];
  function handleCitySelection(cityId) {
    const filteredCity = citiesList.filter((c) => c._id === cityId);
    const city = filteredCity[0];
    const sector = {};
    setCustomerToEdit({
      ...customerToEdit,
      currentResidence: { ...customerToEdit.currentResidence, city, sector },
    });
  }

  function handleSectorSelection(sectorId) {
    const sector = { _id: sectorId };
    setCustomerToEdit({
      ...customerToEdit,
      currentResidence: { ...customerToEdit.currentResidence, sector },
    });
  }
  const getInfoTextField = (
    label: string,
    field: string,
    minLength: number,
    maxLength: number,
    disabled: boolean
  ) => (
    <TextField
      fullWidth
      inputProps={{ minLength, maxLength }}
      autoComplete="off"
      disabled={disabled}
      label={label}
      required
      id={field}
      name={field}
      variant="outlined"
      size="small"
      value={customerToEdit[field]}
      onChange={(e) => {
        setCustomerToEdit({
          ...customerToEdit,
          [field]: e.target.value,
        });
      }}
    />
  );

  const getResidenceTextField = (
    label: string,
    field: string,
    minLength: number,
    maxLength: number,
    disabled: boolean
  ) => (
    <TextField
      fullWidth
      inputProps={{ minLength, maxLength }}
      autoComplete="off"
      disabled={disabled}
      required
      label={label}
      id={field}
      name={field}
      variant="outlined"
      size="small"
      value={customerToEdit.currentResidence[field]}
      onChange={(e) => {
        setCustomerToEdit({
          ...customerToEdit,
          currentResidence: {
            ...customerToEdit.currentResidence,
            [field]: e.target.value,
          },
        });
      }}
    />
  );
  const checkEnabledButton = () => {
    if (activeStep === 0)
      return (
        customerToEdit?.currentResidence?.nameRef?.trim()?.length > 0 &&
        customerToEdit?.currentResidence?.telRef?.trim()?.length > 0 &&
        customerToEdit?.currentResidence?.maps &&
        validateMapsUrl(customerToEdit?.currentResidence?.maps)
      );
    if (activeStep === 1) return deliveredMachine;
    if (activeStep === 2) return deliveryDate ? deliveryDate.toString() !== "Invalid Date" : delivery?.date
  };

  const nextButtonEnabled = checkEnabledButton();

  const handleOnSubmit = async (event) => {
    event.preventDefault();
    setHasErrorSubmitting({ error: false, msg: "" });
    setIsSubmitting(true);
    const result = await completeDelivery(attached, {
      deliveryId,
      customerData: customerToEdit,
      payment,
      deliveredMachine,
      leftAccesories,
      deliveryDate: deliveryDate ? convertDateToTZ(deliveryDate): new Date(delivery.date),
      isOk,
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

  const onChangeOk = (id, value) => {
    setIsOk({ ...isOk, [id]: value });
    if (value) {
      setCustomerToEdit({ ...customer, isSet: true });
    }
  };
  if (!customerToEdit.isSet && customer) {
    setCustomerToEdit({ ...customer, isSet: true });
  }
  if (payment < 0 && delivery?.rent) {
    setPayment(delivery?.rent?.initialPay);
  }
  return (
    <>
      <Head>
        <title>Completar entrega</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader title={"Completar entrega"} sutitle={""} />
        <NextBreadcrumbs
          paths={paths}
          lastLoaded={!deliveryByIdError && delivery}
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
              <Alert severity="error">
                {deliveryByIdError?.message ||
                  citiesError?.message ||
                  machinesError?.message}
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
                              <Grid item xs={12} sm={12} lg={12} m={1}>
                                <Typography
                                  variant="h4"
                                  component="h4"
                                  color="black"
                                  textAlign="left"
                                >
                                  Datos personales
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={12} lg={12} m={1}>
                                <FormLabel id="demo-controlled-radio-buttons-group">
                                  ¿Es la persona correcta?
                                </FormLabel>
                                <RadioGroup
                                  row
                                  aria-labelledby="demo-controlled-radio-buttons-group"
                                  name="controlled-radio-buttons-group"
                                  value={isOk.info ? "si" : "no"}
                                  onChange={(event) => {
                                    onChangeOk(
                                      "info",
                                      event.target.value === "si"
                                    );
                                  }}
                                >
                                  <FormControlLabel
                                    value="si"
                                    control={<Radio />}
                                    label="Sí"
                                  />
                                  <FormControlLabel
                                    value="no"
                                    control={<Radio />}
                                    label="No"
                                  />
                                </RadioGroup>
                              </Grid>
                              <Grid item lg={3} m={1}>
                                {customerToEdit.isSet ? (
                                  getInfoTextField(
                                    "Nombre",
                                    "name",
                                    1,
                                    100,
                                    isOk.info
                                  )
                                ) : (
                                  <Skeleton
                                    variant="text"
                                    sx={{ fontSize: "1rem", width: "100px" }}
                                  />
                                )}
                              </Grid>
                              <Grid item lg={3} m={1}>
                                {customerToEdit.isSet ? (
                                  getInfoTextField(
                                    "Teléfono",
                                    "cell",
                                    10,
                                    10,
                                    isOk.info
                                  )
                                ) : (
                                  <Skeleton
                                    variant="text"
                                    sx={{ fontSize: "1rem", width: "100px" }}
                                  />
                                )}
                              </Grid>
                              <Grid item xs={12} sm={12} lg={12} m={1}>
                                <Typography
                                  variant="h4"
                                  component="h4"
                                  color="black"
                                  textAlign="left"
                                >
                                  Domicilio
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={12} lg={12} m={1}>
                                <FormLabel id="demo-controlled-radio-buttons-group">
                                  ¿Son correctos?
                                </FormLabel>
                                <RadioGroup
                                  row
                                  aria-labelledby="demo-controlled-radio-buttons-group"
                                  name="controlled-radio-buttons-group"
                                  value={isOk.residence ? "si" : "no"}
                                  onChange={(event) => {
                                    onChangeOk(
                                      "residence",
                                      event.target.value === "si"
                                    );
                                  }}
                                >
                                  <FormControlLabel
                                    value="si"
                                    control={<Radio />}
                                    label="Sí"
                                  />
                                  <FormControlLabel
                                    value="no"
                                    control={<Radio />}
                                    label="No"
                                  />
                                </RadioGroup>
                              </Grid>
                              <Grid item xs={9} sm={6} md={3} m={1}>
                                {customerToEdit.isSet ? (
                                  getResidenceTextField(
                                    "Calle y número",
                                    "street",
                                    1,
                                    100,
                                    isOk.residence
                                  )
                                ) : (
                                  <Skeleton
                                    variant="text"
                                    sx={{ fontSize: "1rem", width: "100px" }}
                                  />
                                )}
                              </Grid>
                              <Grid item xs={9} sm={6} lg={3} m={1}>
                                {customerToEdit.isSet ? (
                                  getResidenceTextField(
                                    "Colonia",
                                    "suburb",
                                    1,
                                    100,
                                    isOk.residence
                                  )
                                ) : (
                                  <Skeleton
                                    variant="text"
                                    sx={{ fontSize: "1rem", width: "100px" }}
                                  />
                                )}
                              </Grid>
                              <Grid item xs={9} sm={6} lg={2} m={1}>
                                {customerToEdit.isSet ? (
                                  <FormControl sx={{ width: "100%" }}>
                                    <InputLabel id="city-id">
                                      Ciudad*
                                    </InputLabel>
                                    <Select
                                      labelId="city-id"
                                      label="Ciudad*"
                                      id="city"
                                      name="city"
                                      disabled={isOk.residence}
                                      required
                                      autoComplete="off"
                                      size="small"
                                      value={
                                        customerToEdit?.currentResidence?.city
                                          ?._id || ""
                                      }
                                      onChange={(event) =>
                                        handleCitySelection(event.target.value)
                                      }
                                    >
                                      {citiesList
                                        ? citiesList.map((city) => (
                                            <MenuItem
                                              key={city._id}
                                              value={city._id}
                                            >
                                              {city.name}
                                            </MenuItem>
                                          ))
                                        : null}
                                    </Select>
                                  </FormControl>
                                ) : (
                                  <Skeleton
                                    variant="text"
                                    sx={{ fontSize: "1rem", width: "100px" }}
                                  />
                                )}
                              </Grid>
                              <Grid item xs={9} sm={6} lg={2} m={1}>
                                {customerToEdit.isSet ? (
                                  <FormControl sx={{ width: "100%" }}>
                                    <InputLabel id="sector-id">
                                      Sector*
                                    </InputLabel>
                                    <Select
                                      labelId="sector-id"
                                      label="Sector*"
                                      id="sector"
                                      name="sector"
                                      required
                                      autoComplete="off"
                                      size="small"
                                      placeholder="Seleccione un valor"
                                      value={
                                        customerToEdit?.currentResidence?.sector
                                          ._id || ""
                                      }
                                      disabled={isOk.residence}
                                      onChange={(event) =>
                                        handleSectorSelection(
                                          event.target.value
                                        )
                                      }
                                    >
                                      {customerToEdit?.currentResidence?.city
                                        ?.sectors?.length > 0
                                        ? customerToEdit?.currentResidence?.city?.sectors?.map(
                                            (sector) => (
                                              <MenuItem
                                                key={sector._id}
                                                value={sector._id}
                                              >
                                                {sector.name}
                                              </MenuItem>
                                            )
                                          )
                                        : null}
                                    </Select>
                                  </FormControl>
                                ) : (
                                  <Skeleton
                                    variant="text"
                                    sx={{ fontSize: "1rem", width: "100px" }}
                                  />
                                )}
                              </Grid>
                              <Grid item xs={9} sm={6} lg={3} m={1}>
                                {customerToEdit.isSet ? (
                                  getResidenceTextField(
                                    "Domicilio referencia",
                                    "residenceRef",
                                    1,
                                    250,
                                    isOk.residence
                                  )
                                ) : (
                                  <Skeleton
                                    variant="text"
                                    sx={{ fontSize: "1rem", width: "100px" }}
                                  />
                                )}
                              </Grid>
                              <Grid item xs={9} sm={6} lg={3} m={1}>
                                {customerToEdit.isSet ? (
                                  getResidenceTextField(
                                    "Nombre referencia",
                                    "nameRef",
                                    1,
                                    100,
                                    isOk.residence
                                  )
                                ) : (
                                  <Skeleton
                                    variant="text"
                                    sx={{ fontSize: "1rem", width: "100px" }}
                                  />
                                )}
                              </Grid>
                              <Grid item xs={9} sm={6} lg={3} m={1}>
                                {customerToEdit.isSet ? (
                                  getResidenceTextField(
                                    "Teléfono referencia",
                                    "telRef",
                                    10,
                                    10,
                                    isOk.residence
                                  )
                                ) : (
                                  <Skeleton
                                    variant="text"
                                    sx={{ fontSize: "1rem", width: "100px" }}
                                  />
                                )}
                              </Grid>
                              <Grid item xs={9} sm={6} lg={6} m={1}>
                                <TextField
                                  autoComplete="off"
                                  required
                                  label={"Maps"}
                                  id="maps"
                                  name="maps"
                                  disabled={isOk.residence}
                                  multiline
                                  maxRows={5}
                                  fullWidth={true}
                                  value={customerToEdit?.currentResidence?.maps}
                                  onChange={(e) => {
                                    setCustomerToEdit({
                                      ...customerToEdit,
                                      currentResidence: {
                                        ...customerToEdit.currentResidence,
                                        maps: e.target.value,
                                      },
                                    });
                                  }}
                                />
                              </Grid>
                              {!nextButtonEnabled && (
                                <Grid item lg={6} m={1}>
                                  <Alert severity="warning">
                                    {"Ingrese los datos faltantes"}
                                  </Alert>
                                </Grid>
                              )}
                            </Grid>
                          )}
                          {activeStep === 1 && (
                            <Grid container>
                              <Grid item xs={9} sm={6} lg={2} m={1}>
                                <FormControl
                                  sx={{ width: "100%", textAlign: "center" }}
                                >
                                  <InputLabel id="machine-id">
                                    Equipo entregado*
                                  </InputLabel>
                                  <Select
                                    labelId="machine-id"
                                    label="Equipo entregado*"
                                    id="machine"
                                    name="machine"
                                    required
                                    size="medium"
                                    value={deliveredMachine || ""}
                                    onChange={(event) =>
                                      setDeliveredMachine(event.target.value)
                                    }
                                  >
                                    {machinesData
                                      ? machinesData.map((machine) => (
                                          <MenuItem
                                            key={machine._id}
                                            value={machine.machineNum}
                                          >
                                            {machine.machineNum}
                                          </MenuItem>
                                        ))
                                      : null}
                                  </Select>
                                </FormControl>
                              </Grid>
                              <Grid item xs={9} sm={6} lg={12} m={1}>
                                <FormControl
                                  component="fieldset"
                                  variant="standard"
                                >
                                  <FormLabel component="legend">
                                    Accesorios
                                  </FormLabel>
                                  <FormGroup>
                                    {Object.keys(ACCESORIES_LIST).map((key) => (
                                      <FormControlLabel
                                        key={key}
                                        control={
                                          <Checkbox
                                            checked={
                                              leftAccesories[key] ? true : false
                                            }
                                            onChange={(event) => {
                                              setLeftAccesories({
                                                ...leftAccesories,
                                                [key]: event.target.checked,
                                              });
                                            }}
                                          />
                                        }
                                        label={ACCESORIES_LIST[key]}
                                      />
                                    ))}
                                  </FormGroup>
                                </FormControl>
                              </Grid>
                            </Grid>
                          )}
                          {activeStep === 2 && (
                            <Grid container>
                              <Grid item lg={12} m={1}>
                                <DesktopDatePicker
                                  label="Fecha de entrega"
                                  inputFormat="dd/MM/yyyy"
                                  value={deliveryDate || convertDateToLocal(new Date(delivery.date))}
                                  maxDate={new Date()}
                                  onChange={(newValue) => { 
                                    setDeliveryDate(newValue);
                                  }}
                                  renderInput={(params) => (
                                    <TextField {...params} />
                                  )}
                                />
                              </Grid>
                              <Grid item lg={12} m={1}>
                                <TextField
                                  label="Cantidad"
                                  type="number"
                                  required
                                  value={payment}
                                  variant="outlined"
                                  size="small"
                                  InputProps={{
                                    startAdornment: (
                                      <InputAdornment position="start">
                                        $
                                      </InputAdornment>
                                    ),
                                    inputProps: {
                                      min: 0,
                                      style: { textAlign: "center" },
                                    },
                                  }}
                                  onChange={(event) => {
                                    setPayment(Number(event.target.value));
                                  }}
                                />
                              </Grid>
                              {attached.contract?.url &&
                                !attached.contract.file.name.includes(
                                  "pdf"
                                ) && (
                                  <Grid item lg={12} m={1}>
                                    <Image
                                      src={attached.contract.url}
                                      alt="Picture of the author"
                                      width={300}
                                      height={400}
                                    />
                                  </Grid>
                                )}
                              <Grid item lg={4} m={1}>
                                <MuiFileInput
                                  required={!attached.contract.file}
                                  placeholder={"No seleccionada"}
                                  label={"Foto de contrato"}
                                  value={attached.contract?.file}
                                  onChange={(file) => {
                                    if (
                                      file &&
                                      !file.type.includes("image/") &&
                                      !file.type.includes("/pdf")
                                    ) {
                                      setBadFormat({
                                        ...badFormat,
                                        contract: true,
                                      });
                                      setAttached({
                                        ...attached,
                                        contract: {
                                          ...attached.contract,
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
                                      contract: { file, url, error: false },
                                    });
                                  }}
                                />
                              </Grid>
                              <Grid item lg={12} />
                              {attached.contract?.error && (
                                <Grid item lg={4} m={1}>
                                  <Typography color="error">
                                    Seleccione un archivo válido(*.jpg, *.jpeg,
                                    *.png).
                                  </Typography>
                                </Grid>
                              )}
                              {attached.front?.url &&
                                !attached.front.file.name.includes("pdf") && (
                                  <Grid item lg={12} m={1}>
                                    <Image
                                      src={attached.front.url}
                                      alt="Picture of the author"
                                      width={300}
                                      height={400}
                                    />
                                  </Grid>
                                )}
                              <Grid item lg={4} m={1}>
                                <MuiFileInput
                                  required={!attached.front.file}
                                  placeholder={"No seleccionada"}
                                  label={"Foto de frente"}
                                  value={attached.front?.file}
                                  onChange={(file) => {
                                    if (
                                      file &&
                                      !file.type.includes("image/") &&
                                      !file.type.includes("/pdf")
                                    ) {
                                      setBadFormat({
                                        ...badFormat,
                                        front: true,
                                      });
                                      setAttached({
                                        ...attached,
                                        front: {
                                          ...attached.front,
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
                                      front: { file, url, error: false },
                                    });
                                  }}
                                />
                              </Grid>
                              <Grid item lg={12} />
                              {attached.front?.error && (
                                <Grid item lg={4} m={1}>
                                  <Typography color="error">
                                    Seleccione un archivo válido(*.jpg, *.jpeg,
                                    *.png).
                                  </Typography>
                                </Grid>
                              )}
                              {attached.board?.url &&
                                !attached.board.file.name.includes("pdf") && (
                                  <Grid item lg={12} m={1}>
                                    <Image
                                      src={attached.board.url}
                                      alt="Picture of the author"
                                      width={300}
                                      height={400}
                                    />
                                  </Grid>
                                )}
                              <Grid item lg={4} m={1}>
                                <MuiFileInput
                                  required={!attached.board.file}
                                  placeholder={"No seleccionada"}
                                  label={"Foto de tablero"}
                                  value={attached.board?.file}
                                  onChange={(file) => {
                                    if (
                                      file &&
                                      !file.type.includes("image/") &&
                                      !file.type.includes("/pdf")
                                    ) {
                                      setBadFormat({
                                        ...badFormat,
                                        board: true,
                                      });
                                      setAttached({
                                        ...attached,
                                        board: {
                                          ...attached.board,
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
                                      board: { file, url, error: false },
                                    });
                                  }}
                                />
                              </Grid>
                              <Grid item lg={12} />
                              {attached.board?.error && (
                                <Grid item lg={4} m={1}>
                                  <Typography color="error">
                                    Seleccione un archivo válido(*.jpg, *.jpeg,
                                    *.png).
                                  </Typography>
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
                                  label={"Foto de etiqueta"}
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
                                loading={isSubmitting}
                                disabled={!nextButtonEnabled}
                                variant="contained"
                                type="submit"
                                sx={{ mt: 1, mr: 1 }}
                              >
                                {index === steps.length - 1
                                  ? "Entregado"
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
                    <Alert severity="success">La entrega fue completada</Alert>
                    <NextLink href="/entregas-pendientes">
                      <Button sx={{ mt: 1, mr: 1 }}>
                        Lista de entregas pendientes
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

RentaRapida.getLayout = (page) => <SidebarLayout>{page}</SidebarLayout>;

export async function getServerSideProps({ req, resolvedUrl }) {
  let props = await validateServerSideSession(getSession, req, resolvedUrl);
  return props;
}
export default RentaRapida;
