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
  useTheme,
  CardHeader,
  Chip,
  Avatar,
  AvatarGroup,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import { useSnackbar } from 'notistack';
import { compressImage } from 'lib/client/utils';
import { completeConditioning } from '../../lib/client/warehouseMachinesFetch';
import {
  WAREHOUSE_MACHINE_ORIGIN_LABELS,
  WAREHOUSE_ORIGIN_COLORS
} from '../../lib/consts/OBJ_CONTS';

const applyPagination = (list: any[], page: number, limit: number): any[] => {
  return list.slice(page * limit, page * limit + limit);
};

const getOriginChip = (origin: string) => {
  const label = WAREHOUSE_MACHINE_ORIGIN_LABELS[origin] || origin;
  const color = WAREHOUSE_ORIGIN_COLORS[origin] || 'default';
  return <Chip label={label} color={color as any} size="small" />;
};

const getTimerChip = (techAssignedAt: string) => {
  if (!techAssignedAt) return null;
  const assignedDate = new Date(techAssignedAt);
  const now = new Date();
  const diffMs = now.getTime() - assignedDate.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  const remainingHours = 72 - diffHours;

  if (remainingHours <= 0) {
    return (
      <Chip
        label={`Vencido (${diffDays}d ${diffHours % 24}h)`}
        color="error"
        size="small"
        variant="outlined"
      />
    );
  }
  if (remainingHours <= 24) {
    return (
      <Chip
        label={`${remainingHours}h restantes`}
        color="warning"
        size="small"
        variant="outlined"
      />
    );
  }
  return (
    <Chip
      label={`${remainingHours}h restantes`}
      color="info"
      size="small"
      variant="outlined"
    />
  );
};

interface TablaAcondicionamientoProps {
  listData: any[];
  userRole: string;
  warehousesList: any[];
}

const PHOTO_LABELS = ['Frente', 'Tablero', 'Etiqueta', 'Debajo'];

