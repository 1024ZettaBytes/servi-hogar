import { FC, ChangeEvent, useState } from 'react';
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
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import CloseIcon from '@mui/icons-material/Close';
import { useSnackbar } from 'notistack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CompleteCollectionModal from '@/components/CompleteCollectionModal';
import { completeCollectionVisit } from '../../lib/client/salesFetch';
import { formatTZDate } from 'lib/client/utils';
import { useRouter } from 'next/router';

interface TablaVueltasOperadorProps {
  className?: string;
  tasksList: any[];
  userRole: string;
  showTimeBetween: boolean;
  isBlocked?: boolean;
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
  isBlocked = false
}) => {
  const router = useRouter();
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(10);
  const [openImagesDialog, setOpenImagesDialog] = useState<boolean>(false);
  const [selectedImages, setSelectedImages] = useState<any>(null);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [taskToComplete, setTaskToComplete] = useState<any>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const handlePageChange = (_event: any, newPage: number): void => {
    setPage(newPage);
  };

  const handleLimitChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setLimit(parseInt(event.target.value));
  };

  const handleOpenImages = (task: any) => {
    let images = task.rent?.imagesUrl;
    setSelectedImages(images);
    setOpenImagesDialog(true);
  };

  const handleCloseImages = () => {
    setOpenImagesDialog(false);
    setSelectedImages(null);
  };

const handleConfirmCompletion = async (outcome: string) => {
    setIsCompleting(true);
    
    const result = await completeCollectionVisit(taskToComplete._id, outcome);
    
    setIsCompleting(false);
    setCompleteModalOpen(false);
    setTaskToComplete(null);

    if (!result.error) {
       enqueueSnackbar(result.msg || 'Visita completada correctamente', { 
         variant: 'success',
         anchorOrigin: { vertical: 'top', horizontal: 'center' },
         autoHideDuration: 2000
       });
       
       //router.replace(router.asPath); 
    } else {
       enqueueSnackbar(result.msg, { 
         variant: 'error',
         anchorOrigin: { vertical: 'top', horizontal: 'center' }
       });
    }
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
              <TableCell>TIPO DE VUELTA</TableCell>
              <TableCell>CLIENTE</TableCell>
              {!showTimeBetween && <TableCell>SECTOR</TableCell>}
              <TableCell>TELÉFONO</TableCell>
              {userRole === 'ADMIN' && <TableCell>OPERADOR</TableCell>}
              <TableCell>HORA ASIGNACIÓN</TableCell>
              <TableCell align="center">FOTOS</TableCell>
              <TableCell align="center">UBICACIÓN</TableCell>
              {showTimeBetween && (
                <>
                  <TableCell>HORA DE REALIZACIÓN</TableCell>
                  <TableCell align="center">TIEMPO ENTRE VUELTAS</TableCell>
                </>
              )}
              {!showTimeBetween && userRole !== "ADMIN" && <TableCell align="center">ACCIÓN</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedTasks.map((task, index) => {
              // Since tasks are sorted descending (most recent first),
              // the "next" task in the array is chronologically earlier
              const nextTask = index < paginatedTasks.length - 1 ? paginatedTasks[index + 1] : null;
              const timeBetween = showTimeBetween
                ? calculateTimeBetween(task, nextTask)
                : null;

              const source = task.rent || task.sale; 
              const customer = source?.customer;
              const residence = customer?.currentResidence;
              
              const customerName = customer?.name || 'N/A';
              const sectorName = residence?.sector?.name || 'N/A';
              const cellPhone = customer?.cell || 'N/A';

              return (
                <TableRow hover key={task._id}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip
                        label={task.type}
                        color={getTypeColor(task.type)}
                        size="small"
                      />
                      {task.type === 'CAMBIO' && task.reason && (
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
                      align='center'
                      noWrap
                    >
                      {task.takenAt
                        ? formatTZDate(new Date(task.takenAt), 'HH:mm')
                        : 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {task.rent?.imagesUrl ? (
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
                          onClick={() =>
                            window.open(
                              residence.maps,
                              '_blank'
                            )
                          }
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
                            label={timeBetween+ ' min.'}
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
                  {!showTimeBetween && userRole !== "ADMIN" && (
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
