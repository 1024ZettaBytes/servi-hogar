import Head from 'next/head';
import { getSession } from 'next-auth/react';
import SidebarLayout from '@/layouts/SidebarLayout';
import { validateServerSideSession } from '../../../lib/auth';
import PageHeader from '@/components/PageHeader';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import { Container, Grid } from '@mui/material';
import Footer from '@/components/Footer';
import TablaPagosVenta from './TablaPagosVenta';
import NextBreadcrumbs from '@/components/Shared/BreadCrums';

function PagosVenta({}) {
  const paths = ['Inicio', 'Ventas', 'Pagos'];

  return (
    <>
      <Head>
        <title>Pagos de Venta</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader title={'Pagos de Venta'} sutitle={''} />
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
          <TablaPagosVenta />
        </Grid>
      </Container>
      <Footer />
    </>
  );
}

PagosVenta.getLayout = (page) => <SidebarLayout>{page}</SidebarLayout>;

export async function getServerSideProps({ req, resolvedUrl }) {
  let props = await validateServerSideSession(getSession, req, resolvedUrl);
  return props;
}

export default PagosVenta;
