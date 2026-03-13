import Head from 'next/head';
import { getSession } from 'next-auth/react';
import { useState } from 'react';
import SidebarLayout from '@/layouts/SidebarLayout';
import { validateServerSideSession } from '../../../lib/auth';
import PageHeader from '@/components/PageHeader';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Box,
  TextField,
  Button,
  Alert
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import Footer from '@/components/Footer';
import { useSnackbar } from 'notistack';
import NextBreadcrumbs from '@/components/Shared/BreadCrums';
import { registerStreetPurchase } from '../../../lib/client/warehouseMachinesFetch';
import { compressImage } from '../../../lib/client/utils';

const PHOTO_LABELS = ['Frente', 'Tablero', 'Etiqueta', 'Debajo'];

function RegistrarCompra(_props) {
  const paths = ['Inicio', 'Almacén', 'Registrar Compra'];
  const { enqueueSnackbar } = useSnackbar();

  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState({ error: false, msg: '' });
  const [brand, setBrand] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [cost, setCost] = useState('');
  const [photos, setPhotos] = useState([null, null, null, null]);

  const handlePhotoChange = async (index, e) => {
    if (e.target.files && e.target.files[0]) {
      const result = await compressImage(e.target.files[0]);
      if (result) {
        setPhotos((prev) => {
          const updated = [...prev];
          updated[index] = result.file;
          return updated;
        });
      }
    }
  };

  async function submitHandler(event) {
    event.preventDefault();
    setIsLoading(true);
    setHasError({ error: false, msg: '' });

    if (!brand || !cost || !photos[0] || !photos[1] || !photos[2] || !photos[3]) {
      setHasError({
        error: true,
        msg: 'Por favor complete la marca, el precio y suba las 4 fotos obligatorias'
      });
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('brand', brand);
    formData.append('serialNumber', serialNumber);
    formData.append('cost', cost);
    photos.forEach((photo, i) => {
      if (photo) formData.append(`photo${i + 1}`, photo);
    });

    const result = await registerStreetPurchase(formData);

    setIsLoading(false);
    if (!result.error) {
      enqueueSnackbar(result.msg, {
        variant: 'success',
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
        autoHideDuration: 2000
      });
      // Reset form
      setBrand('');
      setSerialNumber('');
      setCost('');
      setPhotos([null, null, null, null]);
    } else {
      setHasError({ error: true, msg: result.msg });
    }
  }

  return (
    <>
      <Head>
        <title>Registrar Compra en Calle</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader
          title={'Registrar Compra en Calle'}
          sutitle={'Registrar una máquina comprada por el operador'}
        />
        <NextBreadcrumbs paths={paths} lastLoaded={true} />
      </PageTitleWrapper>

      <Container maxWidth="sm">
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Datos de la compra" />
              <Divider />
              <CardContent>
                <Box component="form" onSubmit={submitHandler}>
                  <Grid
                    container
                    direction="column"
                    justifyContent="center"
                    spacing={2}
                  >
                    <Grid item>
                      <TextField
                        autoComplete="off"
                        required
                        id="brand"
                        name="brand"
                        label="Marca"
                        fullWidth
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                      />
                    </Grid>

                    <Grid item>
                      <TextField
                        required
                        autoComplete="off"
                        id="serialNumber"
                        name="serialNumber"
                        label="Número de Serie"
                        fullWidth
                        value={serialNumber}
                        onChange={(e) => setSerialNumber(e.target.value)}
                      />
                    </Grid>

                    <Grid item>
                      <TextField
                        type="number"
                        autoComplete="off"
                        required
                        id="cost"
                        name="cost"
                        label="Precio de compra ($)"
                        fullWidth
                        value={cost}
                        onChange={(e) => setCost(e.target.value)}
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    </Grid>

                    {PHOTO_LABELS.map((label, index) => (
                      <Grid item key={index}>
                        <Button
                          variant="outlined"
                          component="label"
                          fullWidth
                          color={photos[index] ? 'success' : 'primary'}
                        >
                          {photos[index]
                            ? `${label}: ${photos[index].name}`
                            : `Foto ${label} *`}
                          <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={(e) => handlePhotoChange(index, e)}
                          />
                        </Button>
                      </Grid>
                    ))}

                    {hasError.error && (
                      <Grid item>
                        <Alert severity="error">{hasError.msg}</Alert>
                      </Grid>
                    )}

                    <Grid item>
                      <LoadingButton
                        loading={isLoading}
                        type="submit"
                        variant="contained"
                        fullWidth
                        size="large"
                      >
                        Registrar Compra
                      </LoadingButton>
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
      <Footer />
    </>
  );
}

RegistrarCompra.getLayout = (page) => <SidebarLayout>{page}</SidebarLayout>;

export async function getServerSideProps({ req, resolvedUrl }) {
  let props = await validateServerSideSession(getSession, req, resolvedUrl);
  return props;
}

export default RegistrarCompra;
