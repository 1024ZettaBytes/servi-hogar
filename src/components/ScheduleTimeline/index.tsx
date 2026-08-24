import { FC, Fragment, useMemo, useState } from 'react';
import {
  useGetScheduledSlots,
  useGetOperators,
  getFetcher
} from '../../../pages/api/useRequest';
import {
  Box,
  Typography,
  CircularProgress,
  alpha,
  useTheme,
  Collapse,
  Tooltip
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ScheduleTimelineProps {
  selectedDate: Date;
  userRole?: string;
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
}

// Columna de la vista de oficina: un operador, o el cajón de vueltas sin asignar.
interface OperatorColumn {
  id: string;
  name: string;
}

// 07:00 → 20:00 en intervalos de 30 minutos.
const FIRST_HOUR = 7;
const SLOT_COUNT = 26;
const UNASSIGNED_COLUMN_ID = '__unassigned__';

const minuteKey = (date: Date) => date.getHours() * 60 + date.getMinutes();

const ScheduleTimeline: FC<ScheduleTimelineProps> = ({
  selectedDate,
  userRole
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(true);

  const isManager = userRole === 'ADMIN' || userRole === 'AUX';

  const getTypeColor = (
    type: string
  ): 'primary' | 'warning' | 'error' | 'info' | 'success' | 'secondary' => {
    switch (type) {
      case 'ENTREGA':
      case 'ENTREGA_VENTA':
        return 'primary';
      case 'CAMBIO':
      case 'RECOLECCION_EXTERNA':
        return 'warning';
      case 'RECOLECCION':
      case 'RECOLECCION_VENTA':
        return 'error';
      case 'COBRANZA':
        return 'info';
      case 'ENTREGA_EXTERNA':
        return 'success';
      case 'VUELTA_EXTRA':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getTypeBgColor = (type: string) => {
    switch (type) {
      case 'ENTREGA':
      case 'ENTREGA_VENTA':
        return alpha(theme.palette.primary.main, 0.15);
      case 'CAMBIO':
      case 'RECOLECCION_EXTERNA':
        return alpha(theme.palette.warning.main, 0.15);
      case 'RECOLECCION':
      case 'RECOLECCION_VENTA':
        return alpha(theme.palette.error.main, 0.15);
      case 'COBRANZA':
        return alpha(theme.palette.info.main, 0.15);
      case 'ENTREGA_EXTERNA':
        return alpha(theme.palette.success.main, 0.15);
      case 'VUELTA_EXTRA':
        return alpha(theme.palette.secondary.main, 0.15);
      default:
        return alpha(theme.palette.grey[500], 0.15);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'ENTREGA_VENTA':
        return 'ENTREGA VENTA';
      case 'RECOLECCION_VENTA':
        return 'RECOLECCIÓN VENTA';
      case 'CAMBIO_VENTA':
        return 'CAMBIO VENTA';
      case 'VUELTA_EXTRA':
        return 'VUELTA EXTRA';
      case 'RECOLECCION_EXTERNA':
        return 'RECOL. EXTERNA';
      case 'ENTREGA_EXTERNA':
        return 'ENTREGA EXTERNA';
      default:
        return type;
    }
  };

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  // El API acota la respuesta: el OPE recibe solo su agenda; oficina recibe todas.
  const { scheduledSlotsData, isLoadingScheduledSlots } = useGetScheduledSlots(
    getFetcher,
    dateStr
  );
  const { operatorsList } = useGetOperators(isManager ? getFetcher : null);

  const slotTimes = useMemo(() => {
    const baseDate = new Date(selectedDate);
    baseDate.setHours(FIRST_HOUR, 0, 0, 0);
    return Array.from({ length: SLOT_COUNT }, (_, i) => {
      const slotTime = new Date(baseDate);
      slotTime.setMinutes(baseDate.getMinutes() + i * 30);
      return slotTime;
    });
  }, [selectedDate]);

  // Solo los slots del día seleccionado que caen en un intervalo de la rejilla.
  const slotsForDay = useMemo(
    () =>
      (scheduledSlotsData || []).filter((s: any) => {
        const scheduled = new Date(s.scheduledTime);
        return (
          scheduled.getFullYear() === selectedDate.getFullYear() &&
          scheduled.getMonth() === selectedDate.getMonth() &&
          scheduled.getDate() === selectedDate.getDate()
        );
      }),
    [scheduledSlotsData, selectedDate]
  );

  // --- Vista del operador: un solo timeline vertical ---
  const timeSlots: TimeSlot[] = useMemo(
    () =>
      slotTimes.map((slotTime) => {
        const occupiedSlot = slotsForDay.find(
          (s: any) => minuteKey(new Date(s.scheduledTime)) === minuteKey(slotTime)
        );
        return {
          time: slotTime,
          label: format(slotTime, 'HH:mm', { locale: es }),
          isOccupied: !!occupiedSlot,
          occupiedBy: occupiedSlot
            ? {
                taskId: occupiedSlot.taskId,
                taskType: occupiedSlot.taskType,
                customerName: occupiedSlot.customerName,
                sector: occupiedSlot.sector || ''
              }
            : undefined
        };
      }),
    [slotTimes, slotsForDay]
  );

  // --- Vista de oficina: una columna por operador ---
  // Solo se muestra el operador que está activo Y tiene al menos una vuelta
  // programada en la fecha indicada.
  const columns: OperatorColumn[] = useMemo(() => {
    if (!isManager) return [];
    const withSlots = new Set(
      slotsForDay.map((s: any) => s.operatorId).filter(Boolean)
    );
    const cols: OperatorColumn[] = (operatorsList || [])
      .filter((op: any) => op.isActive !== false && withSlots.has(String(op._id)))
      .map((op: any) => ({ id: String(op._id), name: op.name }));
    // Vueltas programadas cuyo operador se quitó: no se esconden, se agrupan aparte.
    const hasUnassigned = slotsForDay.some((s: any) => !s.operatorId);
    if (hasUnassigned) {
      cols.push({ id: UNASSIGNED_COLUMN_ID, name: 'Sin asignar' });
    }
    return cols;
  }, [isManager, operatorsList, slotsForDay]);

  // { operatorId -> { minuto -> vuelta } }
  const slotsByOperator = useMemo(() => {
    const map = new Map<string, Map<number, any>>();
    if (!isManager) return map;
    for (const slot of slotsForDay as any[]) {
      const columnId = slot.operatorId || UNASSIGNED_COLUMN_ID;
      if (!map.has(columnId)) map.set(columnId, new Map());
      map.get(columnId).set(minuteKey(new Date(slot.scheduledTime)), slot);
    }
    return map;
  }, [isManager, slotsForDay]);

  const occupiedCount = isManager
    ? slotsForDay.length
    : timeSlots.filter((s) => s.isOccupied).length;
  const availableCount = isManager
    ? Math.max(SLOT_COUNT * columns.length - occupiedCount, 0)
    : timeSlots.length - occupiedCount;

  // Get current time slot
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();
  const isToday =
    selectedDate.getFullYear() === now.getFullYear() &&
    selectedDate.getMonth() === now.getMonth() &&
    selectedDate.getDate() === now.getDate();

  const isCurrentTimeSlot = (slotTime: Date) =>
    isToday &&
    slotTime.getHours() === currentHour &&
    ((currentMinutes < 30 && slotTime.getMinutes() === 0) ||
      (currentMinutes >= 30 && slotTime.getMinutes() === 30));

  return (
    <Box
      sx={{
        mb: 3,
        borderRadius: 2,
        overflow: 'hidden',
        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        bgcolor: 'background.paper'
      }}
    >
      {/* Header */}
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1,
          px: 2,
          py: 1.5,
          bgcolor: alpha(theme.palette.primary.main, 0.08),
          borderBottom: expanded
            ? `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
            : 'none',
          cursor: 'pointer',
          '&:hover': {
            bgcolor: alpha(theme.palette.primary.main, 0.12)
          }
        }}
      >
        <Box display="flex" alignItems="center" gap={1} sx={{ minWidth: 0 }}>
          <AccessTimeIcon color="primary" />
          <Typography
            variant="h6"
            fontWeight="bold"
            sx={{
              fontSize: { xs: '0.95rem', sm: '1.25rem' },
              whiteSpace: 'nowrap'
            }}
          >
            Programación
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              ml: { xs: 0, sm: 1 },
              display: { xs: 'none', sm: 'block' }
            }}
          >
            {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
            {isManager ? ' · todos los operadores' : ''}
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" gap={{ xs: 1, sm: 2 }}>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: 'success.main'
              }}
            />
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}
            >
              {availableCount}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: 'warning.main'
              }}
            />
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}
            >
              {occupiedCount}
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              borderRadius: '50%',
              bgcolor: alpha(theme.palette.primary.main, 0.1)
            }}
          >
            {expanded ? (
              <ExpandLessIcon fontSize="small" />
            ) : (
              <ExpandMoreIcon fontSize="small" />
            )}
          </Box>
        </Box>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ p: 2 }}>
          {isLoadingScheduledSlots || (isManager && !operatorsList) ? (
            <Box display="flex" justifyContent="center" p={2}>
              <CircularProgress size={24} />
            </Box>
          ) : isManager ? (
            /* --- Oficina: una columna por operador --- */
            columns.length === 0 ? (
              <Typography variant="body2" color="text.secondary" align="center">
                No hay vueltas programadas para esta fecha.
              </Typography>
            ) : (
              <Box sx={{ maxHeight: 420, overflow: 'auto' }}>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: `56px repeat(${columns.length}, minmax(150px, 1fr))`,
                    minWidth: 56 + columns.length * 150,
                    gap: 0.5
                  }}
                >
                  {/* Encabezado */}
                  <Box
                    sx={{
                      position: 'sticky',
                      top: 0,
                      zIndex: 2,
                      bgcolor: 'background.paper'
                    }}
                  />
                  {columns.map((column) => (
                    <Box
                      key={column.id}
                      sx={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 2,
                        px: 1,
                        py: 0.75,
                        borderRadius: 1,
                        textAlign: 'center',
                        bgcolor: alpha(theme.palette.primary.main, 0.1)
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          display: 'block'
                        }}
                      >
                        {column.name}
                      </Typography>
                    </Box>
                  ))}

                  {/* Filas: un renglón por intervalo de 30 min */}
                  {slotTimes.map((slotTime) => {
                    const isCurrentSlot = isCurrentTimeSlot(slotTime);
                    return (
                      <Fragment key={slotTime.getTime()}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            pr: 1
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: isCurrentSlot ? 700 : 500,
                              color: isCurrentSlot
                                ? 'primary.main'
                                : 'text.secondary',
                              fontSize: '0.75rem'
                            }}
                          >
                            {format(slotTime, 'HH:mm', { locale: es })}
                          </Typography>
                        </Box>

                        {columns.map((column) => {
                          const vuelta = slotsByOperator
                            .get(column.id)
                            ?.get(minuteKey(slotTime));

                          if (!vuelta) {
                            return (
                              <Box
                                key={column.id}
                                sx={{
                                  minHeight: 36,
                                  borderRadius: 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  bgcolor: isCurrentSlot
                                    ? alpha(theme.palette.primary.main, 0.08)
                                    : alpha(theme.palette.grey[100], 0.5)
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{ color: 'text.disabled' }}
                                >
                                  —
                                </Typography>
                              </Box>
                            );
                          }

                          const color = getTypeColor(vuelta.taskType);
                          return (
                            <Tooltip
                              key={column.id}
                              arrow
                              title={`${getTypeLabel(vuelta.taskType)} · ${
                                vuelta.customerName
                              }${vuelta.sector ? ` · ${vuelta.sector}` : ''}`}
                            >
                              <Box
                                sx={{
                                  minHeight: 36,
                                  px: 1,
                                  py: 0.5,
                                  borderRadius: 1,
                                  bgcolor: getTypeBgColor(vuelta.taskType),
                                  border: '1px solid',
                                  borderColor: alpha(
                                    theme.palette[color].main,
                                    0.3
                                  ),
                                  overflow: 'hidden'
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{
                                    display: 'block',
                                    fontWeight: 600,
                                    fontSize: '0.65rem',
                                    color: theme.palette[color].dark,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {getTypeLabel(vuelta.taskType)}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    display: 'block',
                                    fontSize: '0.7rem',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {vuelta.customerName}
                                </Typography>
                              </Box>
                            </Tooltip>
                          );
                        })}
                      </Fragment>
                    );
                  })}
                </Box>
              </Box>
            )
          ) : (
            /* --- Operador: su propio timeline vertical --- */
            <Box
              sx={{
                position: 'relative',
                maxHeight: 350,
                overflowY: 'auto',
                pr: 1,
                '&::-webkit-scrollbar': {
                  width: 6
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.3),
                  borderRadius: 3
                }
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
                {timeSlots.map((slot, index) => {
                  const isCurrentSlot = isCurrentTimeSlot(slot.time);

                  return (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        alignItems: 'stretch',
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
                            fontWeight: isCurrentSlot ? 700 : 500,
                            color: isCurrentSlot
                              ? 'primary.main'
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
                          bgcolor: isCurrentSlot
                            ? 'primary.main'
                            : slot.isOccupied
                            ? theme.palette[
                                getTypeColor(slot.occupiedBy?.taskType || '')
                              ].main
                            : alpha(theme.palette.grey[400], 0.5),
                          border: isCurrentSlot ? '2px solid' : 'none',
                          borderColor: isCurrentSlot
                            ? 'primary.dark'
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
                        {isCurrentSlot && (
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
                          bgcolor: isCurrentSlot
                            ? alpha(theme.palette.primary.main, 0.15)
                            : slot.isOccupied
                            ? getTypeBgColor(slot.occupiedBy?.taskType || '')
                            : alpha(theme.palette.grey[100], 0.5),
                          border: '1px solid',
                          borderColor: isCurrentSlot
                            ? 'primary.main'
                            : slot.isOccupied
                            ? alpha(
                                theme.palette[
                                  getTypeColor(slot.occupiedBy?.taskType || '')
                                ].main,
                                0.3
                              )
                            : 'transparent',
                          minHeight: 36,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          '&:hover': {
                            bgcolor: isCurrentSlot
                              ? alpha(theme.palette.primary.main, 0.25)
                              : slot.isOccupied
                              ? getTypeBgColor(slot.occupiedBy?.taskType || '')
                              : alpha(theme.palette.grey[200], 0.7)
                          }
                        }}
                      >
                        {slot.isOccupied && slot.occupiedBy ? (
                          <>
                            <Box
                              display="flex"
                              alignItems="center"
                              gap={1}
                              sx={{ minWidth: 0, flex: 1 }}
                            >
                              <EventBusyIcon
                                sx={{
                                  fontSize: 16,
                                  color:
                                    theme.palette[
                                      getTypeColor(slot.occupiedBy.taskType)
                                    ].main,
                                  flexShrink: 0
                                }}
                              />
                              <Box sx={{ minWidth: 0 }}>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 500,
                                    color:
                                      theme.palette[
                                        getTypeColor(slot.occupiedBy.taskType)
                                      ].dark,
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
                                bgcolor: alpha(
                                  theme.palette[
                                    getTypeColor(slot.occupiedBy.taskType)
                                  ].main,
                                  0.2
                                ),
                                color:
                                  theme.palette[
                                    getTypeColor(slot.occupiedBy.taskType)
                                  ].dark,
                                fontWeight: 600,
                                fontSize: '0.65rem',
                                flexShrink: 0,
                                ml: 1
                              }}
                            >
                              {getTypeLabel(slot.occupiedBy.taskType)}
                            </Typography>
                          </>
                        ) : isCurrentSlot ? (
                          <Typography
                            variant="body2"
                            sx={{
                              color: 'primary.main',
                              fontWeight: 600,
                              fontSize: '0.8rem'
                            }}
                          >
                            ▶ Hora actual
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
        </Box>
      </Collapse>
    </Box>
  );
};

export default ScheduleTimeline;
