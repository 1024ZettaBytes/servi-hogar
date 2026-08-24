import { useState } from 'react';
import { useRouter } from 'next/router';
import {
  Card,
  CardHeader,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Box,
  CircularProgress,
  IconButton,
  Tooltip,
  Typography
} from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useSnackbar } from 'notistack';
import ReassignVueltaModal from '@/components/ReassignVueltaModal';
import ScheduleTimePicker from '@/components/ScheduleTimePicker';
import { formatTZDate } from 'lib/client/utils';
import { getFetcher, useGetExternalRepairs } from '../../pages/api/useRequest';

// Build the operator's external-repair "vueltas" (pickups + deliveries/returns)
// from the external repairs list, split into pending (por realizar) and completed
// (realizadas). Completed trips carry the timestamp they were finished at.
export function buildVueltas(list) {
  const pending = [];
  const completed = [];
  for (const r of list || []) {
    // --- Pickup (recolección) ---
    if (r.status === 'RECOLECCION_AGENDADA') {
      pending.push({
        _id: r._id,
        type: 'RECOLECCION_EXTERNA',
        label: 'Recolección',
        color: 'secondary',
        totalNumber: r.totalNumber,
        customerName: r.customerName,
        operator: r.pickupAssignedTo,
        scheduledTime: r.scheduledTime
      });
    } else if (r.pickupCompletedAt) {
      completed.push({
        _id: r._id,
        type: 'RECOLECCION_EXTERNA',
        label: 'Recolección',
        color: 'secondary',
        totalNumber: r.totalNumber,
        customerName: r.customerName,
        operator: r.pickupAssignedTo,
        completedAt: r.pickupCompletedAt
      });
    }

    // --- Delivery / return (entrega / devolución) ---
    const isDeliverablePending =
      (r.status === 'REPARADA' || r.status === 'NO_AUTORIZADA') &&
      r.deliveryAssignedTo &&
      !r.deliveredAt;
    if (isDeliverablePending) {
      pending.push({
        _id: r._id,
        type: 'ENTREGA_EXTERNA',
        label: r.status === 'NO_AUTORIZADA' ? 'Devolución' : 'Entrega',
        color: r.status === 'NO_AUTORIZADA' ? 'error' : 'primary',
        totalNumber: r.totalNumber,
        customerName: r.customerName,
        operator: r.deliveryAssignedTo,
        scheduledTime: r.scheduledTime
      });
    } else if (r.deliveredAt) {
      completed.push({
        _id: r._id,
        type: 'ENTREGA_EXTERNA',
        label: r.status === 'DEVUELTA' ? 'Devolución' : 'Entrega',
        color: r.status === 'DEVUELTA' ? 'error' : 'primary',
        totalNumber: r.totalNumber,
        customerName: r.customerName,
        operator: r.deliveryAssignedTo,
        completedAt: r.deliveredAt
      });
    }
  }
  return { pending, completed };
}

