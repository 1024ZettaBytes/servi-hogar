import { FC, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Typography,
  Chip,
  Button,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CompleteExtraTripModal from '@/components/CompleteExtraTripModal';
import AssignExtraTripOperatorModal from '@/components/AssignExtraTripOperatorModal';
import ScheduleTimePicker from '@/components/ScheduleTimePicker';
import { cancelExtraTrip } from '../../lib/client/extraTripsFetch';
import { formatTZDate } from 'lib/client/utils';
import { useSnackbar } from 'notistack';

interface TablaVueltasExtrasProps {
  className?: string;
  extraTripsList: any[];
  userRole: string;
  showCompleted: boolean;
  isBlocked?: boolean;
  selectedDate?: Date;
  onRefresh?: () => void;
}

const TablaVueltasExtras: FC<TablaVueltasExtrasProps> = ({
  extraTripsList,
  userRole,
  showCompleted,
  isBlocked = false,
  selectedDate = new Date(),
  onRefresh = () => {}
}) => {
  const [extraTripModalOpen, setExtraTripModalOpen] = useState(false);
  const [tripToComplete, setTripToComplete] = useState<any>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [tripToAssign, setTripToAssign] = useState<any>(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [tripToSchedule, setTripToSchedule] = useState<any>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [tripToCancel, setTripToCancel] = useState<any>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const isAdminOrAux = userRole === 'ADMIN' || userRole === 'AUX';
  const isOperator = userRole === 'OPE';

  const handleCompleteExtraTrip = (trip: any) => {
    setTripToComplete(trip);
    setExtraTripModalOpen(true);
  };

  const handleAssignOperator = (trip: any) => {
    setTripToAssign(trip);
    setAssignModalOpen(true);
  };

  const handleScheduleTrip = (trip: any) => {
    setTripToSchedule(trip);
    setScheduleModalOpen(true);
  };

  const handleCancelTrip = (trip: any) => {
    setTripToCancel(trip);
    setCancelModalOpen(true);
  };

  const confirmCancelTrip = async () => {
    if (!tripToCancel) return;
    
    setIsCancelling(true);
    try {
      const result = await cancelExtraTrip(tripToCancel._id);
      if (!result.error) {
        enqueueSnackbar(result.msg || 'Vuelta extra cancelada', {
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'center' },
          autoHideDuration: 2000
        });
        onRefresh();
      } else {
        enqueueSnackbar(result.msg || 'Error al cancelar', {
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'center' },
          autoHideDuration: 3000
        });
      }
    } catch (error) {
      enqueueSnackbar('Error al cancelar la vuelta extra', {
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
        autoHideDuration: 3000
      });
    } finally {
      setIsCancelling(false);
      setCancelModalOpen(false);
      setTripToCancel(null);
    }
  };

  // Calculate column count for empty state
  const getColumnCount = () => {
    let count = 4; // #, Destino, Motivo, Programada/Completada
    if (isAdminOrAux) count++; // Operador
    if (showCompleted) count++; // Estado
    if (!showCompleted) count++; // Acciones
    return count;
  };

  return (
    <Card>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Destino</TableCell>
              <TableCell>Motivo</TableCell>
              {isAdminOrAux && <TableCell>Operador</TableCell>}
              <TableCell>{showCompleted ? 'Completada' : 'Programada'}</TableCell>
              {showCompleted && <TableCell>Estado</TableCell>}
              {!showCompleted && <TableCell align="center">Acciones</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {extraTripsList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={getColumnCount()} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No hay vueltas extras {showCompleted ? 'completadas' : 'pendientes'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              extraTripsList.map((trip) => (
                <TableRow 
                  hover 
                  key={trip._id}
                  sx={{
                    opacity: trip.status === 'CANCELADA' ? 0.6 : 1,
                    bgcolor: trip.status === 'CANCELADA' ? 'action.hover' : 'inherit'
                  }}
                >
                  <TableCell>
                    <Chip
                      label={trip.tripNumber || '-'}
                      color={trip.status === 'CANCELADA' ? 'default' : 'primary'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body1"
                      fontWeight="bold"
                      color="text.primary"
                    >
                      {trip.destination || 'Sin destino'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        variant="body1"
                        color="text.primary"
                      >
                        {trip.reason || 'Sin motivo'}
                      </Typography>
                      {trip.notes && (
                        <Tooltip title={`Notas: ${trip.notes}`} arrow>
                          <InfoOutlinedIcon
                            fontSize="small"
                            color="info"
                            sx={{ cursor: 'help' }}
                          />
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  {isAdminOrAux && (
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" fontWeight="bold">
                          {trip.assignedTo?.name || 'Sin asignar'}
                        </Typography>
                        {!showCompleted && (
                          <Tooltip title={trip.assignedTo ? 'Cambiar operador' : 'Asignar operador'} arrow>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleAssignOperator(trip)}
                            >
                              <PersonAddIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  )}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1" fontWeight="bold">
                        {showCompleted
                          ? (trip.completedAt || trip.updatedAt
                              ? formatTZDate(new Date(trip.completedAt || trip.updatedAt), 'HH:mm')
                              : 'N/A')
                          : (trip.scheduledTime
                              ? formatTZDate(new Date(trip.scheduledTime), 'HH:mm')
                              : 'Sin programar')
                        }
                      </Typography>
                      {!showCompleted  && (
                        <Tooltip title={trip.scheduledTime ? 'Cambiar hora' : 'Programar hora'} arrow>
                          <IconButton
                            size="small"
                            color="secondary"
                            onClick={() => handleScheduleTrip(trip)}
                          >
                            <AccessTimeIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  {showCompleted && (
                    <TableCell>
                      <Chip
                        label={trip.status === 'CANCELADA' ? 'Cancelada' : 'Completada'}
                        color={trip.status === 'CANCELADA' ? 'error' : 'success'}
                        size="small"
                        variant={trip.status === 'CANCELADA' ? 'outlined' : 'filled'}
                      />
                    </TableCell>
                  )}
                  {!showCompleted && (
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        {(userRole === 'ADMIN' || isOperator) && !isBlocked && (
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            startIcon={<CheckCircleIcon />}
                            onClick={() => handleCompleteExtraTrip(trip)}
                          >
                            Completar
                          </Button>
                        )}
                        {isAdminOrAux && (
                          <Tooltip title="Cancelar vuelta" arrow>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleCancelTrip(trip)}
                            >
                              <CancelIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {isOperator && isBlocked && (
                          <Typography variant="body2" color="error">
                            Bloqueado
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Complete Extra Trip Modal */}
      {tripToComplete && extraTripModalOpen && (
        <CompleteExtraTripModal
          open={extraTripModalOpen}
          trip={tripToComplete}
          handleOnClose={(success, msg) => {
            setExtraTripModalOpen(false);
            setTripToComplete(null);
            if (success) {
              enqueueSnackbar(msg || 'Vuelta extra completada', {
                variant: 'success',
                anchorOrigin: { vertical: 'top', horizontal: 'center' },
                autoHideDuration: 2000
              });
              onRefresh();
            }
          }}
        />
      )}

      {/* Assign Operator Modal */}
      {tripToAssign && (
        <AssignExtraTripOperatorModal
          open={assignModalOpen}
          trip={tripToAssign}
          handleOnClose={(success, msg) => {
            setAssignModalOpen(false);
            setTripToAssign(null);
            if (success) {
              enqueueSnackbar(msg || 'Operador asignado correctamente', {
                variant: 'success',
                anchorOrigin: { vertical: 'top', horizontal: 'center' },
                autoHideDuration: 2000
              });
              onRefresh();
            }
          }}
        />
      )}

      {/* Schedule Trip Modal */}
      {scheduleModalOpen && tripToSchedule && (
        <ScheduleTimePicker
          open={scheduleModalOpen}
          onClose={() => {
            setScheduleModalOpen(false);
            setTripToSchedule(null);
          }}
          taskId={tripToSchedule._id}
          taskType="VUELTA_EXTRA"
          currentScheduledTime={tripToSchedule.scheduledTime}
          onScheduleSaved={() => {
            enqueueSnackbar('Hora programada correctamente', {
              variant: 'success',
              anchorOrigin: { vertical: 'top', horizontal: 'center' },
              autoHideDuration: 2000
            });
            onRefresh();
          }}
          selectedDate={selectedDate}
        />
      )}

      {/* Cancel Confirmation Modal */}
      <Dialog
        open={cancelModalOpen}
        onClose={() => {
          setCancelModalOpen(false);
          setTripToCancel(null);
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Cancelar Vuelta Extra</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas cancelar la vuelta extra{' '}
            <strong>#{tripToCancel?.tripNumber}</strong> a{' '}
            <strong>{tripToCancel?.destination}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setCancelModalOpen(false);
              setTripToCancel(null);
            }}
            color="inherit"
          >
            No, mantener
          </Button>
          <Button
            onClick={confirmCancelTrip}
            color="error"
            variant="contained"
            disabled={isCancelling}
          >
            {isCancelling ? 'Cancelando...' : 'Sí, cancelar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

TablaVueltasExtras.propTypes = {
  extraTripsList: PropTypes.array.isRequired,
  userRole: PropTypes.string.isRequired,
  showCompleted: PropTypes.bool.isRequired,
  isBlocked: PropTypes.bool,
  selectedDate: PropTypes.instanceOf(Date)
};

TablaVueltasExtras.defaultProps = {
  extraTripsList: [],
  isBlocked: false,
  selectedDate: new Date()
};

export default TablaVueltasExtras;
