import Head from 'next/head';
import { getSession } from 'next-auth/react';
import SidebarLayout from '@/layouts/SidebarLayout';
import { validateServerSideSession } from '../../lib/auth';
import PageHeader from '@/components/PageHeader';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import {
  Card,
  Container,
  Grid,
  Skeleton,
  Alert,
  CardContent,
  Typography,
  styled,
  Avatar
} from '@mui/material';
import Footer from '@/components/Footer';
import TablaRentasActuales from './TablaRentasActuales';
import TablaRentasPasadas from './TablaRentasPasadas';
import AlarmOnIcon from '@mui/icons-material/AlarmOn';
import NotificationImportantIcon from '@mui/icons-material/NotificationImportant';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import {
  useGetRents,
  getFetcher,
  useGetPendingPickups
} from '../api/useRequest';

import NextBreadcrumbs from '@/components/Shared/BreadCrums';

function Rentas({ session }) {
  const { user } = session;
  const paths = ['Inicio', 'Colocadas'];
  const { rentsData, rentsError } = useGetRents('current', getFetcher);
  const { pastRentsData, pastRentsError } = useGetRents('past', getFetcher);
  const { pendingPickupsList: pickups } = useGetPendingPickups(
    getFetcher,
    false
  );
  const getOnTimeAndExpired = () => {
    let onTime = 0;
    let expired = 0;
    if (rentsData) {
      rentsData.forEach((rent) => {
        if (rent.remaining >= 0) {
          onTime++;
        } else {
          expired++;
        }
      });
    }
    return [onTime, expired];
  };
  const AvatarWrapperSuccess = styled(Avatar)(
    ({ theme }) => `
        background-color: ${theme.colors.success.lighter};
        color:  ${theme.colors.success.main};
  `
  );

  const AvatarWrapperError = styled(Avatar)(
    ({ theme }) => `
        background-color: ${theme.colors.error.lighter};
        color:  ${theme.colors.error.main};
  `
  );

  const AvatarWrapperPickup = styled(Avatar)(
    ({ theme }) => `
        background-color: ${theme.colors.warning.lighter};
        color:  ${theme.colors.warning.main};
  `
  );

  return (
    <>
      <Head>
        <title>Colocadas</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader title={'Colocadas'} sutitle={''} />
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
            {rentsError ? (
              <Alert severity="error">{rentsError?.message}</Alert>
            ) : !rentsData ? (
              <Skeleton
                variant="rectangular"
                width={'100%'}
                height={500}
                animation="wave"
              />
            ) : (
              <>
                <Grid container spacing={2} sx={{ marginBottom: 2 }}>
                  <Grid lg={3} />
                  <Grid xs={12} sm={6} md={3} lg={3} item>
                    <Card
                      sx={{
                        px: 1,
                        height: '100px',
                        overflowY: 'auto'
                      }}
                    >
                      <CardContent>
                        <Grid
                          container
                          alignItems="center"
                          justifyItems="center"
                          textAlign={{ lg: 'center' }}
                        >
                          <Grid item lg={2} md={2} xs={2}>
                            <AvatarWrapperSuccess>
                              <AlarmOnIcon />
                            </AvatarWrapperSuccess>
                          </Grid>
                          <Grid item lg={3} md={2} xs={2}>
                            <Typography variant="h3" gutterBottom noWrap>
                              {getOnTimeAndExpired()[0]}
                            </Typography>
                          </Grid>
                          <Grid item lg={7} md={8} xs={8}>
                            <Typography
                              variant="subtitle2"
                              noWrap
                              textAlign="left"
                            >
                              Al corriente
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid xs={12} sm={6} md={3} lg={3} item>
                    <Card
                      sx={{
                        px: 1,
                        height: '100px',
                        overflowY: 'auto'
                      }}
                    >
                      <CardContent>
                        <Grid
                          container
                          alignItems="center"
                          justifyItems="center"
                          textAlign={{ lg: 'center' }}
                        >
                          <Grid item lg={2} md={2} xs={2}>
                            <AvatarWrapperError>
                              <NotificationImportantIcon />
                            </AvatarWrapperError>
                          </Grid>
                          <Grid item lg={3} md={2} xs={2}>
                            <Typography variant="h3" gutterBottom noWrap>
                              {getOnTimeAndExpired()[1]}
                            </Typography>
                          </Grid>
                          <Grid item lg={7} md={8} xs={8}>
                            <Typography
                              variant="subtitle2"
                              noWrap
                              textAlign="left"
                            >
                              Vencidas
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid xs={12} sm={6} md={3} lg={3} item>
                    <Card
                      sx={{
                        px: 1,
                        height: '100px',
                        overflowY: 'auto'
                      }}
                    >
                      <CardContent>
                        <Grid
                          container
                          alignItems="center"
                          justifyItems="center"
                          textAlign={{ lg: 'center' }}
                        >
                          <Grid item lg={2} md={2} xs={2}>
                            <AvatarWrapperPickup>
                              <LocalShippingIcon />
                            </AvatarWrapperPickup>
                          </Grid>
                          <Grid item lg={3} md={2} xs={2}>
                            <Typography variant="h3" gutterBottom noWrap>
                              {pickups?.count}
                            </Typography>
                          </Grid>
                          <Grid item lg={7} md={8} xs={8}>
                            <Typography
                              variant="subtitle2"
                              noWrap
                              textAlign="left"
                            >
                              Rec. Pendientes
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
                <Card>
                  <TablaRentasActuales
                    userRole={user?.role}
                    rentList={rentsData}
                  />
                </Card>
              </>
            )}
          </Grid>
        </Grid>
      </Container>
      <Container maxWidth="lg" sx={{ marginTop: 5 }}>
        <Grid
          container
          direction="row"
          justifyContent="center"
          alignItems="stretch"
          spacing={4}
        >
          <Grid item xs={12}>
            {pastRentsError ? (
              <Alert severity="error">{pastRentsError?.message}</Alert>
            ) : !pastRentsData ? (
              <Skeleton
                variant="rectangular"
                width={'100%'}
                height={500}
                animation="wave"
              />
            ) : (
              <Card>
                <TablaRentasPasadas rentList={pastRentsData} />
              </Card>
            )}
          </Grid>
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
