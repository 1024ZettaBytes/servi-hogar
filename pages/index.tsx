import Head from 'next/head';
import { getSession } from 'next-auth/react';
import SidebarLayout from '@/layouts/SidebarLayout';
import { validateServerSideSession } from '../lib/auth';
import PageHeader from '@/components/PageHeader';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import {
  Avatar,
  Card,
  CardContent,
  Container,
  Grid,
  styled,
  Typography
} from '@mui/material';
import Footer from '@/components/Footer';
import { getFetcher, useGetMantainancesAlert } from './api/useRequest';
import NotificationImportantIcon from '@mui/icons-material/NotificationImportant';

function Home({ session }) {
  const { user } = session;
  const { alertData, alertError } = useGetMantainancesAlert(getFetcher);
  const AvatarWrapperError = styled(Avatar)(
    ({ theme }) => `
        background-color: ${theme.colors.error.lighter};
        color:  ${theme.colors.error.main};
  `
  );
  return (
    <>
      <>
        <Head>
          <title>Servi Hogar</title>
        </Head>
        <PageTitleWrapper>
          <PageHeader
            title={'¡Bienvenido(a) ' + user?.name + '!'}
            sutitle={'Esta es la página de inicio'}
            showAvatar={true}
          />
        </PageTitleWrapper>
        {alertData && !alertError && alertData.length > 0 && (
          <Container maxWidth="lg">
            <Grid container spacing={2} sx={{ marginBottom: 2 }}>
              <Grid xs={12} sm={6} md={3} lg={4} item>
                <Card
                  sx={{
                    px: 1,
                    height: 'auto'
                  }}
                >
                  <CardContent>
                    <Grid
                      container
                      alignItems="left"
                      justifyItems="left"
                      textAlign={{ lg: 'left' }}
                      spacing={1}
                    >
                      <Grid item lg={2} md={2} xs={2}>
                        <AvatarWrapperError>
                          <NotificationImportantIcon />
                        </AvatarWrapperError>
                      </Grid>
                      <Grid item lg={10} md={12} xs={12}>
                        <Typography variant="h3" gutterBottom noWrap>
                          Atención
                        </Typography>
                      </Grid>
                      <Grid item lg={12} md={8} xs={8}>
                        <Typography variant="subtitle2" textAlign="left">
                          Los siguientes equipos no han tenido mantenimiento en
                          los ultimos 365 días
                        </Typography>
                      </Grid>
                      <Grid item lg={12} md={12} xs={12}>
                        {alertData?.map((machine) => machine.machineNum + ', ')}
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Container>
        )}
      </>
      <Footer />
    </>
  );
}

Home.getLayout = (page) => <SidebarLayout>{page}</SidebarLayout>;
export async function getServerSideProps({ req, resolvedUrl }) {
  return await validateServerSideSession(getSession, req, resolvedUrl);
}
export default Home;
