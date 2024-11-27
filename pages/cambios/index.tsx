import Head from 'next/head';
import { getSession } from 'next-auth/react';
import SidebarLayout from '@/layouts/SidebarLayout';
import { validateServerSideSession } from '../../lib/auth';
import PageHeader from '@/components/PageHeader';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import { Container, Grid } from '@mui/material';
import Footer from '@/components/Footer';
import TablaCambios from './TablaCambios';

import NextBreadcrumbs from '@/components/Shared/BreadCrums';

function Rentas({ session }) {
  const paths = ['Inicio', 'Cambios'];

  const { user } = session;

  return (
    <>
      <Head>
        <title>Cambios</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader title={'Cambios'} sutitle={''} />
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
          <TablaCambios userRole={user?.role} />
        </Grid>
      </Container>
      <Footer />
    </>
  );
}

Rentas.getLayout = (page) => <SidebarLayout>{page}</SidebarLayout>;

export async function getServerSideProps({ req, resolvedUrl }) {
  let props = await validateServerSideSession(getSession, req, resolvedUrl);
  return props;
}
export default Rentas;
