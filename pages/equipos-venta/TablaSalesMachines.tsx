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
  CardHeader,
  Chip
} from '@mui/material';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import SellIcon from '@mui/icons-material/Sell';
import { useSnackbar } from 'notistack';
import { deleteSalesMachines } from '../../lib/client/salesMachinesFetch';

interface TablaSalesMachinesProps {
  userRole: string;
  salesMachinesList: any[];
  onUpdate: () => void;
}

const getStatusChip = (status: string) => {
  switch (status) {
    case 'DISPONIBLE':
      return (
        <Chip
          icon={<CheckCircleOutlineIcon />}
          label="Disponible"
          color="success"
          size="small"
          sx={{ fontWeight: 'bold' }}
        />
      );
    case 'PENDIENTE':
      return (
        <Chip
          icon={<HourglassEmptyIcon />}
          label="Pendiente"
          color="warning"
          size="small"
          sx={{ fontWeight: 'bold' }}
        />
      );
    case 'VENDIDO':
      return (
        <Chip
          icon={<SellIcon />}
          label="Vendido"
          color="error"
          size="small"
          sx={{ fontWeight: 'bold' }}
        />
      );
    default:
      return (
        <Chip
          icon={<CheckCircleOutlineIcon />}
          label="Disponible"
          color="success"
          size="small"
          sx={{ fontWeight: 'bold' }}
        />
      );
  }
};

const TablaSalesMachines: FC<TablaSalesMachinesProps> = ({
  userRole,
  salesMachinesList,
  onUpdate
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(10);

  const handlePageChange = (_event: any, newPage: number): void => {
    setPage(newPage);
  };

  const handleLimitChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setLimit(parseInt(event.target.value));
  };

  const handleDelete = async (machineId: string) => {
    if (window.confirm('¿Está seguro de eliminar este equipo de venta?')) {
      const result = await deleteSalesMachines([machineId]);
      if (!result.error) {
        enqueueSnackbar(result.msg, {
          variant: 'success',
          anchorOrigin: {
            vertical: 'top',
            horizontal: 'center'
          },
          autoHideDuration: 1500
        });
        onUpdate();
      } else {
        enqueueSnackbar(result.msg, {
          variant: 'error',
          anchorOrigin: {
            vertical: 'top',
            horizontal: 'center'
          },
          autoHideDuration: 2000
        });
      }
    }
  };

  const paginatedMachines = salesMachinesList ? salesMachinesList.slice(
    page * limit,
    page * limit + limit
  ) : [];

  return (
    <Card>
      <CardHeader title="Equipos de Venta" />
      <Divider />
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Número</TableCell>
              <TableCell>Marca</TableCell>
              <TableCell>Capacidad</TableCell>
              <TableCell>Costo</TableCell>
              <TableCell>Número de Serie</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedMachines.map((machine) => {
              return (
                <TableRow hover key={machine._id}>
                  <TableCell>
                    <Typography
                      variant="body1"
                      fontWeight="bold"
                      color="text.primary"
                      gutterBottom
                      noWrap
                    >
                      #{machine.machineNum}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body1"
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
                      color="text.secondary"
                      gutterBottom
                      noWrap
                    >
                      {machine.capacity || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body1"
                      color="text.primary"
                      gutterBottom
                      noWrap
                    >
                      ${machine.cost.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      gutterBottom
                      noWrap
                    >
                      {machine.serialNumber || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {getStatusChip(machine.status)}
                  </TableCell>
                  <TableCell align="right">
                    {!machine.isSold && machine.status === 'DISPONIBLE' && userRole === 'ADMIN' && (
                      <Tooltip title="Eliminar" arrow>
                        <IconButton
                          sx={{
                            '&:hover': {
                              background: 'error.light'
                            },
                            color: 'error.main'
                          }}
                          color="inherit"
                          size="small"
                          onClick={() => handleDelete(machine._id)}
                        >
                          <DeleteTwoToneIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
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
          count={salesMachinesList?.length || 0}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleLimitChange}
          page={page}
          rowsPerPage={limit}
          rowsPerPageOptions={[5, 10, 25, 30]}
        />
      </Box>
    </Card>
  );
};

TablaSalesMachines.propTypes = {
  salesMachinesList: PropTypes.array.isRequired
};

export default TablaSalesMachines;
