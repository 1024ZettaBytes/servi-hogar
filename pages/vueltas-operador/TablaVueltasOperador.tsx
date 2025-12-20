import { FC, ChangeEvent, useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Tooltip,
  Divider,
  Box,
  Card,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TableContainer,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  Button
} from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import CloseIcon from '@mui/icons-material/Close';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ScheduleTimePicker from '@/components/ScheduleTimePicker';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CompleteCollectionModal from '@/components/CompleteCollectionModal';
import FormatModal from '@/components/FormatModal';
import { completeCollectionVisit } from '../../lib/client/salesFetch';
import { formatTZDate } from 'lib/client/utils';
import { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import {
  getFormatForDelivery,
  getFormatForChange,
  getFormatForPickup
} from '../../lib/consts/OBJ_CONTS';
import { markWasSentDelivery } from '../../lib/client/deliveriesFetch';
import { markWasSentChange } from '../../lib/client/changesFetch';
import { markWasSentPickup } from '../../lib/client/pickupsFetch';
import { getFetcher, useGetPrices } from 'pages/api/useRequest';

interface TablaVueltasOperadorProps {
  className?: string;
  tasksList: any[];
  userRole: string;
  showTimeBetween: boolean;
  isBlocked?: boolean;
  selectedDate?: Date;
  onRefresh?: () => void;
}

const applyPagination = (
  tasksList: any[],
  page: number,
  limit: number
): any[] => {
  return tasksList.slice(page * limit, page * limit + limit);
};

const TablaVueltasOperador: FC<TablaVueltasOperadorProps> = ({
  tasksList,
  userRole,
  showTimeBetween,
  isBlocked = false,
  selectedDate = new Date(),
  onRefresh = () => {}
}) => {
  const router = useRouter();
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(10);
  const [openImagesDialog, setOpenImagesDialog] = useState<boolean>(false);
  const [selectedImages, setSelectedImages] = useState<any>(null);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [taskToComplete, setTaskToComplete] = useState<any>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [taskToSchedule, setTaskToSchedule] = useState<any>(null);
  const [formatIsOpen, setFormatIsOpen] = useState(false);
  const [formatText, setFormatText] = useState<string>('');
  const [formatConfig, setFormatConfig] = useState<{
    title: string;
    action: any;
    task: any;
  } | null>(null);

  const { prices } = useGetPrices(getFetcher);

  const { enqueueSnackbar } = useSnackbar();
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handlePageChange = (_event: any, newPage: number): void => {
    setPage(newPage);
  };

  const handleLimitChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setLimit(parseInt(event.target.value));
  };

  const handleOpenImages = (task: any) => {
    let images;

    if (task.type === 'RECOLECCION_VENTA') {
      // For sale warranty pickups, check pickup images first (completed pickups)
      // Then fall back to delivery images (pending pickups shown in operator view)
      images = task.imagesUrl || task.sale?.delivery?.imagesUrl;
    } else {
      // For rent-related tasks (deliveries, pickups, changes)
      images = task.rent?.imagesUrl;
    }

    setSelectedImages(images);
    setOpenImagesDialog(true);
  };

  const handleCloseImages = () => {
    setOpenImagesDialog(false);
    setSelectedImages(null);
  };

  const handleOpenFormat = (task: any) => {
    let text = '';
    let action = null;
    let title = '';

    if (task.type === 'ENTREGA' && task.rent) {
      text = getFormatForDelivery(task.rent, task, task);
      action = markWasSentDelivery;
      title = 'Formato de entrega';
    } else if (task.type === 'CAMBIO' && task.rent) {
      text = getFormatForChange(task.rent, task, task.reason, task);
      action = markWasSentChange;
      title = 'Formato de cambio';
    } else if (task.type === 'RECOLECCION' && task.rent) {
      const dayPrice = prices?.dayPrice || 0;
      text = getFormatForPickup(task.rent, task, task, dayPrice);
      action = markWasSentPickup;
      title = 'Formato de recolección';
    }

    if (text && action) {
      setFormatConfig({
        title,
        action,
        task
      });
      setFormatText(text);
      setFormatIsOpen(true);
    }
  };

  const handleConfirmCompletion = async (outcome: string) => {
    setIsCompleting(true);

    const result = await completeCollectionVisit(taskToComplete._id, outcome);

    if (isMounted.current) {
      setIsCompleting(false);
      setCompleteModalOpen(false);
      setTaskToComplete(null);
    }

    if (!result.error) {
      enqueueSnackbar(result.msg || 'Visita completada correctamente', {
        variant: 'success',
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
        autoHideDuration: 2000
      });
    } else {
      enqueueSnackbar(result.msg, {
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'center' }
      });
    }
  };

  const handleOpenSchedule = (task: any) => {
    setTaskToSchedule(task);
    setScheduleModalOpen(true);
  };

  const handleScheduleSaved = () => {
    enqueueSnackbar('Hora programada exitosamente', {
      variant: 'success',
      anchorOrigin: { vertical: 'top', horizontal: 'center' },
      autoHideDuration: 2000
    });
    onRefresh();
  };

  const handleGoToCompletion = (task: any) => {
    let route = '';
    if (task.type === 'COBRANZA') {
      setTaskToComplete(task);
      setCompleteModalOpen(true);
      return;
    }
    switch (task.type) {
      case 'ENTREGA':
        route = `/entregas-pendientes/${task._id}`;
        break;
      case 'RECOLECCION':
        route = `/recolecciones-pendientes/${task._id}`;
        break;
      case 'RECOLECCION_VENTA':
        route = `/recolecciones-ventas-pendientes/${task._id}`;
        break;
      case 'CAMBIO':
        route = `/cambios-pendientes/${task._id}`;
        break;
    }
    if (route) {
      router.push(route);
    }
  };

  const paginatedTasks = applyPagination(tasksList, page, limit);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ENTREGA':
        return 'primary';
      case 'CAMBIO':
        return 'warning';
      case 'RECOLECCION':
        return 'error';
      case 'COBRANZA':
        return 'info';
      case 'RECOLECCION_VENTA':
        return 'error';
      default:
        return 'default';
    }
  };

  const calculateTimeBetween = (currentTask: any, previousTask: any) => {
    if (!currentTask.finishedAt || !previousTask?.finishedAt) return null;

    const current = new Date(currentTask.finishedAt).getTime();
    const previous = new Date(previousTask.finishedAt).getTime();
    // Calculate absolute difference since the list is sorted descending
    const diffMinutes = Math.abs(
      Math.round((current - previous) / (1000 * 60))
    );

    return diffMinutes;
  };

  return (
    <Card>
      <Divider />
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {!showTimeBetween && (
                <TableCell align="center">HORA PROGRAMADA</TableCell>
              )}
              <TableCell>TIPO DE VUELTA</TableCell>
              <TableCell>CLIENTE</TableCell>
              {!showTimeBetween && <TableCell>SECTOR</TableCell>}
              <TableCell>TELÉFONO</TableCell>
              {userRole === 'ADMIN' && <TableCell>OPERADOR</TableCell>}
              <TableCell>HORA ASIGNACIÓN</TableCell>
              <TableCell align="center">FOTOS</TableCell>
              <TableCell align="center">UBICACIÓN</TableCell>
              <TableCell align="center"></TableCell>
              {showTimeBetween && (
                <>
                  <TableCell>HORA DE REALIZACIÓN</TableCell>
                  <TableCell align="center">TIEMPO ENTRE VUELTAS</TableCell>
                </>
              )}
              {!showTimeBetween && userRole !== 'ADMIN' && (
                <TableCell align="center">ACCIÓN</TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedTasks.map((task, index) => {
              // Since tasks are sorted descending (most recent first),
              // the "next" task in the array is chronologically earlier
              const nextTask =
                index < paginatedTasks.length - 1
                  ? paginatedTasks[index + 1]
                  : null;
              const timeBetween = showTimeBetween
                ? calculateTimeBetween(task, nextTask)
                : null;

              const source = task.rent || task.sale;
              const customer = source?.customer;
              const residence = customer?.currentResidence;

              const typeLabel =
                task.type === 'RECOLECCION_VENTA'
                  ? 'RECOLECCIÓN GARANTÍA'
                  : task.type;
              const isPriority = task.isPriority || false;

              const customerName = customer?.name || 'N/A';
              const sectorName = residence?.sector?.name || 'N/A';

              const cellPhone = customer?.cell || customer?.phone || 'N/A';
              return (
                <TableRow
                  hover
                  key={task._id}
                  sx={isPriority ? { backgroundColor: '#fff3cd' } : {}}
                >
                  {!showTimeBetween && (
                    <TableCell align="center">
                      {task.scheduledTime ? (
                        <Chip
                          label={formatTZDate(
                            new Date(task.scheduledTime),
                            'HH:mm'
                          )}
                          color="success"
                          size="small"
                          icon={<AccessTimeIcon />}
                          onClick={() => handleOpenSchedule(task)}
                          sx={{ cursor: 'pointer' }}
                        />
                      ) : (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleOpenSchedule(task)}
                          startIcon={<AccessTimeIcon />}
                        >
                          Programar
                        </Button>
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip
                        label={typeLabel}
                        color={getTypeColor(task.type)}
                        size="small"
                      />
                      {isPriority && (
                        <Chip
                          label="PRIORIDAD"
                          color="warning"
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                      )}
                      {(task.type === 'CAMBIO' ||
                        task.type === 'RECOLECCION_VENTA') &&
                        task.reason && (
                          <Tooltip title={`Motivo: ${task.reason}`} arrow>
                            <InfoOutlinedIcon
                              fontSize="small"
                              color="warning"
                              sx={{ cursor: 'help' }}
                            />
                          </Tooltip>
                        )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body1"
                      fontWeight="bold"
                      color="text.primary"
                      gutterBottom
                      noWrap
                    >
                      {customerName || 'N/A'}
                    </Typography>
                  </TableCell>
                  {!showTimeBetween && (
                    <TableCell>
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        color="text.primary"
                        gutterBottom
                        noWrap
                      >
                        {sectorName || 'N/A'}
                      </Typography>
                    </TableCell>
                  )}
                  <TableCell>
                    <Typography
                      variant="body1"
                      fontWeight="bold"
                      color="text.primary"
                      gutterBottom
                      noWrap
                    >
                      {cellPhone || 'N/A'}
                    </Typography>
                  </TableCell>
                  {userRole === 'ADMIN' && (
                    <TableCell>
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        color="text.primary"
                        gutterBottom
                        noWrap
                      >
                        {task.operator?.name || 'Sin asignar'}
                      </Typography>
                    </TableCell>
                  )}
                  <TableCell>
                    <Typography
                      variant="body1"
                      fontWeight="bold"
                      color="text.primary"
                      gutterBottom
                      align="center"
                      noWrap
                    >
                      {task.takenAt
                        ? formatTZDate(new Date(task.takenAt), 'HH:mm')
                        : 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {task.rent?.imagesUrl ||
                    task.sale?.delivery?.imagesUrl ||
                    task.imagesUrl ? (
                      <Tooltip title="Ver fotos" arrow>
                        <IconButton
                          sx={{
                            '&:hover': {
                              background: 'rgba(0, 0, 0, 0.08)'
                            },
                            color: 'primary.main'
                          }}
                          color="inherit"
                          size="small"
                          onClick={() => handleOpenImages(task)}
                        >
                          <PhotoLibraryIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {residence?.maps ? (
                      <Tooltip title="Ver ubicación" arrow>
                        <IconButton
                          sx={{
                            '&:hover': {
                              background: 'rgba(0, 0, 0, 0.08)'
                            },
                            color: 'primary.main'
                          }}
                          color="inherit"
                          size="small"
                          onClick={() => window.open(residence.maps, '_blank')}
                        >
                          <MapIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Ψ
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {task.type === 'ENTREGA' ||
                    task.type === 'CAMBIO' ||
                    task.type === 'RECOLECCION' ? (
                      <Tooltip title="Ver formato" arrow>
                        <IconButton
                          sx={{
                            '&:hover': { background: 'rgba(0, 0, 0, 0.08)' },
                            color: 'success.main'
                          }}
                          color="inherit"
                          size="small"
                          onClick={() => handleOpenFormat(task)}
                        >
                          <WhatsAppIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </TableCell>
                  {showTimeBetween && (
                    <>
                      <TableCell>
                        <Typography
                          variant="body1"
                          fontWeight="bold"
                          color="text.primary"
                          gutterBottom
                          noWrap
                        >
                          {task.finishedAt
                            ? formatTZDate(new Date(task.finishedAt), 'HH:mm')
                            : 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {timeBetween !== null && nextTask ? (
                          <Chip
                            label={timeBetween + ' min.'}
                            color={timeBetween > 30 ? 'error' : 'success'}
                            size="small"
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                    </>
                  )}
                  {!showTimeBetween && userRole !== 'ADMIN' && (
                    <TableCell align="center">
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        endIcon={<ArrowForwardIcon />}
                        onClick={() => handleGoToCompletion(task)}
                        disabled={isBlocked}
                      >
                        Completar
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <Box p={2}>
        <TablePagination
          component="div"
          count={tasksList.length}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleLimitChange}
          page={page}
          rowsPerPage={limit}
          rowsPerPageOptions={[5, 10, 25, 30]}
        />
      </Box>

      {/* Images Dialog */}
      <Dialog
        open={openImagesDialog}
        onClose={handleCloseImages}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h4">Fotos de la vuelta</Typography>
            <IconButton onClick={handleCloseImages}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedImages && (
            <Grid container spacing={2}>
              {/* Rent delivery images */}
              {selectedImages.front && (
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Frente de casa
                    </Typography>
                    <img
                      src={selectedImages.front}
                      alt="Frente de casa"
                      style={{ width: '100%', height: 'auto', borderRadius: 8 }}
                    />
                  </Box>
                </Grid>
              )}
              {selectedImages.contract && (
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Contrato
                    </Typography>
                    <img
                      src={selectedImages.contract}
                      alt="Contrato"
                      style={{ width: '100%', height: 'auto', borderRadius: 8 }}
                    />
                  </Box>
                </Grid>
              )}
              {selectedImages.board && (
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Tablero
                    </Typography>
                    <img
                      src={selectedImages.board}
                      alt="Tablero"
                      style={{ width: '100%', height: 'auto', borderRadius: 8 }}
                    />
                  </Box>
                </Grid>
              )}
              {selectedImages.tag && (
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Etiqueta
                    </Typography>
                    <img
                      src={selectedImages.tag}
                      alt="Etiqueta"
                      style={{ width: '100%', height: 'auto', borderRadius: 8 }}
                    />
                  </Box>
                </Grid>
              )}
              {/* Sale delivery images */}
              {selectedImages.ine && (
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      INE
                    </Typography>
                    <img
                      src={selectedImages.ine}
                      alt="INE"
                      style={{ width: '100%', height: 'auto', borderRadius: 8 }}
                    />
                  </Box>
                </Grid>
              )}
              {selectedImages.frontal && (
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Foto Frontal
                    </Typography>
                    <img
                      src={selectedImages.frontal}
                      alt="Foto Frontal"
                      style={{ width: '100%', height: 'auto', borderRadius: 8 }}
                    />
                  </Box>
                </Grid>
              )}
              {selectedImages.label && (
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Etiqueta
                    </Typography>
                    <img
                      src={selectedImages.label}
                      alt="Etiqueta"
                      style={{ width: '100%', height: 'auto', borderRadius: 8 }}
                    />
                  </Box>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
      </Dialog>
      {taskToComplete && (
        <CompleteCollectionModal
          open={completeModalOpen}
          handleOnClose={() => {
            setCompleteModalOpen(false);
            setTaskToComplete(null);
          }}
          handleOnConfirm={handleConfirmCompletion}
          isLoading={isCompleting}
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
          currentScheduledTime={taskToSchedule.scheduledTime}
          onScheduleSaved={handleScheduleSaved}
          selectedDate={selectedDate}
        />
      )}
      {formatIsOpen && formatConfig && (
        <FormatModal
          selectedId={formatConfig.task?._id}
          open={formatIsOpen}
          title={formatConfig.title}
          text={formatConfig.task?.wasSent ? 'ENVIADO' : null}
          textColor={'green'}
          formatText={formatText}
          onAccept={() => {
            setFormatIsOpen(false);
            setFormatText('');
            setFormatConfig(null);
          }}
          onSubmitAction={formatConfig.action}
        />
      )}
    </Card>
  );
};

TablaVueltasOperador.propTypes = {
  tasksList: PropTypes.array.isRequired,
  userRole: PropTypes.string.isRequired,
  showTimeBetween: PropTypes.bool.isRequired,
  isBlocked: PropTypes.bool
};

TablaVueltasOperador.defaultProps = {
  tasksList: [],
  isBlocked: false
};

export default TablaVueltasOperador;
