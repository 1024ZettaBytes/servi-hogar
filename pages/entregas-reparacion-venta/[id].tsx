import Footer from '@/components/Footer';
import PageHeader from '@/components/PageHeader';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import NextBreadcrumbs from '@/components/Shared/BreadCrums';
import SidebarLayout from '@/layouts/SidebarLayout';
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
  Grid,
  IconButton,
  Skeleton,
  TextField,
  Typography,
  Button as MuiButton
} from '@mui/material';
import Button from '@mui/material/Button';
import { DesktopDatePicker } from '@mui/x-date-pickers';
import { completeRepairReturnDelivery } from 'lib/client/salesFetch';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { validateServerSideSession } from '../../lib/auth';
import {
  compressImage,
  convertDateToLocal,
  setDateToMid
} from '../../lib/client/utils';
import useSWR from 'swr';

const fetcher = (url) => fetch(url).then((res) => res.json());

function CompletarEntregaReparacion() {
  const router = useRouter();
  const { id } = router.query;
  
  // Fetch sale data
  const { data: saleData, error: saleError } = useSWR(
    id ? `/api/sales/${id}?populate=full` : null,
    fetcher
  );
  
  const sale = saleData?.data;
  const customer = sale?.customer;
  const paths = ['Inicio', 'Entregas', 'Completar entrega de reparación'];
  
  const [deliveryDate, setDeliveryDate] = useState<any>(new Date());
  
  const [attached, setAttached] = useState<any>({
    evidence: { file: null, url: null, error: false }
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [hasErrorSubmitting, setHasErrorSubmitting] = useState<any>({
    error: false,
    msg: ''
  });
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  async function handleImageSelection(imageFile) {
    // Handle file removal
    if (!imageFile) {
      setAttached({
        evidence: { file: null, url: null, error: false }
      });
      return;
    }

    // Compress image using helper function
    const result = await compressImage(imageFile);
    
    if (!result) {
      // Validation failed (invalid image type)
      setAttached({
        evidence: { ...attached.evidence, error: true }
      });
      return;
    }

    // Set compressed file and preview URL
    setAttached({
      evidence: { file: result.file, url: result.url, error: false }
    });
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageSelection(file);
    }
  };

  const handleRemoveImage = () => {
    setAttached({
      evidence: { file: null, url: null, error: false }
    });
  };

  const handleOnSubmit = async (event) => {
    event.preventDefault();
    setHasErrorSubmitting({ error: false, msg: '' });
    setIsSubmitting(true);

    const deliveryData = {
      saleId: id as string,
      deliveryDate: setDateToMid(new Date(deliveryDate)).toISOString()
    };

    const result = await completeRepairReturnDelivery(attached.evidence, deliveryData);
    setIsSubmitting(false);
    
    if (!result.error) {
      setIsCompleted(true);
    } else {
      setHasErrorSubmitting({ error: true, msg: result.msg });
    }
  };

  const machineInfo = sale?.machine
    ? `#${sale.machine.machineNum} - ${sale.machine.brand}`
    : sale?.serialNumber || 'N/A';

  const canSubmit = deliveryDate && 
    deliveryDate.toString() !== 'Invalid Date' && 
    attached.evidence.file;

  return (
    <>
      <Head>
        <title>Completar entrega de reparación</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader title={'Completar entrega de reparación'} sutitle={''} />
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
            {saleError ? (
              <Alert severity="error">
                {saleError?.message}
              </Alert>
            ) : !sale ? (
              <Skeleton
                variant="rectangular"
                width={'100%'}
                height={500}
                animation="wave"
              />
            ) : isCompleted ? (
              <Card sx={{ p: 3 }}>
                <Alert severity="success" sx={{ mb: 2 }}>
                  La entrega de reparación fue completada exitosamente
                </Alert>
                <NextLink href="/entregas-pendientes" passHref>
                  <Button variant="contained">
                    Volver a entregas pendientes
                  </Button>
                </NextLink>
              </Card>
            ) : (
              <Card sx={{ p: 3 }}>
                <Box component="form" onSubmit={handleOnSubmit}>
                  <Grid container spacing={3}>
                    {/* Repair Return Information */}
                    <Grid item xs={12}>
                      <Alert severity="info" sx={{ mb: 2 }}>
                        Esta es una entrega de devolución de reparación. Solo necesita registrar la evidencia de entrega.
                      </Alert>
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant="h4" gutterBottom>
                        Información del equipo reparado
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Folio de Venta
                      </Typography>
                      <Typography variant="body1" fontWeight="500">
                        {sale?.saleNum || 'N/A'}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Equipo Reparado
                      </Typography>
                      <Typography variant="body1" fontWeight="500">
                        {machineInfo}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Cliente
                      </Typography>
                      <Typography variant="body1" fontWeight="500">
                        {customer?.name || 'N/A'}
                      </Typography>
                    </Grid>

                    {/* Delivery Date */}
                    <Grid item xs={12}>
                      <Typography variant="h4" gutterBottom sx={{ mt: 3 }}>
                        Completar devolución de reparación
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <DesktopDatePicker
                        label="Fecha de entrega"
                        inputFormat="dd/MM/yyyy"
                        value={deliveryDate || convertDateToLocal(new Date())}
                        maxDate={new Date()}
                        onChange={(newValue) => {
                          setDeliveryDate(newValue);
                        }}
                        renderInput={(params) => <TextField {...params} fullWidth />}
                      />
                    </Grid>

                    {/* Evidence Image */}
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Foto de Evidencia *
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                        Suba una foto que muestre que el equipo fue entregado al cliente
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      {attached.evidence?.url ? (
                        <Card>
                          <CardMedia
                            component="img"
                            height="300"
                            image={attached.evidence.url}
                            alt="Evidencia"
                          />
                          <CardActions sx={{ justifyContent: 'center' }}>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={handleRemoveImage}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </CardActions>
                        </Card>
                      ) : (
                        <MuiButton
                          variant="outlined"
                          component="label"
                          fullWidth
                          startIcon={<PhotoCamera />}
                          sx={{ height: 200 }}
                        >
                          Subir Foto
                          <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={handleImageUpload}
                          />
                        </MuiButton>
                      )}
                      {attached.evidence?.error && (
                        <Typography color="error" variant="caption" display="block" sx={{ mt: 1 }}>
                          Seleccione un archivo válido (*.jpg, *.jpeg, *.png).
                        </Typography>
                      )}
                    </Grid>

                    {/* Error Message */}
                    {hasErrorSubmitting.error && (
                      <Grid item xs={12}>
                        <Alert severity="error">
                          {hasErrorSubmitting.msg}
                        </Alert>
                      </Grid>
                    )}

                    {/* Submit Button */}
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                        <NextLink href="/entregas-pendientes" passHref>
                          <Button disabled={isSubmitting}>
                            Cancelar
                          </Button>
                        </NextLink>
                        <LoadingButton
                          loading={isSubmitting}
                          disabled={!canSubmit}
                          variant="contained"
                          type="submit"
                        >
                          Completar entrega
                        </LoadingButton>
                      </Box>
                      {!canSubmit && !attached.evidence.file && (
                        <Alert severity="warning" sx={{ mt: 2 }}>
                          Por favor suba la foto de evidencia para continuar
                        </Alert>
                      )}
                    </Grid>
                  </Grid>
                </Box>
              </Card>
            )}
          </Grid>
        </Grid>
      </Container>

      <Footer />
    </>
  );
}

CompletarEntregaReparacion.getLayout = (page) => <SidebarLayout>{page}</SidebarLayout>;

export async function getServerSideProps({ req, resolvedUrl }) {
  let props = await validateServerSideSession(getSession, req, resolvedUrl);
  return props;
}

export default CompletarEntregaReparacion;
