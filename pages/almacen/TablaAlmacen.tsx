import { FC, ChangeEvent, useState } from 'react';
import * as str from 'string';
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
  TextField,
  InputAdornment,
  Chip,
  Avatar,
  AvatarGroup,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import BuildIcon from '@mui/icons-material/Build';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import DeconstructIcon from '@mui/icons-material/ConstructionOutlined';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import { useSnackbar } from 'notistack';
import { formatTZDate } from 'lib/client/utils';
import {
  WAREHOUSE_MACHINE_ORIGIN_LABELS,
  WAREHOUSE_ORIGIN_COLORS,
  WAREHOUSE_MACHINE_STATUS_LABELS
} from '../../lib/consts/OBJ_CONTS';
import GenericModal from '@/components/GenericModal';
import {
  deleteWarehouseMachine,
  dismantleWarehouseMachine,
  moveToSale
} from '../../lib/client/warehouseMachinesFetch';

interface TablaAlmacenProps {
  userRole: string;
  isSuperUser?: boolean;
  machinesList: any[];
  onUpdate: () => void;
  tabFilter?: string;
  onAssignTech?: (machine: any) => void;
  onLoadToVehicle?: (machine: any) => void;
}

const compareStringsForFilter = (keyWord: string, field: string) => {
  return str(field)
    .latinise()
    .toLowerCase()
    .includes(str(keyWord).latinise().toLowerCase());
};

const getOriginChip = (origin: string) => {
  const label = WAREHOUSE_MACHINE_ORIGIN_LABELS[origin] || origin;
  const color = WAREHOUSE_ORIGIN_COLORS[origin] || 'default';
  return <Chip label={label} color={color as any} size="small" />;
};

const getStatusChip = (status: string) => {
  const label = WAREHOUSE_MACHINE_STATUS_LABELS[status] || status;
  let color: any = 'default';
  switch (status) {
    case 'ALMACENADA':
      color = 'primary';
      break;
    case 'EN_VEHICULO':
      color = 'info';
      break;
    case 'EN_ACONDICIONAMIENTO':
      color = 'warning';
      break;
    case 'ACONDICIONADA':
      color = 'success';
      break;
    case 'LISTA_VENTA':
      color = 'success';
      break;
    case 'DESMANTELADA':
      color = 'error';
      break;
    case 'ASIGNADA_RENTA':
      color = 'secondary';
      break;
    case 'CONVERTIDA_VENTA':
      color = 'success';
      break;
  }
  return <Chip label={label} color={color} size="small" />;
};

const applyPagination = (list: any[], page: number, limit: number): any[] => {
  return list.slice(page * limit, page * limit + limit);
};

