import Footer from '@/components/Footer';
import PageHeader from '@/components/PageHeader';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import NextBreadcrumbs from '@/components/Shared/BreadCrums';
import SidebarLayout from '@/layouts/SidebarLayout';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Box,
  Card,
  Checkbox,
  Container,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Skeleton,
  TextField,
  Typography
} from '@mui/material';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Step from '@mui/material/Step';
import StepContent from '@mui/material/StepContent';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import { DesktopDatePicker } from '@mui/x-date-pickers';
import Compressor from 'compressorjs';
import * as imageConversion from 'image-conversion';
import { completeDelivery } from 'lib/client/deliveriesFetch';
import { MuiFileInput } from 'mui-file-input';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import Image from 'next/image';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { validateServerSideSession } from '../../lib/auth';
import {
  convertDateToLocal,
  replaceCoordinatesOnUrl,
  setDateToInitial,
  setDateToMid,
  validateMapsUrl
} from '../../lib/client/utils';
import { ACCESORIES_LIST } from '../../lib/consts/OBJ_CONTS';
import {
  getFetcher,
  useGetCities,
  useGetDeliveryById,
  useGetMachinesForRent
} from '../api/useRequest';
function RentaRapida() {
  const router = useRouter();
  const { deliveryId } = router.query;
  const { delivery, deliveryByIdError } = useGetDeliveryById(
    getFetcher,
    deliveryId
  );
  const customer = delivery?.rent?.customer;
  const paths = ['Inicio', 'Entregas pendientes', `${delivery?.totalNumber}`];
  const [customerToEdit, setCustomerToEdit] = useState<any>({ isSet: false });
  const [deliveredMachine, setDeliveredMachine] = useState<string>(null);
  const [deliveryDate, setDeliveryDate] = useState<any>(new Date());
  const [payment, setPayment] = useState<number>(-1);
  const [isGettingLocation, setIsGettingLocation] = useState<boolean>(false);
  const [isOk, setIsOk] = useState<any>({
    info: true,
    residence: true
  });
  const { machinesData, machinesError } = useGetMachinesForRent(getFetcher);
  const { citiesList, citiesError } = useGetCities(getFetcher);
  const [leftAccesories, setLeftAccesories] = useState<any>({
    MANG_CARGA: true,
    MANG_DESCAARGA: true,
    CODO_PVC: false
  });
  const [attached, setAttached] = useState<any>({
    contract: { file: null, url: null },
    front: { file: null, url: null },
    board: { file: null, url: null },
    tag: { file: null, url: null }
  });

  const [badFormat, setBadFormat] = useState<any>({
    contract: false,
    front: false,
    board: false,
    tag: false
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [hasErrorSubmitting, setHasErrorSubmitting] = useState<any>({
    error: false,
    msg: ''
  });
  const [activeStep, setActiveStep] = useState(0);
  const generalError = deliveryByIdError || citiesError || machinesError;
  const completeData = delivery && citiesList;

  const steps = [
    {
      label: 'Verifique los datos del cliente'
    },
    {
      label: 'Equipo y accesorios'
    },
    {
      label: 'Entrega'
    }
  ];
  function handleCitySelection(cityId) {
    const filteredCity = citiesList.filter((c) => c._id === cityId);
    const city = filteredCity[0];
    const sector = {};
    setCustomerToEdit({
      ...customerToEdit,
      currentResidence: { ...customerToEdit.currentResidence, city, sector }
    });
  }

  function handleSectorSelection(sectorId) {
    const sector = { _id: sectorId };
    setCustomerToEdit({
      ...customerToEdit,
      currentResidence: { ...customerToEdit.currentResidence, sector }
    });
  }
  async function handleImageSelection(imageFile, key) {
    if (
      imageFile &&
      (!imageFile.type.includes('image/') || imageFile.type.includes('/heic'))
    ) {
      setBadFormat({
        ...badFormat,
        [key]: true
      });

      setAttached({
        ...attached,
        [key]: {
          ...attached[key],
          error: true
        }
      });
      return;
    }
    if (!imageFile) {
      setAttached({
        ...attached,
        [key]: {
          file: null,
          url: null,
          error: false
        }
      });
      return;
    }
    let compressedFile;
    let url;
    try {
      compressedFile = new File(
        [await imageConversion.compress(imageFile, 0.2)],
        imageFile.name
      );
    } catch (error) {
      compressedFile = new File(
        [
          await new Promise((resolve, reject) => {
            new Compressor(imageFile, {
              quality: 0.6,
              success: resolve,
              error: reject
            });
          })
        ],
        imageFile.name
      );
    }
    try {
      url = URL.createObjectURL(compressedFile);
    } catch (error) {
      console.error(error);
      url = URL.createObjectURL(imageFile);
    }
    setAttached({
      ...attached,
      [key]: {
        file: compressedFile,
        url,
        error: false
      }
    });
  }

  const getInfoTextField = (
    label: string,
    field: string,
    minLength: number,
    maxLength: number,
    disabled: boolean,
    type: string = 'text'
  ) => (
    <TextField
      fullWidth
      type={type}
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
          [field]: e.target.value
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
            [field]: e.target.value
          }
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
    if (activeStep === 2)
      return deliveryDate
        ? deliveryDate.toString() !== 'Invalid Date'
        : delivery?.date;
  };

  const nextButtonEnabled = checkEnabledButton();

  const handleOnSubmit = async (event) => {
    event.preventDefault();
    setHasErrorSubmitting({ error: false, msg: '' });
    setIsSubmitting(true);
    const result = await completeDelivery(attached, {
      deliveryId,
      customerData: customerToEdit,
      payment,
      deliveredMachine,
      leftAccesories,
      deliveryDate: setDateToMid(new Date(deliveryDate || delivery.date)),
      isOk
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
        <PageHeader title={'Completar entrega'} sutitle={''} />
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
                width={'100%'}
                height={500}
                animation="wave"
              />
            ) : (
              <Card sx={{ p: 2 }}>
                <Stepper
                  activeStep={activeStep}
                  orientation="vertical"
                  sx={{ backgroundColor: 'transparent' }}
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
                                  value={isOk.info ? 'si' : 'no'}
                                  onChange={(event) => {
                                    onChangeOk(
                                      'info',
                                      event.target.value === 'si'
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
                                    'Nombre',
                                    'name',
                                    1,
                                    100,
                                    isOk.info
                                  )
                                ) : (
                                  <Skeleton
                                    variant="text"
                                    sx={{ fontSize: '1rem', width: '100px' }}
                                  />
                                )}
                              </Grid>
                              <Grid item lg={3} m={1}>
                                {customerToEdit.isSet ? (
                                  getInfoTextField(
                                    'Teléfono',
                                    'cell',
                                    10,
                                    10,
                                    isOk.info
                                  )
                                ) : (
                                  <Skeleton
                                    variant="text"
                                    sx={{ fontSize: '1rem', width: '100px' }}
                                  />
                                )}
                              </Grid>
                              <Grid item lg={3} m={1}>
                                {customerToEdit.isSet ? (
                                  getInfoTextField(
                                    'Correo',
                                    'email',
                                    0,
                                    100,
                                    isOk.info,
                                    'email'
                                  )
                                ) : (
                                  <Skeleton
                                    variant="text"
                                    sx={{ fontSize: '1rem', width: '100px' }}
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
                                  value={isOk.residence ? 'si' : 'no'}
                                  onChange={(event) => {
                                    onChangeOk(
                                      'residence',
                                      event.target.value === 'si'
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
                                    'Calle y número',
                                    'street',
                                    1,
                                    100,
                                    isOk.residence
                                  )
                                ) : (
                                  <Skeleton
                                    variant="text"
                                    sx={{ fontSize: '1rem', width: '100px' }}
                                  />
                                )}
                              </Grid>
                              <Grid item xs={9} sm={6} lg={3} m={1}>
                                {customerToEdit.isSet ? (
                                  getResidenceTextField(
                                    'Colonia',
                                    'suburb',
                                    1,
                                    100,
                                    isOk.residence
                                  )
                                ) : (
                                  <Skeleton
                                    variant="text"
                                    sx={{ fontSize: '1rem', width: '100px' }}
                                  />
                                )}
                              </Grid>
                              <Grid item xs={9} sm={6} lg={2} m={1}>
                                {customerToEdit.isSet ? (
                                  <FormControl sx={{ width: '100%' }}>
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
                                          ?._id || ''
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
                                    sx={{ fontSize: '1rem', width: '100px' }}
                                  />
                                )}
                              </Grid>
                              <Grid item xs={9} sm={6} lg={2} m={1}>
                                {customerToEdit.isSet ? (
                                  <FormControl sx={{ width: '100%' }}>
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
                                          ._id || ''
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
                                    sx={{ fontSize: '1rem', width: '100px' }}
                                  />
                                )}
                              </Grid>
                              <Grid item xs={9} sm={6} lg={3} m={1}>
                                {customerToEdit.isSet ? (
                                  getResidenceTextField(
                                    'Domicilio referencia',
                                    'residenceRef',
                                    1,
                                    250,
                                    isOk.residence
                                  )
                                ) : (
                                  <Skeleton
                                    variant="text"
                                    sx={{ fontSize: '1rem', width: '100px' }}
                                  />
                                )}
                              </Grid>
                              <Grid item xs={9} sm={6} lg={3} m={1}>
                                {customerToEdit.isSet ? (
                                  getResidenceTextField(
                                    'Nombre referencia',
                                    'nameRef',
                                    1,
                                    100,
                                    isOk.residence
                                  )
                                ) : (
                                  <Skeleton
                                    variant="text"
                                    sx={{ fontSize: '1rem', width: '100px' }}
                                  />
                                )}
                              </Grid>
                              <Grid item xs={9} sm={6} lg={3} m={1}>
                                {customerToEdit.isSet ? (
                                  getResidenceTextField(
                                    'Teléfono referencia',
                                    'telRef',
                                    10,
                                    10,
                                    isOk.residence
                                  )
                                ) : (
                                  <Skeleton
                                    variant="text"
                                    sx={{ fontSize: '1rem', width: '100px' }}
                                  />
                                )}
                              </Grid>
                              <Grid item xs={9} sm={6} lg={6} m={1}>
                                <TextField
                                  autoComplete="off"
                                  required
                                  label={'Maps'}
                                  id="maps"
                                  name="maps"
                                  disabled={isOk.residence}
                                  multiline
                                  maxRows={5}
                                  fullWidth={true}
                                  value={
                                    customerToEdit?.currentResidence?.maps || ''
                                  }
                                  onChange={(e) => {
                                    setCustomerToEdit({
                                      ...customerToEdit,
                                      currentResidence: {
                                        ...customerToEdit.currentResidence,
                                        maps: e.target.value
                                      }
                                    });
                                  }}
                                />
                                {!isOk.residence && (
                                  <>
                                    <br />
                                    <br />
                                    <LoadingButton
                                      color="success"
                                      loading={isGettingLocation}
                                      startIcon={<MyLocationIcon />}
                                      variant="contained"
                                      onClick={() => {
                                        setIsGettingLocation(true);
                                        if ('geolocation' in navigator) {
                                          // Retrieve latitude & longitude coordinates from `navigator.geolocation` Web API
                                          navigator.geolocation.getCurrentPosition(
                                            ({ coords }) => {
                                              const { latitude, longitude } =
                                                coords;
                                              setCustomerToEdit({
                                                ...customerToEdit,
                                                currentResidence: {
                                                  ...customerToEdit.currentResidence,
                                                  maps: replaceCoordinatesOnUrl(
                                                    { latitude, longitude }
                                                  )
                                                }
                                              });
                                              setIsGettingLocation(false);
                                            }
                                          );
                                        }
                                      }}
                                    >
                                      Usar mi ubicación
                                    </LoadingButton>
                                  </>
                                )}
                              </Grid>
                              {!nextButtonEnabled && (
                                <Grid item lg={6} m={1}>
                                  <Alert severity="warning">
                                    {'Ingrese los datos faltantes'}
                                  </Alert>
                                </Grid>
                              )}
                            </Grid>
                          )}
                          {activeStep === 1 && (
                            <Grid container>
                              <Grid item xs={9} sm={6} lg={2} m={1}>
                                <FormControl
                                  sx={{ width: '100%', textAlign: 'center' }}
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
                                    value={deliveredMachine || ''}
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
                                                [key]: event.target.checked
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
                                  value={
                                    deliveryDate ||
                                    convertDateToLocal(new Date(delivery.date))
                                  }
                                  minDate={setDateToInitial(
                                    convertDateToLocal(new Date())
                                  )}
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
                                      style: { textAlign: 'center' }
                                    }
                                  }}
                                  onChange={(event) => {
                                    setPayment(Number(event.target.value));
                                  }}
                                />
                              </Grid>
                              {(delivery?.rent?.imagesUrl || (attached.contract?.url &&
                                !attached.contract.file.name.includes(
                                  'pdf'
                                ))) && (
                                  <Grid item lg={12} m={1}>
                                    <Image
                                      src={attached.contract.url || delivery?.rent?.imagesUrl?.contract}
                                      alt="Picture of the author"
                                      width={300}
                                      height={400}
                                    />
                                  </Grid>
                                )}
                              <Grid item lg={4} m={1}>
                                <MuiFileInput
                                  required={!delivery?.rent?.imagesUrl?.contract && !attached.contract.file}
                                  placeholder={delivery?.rent?.imagesUrl?.contract ? 'Usar anterior' :'No seleccionada'}
                                  label={'Foto de INE'}
                                  value={attached.contract?.file}
                                  onChange={(file) => {
                                    handleImageSelection(file, 'contract');
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
                              {(delivery?.rent?.imagesUrl || (attached.front?.url &&
                                !attached.front.file.name.includes('pdf'))) && (
                                  <Grid item lg={12} m={1}>
                                    <Image
                                      src={attached.front.url || delivery?.rent?.imagesUrl?.front}
                                      alt="Picture of the author"
                                      width={300}
                                      height={400}
                                    />
                                  </Grid>
                                )}
                              <Grid item lg={4} m={1}>
                                <MuiFileInput
                                  required={!delivery?.rent?.imagesUrl?.contract && !attached.front.file}
                                  placeholder={delivery?.rent?.imagesUrl?.contract ? 'Usar anterior' : 'No seleccionada'}
                                  label={'Foto de frente'}
                                  value={attached.front?.file}
                                  onChange={(file) => {
                                    handleImageSelection(file, 'front');
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
                                !attached.board.file.name.includes('pdf') && (
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
                                  placeholder={'No seleccionada'}
                                  label={'Foto de tablero'}
                                  value={attached.board?.file}
                                  onChange={(file) => {
                                    handleImageSelection(file, 'board');
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
                                !attached.tag.file.name.includes('pdf') && (
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
                                  placeholder={'No seleccionada'}
                                  label={'Foto de etiqueta'}
                                  value={attached.tag?.file}
                                  onChange={(file) => {
                                    handleImageSelection(file, 'tag');
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
                                  ? 'Entregado'
                                  : 'Siguiente'}
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
