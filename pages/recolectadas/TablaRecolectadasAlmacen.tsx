import { FC, useState, ChangeEvent } from 'react';
import {
  Typography,
  Card,
  CardHeader,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TableContainer,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  MenuItem,
  Box
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import DownloadIcon from '@mui/icons-material/Download';
import { useGetWarehouseMachines, useGetAllWarehousesOverview, getFetcher } from '../api/useRequest';
import { formatTZDate } from 'lib/client/utils';
import { receiveWarehouseMachine } from 'lib/client/warehouseMachinesFetch';
import { useSnackbar } from 'notistack';
import MachineEntryNumberCell, {
  getDisplayMachineNum
} from '@/components/MachineEntryNumberCell';

interface Props {
  className?: string;
  userRole?: string;
}

const TablaRecolectadasAlmacen: FC<Props> = ({ userRole }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(10);
  const [selectedMachine, setSelectedMachine] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { warehouseMachines, isLoadingWarehouseMachines } =
    useGetWarehouseMachines(getFetcher, 'EN_VEHICULO');

  const { warehousesList } = useGetAllWarehousesOverview(getFetcher);

  const handlePageChange = (event: any, newPage: number): void => {
    event?.preventDefault();
    setPage(newPage);
  };

  const handleLimitChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setLimit(parseInt(event.target.value));
  };

  const handleOpenModal = (machine: any) => {
    setSelectedMachine(machine);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedMachine(null);
    setSelectedWarehouse('');
    setCurrentImageIndex(0);
  };

  const handleConfirmReceive = async () => {
    if (!selectedWarehouse) return;
    setIsReceiving(true);
    const result = await receiveWarehouseMachine(selectedMachine._id, selectedWarehouse);
    setIsReceiving(false);

    enqueueSnackbar(result.msg, {
      variant: !result.error ? 'success' : 'error',
      anchorOrigin: { vertical: 'top', horizontal: 'center' },
      autoHideDuration: 2000
    });

    if (!result.error) {
      setModalOpen(false);
      setSelectedMachine(null);
    }
  };

  if (isLoadingWarehouseMachines) {
    return <div>Cargando...</div>;
  }

  const machines = warehouseMachines || [];
  const paginatedMachines = machines.slice(page * limit, (page + 1) * limit);

  const images = selectedMachine?.entryPhotos || [];
  const currentImage = images[currentImageIndex];

  const handleNextImage = () => {
    if (currentImageIndex < images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const handlePrevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  return (
    <>
      <Card>
        <CardHeader title="Máquinas de Almacén en Vehículo" />
        <Divider />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Ingreso #</TableCell>
                <TableCell>Marca</TableCell>
                <TableCell>No. Serie</TableCell>
                <TableCell>Origen</TableCell>
                <TableCell>Operador</TableCell>
                <TableCell>Fecha Registro</TableCell>
                {['ADMIN', 'AUX'].includes(userRole) && (
                  <TableCell align="center">Acciones</TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedMachines.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={['ADMIN', 'AUX'].includes(userRole) ? 7 : 6}
                    align="center"
                  >
                    <Typography variant="body1" color="text.secondary">
                      No hay máquinas de almacén en vehículos.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedMachines.map((machine) => (
                  <TableRow hover key={machine._id}>
                    <TableCell>
                      <MachineEntryNumberCell machine={machine} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" fontWeight="bold" noWrap>
                        {machine.brand}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" noWrap>
                        {machine.serialNumber || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          machine.origin === 'COMPRA_CALLE'
                            ? 'Compra en calle'
                            : machine.origin === 'REPUESTA'
                            ? 'Repuesta'
                            : machine.origin
                        }
                        color={
                          machine.origin === 'COMPRA_CALLE'
                            ? 'info'
                            : 'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" noWrap>
                        {machine.currentVehicle?.operator?.name || machine.purchasedBy?.name || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" noWrap>
                        {machine.createdAt
                          ? formatTZDate(
                              new Date(machine.createdAt),
                              'DD/MM/YYYY hh:mm A'
                            )
                          : '-'}
                      </Typography>
                    </TableCell>
                    {['ADMIN', 'AUX'].includes(userRole) && (
                      <TableCell align="center">
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          startIcon={<DownloadIcon />}
                          onClick={() => handleOpenModal(machine)}
                        >
                          Bajar
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={machines.length}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleLimitChange}
          page={page}
          rowsPerPage={limit}
          rowsPerPageOptions={[5, 10, 25, 30]}
        />
      </Card>

      {modalOpen && selectedMachine && (
        <Dialog open={modalOpen} fullWidth maxWidth="xs">
          <DialogTitle>Recibir máquina de almacén</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              {`Máquina #${getDisplayMachineNum(selectedMachine)} (${selectedMachine.brand}). Seleccione la ubicación donde se bajará el equipo:`}
            </DialogContentText>
            {images.length > 0 && (
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Fotos del Equipo
                </Typography>
                <img
                  src={currentImage as string}
                  alt={`Foto ${currentImageIndex + 1}`}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '300px',
                    borderRadius: '8px'
                  }}
                />
                {images.length > 1 && (
                  <Box
                    sx={{
                      mt: 1,
                      display: 'flex',
                      justifyContent: 'center',
                      gap: 1
                    }}
                  >
                    <Button
                      size="small"
                      onClick={handlePrevImage}
                      disabled={currentImageIndex === 0}
                    >
                      Anterior
                    </Button>
                    <Typography variant="caption" sx={{ alignSelf: 'center' }}>
                      {currentImageIndex + 1} / {images.length}
                    </Typography>
                    <Button
                      size="small"
                      onClick={handleNextImage}
                      disabled={currentImageIndex === images.length - 1}
                    >
                      Siguiente
                    </Button>
                  </Box>
                )}
              </Box>
            )}
            <TextField
              select
              fullWidth
              label="Ubicación (Bodega)"
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
            >
              {warehousesList?.map((wh) => (
                <MenuItem key={wh._id} value={wh._id}>
                  {wh.name}
                </MenuItem>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions>
            {!isReceiving && (
              <Button variant="outlined" onClick={handleCloseModal}>
                Cancelar
              </Button>
            )}
            <LoadingButton
              loading={isReceiving}
              disabled={!selectedWarehouse}
              variant="contained"
              color="success"
              onClick={handleConfirmReceive}
            >
              Confirmar
            </LoadingButton>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
};

export default TablaRecolectadasAlmacen;
