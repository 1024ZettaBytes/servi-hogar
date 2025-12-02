import { FC } from 'react';
import Head from 'next/head';
import { useSession } from 'next-auth/react';
import SidebarLayout from '@/layouts/SidebarLayout';
import PageHeader from '@/components/PageHeader';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import { Container, Grid, Card } from '@mui/material';
import Footer from '@/components/Footer';
import { useGetPendingSaleRepairs, useGetSaleRepairs } from '../api/useRequest';
import TablaReparaciones from './TablaReparaciones';

const ReparacionesVentas: FC = () => {
  const { data: session } = useSession();
  const user = session?.user as any;
  const userRole = user?.role?.name;

  const { data: pendingRepairs, isLoading: loadingPending } = useGetPendingSaleRepairs();
  const { data: allRepairs, isLoading: loadingAll } = useGetSaleRepairs();

  return (
    <>
      <Head>
        <title>Reparaciones de Garantía - Servi Hogar</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader
          title="Reparaciones de Garantía"
          subtitle="Gestión de reparaciones de equipos vendidos"
        />
      </PageTitleWrapper>
      <Container maxWidth="lg">
        <Grid
          container
          direction="row"
          justifyContent="center"
          alignItems="stretch"
          spacing={3}
        >
          <Grid item xs={12}>
            <Card>
              <TablaReparaciones
                userRole={userRole}
                pendingRepairs={pendingRepairs || []}
                allRepairs={allRepairs || []}
                isLoading={loadingPending || loadingAll}
              />
            </Card>
          </Grid>
        </Grid>
      </Container>
      <Footer />
    </>
  );
};

(ReparacionesVentas as any).getLayout = (page) => <SidebarLayout>{page}</SidebarLayout>;

export default ReparacionesVentas;