const TablaAcondicionamiento: FC<TablaAcondicionamientoProps> = ({
  listData,
  userRole,
  warehousesList
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(10);

  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<any>(null);
  const [photos, setPhotos] = useState<{ [key: string]: File | null }>({
    photo1: null,
    photo2: null,
    photo3: null,
    photo4: null
  });
  const [photoPreviews, setPhotoPreviews] = useState<{ [key: string]: string }>({});
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePageChange = (_event: any, newPage: number): void => {
    setPage(newPage);
  };

  const handleLimitChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setLimit(parseInt(event.target.value));
    setPage(0);
  };

  const paginatedMachines = applyPagination(listData || [], page, limit);

  const handleOpenComplete = (machine: any) => {
    setSelectedMachine(machine);
    setPhotos({ photo1: null, photo2: null, photo3: null, photo4: null });
    setPhotoPreviews({});
    setSelectedWarehouse('');
    setCompleteModalOpen(true);
  };

  const handlePhotoChange = async (field: string, file: File) => {
    const compressed = await compressImage(file);
    if (!compressed) return;
    setPhotos((prev) => ({ ...prev, [field]: compressed.file }));
    setPhotoPreviews((prev) => ({
      ...prev,
      [field]: compressed.url
    }));
  };

  const allPhotosReady =
    photos.photo1 && photos.photo2 && photos.photo3 && photos.photo4;

  const canSubmit = allPhotosReady && selectedWarehouse;

  const handleSubmitComplete = async () => {
    if (!allPhotosReady || !selectedMachine || !selectedWarehouse) return;
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('warehouseMachineId', selectedMachine._id);
    formData.append('warehouseId', selectedWarehouse);
    formData.append('photo1', photos.photo1);
    formData.append('photo2', photos.photo2);
    formData.append('photo3', photos.photo3);
    formData.append('photo4', photos.photo4);

    const result = await completeConditioning(formData);
    setIsSubmitting(false);

    if (!result.error) {
      setCompleteModalOpen(false);
      setSelectedMachine(null);
      enqueueSnackbar(result.msg, {
        variant: 'success',
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
        autoHideDuration: 2000
      });
    } else {
      enqueueSnackbar(result.msg, {
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
        autoHideDuration: 2000
      });
    }
  };

  const handleCloseComplete = () => {
    // Revoke object URLs
    Object.values(photoPreviews).forEach((url) => {
      if (url) URL.revokeObjectURL(url);
    });
    setCompleteModalOpen(false);
    setSelectedMachine(null);
    setPhotos({ photo1: null, photo2: null, photo3: null, photo4: null });
    setPhotoPreviews({});
    setSelectedWarehouse('');
  };

  return (
    <>
      <Card>
        <CardHeader title={`Acondicionamiento (${(listData || []).length})`} />
        <Divider />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>#Ingreso</TableCell>
                <TableCell>Marca</TableCell>
                <TableCell>N. Serie</TableCell>
                <TableCell>Origen</TableCell>
                {['ADMIN', 'AUX'].includes(userRole) && (
                  <TableCell>Técnico</TableCell>
                )}
                <TableCell>Fotos ingreso</TableCell>
                <TableCell>Tiempo</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedMachines.map((machine) => (
                <TableRow hover key={machine._id}>
                  <TableCell>
                    <Typography variant="body1" fontWeight="bold" color="text.primary" noWrap>
                      #{machine.entryNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1" color="text.primary" noWrap>
                      {machine.brand}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {machine.serialNumber || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>{getOriginChip(machine.origin)}</TableCell>
                  {['ADMIN', 'AUX'].includes(userRole) && (
                    <TableCell>
                      <Typography variant="body2" color="text.primary" noWrap>
                        {machine.assignedTechnician?.name || 'Sin asignar'}
                      </Typography>
                    </TableCell>
                  )}
                  <TableCell>
                    {machine.entryPhotos?.length > 0 && (
                      <AvatarGroup max={4}>
                        {machine.entryPhotos.map((url, i) => (
                          <Avatar
                            key={i}
                            src={url}
                            sx={{ width: 32, height: 32, cursor: 'pointer' }}
                            onClick={() => window.open(url, '_blank')}
                          />
                        ))}
                      </AvatarGroup>
                    )}
                  </TableCell>
                  <TableCell>
                    {getTimerChip(machine.techAssignedAt)}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Completar acondicionamiento" arrow>
                      <IconButton
                        sx={{
                          '&:hover': {
                            background: theme.colors.success.lighter
                          },
                          color: theme.palette.success.main
                        }}
                        color="inherit"
                        size="small"
                        onClick={() => handleOpenComplete(machine)}
                      >
                        <CheckCircleIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedMachines.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={['ADMIN', 'AUX'].includes(userRole) ? 8 : 7}
                    align="center"
                  >
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                      No hay máquinas en acondicionamiento
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Box p={2}>
          <TablePagination
            component="div"
            count={(listData || []).length}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleLimitChange}
            page={page}
            rowsPerPage={limit}
            rowsPerPageOptions={[5, 10, 25]}
            labelRowsPerPage="Filas por página"
          />
        </Box>
      </Card>

      {/* Complete conditioning modal */}
      {completeModalOpen && selectedMachine && (
        <Dialog
          open={completeModalOpen}
          onClose={handleCloseComplete}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Completar acondicionamiento</DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 2, mt: 1 }}>
              Máquina <strong>#{selectedMachine.entryNumber}</strong> — {selectedMachine.brand}
              {selectedMachine.serialNumber ? ` (Serie: ${selectedMachine.serialNumber})` : ''}
            </Alert>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Suba las 4 fotos del equipo acondicionado. Estas fotos se usarán
              como las fotos del equipo de venta.
            </Typography>
            <FormControl fullWidth required sx={{ mb: 2 }}>
              <InputLabel>Ubicación del equipo</InputLabel>
              <Select
                value={selectedWarehouse}
                label="Ubicación del equipo"
                onChange={(e) => setSelectedWarehouse(e.target.value as string)}
              >
                {(warehousesList || []).map((wh) => (
                  <MenuItem key={wh._id} value={wh._id}>
                    {wh.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Grid container spacing={2}>
              {PHOTO_LABELS.map((label, idx) => {
                const field = `photo${idx + 1}`;
                const preview = photoPreviews[field];
                return (
                  <Grid item xs={6} key={field}>
                    <Box
                      sx={{
                        border: '2px dashed',
                        borderColor: photos[field]
                          ? theme.palette.success.main
                          : theme.palette.grey[400],
                        borderRadius: 1,
                        p: 1,
                        textAlign: 'center',
                        minHeight: 120,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {preview ? (
                        <Box>
                          <img
                            src={preview}
                            alt={label}
                            style={{
                              maxWidth: '100%',
                              maxHeight: 80,
                              objectFit: 'contain'
                            }}
                          />
                          <Typography variant="caption" display="block">
                            {label}
                          </Typography>
                        </Box>
                      ) : (
                        <>
                          <PhotoCameraIcon
                            sx={{ fontSize: 32, color: theme.palette.grey[400], mb: 0.5 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {label} *
                          </Typography>
                        </>
                      )}
                      <Button
                        component="label"
                        size="small"
                        sx={{ mt: 0.5 }}
                      >
                        {photos[field] ? 'Cambiar' : 'Subir'}
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handlePhotoChange(field, e.target.files[0]);
                            }
                          }}
                        />
                      </Button>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseComplete} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={handleSubmitComplete}
              disabled={!canSubmit || isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} /> : <CheckCircleIcon />}
            >
              {isSubmitting ? 'Completando...' : 'Completar'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
};

TablaAcondicionamiento.propTypes = {
  listData: PropTypes.array.isRequired,
  userRole: PropTypes.string.isRequired,
  warehousesList: PropTypes.array.isRequired
};

export default TablaAcondicionamiento;
