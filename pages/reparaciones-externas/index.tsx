import Head from 'next/head';
import { getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useState } from 'react';
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
  CircularProgress,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { useSnackbar } from 'notistack';
import Footer from '@/components/Footer';
import NextBreadcrumbs from '@/components/Shared/BreadCrums';
import { getFetcher, useGetExternalRepairs, useGetUsers } from '../../pages/api/useRequest';
import { reassignExternalRepairTechnician } from '../../lib/client/externalRepairsFetch';

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

const TERMINAL_STATUSES = ['ENTREGADA', 'DEVUELTA', 'CANCELADA'];

function ReparacionesExternas({ session }) {
  const paths = ['Inicio', 'Reparaciones Externas'];
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
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

  // Only office (AUX/ADMIN) schedules external-repair pickups and reassigns technicians.
  const canRegister = ['ADMIN', 'AUX'].includes(session?.user?.role);
  const { userList: technicianList } = useGetUsers(
    canRegister ? getFetcher : null,
    'TEC'
  );
  const activeTechnicians = (technicianList || []).filter((t) => t.isActive);

  const [reassignRepair, setReassignRepair] = useState<any>(null);
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [isReassigning, setIsReassigning] = useState(false);

  const list = externalRepairsList || [];
  const finalized = finalizedList || [];
  const reminders = externalRepairsReminders || [];
  const overdueReturns = externalRepairsOverdueReturns || [];

  const handleOpenReassign = (r) => {
    setReassignRepair(r);
    setSelectedTechnician(r.takenBy?._id || r.assignedTechnician?._id || '');
  };

  const handleCloseReassign = () => {
    setReassignRepair(null);
    setSelectedTechnician('');
  };

  const handleSubmitReassign = async () => {
    if (!reassignRepair || !selectedTechnician) return;
    setIsReassigning(true);
    const result = await reassignExternalRepairTechnician(
      reassignRepair._id,
      selectedTechnician
    );
    setIsReassigning(false);
    if (!result.error) {
      enqueueSnackbar(result.msg, { variant: 'success' });
      handleCloseReassign();
    } else {
      enqueueSnackbar(result.msg, { variant: 'error' });
    }
  };

  const renderRepairRow = (r) => {
    const status = EXTERNAL_REPAIR_STATUS_LABELS[r.status] || {
      label: r.status,
      color: 'default'
    };
    const canReassign = canRegister && !TERMINAL_STATUSES.includes(r.status);
    return (
      <TableRow hover key={r._id}>
        <TableCell>#{r.totalNumber}</TableCell>
        <TableCell>{r.customerName}</TableCell>
        <TableCell>{r.brand}</TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" noWrap>
              {r.takenBy?.name || r.assignedTechnician?.name || '—'}
            </Typography>
            {canReassign && (
              <Tooltip title="Cambiar técnico" arrow>
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => handleOpenReassign(r)}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </TableCell>
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

      {reassignRepair && (
        <Dialog
          open={!!reassignRepair}
          onClose={handleCloseReassign}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Cambiar técnico asignado</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 1 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Reparación externa <strong>#{reassignRepair.totalNumber}</strong> —{' '}
                {reassignRepair.customerName}
              </Alert>
              <FormControl fullWidth required>
                <InputLabel>Técnico</InputLabel>
                <Select
                  value={selectedTechnician}
                  label="Técnico"
                  onChange={(e) => setSelectedTechnician(e.target.value as string)}
                >
                  {activeTechnicians.map((tec) => (
                    <MenuItem key={tec._id} value={tec._id}>
                      {tec.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseReassign} disabled={isReassigning}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmitReassign}
              disabled={!selectedTechnician || isReassigning}
              startIcon={isReassigning ? <CircularProgress size={20} /> : null}
            >
              {isReassigning ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
}

ReparacionesExternas.getLayout = (page) => <SidebarLayout>{page}</SidebarLayout>;

export async function getServerSideProps({ req, resolvedUrl }) {
  let props = await validateServerSideSession(getSession, req, resolvedUrl);
  return props;
}

export default ReparacionesExternas;
