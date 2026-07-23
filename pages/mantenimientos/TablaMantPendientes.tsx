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
  useTheme,
  CardHeader,
  Chip,
  Typography
} from '@mui/material';
import NotificationImportantIcon from '@mui/icons-material/NotificationImportant';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';

import VisibilityIcon from '@mui/icons-material/Visibility';
import DoNotDisturbOnOutlinedIcon from '@mui/icons-material/DoNotDisturbOnOutlined';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import DoneOutlineIcon from '@mui/icons-material/DoneOutline';

import EditIcon from '@mui/icons-material/Edit';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { reassignMantTechnician } from '../../lib/client/mantainanacesFetch';
import NextLink from 'next/link';

export const getStatusLabel = (status) => {
  switch (status) {
    case 'PENDIENTE':
      return (
        <Chip
          icon={<PendingActionsIcon fontSize="small" />}
          label="Pendiente"
          color="warning"
          size="small"
        ></Chip>
      );
    case 'FINALIZADO':
    case 'COMPLETADA':
      return (
        <Chip
          icon={<DoneOutlineIcon fontSize="small" />}
          label="Completado"
          color="success"
          size="small"
        ></Chip>
      );
    case 'CANCELADO':
    case 'CANCELADA':
      return (
        <Chip
          icon={<DoNotDisturbOnOutlinedIcon fontSize="small" />}
          label="Cancelado"
          color="error"
          size="small"
        ></Chip>
      );
    case 'ALERTA':
      return (
        <Chip
          icon={<NotificationImportantIcon fontSize="small" />}
          label="LLAMAR A ADMINISTRADOR"
          color="error"
          size="small"
        ></Chip>
      );
  }
};

interface TablaMantPendientesProps {
  className?: string;
  listData: any[];
  userRole: string;
  techniciansList?: any[];
  isBlocked?: boolean;
}

const applyPagination = (
  rentList: any[],
  page: number,
  limit: number
): any[] => {
  return rentList.slice(page * limit, page * limit + limit);
};

