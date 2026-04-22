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
import { getFetcher, useGetSaleChangeById } from '../api/useRequest';
import NextBreadcrumbs from '@/components/Shared/BreadCrums';
import { LoadingButton } from '@mui/lab';
import { completeSaleChange } from 'lib/client/saleChangesFetch';
import { useRouter } from 'next/router';
import React from 'react';
import { MuiFileInput } from 'mui-file-input';
import { compressImage } from 'lib/client/utils';

function CambioVentaPendiente({ session }) {
  const router = useRouter();
  const { changeId } = router.query;
  const { saleChange, saleChangeByIdError } = useGetSaleChangeById(getFetcher, changeId);
  const { data: sessionData, update: updateSession } = useSession();
  const [attached, setAttached] = useState<any>({
    front: { file: null, url: null, error: false },
    tag: { file: null, url: null, error: false }
  });

  const [badFormat, setBadFormat] = useState<any>({
    front: false,
    tag: false
  });
  const paths = ['Inicio', 'Cambios ventas pendientes', `${saleChange?.totalNumber || ''}`];
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const currentUser = sessionData?.user || session?.user;
  const isBlocked = currentUser?.isBlocked === true;

  const [hasErrorSubmitting, setHasErrorSubmitting] = useState<any>({
    error: false,
    msg: ''
  });

  const [activeStep, setActiveStep] = useState(0);
  const generalError = saleChangeByIdError;
  const completeData = saleChange;

  const steps = [
    {
      label: 'Fotos del cambio'
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
    const result = await completeSaleChange(attached, { changeId });
    setIsSubmitting(false);
    if (!result.error) {
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

    if (file.type.includes('/pdf')) {
      const url = URL.createObjectURL(file);
      setAttached({
        ...attached,
        [fieldName]: { file, url, error: false }
      });
    } else {
      const result = await compressImage(file);
      if (result) {
        setAttached({
          ...attached,
          [fieldName]: { file: result.file, url: result.url, error: false }
        });
      } else {
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
        <title>Completar cambio por garantía</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader title="Completar cambio por garantía" sutitle="" />
        <NextBreadcrumbs
          paths={paths}
          lastLoaded={!saleChangeByIdError && saleChange}
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
                  Tu cuenta ha sido bloqueada por exceder el tiempo permitido entre vueltas (más de 45 minutos).
                  Por favor contacta al administrador para resolver esta situación.
                </Typography>
              </Alert>
            )}
            {generalError ? (
              <Alert severity="error">{saleChangeByIdError?.message}</Alert>
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
                  <Grid container lg={12} spacing={2}>
                    <Grid item container lg={3}>
                      <Grid item xs={12} mt={1} textAlign="center">
                        <InputLabel>Equipo a recoger</InputLabel>
                      </Grid>
                      <Grid item xs={12} textAlign="center">
                        <Typography color="black" fontWeight="bold">
                          #{saleChange.pickedMachine?.machineNum} - {saleChange.pickedMachine?.brand} ({saleChange.pickedMachine?.serialNumber || "NA"})
                        </Typography>
                      </Grid>
                    </Grid>
                    <Grid item container lg={3}>
                      <Grid item xs={12} mt={1} textAlign="center">
                        <InputLabel>Equipo a dejar</InputLabel>
                      </Grid>
                      <Grid item xs={12} textAlign="center">
                        <Typography color="black" fontWeight="bold">
                          #{saleChange.leftMachine?.machineNum} - {saleChange.leftMachine?.brand} ({saleChange.leftMachine?.serialNumber || "NA"})
                        </Typography>
                      </Grid>
                    </Grid>
                    <Grid item container lg={3}>
                      <Grid item xs={12} mt={1} textAlign="center">
                        <InputLabel>Cliente</InputLabel>
                      </Grid>
                      <Grid item xs={12} textAlign="center">
                        <Typography color="black" fontWeight="bold">
                          {saleChange.sale?.customer?.name}
                        </Typography>
                      </Grid>
                    </Grid>
                    <Grid item container lg={3}>
                      <Grid item xs={12} mt={1} textAlign="center">
                        <InputLabel>Motivo</InputLabel>
                      </Grid>
                      <Grid item xs={12} textAlign="center">
                        <Typography color="black" fontWeight="bold">
                          {saleChange.reason}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Grid>
                  <Stepper
                    activeStep={activeStep}
                    orientation="vertical"
                    sx={{ backgroundColor: 'transparent', mt: 2 }}
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
                                    Toma fotos de la máquina recogida y la casa del cliente
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
                                  Completar cambio
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
                        El cambio por garantía fue completado exitosamente. La máquina de reemplazo ha sido entregada al cliente.
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

CambioVentaPendiente.getLayout = (page) => (
  <SidebarLayout>{page}</SidebarLayout>
);

export async function getServerSideProps({ req, resolvedUrl }) {
  let props = await validateServerSideSession(getSession, req, resolvedUrl);
  return props;
}
export default CambioVentaPendiente;
