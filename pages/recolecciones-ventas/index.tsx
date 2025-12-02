import Head from 'next/head';
import { getSession } from 'next-auth/react';
import { useState } from 'react';
import SidebarLayout from '@/layouts/SidebarLayout';
import { validateServerSideSession } from '../../lib/auth';
import PageHeader from '@/components/PageHeader';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import { Card, Container, Grid, Skeleton, Alert } from '@mui/material';
import Footer from '@/components/Footer';
import NextBreadcrumbs from '@/components/Shared/BreadCrums';
import TablaRecoleccionesVentas from './TablaRecoleccionesVentas';
import ScheduleSalePickupModal from '@/components/ScheduleSalePickupModal';
import { useGetPendingSalePickups, useGetSalePickups, getFetcher } from '../api/useRequest';
import { useSnackbar } from 'notistack';
import AddTwoTone from '@mui/icons-material/AddTwoTone';

function RecoleccionesVentas({ session }) {
  const paths = ['Inicio', 'Recolecciones de Garantía'];
  const { enqueueSnackbar } = useSnackbar();
  const [modalIsOpen, setModalIsOpen] = useState(false);

  const { pendingSalePickupsList, pendingSalePickupsError } = useGetPendingSalePickups(getFetcher);
  const { salePickupsData, salePickupsError } = useGetSalePickups(getFetcher, 1, 10, '');

  const generalError = pendingSalePickupsError || salePickupsError;
  const completeData = pendingSalePickupsList && salePickupsData;
  const { user } = session;

  const handleClickOpen = () => {
    setModalIsOpen(true);
  };

  const handleClose = (saved, successMessage = null) => {
    setModalIsOpen(false);
    if (saved && successMessage) {
      enqueueSnackbar(successMessage, {
        variant: 'success',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'center'
        },
        autoHideDuration: 2000
      });
    }
  };

  const button = {
    text: 'Agendar Recolección',
    onClick: handleClickOpen,
    startIcon: <AddTwoTone />,
    variant: 'contained'
  };

  return (
    <>
      <Head>
        <title>Recolecciones de Garantía</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader
          title={'Recolecciones de Garantía'}
          subtitle={'Gestiona las recolecciones de equipos vendidos con fallas'}
          button={!generalError && completeData ? button : null}
        />
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
                {generalError?.message || 'Error al cargar las recolecciones'}
              </Alert>
            ) : !completeData ? (
              <Skeleton
                variant="rectangular"
                width={'100%'}
                height={500}
                animation="wave"
              />
            ) : (
              <Card>
                <TablaRecoleccionesVentas
                  userRole={user?.role}
                  pendingPickups={pendingSalePickupsList}
                  pastPickups={salePickupsData}
                />
              </Card>
            )}
          </Grid>
        </Grid>
      </Container>
      {modalIsOpen && (
        <ScheduleSalePickupModal
          open={modalIsOpen}
          handleOnClose={handleClose}
        />
      )}
      <Footer />
    </>
  );
}

RecoleccionesVentas.getLayout = (page) => <SidebarLayout>{page}</SidebarLayout>;

export async function getServerSideProps({ req, resolvedUrl }) {
  let props = await validateServerSideSession(getSession, req, resolvedUrl);
  return props;
}

export default RecoleccionesVentas;