const TablaMantPendientes: FC<TablaMantPendientesProps> = ({
  listData,
  userRole,
  techniciansList = [],
  isBlocked = false
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(30);
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [selectedMant, setSelectedMant] = useState<any>(null);
  const [selectedTechnician, setSelectedTechnician] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePageChange = (_event: any, newPage: number): void => {
    setPage(newPage);
  };

  const handleLimitChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setLimit(parseInt(event.target.value));
  };

  const handleOpenReassignModal = (mant: any) => {
    setSelectedMant(mant);
    setSelectedTechnician(mant?.takenBy?._id || '');
    setReassignModalOpen(true);
  };

  const handleCloseReassignModal = () => {
    setReassignModalOpen(false);
    setSelectedMant(null);
    setSelectedTechnician('');
  };

  const handleSubmitReassign = async () => {
    if (!selectedMant || !selectedTechnician) return;
    setIsSubmitting(true);
    const result = await reassignMantTechnician({
      mantId: selectedMant._id,
      technicianId: selectedTechnician,
      type: selectedMant.type
    });
    setIsSubmitting(false);
    if (!result.error) {
      enqueueSnackbar(result.msg, { variant: 'success' });
      handleCloseReassignModal();
    } else {
      enqueueSnackbar(result.msg, { variant: 'error' });
    }
  };

  const paginatedMants = applyPagination(listData, page, limit);

  const theme = useTheme();
  const isAdmin = userRole === 'ADMIN';
  const isAdminOrAux = ['ADMIN', 'AUX'].includes(userRole);
  const canComplete = !isBlocked && (isAdmin || !listData.some((m) => m.daysSinceCreate >= 3));
  return (
    <>
      <Card>
        <CardHeader
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap'
          }}
          title="Pendientes"
        />

        <Divider />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="center">Equipo</TableCell>
                <TableCell align="center">Estado</TableCell>
                <TableCell align="center">Días Transcurridos</TableCell>
                {isAdminOrAux && <TableCell align="center">Técnico</TableCell>}
                <TableCell align="center"></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedMants.map((mant) => {
                const isSaleRepair = mant?.type === 'SALE';
                const detailUrl = isSaleRepair 
                  ? `/reparaciones-ventas/${mant?._id}` 
                  : `/mantenimientos/${mant?._id}`;
                
                return (
                  <TableRow
                    key={mant?._id}
                    sx={
                      !canComplete
                        ? { backgroundColor: theme.colors.error.lighter }
                        : {}
                    }
                  >
                    <TableCell align="center">
                      <Typography fontWeight="bold">
                        {mant?.machine?.machineNum}
                      </Typography>
                      {isSaleRepair && (
                        <Chip
                          label="Venta"
                          size="small"
                          color="info"
                          sx={{ ml: 1, fontSize: '0.7rem' }}
                        />
                      )}
                      {mant?.fromOperatorSkip && (
                        <Chip
                          icon={<ReportProblemIcon fontSize="small" />}
                          label="Reporte chofer"
                          size="small"
                          color="error"
                          variant="outlined"
                          sx={{ ml: 1, fontSize: '0.7rem' }}
                        />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {getStatusLabel(canComplete ? mant?.status : 'ALERTA')}
                    </TableCell>
                    <TableCell align="center">
                      {mant?.daysSinceCreate}
                    </TableCell>
                    {isAdminOrAux && (
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                          <Typography variant="body2" color="text.primary" noWrap>
                            {mant?.takenBy?.name || 'Sin asignar'}
                          </Typography>
                          <Tooltip title={mant?.takenBy ? 'Cambiar técnico' : 'Asignar técnico'} arrow>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleOpenReassignModal(mant)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    )}
                    <TableCell align="center">
                      <NextLink href={detailUrl}>
                        <Tooltip title="Ver detalle" arrow>
                          <IconButton
                            disabled={!canComplete}
                            sx={{
                              '&:hover': {
                                background: theme.colors.primary.lighter
                              },
                              color: theme.colors.success.light
                            }}
                            color="inherit"
                            size="small"
                          >
                            <VisibilityIcon fontSize="medium" />
                          </IconButton>
                        </Tooltip>
                      </NextLink>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <Box p={2}>
          <TablePagination
            component="div"
            count={listData.length}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleLimitChange}
            page={page}
            rowsPerPage={limit}
            rowsPerPageOptions={
              listData.length > 100 ? [30, 100, listData.length] : [30, 100]
            }
          />
        </Box>
      </Card>

      {/* Modal Reasignación Técnico Mantenimiento */}
      {reassignModalOpen && selectedMant && (
        <Dialog
          open={reassignModalOpen}
          onClose={handleCloseReassignModal}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {selectedMant?.takenBy ? 'Cambiar técnico' : 'Asignar técnico'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 1 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Mantenimiento Equipo <strong>#{selectedMant?.machine?.machineNum}</strong>
                {selectedMant?.type === 'SALE' ? ' (Venta)' : ''}
              </Alert>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Seleccione el nuevo técnico asignado a este mantenimiento.
              </Typography>
              <FormControl fullWidth required>
                <InputLabel>Técnico</InputLabel>
                <Select
                  value={selectedTechnician}
                  label="Técnico"
                  onChange={(e) => setSelectedTechnician(e.target.value as string)}
                >
                  {techniciansList.map((tec) => (
                    <MenuItem key={tec._id} value={tec._id}>
                      {tec.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseReassignModal} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmitReassign}
              disabled={!selectedTechnician || isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
            >
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
};

TablaMantPendientes.propTypes = {
  listData: PropTypes.array.isRequired,
  userRole: PropTypes.string.isRequired,
  techniciansList: PropTypes.array
};

TablaMantPendientes.defaultProps = {
  listData: [],
  userRole: null,
  techniciansList: []
};

export default TablaMantPendientes;

