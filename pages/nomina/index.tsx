import { useState } from 'react';
import Head from 'next/head';
import { getSession } from 'next-auth/react';
import SidebarLayout from '@/layouts/SidebarLayout';
import { validateServerSideSession } from '../../lib/auth';
import PayrollCard from '@/components/PayrollCard';
import PaymentsProgressCard from '@/components/PaymentsProgressCard';
import {
  Container,
  Grid,
  Box,
  IconButton,
  Button,
  Typography
} from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import Footer from '@/components/Footer';
import { format } from 'date-fns';
import {
  formatTZDate,
  getFirstWeekDay,
  getLastWeekDay,
  addDaysToDate
} from '../../lib/client/utils';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import PageHeader from '@/components/PageHeader';

function Payroll({ session }) {
  const { user } = session;
  const userRole = user?.role;
  const showPayrollCard = ['AUX', 'ADMIN'].includes(userRole);

  // Shared week state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [collectionBonus, setCollectionBonus] = useState(0);

  const weekStart = getFirstWeekDay(selectedDate);
  const weekEnd = getLastWeekDay(selectedDate);
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');

  const currentWeekStart = getFirstWeekDay(new Date());
  const isCurrentWeek =
    format(weekStart, 'yyyy-MM-dd') === format(currentWeekStart, 'yyyy-MM-dd');

  const goToPreviousWeek = () =>
    setSelectedDate(addDaysToDate(selectedDate, -7));
  const goToNextWeek = () => setSelectedDate(addDaysToDate(selectedDate, 7));
  const goToCurrentWeek = () => setSelectedDate(new Date());

  return (
    <>
      <>
        <Head>
          <title>Servi Hogar | Nómina</title>
        </Head>
        <PageTitleWrapper>
          <PageHeader
            title={'Nómina Semanal | Oficina'}
          />
        </PageTitleWrapper>
        {showPayrollCard && (
          <Container maxWidth="lg" sx={{ mb: 3 }}>
            {/* Week Selector */}
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              gap={1}
              mt={3}
              mb={2}
            >
              <IconButton onClick={goToPreviousWeek}>
                <NavigateBeforeIcon />
              </IconButton>
              <Typography variant="h5" fontWeight="bold">
                {formatTZDate(weekStart, 'ddd DD MMM')} -{' '}
                {formatTZDate(weekEnd, 'ddd DD MMM YYYY')}
              </Typography>
              <IconButton onClick={goToNextWeek}>
                <NavigateNextIcon />
              </IconButton>
              {!isCurrentWeek && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={goToCurrentWeek}
                >
                  Semana actual
                </Button>
              )}
            </Box>

            <Grid container spacing={3}>
              {/* Payments Progress Card */}
              <Grid item xs={12}>
                <PaymentsProgressCard
                  weekStartStr={weekStartStr}
                  onBonusChange={setCollectionBonus}
                />
              </Grid>

              {/* Payroll Card */}
              <Grid item xs={12} lg={8}>
                <PayrollCard
                  userRole={userRole}
                  currentUserId={user?.id}
                  weekStartStr={weekStartStr}
                  collectionBonus={collectionBonus}
                />
              </Grid>
            </Grid>
          </Container>
        )}
      </>
      <Footer />
    </>
  );
}

Payroll.getLayout = (page) => <SidebarLayout>{page}</SidebarLayout>;
export async function getServerSideProps({ req, resolvedUrl }) {
  return await validateServerSideSession(getSession, req, resolvedUrl);
}
export default Payroll;
