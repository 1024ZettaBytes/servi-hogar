import Head from 'next/head';
import { getSession } from 'next-auth/react';
import SidebarLayout from '@/layouts/SidebarLayout';
import { validateServerSideSession } from '../../lib/auth';
import PageHeader from '@/components/PageHeader';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import { Container, Grid } from '@mui/material';
import Footer from '@/components/Footer';
import TablaInvestigaciones from './TablaInvestigaciones';

import NextBreadcrumbs from '@/components/Shared/BreadCrums';

function EquiposInvestigacion({ session }) {
  const paths = ['Inicio', 'Equipos en Investigación'];
  const { user } = session;

  return (
    <>
      <Head>
        <title>Equipos en Investigación</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader title={'Equipos en Investigación'} sutitle={''} />
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
          <TablaInvestigaciones userRole={user?.role} />
        </Grid>
      </Container>
      <Footer />
    </>
  );
}

EquiposInvestigacion.getLayout = (page) => <SidebarLayout>{page}</SidebarLayout>;

export async function getServerSideProps({ req, resolvedUrl }) {
  let props = await validateServerSideSession(getSession, req, resolvedUrl);
  return props;
}
export default EquiposInvestigacion;
