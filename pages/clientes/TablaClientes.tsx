import { FC, ChangeEvent, useState } from 'react';
import * as str from "string";
import PropTypes from 'prop-types';
import {
  Tooltip,
  Divider,
  Box,
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
  Typography,
  useTheme,
  CardHeader,
  TextField,
  InputAdornment,
} from '@mui/material';

import { deleteCustomers } from "../../lib/client/customersFetch";
import { useSnackbar } from "notistack";
import Label from '@/components/Label';
import { CustomerLevel } from '@/models/crypto_order';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import BulkTableActions from '../../src/components/BulkTableActions';
import SearchIcon from '@mui/icons-material/Search';
import NextLink from "next/link";
import GenericModal from '@/components/GenericModal';

interface TablaClientesProps {
  userRole: string;
  className?: string;
  customerList: any[];
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

const TablaClientes: FC<TablaClientesProps> = ({ userRole, customerList }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [deleteModalIsOpen, setDeleteModalIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [customersToDelete, setCustomersToDelete] = useState<string[]>(
    []
  );
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>(
    []
  );
  const selectedBulkActions = selectedCustomers.length > 0;
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(10);
  const [filter, setFilter] = useState<string>("");
  const userCanDelete = userRole === "ADMIN";
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setFilter(value);
  };

  const handleSelectAllCustomers = (
    event: ChangeEvent<HTMLInputElement>
  ): void => {
    setSelectedCustomers(
      event.target.checked
        ? customerList.map((customer) => customer?._id)
        : []
    );
  };

  const handleSelectOneCustomer = (
    _event: ChangeEvent<HTMLInputElement>,
    customerId: string
  ): void => {
    if (!selectedCustomers.includes(customerId)) {
      setSelectedCustomers((prevSelected) => [
        ...prevSelected,
        customerId
      ]);
    } else {
      setSelectedCustomers((prevSelected) =>
        prevSelected.filter((id) => id !== customerId)
      );
    }
  };

  const handlePageChange = (_event: any, newPage: number): void => {
    setPage(newPage);
  };

  const handleLimitChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setLimit(parseInt(event.target.value));
  };
  const handleOnDeleteClick= (customers: string[])=>{
    setCustomersToDelete(customers);
    setDeleteModalIsOpen(true);

  }
  const handleOnConfirmDelete = async () => {
    setIsDeleting(true);
    const result = await deleteCustomers(customersToDelete);
    setDeleteModalIsOpen(false);
    setIsDeleting(false);
    enqueueSnackbar(result.msg, {
      variant: !result.error ? "success" : "error",
      anchorOrigin: {
        vertical: "top",
        horizontal: "center",
      },
      autoHideDuration: 2000,
    });

    if(!result.error){
      const newSelected = selectedCustomers.filter(selected=>!customersToDelete.includes(selected));
      setSelectedCustomers(newSelected);
      setCustomersToDelete([]);
    }
  };

  const filteredCostumers = applyFilters(customerList, filter);
  const paginatedCustomers = applyPagination(
    filteredCostumers,
    page,
    limit
  );
  const selectedSomeCustomers =
    selectedCustomers.length > 0 &&
    selectedCustomers.length < customerList.length;
  const selectedAllCustomers =
    (selectedCustomers.length === customerList.length) && customerList.length>0;
  const theme = useTheme();
  return (
    <>
    <Card>
      {selectedBulkActions && (
        <Box flex={1} p={2}>
          <BulkTableActions onClickButton={handleOnDeleteClick} selectedList={selectedCustomers}/>
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
              {userCanDelete &&<Checkbox
                  color="primary"
                  checked={selectedAllCustomers}
                  indeterminate={selectedSomeCustomers}
                  onChange={handleSelectAllCustomers}
                />}
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
            {paginatedCustomers.map((customer) => {
              const isCustomerSelected = selectedCustomers.includes(
                customer?._id
              );
              return (
                <TableRow
                  hover
                  key={customer?._id}
                  selected={isCustomerSelected}
                >
                  <TableCell padding="checkbox">
                    {userCanDelete && <Checkbox
                      color="primary"
                      checked={isCustomerSelected}
                      onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        handleSelectOneCustomer(event, customer?._id)
                      }
                      value={isCustomerSelected}
                    />}
                  </TableCell>
                  <TableCell align="center">
                    <Typography
                      variant="body1"
                      fontWeight="bold"
                      color="text.primary"
                      gutterBottom
                      noWrap
                    >
                      {customer?.name}
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
                      {customer?.cell}
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
                      {customer?.currentResidence?.street}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {customer?.currentResidence?.suburb}
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
                      {customer?.currentResidence?.city?.name}

                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {customer?.currentResidence?.sector?.name}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {getStatusLabel(customer?.level?.id)}
                  </TableCell>
                  <TableCell align="center">
                  <NextLink href={`/clientes/${customer?._id}`}>
                    <Tooltip title="Detalle" arrow>
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
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    </NextLink>
                    {userCanDelete &&<Tooltip title="Eliminar Cliente" arrow>
                      <IconButton
                      onClick={() =>handleOnDeleteClick([customer._id])}
                        sx={{
                          '&:hover': { background: theme.colors.error.lighter },
                          color: theme.palette.error.main
                        }}
                        color="inherit"
                        size="small"
                      >
                        <DeleteTwoToneIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>}
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
    <GenericModal
    open={deleteModalIsOpen}
    title="Atención"
    text={
      "¿Esta seguro de eliminar a" +
      (customersToDelete.length === 1
        ? "l cliente seleccionado"
        : " los clientes seleccionados") +
      "?"
    }
    isLoading={isDeleting}
    onAccept={handleOnConfirmDelete}
    onCancel={() => {
      setDeleteModalIsOpen(false);
      setIsDeleting(false);
    }}
  /></>
  );
};

TablaClientes.propTypes = {
  userRole: PropTypes.string.isRequired,
  customerList: PropTypes.array.isRequired,
};

TablaClientes.defaultProps = {
  userRole: "",
  customerList: [],
};

export default TablaClientes;
