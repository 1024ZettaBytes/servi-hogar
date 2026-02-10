import { FC, useState } from 'react';
import { useGetScheduledSlots, getFetcher } from '../../../pages/api/useRequest';
import { updateTaskScheduledTime } from '../../../lib/client/tasksFetch';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  FormControlLabel,
  Switch,
  TextField,
  alpha,
  useTheme,
  IconButton
} from '@mui/material';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { format, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface ScheduleTimePickerProps {
  open: boolean;
  onClose: () => void;
  taskId: string;
  taskType: string;
  currentScheduledTime: Date | null;
  onScheduleSaved: () => void;
  selectedDate: Date;
}

interface TimeSlot {
  time: Date;
  label: string;
  isOccupied: boolean;
  occupiedBy?: {
    taskId: string;
    taskType: string;
    customerName: string;
    sector: string;
  };
  isCurrent: boolean;
}

const ScheduleTimePicker: FC<ScheduleTimePickerProps> = ({
  open,
  onClose,
  taskId,
  taskType,
  currentScheduledTime,
  onScheduleSaved,
  selectedDate
}) => {
  const [internalDate, setInternalDate] = useState<Date>(selectedDate);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [showConfirmReplace, setShowConfirmReplace] = useState(false);

  // Generate time slots from 07:00 to 20:00 (30-minute intervals)
  const generateTimeSlots = (scheduledSlots: any[]): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const baseDate = new Date(internalDate);
    baseDate.setHours(7, 0, 0, 0);

    for (let i = 0; i < 26; i++) {
      const slotTime = new Date(baseDate);
      slotTime.setMinutes(baseDate.getMinutes() + i * 30);

      // Compare times by matching year, month, day, hour, and minute
      const occupiedSlot = scheduledSlots.find((s) => {
        const scheduledDate = new Date(s.scheduledTime);
        const matches = 
          scheduledDate.getFullYear() === slotTime.getFullYear() &&
          scheduledDate.getMonth() === slotTime.getMonth() &&
          scheduledDate.getDate() === slotTime.getDate() &&
          scheduledDate.getHours() === slotTime.getHours() &&
          scheduledDate.getMinutes() === slotTime.getMinutes();
        
        return matches;
      });

      const isCurrent =
        currentScheduledTime &&
        (() => {
          const currentDate = new Date(currentScheduledTime);
          return (
            currentDate.getFullYear() === slotTime.getFullYear() &&
            currentDate.getMonth() === slotTime.getMonth() &&
            currentDate.getDate() === slotTime.getDate() &&
            currentDate.getHours() === slotTime.getHours() &&
            currentDate.getMinutes() === slotTime.getMinutes()
          );
        })();

      slots.push({
        time: slotTime,
        label: format(slotTime, 'HH:mm', { locale: es }),
        isOccupied: !!occupiedSlot && occupiedSlot.taskId !== taskId,
        occupiedBy:
          occupiedSlot && occupiedSlot.taskId !== taskId
            ? {
                taskId: occupiedSlot.taskId,
                taskType: occupiedSlot.taskType,
                customerName: occupiedSlot.customerName,
                sector: occupiedSlot.sector || ''
              }
            : undefined,
        isCurrent
      });
    }

    return slots;
  };

  const dateStr = format(internalDate, 'yyyy-MM-dd');
  const { scheduledSlotsData, isLoadingScheduledSlots } = useGetScheduledSlots(
    getFetcher,
    open ? dateStr : null
  );

  const timeSlots = generateTimeSlots(scheduledSlotsData || []);
  const loading = isLoadingScheduledSlots;

  const handleSlotClick = (slot: TimeSlot) => {
    if (slot.isOccupied) {
      setSelectedSlot(slot);
      setShowConfirmReplace(true);
    } else {
      setSelectedSlot(slot);
    }
  };

  const handleSave = async (confirmReplace: boolean = false) => {
    if (!selectedSlot) return;

    if (selectedSlot.isOccupied && !confirmReplace) {
      setShowConfirmReplace(true);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const result = await updateTaskScheduledTime(
        taskId,
        taskType,
        selectedSlot.time.toISOString()
      );

      if (result.error) {
        setError(result.msg);
      } else {
        onScheduleSaved();
        onClose();
      }
    } catch (err) {
      console.error('Error saving schedule:', err);
      setError('Error al guardar la hora programada');
    } finally {
      setSaving(false);
      setShowConfirmReplace(false);
    }
  };

  const handleRemoveSchedule = async () => {
    setSaving(true);
    setError(null);

    try {
      const result = await updateTaskScheduledTime(taskId, taskType, null);

      if (result.error) {
        setError(result.msg);
      } else {
        onScheduleSaved();
        onClose();
      }
    } catch (err) {
      console.error('Error removing schedule:', err);
      setError('Error al quitar la hora programada');
    } finally {
      setSaving(false);
    }
  };

  const getTypeColor = (type: string): 'primary' | 'warning' | 'error' | 'info' | 'success' | 'secondary' => {
    switch (type) {
      case 'ENTREGA':
        return 'primary';
      case 'CAMBIO':
        return 'warning';
      case 'RECOLECCION':
        return 'error';
      case 'RECOLECCION_VENTA':
        return 'error';
      case 'COBRANZA':
        return 'info';
      case 'VUELTA_EXTRA':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getTypeBgColor = (type: string, theme: any) => {
    switch (type) {
      case 'ENTREGA':
        return alpha(theme.palette.primary.main, 0.15);
      case 'CAMBIO':
        return alpha(theme.palette.warning.main, 0.15);
      case 'RECOLECCION':
        return alpha(theme.palette.error.main, 0.15);
      case 'RECOLECCION_VENTA':
        return alpha(theme.palette.error.main, 0.15);
      case 'COBRANZA':
        return alpha(theme.palette.info.main, 0.15);
      case 'VUELTA_EXTRA':
        return alpha(theme.palette.secondary.main, 0.15);
      default:
        return alpha(theme.palette.grey[500], 0.15);
    }
  };

  const theme = useTheme();

  const filteredSlots = showOnlyAvailable
    ? timeSlots.filter((slot) => !slot.isOccupied || slot.isCurrent)
    : timeSlots;

  const handlePrevDay = () => {
    setInternalDate(subDays(internalDate, 1));
  };

  const handleNextDay = () => {
    setInternalDate(addDays(internalDate, 1));
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <AccessTimeIcon color="primary" />
            <Typography variant="h6">Programar Hora</Typography>
          </Box>
          
          {/* Date Navigation */}
          <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
            <IconButton onClick={handlePrevDay} size="small">
              <NavigateBeforeIcon />
            </IconButton>
            
            <LocalizationProvider dateAdapter={AdapterDateFns} locale={es}>
              <DesktopDatePicker
                label="Fecha"
                inputFormat="dd/MM/yyyy"
                value={internalDate}
                onChange={(newDate) => newDate && setInternalDate(newDate)}
                renderInput={(params) => (
                  <TextField {...params} size="small" sx={{ width: 160 }} />
                )}
              />
            </LocalizationProvider>
            
            <IconButton onClick={handleNextDay} size="small">
              <NavigateNextIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ px: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box mb={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={showOnlyAvailable}
                  onChange={(e) => setShowOnlyAvailable(e.target.checked)}
                  size="small"
                />
              }
              label={<Typography variant="body2">Solo disponibles</Typography>}
            />
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Box
              sx={{
                position: 'relative',
                maxHeight: 400,
                overflowY: 'auto',
                pr: 1
              }}
            >
              {/* Timeline Container */}
              <Box sx={{ position: 'relative', ml: 1 }}>
                {/* Vertical Line */}
                <Box
                  sx={{
                    position: 'absolute',
                    left: 24,
                    top: 12,
                    bottom: 12,
                    width: 3,
                    bgcolor: alpha(theme.palette.primary.main, 0.2),
                    borderRadius: 1
                  }}
                />

                {/* Timeline Items */}
                {filteredSlots.map((slot, index) => {
                  const isSelected = selectedSlot?.time.getTime() === slot.time.getTime();
                  const isCurrentTask = slot.isCurrent;
                  
                  return (
                    <Box
                      key={index}
                      onClick={() => handleSlotClick(slot)}
                      sx={{
                        display: 'flex',
                        alignItems: 'stretch',
                        cursor: 'pointer',
                        mb: 0.5,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'translateX(4px)',
                          '& .timeline-dot': {
                            transform: 'scale(1.3)'
                          }
                        }
                      }}
                    >
                      {/* Time Label */}
                      <Box
                        sx={{
                          width: 50,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          pr: 1.5
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: isSelected || isCurrentTask ? 700 : 500,
                            color: isSelected
                              ? 'success.main'
                              : isCurrentTask
                              ? 'info.main'
                              : 'text.secondary',
                            fontSize: '0.75rem'
                          }}
                        >
                          {slot.label}
                        </Typography>
                      </Box>

                      {/* Timeline Dot */}
                      <Box
                        className="timeline-dot"
                        sx={{
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          bgcolor: isSelected
                            ? 'success.main'
                            : isCurrentTask
                            ? 'info.main'
                            : slot.isOccupied
                            ? theme.palette[getTypeColor(slot.occupiedBy?.taskType || '')].main
                            : alpha(theme.palette.grey[400], 0.5),
                          border: isSelected || isCurrentTask ? '2px solid' : 'none',
                          borderColor: isSelected
                            ? 'success.dark'
                            : isCurrentTask
                            ? 'info.dark'
                            : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          mt: 1,
                          ml: '-5.5px',
                          mr: 1.5,
                          transition: 'all 0.2s ease',
                          zIndex: 1
                        }}
                      >
                        {(isSelected || isCurrentTask) && (
                          <CheckCircleIcon
                            sx={{ fontSize: 10, color: 'white' }}
                          />
                        )}
                      </Box>

                      {/* Slot Content */}
                      <Box
                        sx={{
                          flex: 1,
                          py: 0.75,
                          px: 1.5,
                          borderRadius: 1.5,
                          bgcolor: isSelected
                            ? alpha(theme.palette.success.main, 0.15)
                            : isCurrentTask
                            ? alpha(theme.palette.info.main, 0.15)
                            : slot.isOccupied
                            ? getTypeBgColor(slot.occupiedBy?.taskType || '', theme)
                            : alpha(theme.palette.grey[100], 0.5),
                          border: '1px solid',
                          borderColor: isSelected
                            ? 'success.main'
                            : isCurrentTask
                            ? 'info.main'
                            : slot.isOccupied
                            ? alpha(theme.palette[getTypeColor(slot.occupiedBy?.taskType || '')].main, 0.3)
                            : 'transparent',
                          minHeight: 36,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          '&:hover': {
                            bgcolor: isSelected
                              ? alpha(theme.palette.success.main, 0.25)
                              : isCurrentTask
                              ? alpha(theme.palette.info.main, 0.25)
                              : slot.isOccupied
                              ? getTypeBgColor(slot.occupiedBy?.taskType || '', theme)
                              : alpha(theme.palette.grey[200], 0.7)
                          }
                        }}
                      >
                        {slot.isOccupied && slot.occupiedBy ? (
                          <>
                            <Box display="flex" alignItems="center" gap={1} sx={{ minWidth: 0, flex: 1 }}>
                              <EventBusyIcon
                                sx={{
                                  fontSize: 16,
                                  color: theme.palette[getTypeColor(slot.occupiedBy.taskType)].main,
                                  flexShrink: 0
                                }}
                              />
                              <Box sx={{ minWidth: 0 }}>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 500,
                                    color: theme.palette[getTypeColor(slot.occupiedBy.taskType)].dark,
                                    fontSize: '0.8rem',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {slot.occupiedBy.customerName}
                                </Typography>
                                {slot.occupiedBy.sector && (
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: 'text.secondary',
                                      fontSize: '0.65rem',
                                      display: 'block'
                                    }}
                                  >
                                    {slot.occupiedBy.sector}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                            <Typography
                              variant="caption"
                              sx={{
                                px: 1,
                                py: 0.25,
                                borderRadius: 1,
                                bgcolor: alpha(theme.palette[getTypeColor(slot.occupiedBy.taskType)].main, 0.2),
                                color: theme.palette[getTypeColor(slot.occupiedBy.taskType)].dark,
                                fontWeight: 600,
                                fontSize: '0.65rem',
                                flexShrink: 0,
                                ml: 1
                              }}
                            >
                              {slot.occupiedBy.taskType}
                            </Typography>
                          </>
                        ) : isCurrentTask ? (
                          <Typography
                            variant="body2"
                            sx={{
                              color: 'info.main',
                              fontWeight: 600,
                              fontSize: '0.8rem'
                            }}
                          >
                            Hora actual
                          </Typography>
                        ) : isSelected ? (
                          <Typography
                            variant="body2"
                            sx={{
                              color: 'success.main',
                              fontWeight: 600,
                              fontSize: '0.8rem'
                            }}
                          >
                            ✓ Seleccionado
                          </Typography>
                        ) : (
                          <Typography
                            variant="body2"
                            sx={{
                              color: 'text.disabled',
                              fontStyle: 'italic',
                              fontSize: '0.8rem'
                            }}
                          >
                            Disponible
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          {currentScheduledTime && (
            <Button
              onClick={handleRemoveSchedule}
              disabled={saving}
              color="error"
              size="small"
              sx={{ mr: 'auto' }}
            >
              Quitar
            </Button>
          )}
          <Button onClick={onClose} disabled={saving} size="small">
            Cancelar
          </Button>
          <Button
            onClick={() => handleSave(false)}
            disabled={!selectedSlot || saving}
            variant="contained"
            size="small"
          >
            {saving ? <CircularProgress size={20} /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog for Replacing */}
      <Dialog
        open={showConfirmReplace}
        onClose={() => setShowConfirmReplace(false)}
        maxWidth="xs"
      >
        <DialogTitle>Confirmar Reemplazo</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Esta hora ya está programada para:
          </Typography>
          <Box
            mt={2}
            p={2}
            borderRadius={2}
            bgcolor={getTypeBgColor(selectedSlot?.occupiedBy?.taskType || '', theme)}
          >
            <Typography
              variant="caption"
              sx={{
                px: 1,
                py: 0.5,
                borderRadius: 1,
                bgcolor: alpha(
                  theme.palette[getTypeColor(selectedSlot?.occupiedBy?.taskType || '')].main,
                  0.2
                ),
                color: theme.palette[getTypeColor(selectedSlot?.occupiedBy?.taskType || '')].dark,
                fontWeight: 600
              }}
            >
              {selectedSlot?.occupiedBy?.taskType}
            </Typography>
            <Typography fontWeight="bold" mt={1}>
              {selectedSlot?.occupiedBy?.customerName}
            </Typography>
            {selectedSlot?.occupiedBy?.sector && (
              <Typography variant="body2" color="text.secondary">
                {selectedSlot?.occupiedBy?.sector}
              </Typography>
            )}
          </Box>
          <Typography variant="body2" mt={2}>
            ¿Deseas reemplazarla con esta tarea?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowConfirmReplace(false)}
            disabled={saving}
            size="small"
          >
            Cancelar
          </Button>
          <Button
            onClick={() => handleSave(true)}
            disabled={saving}
            variant="contained"
            color="warning"
            size="small"
          >
            {saving ? <CircularProgress size={20} /> : 'Reemplazar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ScheduleTimePicker;
