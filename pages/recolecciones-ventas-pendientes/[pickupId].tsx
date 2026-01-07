import Head from 'next/head';
import { getSession, useSession } from 'next-auth/react';
import { useState } from 'react';
import SidebarLayout from '@/layouts/SidebarLayout';
import { validateServerSideSession } from '../../lib/auth';
import PageHeader from '@/components/PageHeader';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import NextLink from 'next/link';
import Image from 'next/image';
import {
  Card,
  Container,
  Grid,
  Skeleton,
  Alert,
  Box,
  Typography,
  InputLabel
} from '@mui/material';
import Footer from '@/components/Footer';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import StepContent from '@mui/material/StepContent';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import { getFetcher, useGetSalePickupById } from '../api/useRequest';
import NextBreadcrumbs from '@/components/Shared/BreadCrums';
import { LoadingButton } from '@mui/lab';
import { completeSalePickup } from 'lib/client/salePickupsFetch';
import { useRouter } from 'next/router';
import React from 'react';
import { MuiFileInput } from 'mui-file-input';
import { compressImage } from 'lib/client/utils';

function RecoleccionVentaPendiente({ session }) {
  const router = useRouter();
  const { pickupId } = router.query;
  const { salePickup, salePickupByIdError } = useGetSalePickupById(getFetcher, pickupId);
  const { data: sessionData, update: updateSession } = useSession();
  const [attached, setAttached] = useState<any>({
    front: { file: null, url: null, error: false },
    tag: { file: null, url: null, error: false }
  });

  const [badFormat, setBadFormat] = useState<any>({
    front: false,
    tag: false
  });
  
  const paths = ['Inicio', 'Recolecciones ventas pendientes', `${salePickup?.sale?.saleNum}`];
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // Use client-side session data if available, otherwise fall back to server-side session
  const currentUser = sessionData?.user || session?.user;
  const isBlocked = currentUser?.isBlocked === true;

  const [hasErrorSubmitting, setHasErrorSubmitting] = useState<any>({
    error: false,
    msg: ''
  });

  const [activeStep, setActiveStep] = useState(0);
  const generalError = salePickupByIdError;
  const completeData = salePickup;

  const steps = [
    {
      label: 'Fotos de la recolección'
    }
  ];

  const checkEnabledButton = () => {
    if (activeStep === 0) return attached.front.file && attached.tag.file;
    return true;
  };

  const nextButtonEnabled = checkEnabledButton();

  const handleOnSubmit = async (event) => {
    event.preventDefault();
    setHasErrorSubmitting({ error: false, msg: '' });
    setIsSubmitting(true);
    const result = await completeSalePickup(attached, {
      pickupId
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

  const handleFileChange = async (fieldName: string, file: any) => {
    if (!file) {
      setAttached({
        ...attached,
        [fieldName]: { file: null, url: null, error: false }
      });
      return;
    }
    
    if (!file.type.includes('image/') && !file.type.includes('/pdf')) {
      setBadFormat({
        ...badFormat,
        [fieldName]: true
      });
      setAttached({
        ...attached,
        [fieldName]: {
          ...attached[fieldName],
          error: true
        }
      });
      return;
    }
    
    // Skip compression for PDF files
    if (file.type.includes('/pdf')) {
      const url = URL.createObjectURL(file);
      setAttached({
        ...attached,
        [fieldName]: { file, url, error: false }
      });
    } else {
      // Use compression helper for images
      const result = await compressImage(file);
      if (result) {
        setAttached({
          ...attached,
          [fieldName]: { file: result.file, url: result.url, error: false }
        });
      } else {
        // Fallback to original file
        const url = URL.createObjectURL(file);
        setAttached({
          ...attached,
          [fieldName]: { file, url, error: false }
        });
      }
    }
    setBadFormat({
      ...badFormat,
      [fieldName]: false
    });
  };

  return (
    <>
      <Head>
        <title>Completar recolección garantía</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader title={'Completar recolección garantía'} sutitle={''} />
        <NextBreadcrumbs
          paths={paths}
          lastLoaded={!salePickupByIdError && salePickup}
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
              <Alert severity="error">{salePickupByIdError?.message}</Alert>
            ) : !completeData ? (
              <Skeleton
                variant="rectangular"
                width={'100%'}
                height={500}
                animation="wave"
              />
            ) : (
              <>
                <Card sx={{ p: 2 }}>
                  <Grid container lg={12}>
                    <Grid item lg={1} container>
                      <Grid item xs={2} sm={2} lg={12} mt={1} textAlign="center">
                        <InputLabel id="machine-id"># Equipo</InputLabel>
                      </Grid>
                      <Grid item xs={12} sm={12} lg={12} />
                      <Grid item xs={2} sm={2} lg={12} textAlign="center">
                        <Typography color="black" fontWeight="bold">
                          {salePickup.machine?.machineNum}
                        </Typography>
                      </Grid>
                    </Grid>
                    <Grid item container lg={5}>
                      <Grid item xs={2} sm={2} lg={2} mt={1} textAlign="center">
                        <InputLabel id="customer-name">Cliente</InputLabel>
                      </Grid>
                      <Grid item xs={12} sm={12} lg={12} />
                      <Grid item xs={12} sm={2} lg={12}>
                        <Typography color="black" fontWeight="bold">
                          {salePickup.sale.customer?.name}
                        </Typography>
                      </Grid>
                    </Grid>
                    <Grid item container lg={6}>
                      <Grid item xs={2} sm={2} lg={2} mt={1} textAlign="center">
                        <InputLabel id="reason">Motivo</InputLabel>
                      </Grid>
                      <Grid item xs={12} sm={12} lg={12} />
                      <Grid item xs={12} sm={2} lg={12}>
                        <Typography color="black" fontWeight="bold">
                          {salePickup.reason}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Grid>
                  <Stepper
                    activeStep={activeStep}
                    orientation="vertical"
                    sx={{ backgroundColor: 'transparent' }}
                  >
                    {steps.map((step) => (
                      <Step key={step.label}>
                        <StepLabel>{step.label}</StepLabel>
                        <StepContent>
                          <Box
                            component="form"
                            onSubmit={handleOnSubmit}
                          >
                            {activeStep === 0 && (
                              <Grid container spacing={2}>
                                <Grid item xs={12}>
                                  <Typography variant="body1" color="text.secondary" gutterBottom>
                                    Toma fotos de la máquina y la casa del cliente
                                  </Typography>
                                </Grid>
                                
                                {/* Front Photo */}
                                <Grid item xs={12} md={6}>
                                  {attached.front?.url &&
                                    !attached.front.file.name.includes('pdf') && (
                                      <Box mb={2}>
                                        <Image
                                          src={attached.front.url}
                                          alt="Frente de casa"
                                          width={300}
                                          height={400}
                                        />
                                      </Box>
                                    )}
                                  <MuiFileInput
                                    required={!attached.front.file}
                                    placeholder={'No seleccionada'}
                                    label={'Foto de frente de casa*'}
                                    value={attached.front?.file}
                                    onChange={(file) => handleFileChange('front', file)}
                                  />
                                  {attached.front?.error && (
                                    <Typography color="error" variant="caption">
                                      Seleccione un archivo válido (*.jpg, *.jpeg, *.png).
                                    </Typography>
                                  )}
                                </Grid>

                                {/* Tag Photo */}
                                <Grid item xs={12} md={6}>
                                  {attached.tag?.url &&
                                    !attached.tag.file.name.includes('pdf') && (
                                      <Box mb={2}>
                                        <Image
                                          src={attached.tag.url}
                                          alt="Etiqueta"
                                          width={300}
                                          height={400}
                                        />
                                      </Box>
                                    )}
                                  <MuiFileInput
                                    required={!attached.tag.file}
                                    placeholder={'No seleccionada'}
                                    label={'Foto de etiqueta de equipo*'}
                                    value={attached.tag?.file}
                                    onChange={(file) => handleFileChange('tag', file)}
                                  />
                                  {attached.tag?.error && (
                                    <Typography color="error" variant="caption">
                                      Seleccione un archivo válido (*.jpg, *.jpeg, *.png).
                                    </Typography>
                                  )}
                                </Grid>

                                {hasErrorSubmitting.error && (
                                  <Grid item xs={12}>
                                    <Alert severity="error">
                                      {hasErrorSubmitting.msg}
                                    </Alert>
                                  </Grid>
                                )}
                              </Grid>
                            )}
                            <Box sx={{ mb: 2, mt: 2 }}>
                              <div>
                                <LoadingButton
                                  type="submit"
                                  loading={isSubmitting}
                                  disabled={!nextButtonEnabled || isBlocked}
                                  variant="contained"
                                  sx={{ mt: 1, mr: 1 }}
                                >
                                  Completar recolección
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
                        La recolección fue completada exitosamente. Se ha creado automáticamente un registro de reparación para el técnico.
                      </Alert>
                      <NextLink href="/vueltas-operador">
                        <Button sx={{ mt: 1, mr: 1 }}>
                          Volver a mis vueltas
                        </Button>
                      </NextLink>
                    </Paper>
                  )}
                </Card>
              </>
            )}
          </Grid>
        </Grid>
      </Container>
      <Footer />
    </>
  );
}

RecoleccionVentaPendiente.getLayout = (page) => (
  <SidebarLayout>{page}</SidebarLayout>
);

export async function getServerSideProps({ req, resolvedUrl }) {
  let props = await validateServerSideSession(getSession, req, resolvedUrl);
  return props;
}
export default RecoleccionVentaPendiente;
