
import Head from 'next/head';
import { getSession } from 'next-auth/react';
import SidebarLayout from '@/layouts/SidebarLayout';
import { validateServerSideSession } from '../../lib/auth';
import PageHeader from '@/components/PageHeader';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import { Container, Grid } from '@mui/material';
import Footer from '@/components/Footer';
import TablaRecolectadas from './TablaRecolectadas';
import NextBreadcrumbs from '@/components/Shared/BreadCrums';

function RecolectadasPage({ session }) {
  const paths = ['Inicio', 'Recolectadas'];
  const { user } = session;

  return (
    <>
      <Head>
        <title>Equipos Recolectados</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader title={'Equipos Recolectados'} sutitle={'Listado de tus equipos recolectados'} />
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
                <TablaRecolectadas userRole={user?.role} />
            </Grid>
        </Grid>
      </Container>
      <Footer />
    </>
  );
}

RecolectadasPage.getLayout = (page) => <SidebarLayout>{page}</SidebarLayout>;

export async function getServerSideProps({ req, resolvedUrl }) {
  let props = await validateServerSideSession(getSession, req, resolvedUrl);
  return props;
}
export default RecolectadasPage;
