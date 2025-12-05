import Head from 'next/head';
import { getSession } from 'next-auth/react';
import SidebarLayout from '@/layouts/SidebarLayout';
import { validateServerSideSession } from '../../lib/auth';
import PageHeader from '@/components/PageHeader';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import { Card, Container, Grid, Skeleton, Alert } from '@mui/material';
import Footer from '@/components/Footer';
import NextBreadcrumbs from '@/components/Shared/BreadCrums';
import TablaRecoleccionesVentasPendientes from './TablaRecoleccionesVentasPendientes';
import { useGetPendingSalePickups, getFetcher } from '../api/useRequest';

function RecoleccionesVentasPendientes({ session }) {
  const paths = ['Inicio', 'Recolecciones de Garantía Pendientes'];
  const { pendingSalePickupsList, pendingSalePickupsError } = useGetPendingSalePickups(getFetcher);
  const { user } = session;

  return (
    <>
      <Head>
        <title>Recolecciones de Garantía Pendientes</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader
          title={'Recolecciones de Garantía Pendientes'}
          sutitle={'Completa las recolecciones de equipos con fallas'}
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
            {pendingSalePickupsError ? (
              <Alert severity="error">
                {pendingSalePickupsError?.message || 'Error al cargar las recolecciones'}
              </Alert>
            ) : !pendingSalePickupsList ? (
              <Skeleton
                variant="rectangular"
                width={'100%'}
                height={500}
                animation="wave"
              />
            ) : (
              <Card>
                <TablaRecoleccionesVentasPendientes
                  userRole={user?.role}
                  pickupList={pendingSalePickupsList}
                />
              </Card>
            )}
          </Grid>
        </Grid>
      </Container>
      <Footer />
    </>
  );
}

RecoleccionesVentasPendientes.getLayout = (page) => <SidebarLayout>{page}</SidebarLayout>;

export async function getServerSideProps({ req, resolvedUrl }) {
  let props = await validateServerSideSession(getSession, req, resolvedUrl);
  return props;
}

export default RecoleccionesVentasPendientes;
