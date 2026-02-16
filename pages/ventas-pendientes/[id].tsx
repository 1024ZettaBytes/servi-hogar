import Footer from '@/components/Footer';
import PageHeader from '@/components/PageHeader';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import NextBreadcrumbs from '@/components/Shared/BreadCrums';
import SidebarLayout from '@/layouts/SidebarLayout';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import DeleteIcon from '@mui/icons-material/Delete';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Box,
  Card,
  CardMedia,
  CardActions,
  Container,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  IconButton,
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
import { completeSaleDelivery } from 'lib/client/salesFetch';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { validateServerSideSession } from '../../lib/auth';
import {
  compressImage,
  convertDateToLocal,
  replaceCoordinatesOnUrl,
  setDateToMid,
  validateMapsUrl
} from '../../lib/client/utils';
import {
  getFetcher,
  useGetCities
} from '../api/useRequest';
import useSWR from 'swr';
import ConfirmEquipmentDeliveryModal from '@/components/ConfirmEquipmentDeliveryModal';

const fetcher = (url) => fetch(url).then((res) => res.json());

function CompletarVenta() {
  const router = useRouter();
  const { id } = router.query;
  
  // Fetch sale data
  const { data: saleData, error: saleError } = useSWR(
    id ? `/api/sales/${id}?populate=full` : null,
    fetcher
  );
  
  const sale = saleData?.data;
  const customer = sale?.customer;
  const paths = ['Inicio', 'Ventas', 'Completar entrega'];
  
  const [customerToEdit, setCustomerToEdit] = useState<any>({ isSet: false });
  const [deliveryDate, setDeliveryDate] = useState<any>(new Date());
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [pendingSaleData, setPendingSaleData] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState<boolean>(false);
  const [isOk, setIsOk] = useState<any>({
    info: true,
    residence: true
  });
  
  const { citiesList, citiesError } = useGetCities(getFetcher);
  
  const [attached, setAttached] = useState<any>({
    ine: { file: null, url: null },
    frontal: { file: null, url: null },
    label: { file: null, url: null },
    board: { file: null, url: null }
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [hasErrorSubmitting, setHasErrorSubmitting] = useState<any>({
    error: false,
    msg: ''
  });
  const [activeStep, setActiveStep] = useState(0);
  
  const generalError = saleError || citiesError;
  const completeData = sale && citiesList;

  const steps = [
    {
      label: 'Verifique los datos del cliente'
    },
    {
      label: 'Información del equipo'
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
    // Handle file removal
    if (!imageFile) {
      setAttached({
        ...attached,
        [key]: { file: null, url: null, error: false }
      });
      return;
    }

    // Compress image using helper function
    const result = await compressImage(imageFile);
    
    if (!result) {
      // Validation failed (invalid image type)
      setAttached({
        ...attached,
        [key]: { ...attached[key], error: true }
      });
      return;
    }

    // Set compressed file and preview URL
    setAttached({
      ...attached,
      [key]: { file: result.file, url: result.url, error: false }
    });
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageSelection(file, key);
    }
  };

  const handleRemoveImage = (key: string) => {
    setAttached({
      ...attached,
      [key]: {
        file: null,
        url: null,
        error: false
      }
    });
  };

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
    if (activeStep === 1) return true; // Equipment info is read-only
    if (activeStep === 2)
      return (
        deliveryDate &&
        deliveryDate.toString() !== 'Invalid Date' &&
        attached.ine.file &&
        attached.frontal.file &&
        attached.label.file &&
        attached.board.file
      );
  };

  const nextButtonEnabled = checkEnabledButton();

  const handleOnSubmit = async (event) => {
    event.preventDefault();
    setHasErrorSubmitting({ error: false, msg: '' });

    // Prepare sale data (like rent delivery does)
    const saleData = {
      saleId: id as string,
      deliveryDate: setDateToMid(new Date(deliveryDate)).toISOString(),
      customerData: {
        ...customerToEdit,
        isOk
      }
    };

    setPendingSaleData(saleData);
    setOpenConfirmModal(true);

  };

  const confirmDelivery = async () => {
    if (!pendingSaleData) return;

    setIsSubmitting(true);
    setOpenConfirmModal(false);

    // Pass attachments and data separately (like rent delivery)
    const result = await completeSaleDelivery(attached, pendingSaleData);
    setIsSubmitting(false);
    if (!result.error) {
      setActiveStep((prev) => prev + 1);
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

  const machineInfo = sale?.machine
    ? `#${sale.machine.machineNum} - ${sale.machine.brand} ${sale.machine.capacity}kg`
    : sale?.serialNumber || 'N/A';

  return (
    <>
      <Head>
        <title>Completar entrega de venta</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader title={'Completar entrega de venta'} sutitle={''} />
        <NextBreadcrumbs
          paths={paths}
          lastLoaded={!saleError && sale}
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
                {saleError?.message || citiesError?.message}
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
                              <Grid item xs={12} sm={12} lg={12} m={1}>
                                <Typography
                                  variant="h4"
                                  component="h4"
                                  color="black"
                                  textAlign="left"
                                >
                                  Información de la venta
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={6} lg={4} m={1}>
                                <Typography variant="subtitle2" color="text.secondary">
                                  Folio
                                </Typography>
                                <Typography variant="body1" fontWeight="500">
                                  {sale?.saleNum || 'N/A'}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={6} lg={4} m={1}>
                                <Typography variant="subtitle2" color="text.secondary">
                                  Equipo
                                </Typography>
                                <Typography variant="body1" fontWeight="500">
                                  {machineInfo}
                                </Typography>
                                <Typography>
                                  Serie: {sale?.serialNumber || 'Sin número de serie'}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={6} lg={4} m={1}>
                                <Typography variant="subtitle2" color="text.secondary">
                                  Total
                                </Typography>
                                <Typography variant="body1" fontWeight="500">
                                  ${sale?.totalAmount?.toFixed(2)}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={6} lg={4} m={1}>
                                <Typography variant="subtitle2" color="text.secondary">
                                  Pago Inicial
                                </Typography>
                                <Typography variant="body1" fontWeight="500">
                                  ${sale?.initialPayment?.toFixed(2)}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={6} lg={4} m={1}>
                                <Typography variant="subtitle2" color="text.secondary">
                                  Semanas
                                </Typography>
                                <Typography variant="body1" fontWeight="500">
                                  {sale?.totalWeeks || 'N/A'}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={6} lg={4} m={1}>
                                <Typography variant="subtitle2" color="text.secondary">
                                  Pago Semanal
                                </Typography>
                                <Typography variant="body1" fontWeight="500">
                                  ${sale?.weeklyPayment?.toFixed(2)}
                                </Typography>
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
                                    convertDateToLocal(new Date())
                                  }
                                  maxDate={new Date()}
                                  onChange={(newValue) => {
                                    setDeliveryDate(newValue);
                                  }}
                                  renderInput={(params) => (
                                    <TextField {...params} />
                                  )}
                                />
                              </Grid>
                              
                              {/* Image Upload Section */}
                              <Grid item xs={12} m={1}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                  Fotos Requeridas
                                </Typography>
                              </Grid>
                              
                              {/* INE Image */}
                              <Grid item xs={12} md={4} m={1}>
                                <Box>
                                  <Typography variant="body2" fontWeight="medium" gutterBottom>
                                    Foto de INE *
                                  </Typography>
                                  {attached.ine?.url ? (
                                    <Card>
                                      <CardMedia
                                        component="img"
                                        height="150"
                                        image={attached.ine.url}
                                        alt="INE"
                                      />
                                      <CardActions sx={{ justifyContent: 'center' }}>
                                        <IconButton
                                          size="small"
                                          color="error"
                                          onClick={() => handleRemoveImage('ine')}
                                        >
                                          <DeleteIcon />
                                        </IconButton>
                                      </CardActions>
                                    </Card>
                                  ) : (
                                    <Button
                                      variant="outlined"
                                      component="label"
                                      fullWidth
                                      startIcon={<PhotoCamera />}
                                      sx={{ height: 150 }}
                                    >
                                      Subir Foto
                                      <input
                                        type="file"
                                        hidden
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, 'ine')}
                                      />
                                    </Button>
                                  )}
                                  {attached.ine?.error && (
                                    <Typography color="error" variant="caption" display="block" sx={{ mt: 1 }}>
                                      Seleccione un archivo válido (*.jpg, *.jpeg, *.png).
                                    </Typography>
                                  )}
                                </Box>
                              </Grid>

                              {/* Frontal Image */}
                              <Grid item xs={12} md={4} m={1}>
                                <Box>
                                  <Typography variant="body2" fontWeight="medium" gutterBottom>
                                    Frente Casa *
                                  </Typography>
                                  {attached.frontal?.url ? (
                                    <Card>
                                      <CardMedia
                                        component="img"
                                        height="150"
                                        image={attached.frontal.url}
                                        alt="Frente Casa"
                                      />
                                      <CardActions sx={{ justifyContent: 'center' }}>
                                        <IconButton
                                          size="small"
                                          color="error"
                                          onClick={() => handleRemoveImage('frontal')}
                                        >
                                          <DeleteIcon />
                                        </IconButton>
                                      </CardActions>
                                    </Card>
                                  ) : (
                                    <Button
                                      variant="outlined"
                                      component="label"
                                      fullWidth
                                      startIcon={<PhotoCamera />}
                                      sx={{ height: 150 }}
                                    >
                                      Subir Foto
                                      <input
                                        type="file"
                                        hidden
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, 'frontal')}
                                      />
                                    </Button>
                                  )}
                                  {attached.frontal?.error && (
                                    <Typography color="error" variant="caption" display="block" sx={{ mt: 1 }}>
                                      Seleccione un archivo válido (*.jpg, *.jpeg, *.png).
                                    </Typography>
                                  )}
                                </Box>
                              </Grid>
                              {/* Board Image */}
                              <Grid item xs={12} md={4} m={1}>
                                <Box>
                                  <Typography variant="body2" fontWeight="medium" gutterBottom>
                                    Tablero *
                                  </Typography>
                                  {attached.board?.url ? (
                                    <Card>
                                      <CardMedia
                                        component="img"
                                        height="150"
                                        image={attached.board.url}
                                        alt="Tablero"
                                      />
                                      <CardActions sx={{ justifyContent: 'center' }}>
                                        <IconButton
                                          size="small"
                                          color="error"
                                          onClick={() => handleRemoveImage('board')}
                                        >
                                          <DeleteIcon />
                                        </IconButton>
                                      </CardActions>
                                    </Card>
                                  ) : (
                                    <Button
                                      variant="outlined"
                                      component="label"
                                      fullWidth
                                      startIcon={<PhotoCamera />}
                                      sx={{ height: 150 }}
                                    >
                                      Subir Foto
                                      <input
                                        type="file"
                                        hidden
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, 'board')}
                                      />
                                    </Button>
                                  )}
                                  {attached.board?.error && (
                                    <Typography color="error" variant="caption" display="block" sx={{ mt: 1 }}>
                                      Seleccione un archivo válido (*.jpg, *.jpeg, *.png).
                                    </Typography>
                                  )}
                                </Box>
                              </Grid>
                              
                              {/* Label Image */}
                              <Grid item xs={12} md={4} m={1}>
                                <Box>
                                  <Typography variant="body2" fontWeight="medium" gutterBottom>
                                    Etiqueta o Serie *
                                  </Typography>
                                  {attached.label?.url ? (
                                    <Card>
                                      <CardMedia
                                        component="img"
                                        height="150"
                                        image={attached.label.url}
                                        alt="Etiqueta"
                                      />
                                      <CardActions sx={{ justifyContent: 'center' }}>
                                        <IconButton
                                          size="small"
                                          color="error"
                                          onClick={() => handleRemoveImage('label')}
                                        >
                                          <DeleteIcon />
                                        </IconButton>
                                      </CardActions>
                                    </Card>
                                  ) : (
                                    <Button
                                      variant="outlined"
                                      component="label"
                                      fullWidth
                                      startIcon={<PhotoCamera />}
                                      sx={{ height: 150 }}
                                    >
                                      Subir Foto
                                      <input
                                        type="file"
                                        hidden
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, 'label')}
                                      />
                                    </Button>
                                  )}
                                  {attached.label?.error && (
                                    <Typography color="error" variant="caption" display="block" sx={{ mt: 1 }}>
                                      Seleccione un archivo válido (*.jpg, *.jpeg, *.png).
                                    </Typography>
                                  )}
                                </Box>
                              </Grid>


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
                                  ? 'Completar entrega'
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
                    <Alert severity="success">La entrega fue completada exitosamente</Alert>
                    <NextLink href="/ventas">
                      <Button sx={{ mt: 1, mr: 1 }}>
                        Volver a ventas
                      </Button>
                    </NextLink>
                  </Paper>
                )}
              </Card>
            )}
          </Grid>
        </Grid>
      </Container>
      <ConfirmEquipmentDeliveryModal
        open={openConfirmModal}
        saleNum={sale?.saleNum}
        machineInfo={machineInfo}
        serialNumber={sale?.serialNumber}
        customerName={customer?.name}
        loading={isSubmitting}
        onConfirm={confirmDelivery}
        onCancel={() => setOpenConfirmModal(false)}
      />
      <Footer />
    </>
  );
}

CompletarVenta.getLayout = (page) => <SidebarLayout>{page}</SidebarLayout>;

export async function getServerSideProps({ req, resolvedUrl }) {
  let props = await validateServerSideSession(getSession, req, resolvedUrl);
  return props;
}
export default CompletarVenta;
