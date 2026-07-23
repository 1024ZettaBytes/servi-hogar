import Head from 'next/head';
import { getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import SidebarLayout from '@/layouts/SidebarLayout';
import { validateServerSideSession } from '../../lib/auth';
import PageHeader from '@/components/PageHeader';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import {
  Container,
  Grid,
  Card,
  CardHeader,
  Divider,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import Footer from '@/components/Footer';
import NextBreadcrumbs from '@/components/Shared/BreadCrums';
import { getFetcher, useGetExternalRepairs } from '../../pages/api/useRequest';

export const EXTERNAL_REPAIR_STATUS_LABELS = {
  RECOLECCION_AGENDADA: { label: 'Recolección agendada', color: 'secondary' },
  RECOLECTADA: { label: 'Recolectada (en vehículo)', color: 'info' },
  POR_EVALUAR: { label: 'Por evaluar', color: 'info' },
  ESPERANDO_AUTORIZACION: {
    label: 'Esperando autorización de presupuesto',
    color: 'warning'
  },
  AUTORIZADA: { label: 'Autorizada — reparar', color: 'primary' },
  NO_AUTORIZADA: { label: 'No autorizada — devolver', color: 'error' },
  REPARADA: { label: 'Reparada', color: 'success' },
  ENTREGADA: { label: 'Entregada', color: 'success' },
  DEVUELTA: { label: 'Devuelta', color: 'default' },
  CANCELADA: { label: 'Cancelada', color: 'default' }
};

function daysSince(date) {
  if (!date) return 0;
  const diff = Date.now() - new Date(date).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function ReparacionesExternas({ session }) {
  const paths = ['Inicio', 'Reparaciones Externas'];
  const router = useRouter();
  const {
    externalRepairsList,
    externalRepairsReminders,
    externalRepairsOverdueReturns,
    isLoadingExternalRepairs
  } = useGetExternalRepairs(getFetcher);
  const {
    externalRepairsList: finalizedList,
    isLoadingExternalRepairs: isLoadingFinalized
  } = useGetExternalRepairs(getFetcher, false);

  // Only office (AUX/ADMIN) schedules external-repair pickups.
  const canRegister = ['ADMIN', 'AUX'].includes(session?.user?.role);
  const list = externalRepairsList || [];
  const finalized = finalizedList || [];
  const reminders = externalRepairsReminders || [];
  const overdueReturns = externalRepairsOverdueReturns || [];

  const renderRepairRow = (r) => {
    const status = EXTERNAL_REPAIR_STATUS_LABELS[r.status] || {
      label: r.status,
      color: 'default'
    };
    return (
      <TableRow hover key={r._id}>
        <TableCell>#{r.totalNumber}</TableCell>
        <TableCell>{r.customerName}</TableCell>
        <TableCell>{r.brand}</TableCell>
        <TableCell>{r.takenBy?.name || '—'}</TableCell>
        <TableCell>
          <Chip size="small" label={status.label} color={status.color as any} />
        </TableCell>
        <TableCell align="center">{daysSince(r.createdAt)}</TableCell>
        <TableCell align="right">
          <Button
            size="small"
            onClick={() => router.push(`/reparaciones-externas/${r._id}`)}
          >
            Ver
          </Button>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <>
      <Head>
        <title>Reparaciones Externas</title>
      </Head>
      <PageTitleWrapper>
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid item>
            <PageHeader
              title={'Reparaciones Externas'}
              sutitle={'Reparaciones de lavadoras de clientes externos'}
            />
          </Grid>
          {canRegister && (
            <Grid item>
              <Button
                variant="contained"
                onClick={() => router.push('/reparaciones-externas/registrar')}
              >
                Agendar recolección
              </Button>
            </Grid>
          )}
        </Grid>
        <NextBreadcrumbs paths={paths} lastLoaded={true} />
      </PageTitleWrapper>

      <Container maxWidth="lg">
        <Grid container spacing={3}>
          {reminders.length > 0 && (
            <Grid item xs={12}>
              <Alert severity="warning">
                Seguimiento de presupuesto pendiente con el cliente (
                {reminders.length}):{' '}
                {reminders
                  .map((r) => `#${r.totalNumber} ${r.customerName}`)
                  .join(', ')}
                . Autorice o rechace el presupuesto.
              </Alert>
            </Grid>
          )}
          {overdueReturns.length > 0 && (
            <Grid item xs={12}>
              <Alert severity="error">
                Devolución vencida ({overdueReturns.length}):{' '}
                {overdueReturns
                  .map((r) => `#${r.totalNumber} ${r.customerName}`)
                  .join(', ')}
                . Exija la entrega inmediata al chofer para evitar el bloqueo de
                oficina.
              </Alert>
            </Grid>
          )}
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Reparaciones activas" />
              <Divider />
              {isLoadingExternalRepairs ? (
                <Box display="flex" justifyContent="center" py={5}>
                  <CircularProgress />
                </Box>
              ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Folio</TableCell>
                      <TableCell>Cliente</TableCell>
                      <TableCell>Marca</TableCell>
                      <TableCell>Técnico</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell align="center">Días</TableCell>
                      <TableCell align="right">Acción</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>{list.map(renderRepairRow)}</TableBody>
                </Table>
              </TableContainer>
              )}
              {!isLoadingExternalRepairs && list.length === 0 && (
                <Box p={3}>
                  <Typography align="center" color="text.secondary">
                    No hay reparaciones externas activas.
                  </Typography>
                </Box>
              )}
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardHeader title="Reparaciones finalizadas" />
              <Divider />
              {isLoadingFinalized ? (
                <Box display="flex" justifyContent="center" py={5}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Folio</TableCell>
                        <TableCell>Cliente</TableCell>
                        <TableCell>Marca</TableCell>
                        <TableCell>Técnico</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell align="center">Días</TableCell>
                        <TableCell align="right">Acción</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>{finalized.map(renderRepairRow)}</TableBody>
                  </Table>
                </TableContainer>
              )}
              {!isLoadingFinalized && finalized.length === 0 && (
                <Box p={3}>
                  <Typography align="center" color="text.secondary">
                    No hay reparaciones externas finalizadas.
                  </Typography>
                </Box>
              )}
            </Card>
          </Grid>
        </Grid>
      </Container>
      <Footer />
    </>
  );
}

ReparacionesExternas.getLayout = (page) => <SidebarLayout>{page}</SidebarLayout>;

export async function getServerSideProps({ req, resolvedUrl }) {
  let props = await validateServerSideSession(getSession, req, resolvedUrl);
  return props;
}

export default ReparacionesExternas;
