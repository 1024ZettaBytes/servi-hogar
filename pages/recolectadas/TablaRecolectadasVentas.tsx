
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
  Button
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { useGetCollectedSalesMachines, getFetcher } from '../api/useRequest';
import { formatTZDate } from 'lib/client/utils';
import BajarEquipoModal from '@/components/BajarEquipoModal';
import { receiveSalesMachine } from 'lib/client/salesMachinesFetch';
import { useSnackbar } from 'notistack';

interface RecolectadasVentasTableProps {
  className?: string;
  userRole?: string;
}

const TablaRecolectadasVentas: FC<RecolectadasVentasTableProps> = ({ userRole }) => {

  const { enqueueSnackbar } = useSnackbar();
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(10);
  const [selectedMachine, setSelectedMachine] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);

  const { collectedSalesMachines, isLoadingCollectedSalesMachines } = useGetCollectedSalesMachines(getFetcher);

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
  };

  const handleConfirmReceive = async (arrived: boolean) => {
    setIsReceiving(true);
    const result = await receiveSalesMachine(selectedMachine._id, arrived);
    setIsReceiving(false);

    enqueueSnackbar(result.msg, {
      variant: !result.error ? 'success' : 'error',
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'center'
      },
      autoHideDuration: 2000
    });

    if (!result.error) {
      setModalOpen(false);
      setSelectedMachine(null);
    }
  };

  if (isLoadingCollectedSalesMachines) {
    return <div>Cargando...</div>;
  }

  const machines = collectedSalesMachines || [];
  const paginatedMachines = machines.slice(page * limit, (page + 1) * limit);

  if (machines.length === 0) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader
          title={'Equipos de Venta Recolectados'}
          subheader="Equipos recolectados por cancelación de venta"
        />
        <Divider />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Equipo #</TableCell>
                <TableCell>Marca</TableCell>
                <TableCell>Motivo de Recolección</TableCell>
                <TableCell>Operador</TableCell>
                <TableCell>Fecha y Hora</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedMachines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body1" color="text.secondary">
                      No hay equipos de venta recolectados.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedMachines.map((machine) => (
                  <TableRow hover key={machine._id}>
                    <TableCell>
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        color="text.primary"
                        gutterBottom
                        noWrap
                      >
                        {machine.machineNum}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        color="text.primary"
                        gutterBottom
                        noWrap
                      >
                        {machine.brand}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        color="text.primary"
                        gutterBottom
                        noWrap
                      >
                        {machine.collectionReason || 'Cancelación de venta'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        color="text.primary"
                        gutterBottom
                        noWrap
                      >
                        {machine.operator?.name || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        color="text.primary"
                        gutterBottom
                        noWrap
                      >
                        {machine.collectionDate ? formatTZDate(machine.collectionDate, 'DD/MM/YYYY hh:mm A') : '-'}
                      </Typography>
                    </TableCell>
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
        <BajarEquipoModal
          open={modalOpen}
          machine={selectedMachine}
          pickupImages={selectedMachine?.pickupImages}
          isLoading={isReceiving}
          onClose={handleCloseModal}
          onConfirm={handleConfirmReceive}
          userRole={userRole}
        />
      )}
    </>
  );
};

export default TablaRecolectadasVentas;
