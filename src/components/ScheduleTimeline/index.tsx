import { FC, useState } from 'react';
import {
  useGetScheduledSlots,
  getFetcher
} from '../../../pages/api/useRequest';
import {
  Box,
  Typography,
  CircularProgress,
  alpha,
  useTheme,
  Collapse
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

const ScheduleTimeline: FC<ScheduleTimelineProps> = ({ selectedDate }) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(true);

  // Generate time slots from 07:00 to 20:00 (30-minute intervals)
  const generateTimeSlots = (scheduledSlots: any[]): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const baseDate = new Date(selectedDate);
    baseDate.setHours(7, 0, 0, 0);

    for (let i = 0; i < 26; i++) {
      const slotTime = new Date(baseDate);
      slotTime.setMinutes(baseDate.getMinutes() + i * 30);

      const occupiedSlot = scheduledSlots.find((s) => {
        const scheduledDate = new Date(s.scheduledTime);
        return (
          scheduledDate.getFullYear() === slotTime.getFullYear() &&
          scheduledDate.getMonth() === slotTime.getMonth() &&
          scheduledDate.getDate() === slotTime.getDate() &&
          scheduledDate.getHours() === slotTime.getHours() &&
          scheduledDate.getMinutes() === slotTime.getMinutes()
        );
      });

      slots.push({
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
      });
    }

    return slots;
  };

  const getTypeColor = (
    type: string
  ): 'primary' | 'warning' | 'error' | 'info' | 'success' | 'secondary' => {
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

  const getTypeBgColor = (type: string) => {
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

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const { scheduledSlotsData, isLoadingScheduledSlots } = useGetScheduledSlots(
    getFetcher,
    dateStr
  );

  const timeSlots = generateTimeSlots(scheduledSlotsData || []);
  const occupiedCount = timeSlots.filter((s) => s.isOccupied).length;
  const availableCount = timeSlots.length - occupiedCount;

  // Get current time slot
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();
  const isToday =
    selectedDate.getFullYear() === now.getFullYear() &&
    selectedDate.getMonth() === now.getMonth() &&
    selectedDate.getDate() === now.getDate();

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

      {/* Vertical Timeline */}
      <Collapse in={expanded}>
        <Box sx={{ p: 2 }}>
          {isLoadingScheduledSlots ? (
            <Box display="flex" justifyContent="center" p={2}>
              <CircularProgress size={24} />
            </Box>
          ) : (
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
                  const isCurrentSlot =
                    isToday &&
                    slot.time.getHours() === currentHour &&
                    ((currentMinutes < 30 && slot.time.getMinutes() === 0) ||
                      (currentMinutes >= 30 && slot.time.getMinutes() === 30));

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
                              {slot.occupiedBy.taskType}
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
