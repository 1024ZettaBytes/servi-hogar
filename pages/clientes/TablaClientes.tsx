import { FC, ChangeEvent, useState } from 'react';
import numeral from 'numeral';
import PropTypes from 'prop-types';
import {
  Tooltip,
  Divider,
  Box,
  FormControl,
  InputLabel,
  Card,
  Checkbox,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TableContainer,
  Select,
  MenuItem,
  Typography,
  useTheme,
  CardHeader
} from '@mui/material';

import Label from '@/components/Label';
import {  CustomerLevel } from '@/models/crypto_order';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import BulkActions from './BulkActions';

interface TablaClientesProps {
  className?: string;
  customerList: any[];
  levelsList: any[];
}

interface Filters {
  level?: CustomerLevel;
}
const getStatusLabel = (customerLevel: CustomerLevel): JSX.Element => {
  const map = {
    nuevo: {
      text: "Nuevo",
      color: 'secondary'
    },
    regular: {
      text: "Regular",
      color: 'info'
    },
    permanente: {
      text: "Permanente",
      color: 'success'
    },
    deudor: {
      text: "Deudor",
      color: 'warning'
    },
    conflictivo: {
      text: "Conflictivo",
      color: 'error'
    }
  };

  const { text, color }: any = map[customerLevel];

  return <Label color={color}>{text}</Label>;
};

const applyFilters = (
  customerList: any[],
  filters: Filters
): any[] => {
  return customerList.filter((customer) => {
    let matches = true;

    if (filters.level && customer.level.id !== filters.level) {
      matches = false;
    }
    return matches;
  });
};

const applyPagination = (
  customerList: any[],
  page: number,
  limit: number
): any[] => {
  return customerList.slice(page * limit, page * limit + limit);
};

const TablaClientes: FC<TablaClientesProps> = ({ customerList }) => {
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>(
    []
  );
  const selectedBulkActions = selectedCustomers.length > 0;
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(5);
  const [filters, setFilters] = useState<Filters>({
    level: null
  });

  const levelsOptions = [
    {
      id: 'todos',
      name: 'Todos'
    },
    {
      id: 'nuevo',
      name: 'Nuevo'
    },
    {
      id: 'regular',
      name: 'Regular'
    },
    {
      id: 'permanente',
      name: 'Permanente'
    },
    {
      id: 'deudor',
      name: 'Deudor'
    },
    {
      id: 'conflictivo',
      name: 'Conflictivo'
    }
  ];

  const handleStatusChange = (e: ChangeEvent<HTMLInputElement>): void => {
    let value = null;

    if (e.target.value !== 'all') {
      value = e.target.value;
    }

    setFilters((prevFilters) => ({
      ...prevFilters,
      level: value
    }));
  };

  const handleSelectAllCryptoOrders = (
    event: ChangeEvent<HTMLInputElement>
  ): void => {
    setSelectedCustomers(
      event.target.checked
        ? customerList.map((customer) => customer.curp)
        : []
    );
  };

  const handleSelectOneCustomer = (
    _event: ChangeEvent<HTMLInputElement>,
    customerCurp: string
  ): void => {
    if (!selectedCustomers.includes(customerCurp)) {
      setSelectedCustomers((prevSelected) => [
        ...prevSelected,
        customerCurp
      ]);
    } else {
      setSelectedCustomers((prevSelected) =>
        prevSelected.filter((id) => id !== customerCurp)
      );
    }
  };

  const handlePageChange = (_event: any, newPage: number): void => {
    setPage(newPage);
  };

  const handleLimitChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setLimit(parseInt(event.target.value));
  };

  const filteredCryptoOrders = applyFilters(customerList, filters);
  const paginatedCryptoOrders = applyPagination(
    filteredCryptoOrders,
    page,
    limit
  );
  const selectedSomeCryptoOrders =
    selectedCustomers.length > 0 &&
    selectedCustomers.length < customerList.length;
  const selectedAllCryptoOrders =
  selectedCustomers.length === customerList.length;
  const theme = useTheme();
  return (
    <Card>
      {selectedBulkActions && (
        <Box flex={1} p={2}>
          <BulkActions />
        </Box>
      )}
      {!selectedBulkActions && (
        <CardHeader
          action={
            <Box width={150}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Nivel</InputLabel>
                <Select
                  value={filters.level || 'todos'}
                  onChange={handleStatusChange}
                  label="Status"
                  autoWidth
                >
                  {levelsOptions.map((levelOption) => (
                    <MenuItem key={levelOption.id} value={levelOption.id}>
                      {levelOption.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          }
          title="Todos los Clientes"
        />
      )}
      <Divider />
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  color="primary"
                  checked={selectedAllCryptoOrders}
                  indeterminate={selectedSomeCryptoOrders}
                  onChange={handleSelectAllCryptoOrders}
                />
              </TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Celular</TableCell>
              <TableCell align="left">Domicilio</TableCell>
              <TableCell align="left">Sector</TableCell>
              <TableCell align="center">Nivel</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedCryptoOrders.map((customer) => {
              const isCryptoOrderSelected = selectedCustomers.includes(
                customer.curp
              );
              return (
                <TableRow
                  hover
                  key={customer.curp}
                  selected={isCryptoOrderSelected}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      color="primary"
                      checked={isCryptoOrderSelected}
                      onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        handleSelectOneCustomer(event, customer.curp)
                      }
                      value={isCryptoOrderSelected}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body1"
                      fontWeight="bold"
                      color="text.primary"
                      gutterBottom
                      noWrap
                    >
                      {customer.curp}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {//format(customer.orderDate, 'MMMM dd yyyy')
                      customer.name
                      }
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
                      {customer.cell}
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
                      {customer.street}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {customer.suburb}
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
                      {customer.amountCrypto}
                      {customer.cryptoCurrency}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {numeral(customer.amount).format(
                        `${customer.currency}0,0.00`
                      )}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {getStatusLabel(customer.level.id)}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit Order" arrow>
                      <IconButton
                        sx={{
                          '&:hover': {
                            background: theme.colors.primary.lighter
                          },
                          color: theme.palette.primary.main
                        }}
                        color="inherit"
                        size="small"
                      >
                        <EditTwoToneIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Order" arrow>
                      <IconButton
                        sx={{
                          '&:hover': { background: theme.colors.error.lighter },
                          color: theme.palette.error.main
                        }}
                        color="inherit"
                        size="small"
                      >
                        <DeleteTwoToneIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
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
          count={filteredCryptoOrders.length}
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

TablaClientes.propTypes = {
  customerList: PropTypes.array.isRequired,
  levelsList: PropTypes.array.isRequired
};

TablaClientes.defaultProps = {
  customerList: [],
  levelsList: []
};

export default TablaClientes;
