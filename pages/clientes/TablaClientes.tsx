import { FC, ChangeEvent, useState } from 'react';
//import numeral from 'numeral';
import * as str from "string";
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
  CardHeader,
  TextField,
  InputAdornment,
} from '@mui/material';


import Label from '@/components/Label';
import { CustomerLevel } from '@/models/crypto_order';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import BulkActions from './BulkActions';
import SearchIcon from '@mui/icons-material/Search';
import { info } from 'console';
import { sr, srLatn } from 'date-fns/locale';

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
const compareStringsForFilter = (keyWord: string, field: string) => {
  return str(field).latinise().toLowerCase().includes(str(keyWord).latinise().toLowerCase());
}
const applyFilters = (
  customerList: any[],
  filter: string
): any[] => {
  return customerList.filter((customer) => {
    if (!filter || filter === '') {
      return true;
    }
    return Object.entries(customer).filter(keyValue => {
      const key = keyValue[0];
      const value = keyValue[1];
      if (!value) {
        return false;
      }
      switch (key) {
        case 'currentResidence': {
          const matchCity = value['city']?.name && compareStringsForFilter(filter, value['city'].name);
          const matchSector = value['sector']?.name && compareStringsForFilter(filter, value['sector'].name);
          const matchStreet = value['street'] && compareStringsForFilter(filter, value['street']);
          const matchSuburb = value['suburb'] && compareStringsForFilter(filter, value['suburb']);
          return matchCity || matchSector || matchStreet || matchSuburb;
        }
        case 'level': {
          const matchLevel = value['name'] && compareStringsForFilter(filter, value['name']);
          return matchLevel;
        }
        case 'curp':
        case 'name':
        case "cell": {
          return compareStringsForFilter(filter, value.toString());
        }
      }
    }).length > 0;
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
  console.log("Gonna render a tabla clientes page");
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>(
    []
  );
  const selectedBulkActions = selectedCustomers.length > 0;
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(5);
  const [filter, setFilter] = useState<string>("");

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

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setFilter(value);
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

  const filteredCostumers = applyFilters(customerList, filter);
  const paginatedCryptoOrders = applyPagination(
    filteredCostumers,
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
            <Box width={200}>
              <TextField
                size='small'
                id="input-search-customer"
                label="Buscar"
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{marginTop:"20px"}}
              />
            </Box>
          }
          sx={{display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap"}}
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
              <TableCell align="center">Cliente</TableCell>
              <TableCell align="center">Celular</TableCell>
              <TableCell align="center">Domicilio</TableCell>
              <TableCell align="center">Ciudad</TableCell>
              <TableCell align="center">Nivel</TableCell>
              <TableCell align="center"></TableCell>
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
                  key={customer._id}
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
                  <TableCell align="center">
                    <Typography
                      variant="body1"
                      fontWeight="bold"
                      color="text.primary"
                      gutterBottom
                      noWrap
                    >
                      {customer.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {customer.curp}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
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
                  <TableCell align="center">
                    <Typography
                      variant="body1"
                      fontWeight="bold"
                      color="text.primary"
                      gutterBottom
                      noWrap
                    >
                      {customer.currentResidence.street}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {customer.currentResidence.suburb}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography
                      variant="body1"
                      fontWeight="bold"
                      color="text.primary"
                      gutterBottom
                      noWrap
                    >
                      {customer.currentResidence.city.name}

                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {/*numeral(customer.amount).format(
                        `${customer.currency}0,0.00`
                      )*/customer.currentResidence.sector.name}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {getStatusLabel(customer.level.id)}
                  </TableCell>
                  <TableCell align="center">
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
          count={filteredCostumers.length}
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
