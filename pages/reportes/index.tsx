import {
  Card,
  Grid,
  Box,
  CardContent,
  Typography,
  Avatar,
  styled,
  Container,
  useTheme
} from '@mui/material';
import NextLink from 'next/link';
import ViewDayIcon from '@mui/icons-material/ViewDay';
import CalendarViewWeekIcon from '@mui/icons-material/CalendarViewWeek';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SidebarLayout from '@/layouts/SidebarLayout';
import LocalLaundryServiceIcon from '@mui/icons-material/LocalLaundryService';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import { validateServerSideSession } from 'lib/auth';
import { getSession } from 'next-auth/react';
import Footer from '@/components/Footer';
import PageHeader from '@/components/PageHeader';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import Head from 'next/head';

const AvatarWrapperSuccess = styled(Avatar)(
  ({ theme }) => `
        background-color: ${theme.colors.info.lighter};
        color:  ${theme.colors.info.main};
  `
);

const AvatarWrapperError = styled(Avatar)(
  ({ theme }) => `
        background-color: ${theme.colors.success.lighter};
        color:  ${theme.colors.success.main};
  `
);
const AvatarWrapperWarning = styled(Avatar)(
  ({ theme }) => `
        background-color: ${theme.colors.warning.lighter};
        color:  ${theme.colors.warning.main};
  `
);

const AvatarWrapperNormal = styled(Avatar)(
  ({ theme }) => `
        background-color: ${theme.colors.info.dark};
        color:  ${theme.colors.warning.main};
  `
);

function Reportes({ session }) {
  const { user } = session;
  const onlyChanges = user?.role === 'SUB';
  const theme = useTheme();
  return (
    <>
      <Head>
        <title>Servi Hogar | Reportes</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader title={'Reportes'} />
      </PageTitleWrapper>
      <Container maxWidth="lg">
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            pb: 3
          }}
        ></Box>
        <Grid container spacing={3}>
          {!onlyChanges && (
            <Grid xs={12} sm={6} md={4} item>
              <NextLink href="/reportes/diario">
                <Card
                  sx={{
                    px: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      background: theme.palette.grey[300]
                    }
                  }}
                >
                  <CardContent>
                    <AvatarWrapperSuccess>
                      <ViewDayIcon />
                    </AvatarWrapperSuccess>

                    <Box
                      sx={{
                        pt: 3
                      }}
                    >
                      <Typography variant="h3" gutterBottom noWrap>
                        Diario
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </NextLink>
            </Grid>
          )}
          <Grid xs={12} sm={6} md={4} item>
            <NextLink href="/reportes/semanal">
              <Card
                sx={{
                  px: 1,
                  cursor: 'pointer',
                  '&:hover': {
                    background: theme.palette.grey[300]
                  }
                }}
              >
                <CardContent>
                  <AvatarWrapperWarning>
                    <CalendarViewWeekIcon />
                  </AvatarWrapperWarning>
                  <Box
                    sx={{
                      pt: 3
                    }}
                  >
                    <Typography variant="h3" gutterBottom noWrap>
                      Semanal
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </NextLink>
          </Grid>
          {!onlyChanges && (
            <Grid xs={12} sm={6} md={4} item>
              <NextLink href="/reportes/mensual">
                <Card
                  sx={{
                    px: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      background: theme.palette.grey[300]
                    }
                  }}
                >
                  <CardContent>
                    <AvatarWrapperError>
                      <CalendarMonthIcon />
                    </AvatarWrapperError>
                    <Box
                      sx={{
                        pt: 3
                      }}
                    >
                      <Typography variant="h3" gutterBottom noWrap>
                        Mensual
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </NextLink>
            </Grid>
          )}
          {user?.role === 'ADMIN' && (
            <Grid xs={12} sm={6} md={4} item>
              <NextLink href="/reportes/equipos">
                <Card
                  sx={{
                    px: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      background: theme.palette.grey[300]
                    }
                  }}
                >
                  <CardContent>
                    <AvatarWrapperNormal>
                      <LocalLaundryServiceIcon />
                    </AvatarWrapperNormal>
                    <Box
                      sx={{
                        pt: 3
                      }}
                    >
                      <Typography variant="h3" gutterBottom noWrap>
                        Equipos
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </NextLink>
            </Grid>
          )}
          {user?.role === 'ADMIN' && (
            <Grid xs={12} sm={6} md={4} item>
              <NextLink href="/reportes/ingresos">
                <Card
                  sx={{
                    px: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      background: theme.palette.grey[300]
                    }
                  }}
                >
                  <CardContent>
                    <AvatarWrapperError>
                      <RequestQuoteIcon />
                    </AvatarWrapperError>
                    <Box
                      sx={{
                        pt: 3
                      }}
                    >
                      <Typography variant="h3" gutterBottom noWrap>
                        Ingresos
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </NextLink>
            </Grid>
          )}
        </Grid>
      </Container>
      <Footer />
    </>
  );
}
Reportes.getLayout = (page) => <SidebarLayout>{page}</SidebarLayout>;
export async function getServerSideProps({ req, resolvedUrl }) {
  let props = await validateServerSideSession(getSession, req, resolvedUrl);
  return props;
}
export default Reportes;