function VueltasTable({ vueltas, canReassign, onReassign, onSchedule, showDate = false }) {
  const router = useRouter();
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Tipo</TableCell>
            <TableCell>Folio</TableCell>
            <TableCell>Cliente</TableCell>
            <TableCell>Operador</TableCell>
            {!showDate && <TableCell>Programada</TableCell>}
            {showDate && <TableCell>Fecha</TableCell>}
            <TableCell align="right">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {vueltas.map((v) => (
            <TableRow hover key={`${v.type}-${v._id}`}>
              <TableCell>
                <Chip size="small" label={v.label} color={v.color as any} />
              </TableCell>
              <TableCell>#{v.totalNumber}</TableCell>
              <TableCell>{v.customerName}</TableCell>
              <TableCell>{v.operator?.name || '—'}</TableCell>
              {!showDate && (
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1" fontWeight="bold">
                      {v.scheduledTime
                        ? formatTZDate(new Date(v.scheduledTime), 'HH:mm')
                        : 'Sin programar'}
                    </Typography>
                    <Tooltip
                      title={
                        !v.operator
                          ? 'Asigna un operador primero'
                          : v.scheduledTime
                          ? 'Cambiar hora'
                          : 'Programar hora'
                      }
                      arrow
                    >
                      <span>
                        <IconButton
                          size="small"
                          color="secondary"
                          disabled={!v.operator}
                          onClick={() => onSchedule(v)}
                        >
                          <AccessTimeIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                </TableCell>
              )}
              {showDate && (
                <TableCell>
                  {v.completedAt
                    ? formatTZDate(v.completedAt, 'DD/MM/YYYY HH:mm')
                    : '—'}
                </TableCell>
              )}
              <TableCell align="right">
                <Button
                  size="small"
                  onClick={() => router.push(`/reparaciones-externas/${v._id}`)}
                >
                  Ver
                </Button>
                {canReassign && !showDate && (
                  <Button
                    size="small"
                    startIcon={<SwapHorizIcon />}
                    onClick={() => onReassign(v)}
                  >
                    Reasignar
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function TablaVueltasReparacionExterna({ userRole, selectedDate }) {
  const { enqueueSnackbar } = useSnackbar();
  const { externalRepairsList, isLoadingExternalRepairs } =
    useGetExternalRepairs(getFetcher);
  const {
    externalRepairsList: finalizedList,
    isLoadingExternalRepairs: isLoadingFinalized
  } = useGetExternalRepairs(getFetcher, false);
  const [reassignTask, setReassignTask] = useState<any>(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [taskToSchedule, setTaskToSchedule] = useState<any>(null);

  const canReassign = ['ADMIN', 'AUX'].includes(userRole);

  if (isLoadingExternalRepairs || isLoadingFinalized) {
    return (
      <Card>
        <CardHeader title="Vueltas de reparación externa" />
        <Divider />
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      </Card>
    );
  }

  // Both pending (non-terminal) and finalized (terminal) repairs contribute
  // completed trips (e.g. a picked-up machine still in evaluation, or an already
  // delivered one).
  const { pending, completed } = buildVueltas([
    ...(externalRepairsList || []),
    ...(finalizedList || [])
  ]);

  // Only show completed trips finished on the selected day.
  const dayKey = selectedDate
    ? formatTZDate(selectedDate, 'YYYY-MM-DD')
    : null;
  const completedForDay = dayKey
    ? completed.filter((v) => formatTZDate(v.completedAt, 'YYYY-MM-DD') === dayKey)
    : completed;

  if (pending.length === 0 && completedForDay.length === 0) return null;

  const handleCloseReassign = (saved, msg) => {
    setReassignTask(null);
    if (saved) {
      enqueueSnackbar(msg || 'Vuelta reasignada', {
        variant: 'success',
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
        autoHideDuration: 3000
      });
    }
  };

  const onReassign = (v) =>
    setReassignTask({
      _id: v._id,
      type: v.type,
      destination: v.customerName,
      operator: v.operator
    });

  const onSchedule = (v) => {
    setTaskToSchedule(v);
    setScheduleModalOpen(true);
  };

  return (
    <>
      {pending.length > 0 && (
        <Card sx={{ mb: 4 }}>
          <CardHeader title="Vueltas de reparación externa por realizar" />
          <Divider />
          <VueltasTable
            vueltas={pending}
            canReassign={canReassign}
            onReassign={onReassign}
            onSchedule={onSchedule}
          />
        </Card>
      )}

      {completedForDay.length > 0 && (
        <Card sx={{ mb: 4 }}>
          <CardHeader title="Vueltas de reparación externa realizadas" />
          <Divider />
          <VueltasTable
            vueltas={completedForDay}
            canReassign={false}
            onReassign={onReassign}
            onSchedule={onSchedule}
            showDate
          />
        </Card>
      )}

      {reassignTask && (
        <ReassignVueltaModal
          open={!!reassignTask}
          task={reassignTask}
          handleOnClose={handleCloseReassign}
        />
      )}

      {scheduleModalOpen && taskToSchedule && (
        <ScheduleTimePicker
          open={scheduleModalOpen}
          onClose={() => {
            setScheduleModalOpen(false);
            setTaskToSchedule(null);
          }}
          taskId={taskToSchedule._id}
          taskType={taskToSchedule.type}
          operatorId={taskToSchedule.operator?._id || null}
          operatorName={taskToSchedule.operator?.name || null}
          currentScheduledTime={taskToSchedule.scheduledTime}
          onScheduleSaved={() => {
            enqueueSnackbar('Hora programada correctamente', {
              variant: 'success',
              anchorOrigin: { vertical: 'top', horizontal: 'center' },
              autoHideDuration: 2000
            });
          }}
          selectedDate={selectedDate || new Date()}
        />
      )}
    </>
  );
}

export default TablaVueltasReparacionExterna;