const TablaAlmacen: FC<TablaAlmacenProps> = ({
  userRole,
  isSuperUser,
  machinesList,
  onUpdate,
  tabFilter,
  onAssignTech,
  onLoadToVehicle
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(10);
  const [filter, setFilter] = useState<string>('');
  const [originFilter, setOriginFilter] = useState<string>('ALL');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [machineToDelete, setMachineToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dismantleModalOpen, setDismantleModalOpen] = useState(false);
  const [machineToDismantle, setMachineToDismantle] = useState(null);
  const [isDismantling, setIsDismantling] = useState(false);
  const [saleModalOpen, setSaleModalOpen] = useState(false);
  const [machineToSale, setMachineToSale] = useState(null);
  const [isMovingToSale, setIsMovingToSale] = useState(false);

  const handlePageChange = (_event: any, newPage: number): void => {
    setPage(newPage);
  };

  const handleLimitChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setLimit(parseInt(event.target.value));
    setPage(0);
  };

  const filteredMachines = machinesList
    ? machinesList.filter((m) => {
        // Apply origin filter
        if (originFilter !== 'ALL' && m.origin !== originFilter) return false;
        // Apply text filter
        if (!filter || filter === '') return true;
        return (
          compareStringsForFilter(filter, m.brand) ||
          compareStringsForFilter(filter, m.serialNumber) ||
          compareStringsForFilter(filter, String(m.entryNumber)) ||
          (m.purchasedBy && compareStringsForFilter(filter, m.purchasedBy.name))
        );
      })
    : [];

  const paginatedMachines = applyPagination(filteredMachines, page, limit);

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteWarehouseMachine(machineToDelete._id);
    setIsDeleting(false);
    setDeleteModalOpen(false);
    setMachineToDelete(null);
    if (!result.error) {
      enqueueSnackbar(result.msg, {
        variant: 'success',
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
        autoHideDuration: 1500
      });
      onUpdate();
    } else {
      enqueueSnackbar(result.msg, {
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
        autoHideDuration: 2000
      });
    }
  };

  const handleDismantle = async () => {
    setIsDismantling(true);
    const result = await dismantleWarehouseMachine(machineToDismantle._id);
    setIsDismantling(false);
    setDismantleModalOpen(false);
    setMachineToDismantle(null);
    if (!result.error) {
      enqueueSnackbar(result.msg, {
        variant: 'success',
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
        autoHideDuration: 1500
      });
      onUpdate();
    } else {
      enqueueSnackbar(result.msg, {
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
        autoHideDuration: 2000
      });
    }
  };

  const handleMoveToSale = async () => {
    setIsMovingToSale(true);
    const result = await moveToSale(machineToSale._id);
    setIsMovingToSale(false);
    setSaleModalOpen(false);
    setMachineToSale(null);
    if (!result.error) {
      enqueueSnackbar(result.msg, {
        variant: 'success',
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
        autoHideDuration: 1500
      });
      onUpdate();
    } else {
      enqueueSnackbar(result.msg, {
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
        autoHideDuration: 2000
      });
    }
  };

  const showOriginFilter =
    ['ALMACENADA', 'ACONDICIONADA'].includes(tabFilter) || !tabFilter;

  return (
    <Card>
      <CardHeader
        action={
          <Box display="flex" gap={2} alignItems="center">
            {showOriginFilter && (
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Origen</InputLabel>
                <Select
                  value={originFilter}
                  label="Origen"
                  onChange={(e) => {
                    setOriginFilter(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="ALL">Todos</MenuItem>
                  <MenuItem value="NUEVA">Nueva (Mexicali)</MenuItem>
                  <MenuItem value="REPUESTA">Repuesta</MenuItem>
                  <MenuItem value="COMPRA_CALLE">Compra en calle</MenuItem>
                </Select>
              </FormControl>
            )}
            <TextField
              size="small"
              placeholder="Buscar..."
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setPage(0);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Box>
        }
        title={`${filteredMachines.length} máquina(s)`}
      />
      <Divider />
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>#Ingreso</TableCell>
              <TableCell>Marca</TableCell>
              <TableCell>N. Serie</TableCell>
              <TableCell>Origen</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Fotos</TableCell>
              <TableCell>Fecha ingreso</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedMachines.map((machine) => (
              <TableRow hover key={machine._id}>
                <TableCell>
                  <Typography
                    variant="body1"
                    fontWeight="bold"
                    color="text.primary"
                    noWrap
                  >
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
                <TableCell>{getStatusChip(machine.status)}</TableCell>
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
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {formatTZDate(new Date(machine.createdAt), 'DD/MMM/YYYY')}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  {['ADMIN', 'AUX'].includes(userRole) &&
                    machine.status === 'ALMACENADA' && (
                      <>
                        <Tooltip title="Asignar técnico" arrow>
                          <IconButton
                            sx={{
                              '&:hover': {
                                background: theme.colors.warning.lighter
                              },
                              color: theme.palette.warning.main
                            }}
                            color="inherit"
                            size="small"
                            onClick={() =>
                              onAssignTech && onAssignTech(machine)
                            }
                          >
                            <BuildIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {isSuperUser && (
                          <Tooltip title="Desmantelar" arrow>
                            <IconButton
                              sx={{
                                '&:hover': {
                                  background: theme.colors.error.lighter
                                },
                                color: theme.palette.error.dark
                              }}
                              color="inherit"
                              size="small"
                              onClick={() => {
                                setMachineToDismantle(machine);
                                setDismantleModalOpen(true);
                              }}
                            >
                              <DeconstructIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {/*
                      <Tooltip title="Eliminar" arrow>
                        <IconButton
                          sx={{
                            '&:hover': {
                              background: theme.colors.error.lighter
                            },
                            color: theme.palette.error.main
                          }}
                          color="inherit"
                          size="small"
                          onClick={() => {
                            setMachineToDelete(machine);
                            setDeleteModalOpen(true);
                          }}
                        >
                          <DeleteTwoToneIcon fontSize="small" />
                        </IconButton>
                      </Tooltip> */}
                      </>
                    )}
                  {['ADMIN', 'AUX'].includes(userRole) &&
                    machine.status === 'ACONDICIONADA' && (
                      <>
                        <Tooltip title="Cargar a vehículo" arrow>
                          <IconButton
                            sx={{
                              '&:hover': {
                                background: theme.colors.info.lighter
                              },
                              color: theme.palette.info.main
                            }}
                            color="inherit"
                            size="small"
                            onClick={() =>
                              onLoadToVehicle && onLoadToVehicle(machine)
                            }
                          >
                            <LocalShippingIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Pasar a venta" arrow>
                          <IconButton
                            sx={{
                              '&:hover': {
                                background: theme.colors.success.lighter
                              },
                              color: theme.palette.success.main
                            }}
                            color="inherit"
                            size="small"
                            onClick={() => {
                              setMachineToSale(machine);
                              setSaleModalOpen(true);
                            }}
                          >
                            <ShoppingBagIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                            {isSuperUser && (
                        <Tooltip title="Desmantelar" arrow>
                          <IconButton
                            sx={{
                              '&:hover': {
                                background: theme.colors.error.lighter
                              },
                              color: theme.palette.error.dark
                            }}
                            color="inherit"
                            size="small"
                            onClick={() => {
                              setMachineToDismantle(machine);
                              setDismantleModalOpen(true);
                            }}
                          >
                            <DeconstructIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>)}
                      </>
                    )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box p={2}>
        <TablePagination
          component="div"
          count={filteredMachines.length}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleLimitChange}
          page={page}
          rowsPerPage={limit}
          rowsPerPageOptions={[5, 10, 25]}
          labelRowsPerPage="Filas por página"
        />
      </Box>
      {deleteModalOpen && (
        <GenericModal
          open={deleteModalOpen}
          title="Eliminar máquina"
          requiredReason={false}
          text={`¿Está seguro de eliminar la máquina #${machineToDelete?.entryNumber} (${machineToDelete?.brand})?`}
          isLoading={isDeleting}
          onAccept={handleDelete}
          onCancel={() => {
            setDeleteModalOpen(false);
            setMachineToDelete(null);
          }}
        />
      )}
      {dismantleModalOpen && (
        <GenericModal
          open={dismantleModalOpen}
          title="Desmantelar máquina"
          requiredReason={false}
          text={`¿Está seguro de desmantelar la máquina #${machineToDismantle?.entryNumber} (${machineToDismantle?.brand})? Esta acción es irreversible.`}
          isLoading={isDismantling}
          onAccept={handleDismantle}
          onCancel={() => {
            setDismantleModalOpen(false);
            setMachineToDismantle(null);
          }}
        />
      )}
      {saleModalOpen && (
        <GenericModal
          open={saleModalOpen}
          title="Pasar a venta"
          requiredReason={false}
          text={`¿Está seguro de pasar la máquina #${machineToSale?.entryNumber} (${machineToSale?.brand}) a la lista de venta? Se creará un equipo de venta a partir de esta máquina.`}
          isLoading={isMovingToSale}
          onAccept={handleMoveToSale}
          onCancel={() => {
            setSaleModalOpen(false);
            setMachineToSale(null);
          }}
        />
      )}
    </Card>
  );
};

TablaAlmacen.propTypes = {
  userRole: PropTypes.string.isRequired,
  isSuperUser: PropTypes.bool,
  machinesList: PropTypes.array.isRequired,
  onUpdate: PropTypes.func.isRequired,
  tabFilter: PropTypes.string,
  onAssignTech: PropTypes.func,
  onLoadToVehicle: PropTypes.func
};

export default TablaAlmacen;
