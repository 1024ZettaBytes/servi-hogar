import { FC, ChangeEvent, useState } from "react";
import * as str from "string";
import PropTypes from "prop-types";
import {
  Divider,
  Box,
  Card,
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
  Button,
  Grid,
} from "@mui/material";
import EditTwoToneIcon from "@mui/icons-material/EditTwoTone";

import { deleteCustomers } from "../../lib/client/customersFetch";
import { useSnackbar } from "notistack";
import Label from "@/components/Label";
import { CustomerLevel } from "@/models/crypto_order";
import SearchIcon from "@mui/icons-material/Search";
import GenericModal from "@/components/GenericModal";

interface TablaClientesRentaProps {
  className?: string;
  customerList: any[];
  selectedCustomer?: any;
  onSelectCustomer: Function;
}

const getStatusLabel = (customerLevel: CustomerLevel): JSX.Element => {
  const map = {
    nuevo: {
      text: "Nuevo",
      color: "secondary",
    },
    regular: {
      text: "Regular",
      color: "info",
    },
    permanente: {
      text: "Permanente",
      color: "success",
    },
    deudor: {
      text: "Deudor",
      color: "warning",
    },
    conflictivo: {
      text: "Conflictivo",
      color: "error",
    },
  };

  const { text, color }: any = map[customerLevel];

  return <Label color={color}>{text}</Label>;
};
const compareStringsForFilter = (keyWord: string, field: string) => {
  return str(field)
    .latinise()
    .toLowerCase()
    .includes(str(keyWord).latinise().toLowerCase());
};
const applyFilters = (customerList: any[], filter: string): any[] => {
  return customerList.filter((customer) => {
    if (!filter || filter === "") {
      return true;
    }
    return (
      Object.entries(customer).filter((keyValue) => {
        const key = keyValue[0];
        const value = keyValue[1];
        if (!value) {
          return false;
        }
        switch (key) {
          case "currentResidence": {
            const matchCity =
              value["city"]?.name &&
              compareStringsForFilter(filter, value["city"].name);
            const matchSector =
              value["sector"]?.name &&
              compareStringsForFilter(filter, value["sector"].name);
            const matchStreet =
              value["street"] &&
              compareStringsForFilter(filter, value["street"]);
            const matchSuburb =
              value["suburb"] &&
              compareStringsForFilter(filter, value["suburb"]);
            return matchCity || matchSector || matchStreet || matchSuburb;
          }
          case "level": {
            const matchLevel =
              value["name"] && compareStringsForFilter(filter, value["name"]);
            return matchLevel;
          }
          case "name":
          case "cell": {
            return compareStringsForFilter(filter, value.toString());
          }
        }
      }).length > 0
    );
  });
};

const applyPagination = (
  customerList: any[],
  page: number,
  limit: number
): any[] => {
  return customerList.slice(page * limit, page * limit + limit);
};

const TablaClientesRenta: FC<TablaClientesRentaProps> = ({
  customerList,
  selectedCustomer,
  onSelectCustomer,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [deleteModalIsOpen, setDeleteModalIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<any>({ isSet: false });
  const [customersToDelete, setCustomersToDelete] = useState<string[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState<any>(false);
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(10);
  const [filter, setFilter] = useState<string>("");
  
  const getInfoTextField = (
    field: string,
    minLength: number,
    maxLength: number
  ) => (
    <TextField
      fullWidth
      inputProps={{ minLength, maxLength }}
      autoComplete="off"
      required
      id={field}
      name={field}
      variant="outlined"
      size="small"
      value={customerToEdit[field]}
      onChange={(e) => {
        setCustomerToEdit({
          ...customerToEdit,
          [field]: e.target.value,
        });
      }}
    />
  );

  const getResidenceTextField = (
    field: string,
    minLength: number,
    maxLength: number
  ) => (
    <TextField
      fullWidth
      inputProps={{ minLength, maxLength }}
      autoComplete="off"
      required
      id={field}
      name={field}
      variant="outlined"
      size="small"
      value={customerToEdit.currentResidence[field]}
      onChange={(e) => {
        setCustomerToEdit({
          ...customerToEdit,
          currentResidence: {
            ...customerToEdit.currentResidence,
            [field]: e.target.value,
          },
        });
      }}
    />
  );
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setFilter(value);
  };

  const handlePageChange = (_event: any, newPage: number): void => {
    setPage(newPage);
  };

  const handleLimitChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setLimit(parseInt(event.target.value));
  };

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

    if (!result.error) {
      const newSelected = selectedCustomers.filter(
        (selected) => !customersToDelete.includes(selected)
      );
      setSelectedCustomers(newSelected);
      setCustomersToDelete([]);
    }
  };

  const filteredCostumers = applyFilters(customerList, filter);
  const paginatedCustomers = applyPagination(filteredCostumers, page, limit);
  const theme = useTheme();
  if (!customerToEdit.isSet && selectedCustomer) {
    setCustomerToEdit({ ...selectedCustomer, isSet: true });
  }
  return (
    <>
      <Card>
        <CardHeader
          action={
            <Box width={200}>
              <>
                <TextField
                  size="small"
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
                  sx={{ marginTop: "20px" }}
                />
              </>
            </Box>
          }
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
          title=""
        />
        <Divider />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="center">Cliente</TableCell>
                <TableCell align="center">Celular</TableCell>
                <TableCell align="center">Domicilio</TableCell>
                <TableCell align="center">Ciudad</TableCell>
                <TableCell align="center">Nivel</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedCustomers.map((customer) => {
                const isSelected = selectedCustomer?._id === customer?._id;
                return (
                  <TableRow
                    key={customer?._id}
                    selected={isSelected}
                    sx={{
                      "&:hover": {
                        backgroundColor: isSelected
                          ? theme.colors.primary
                          : "transparent",
                      },
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      onSelectCustomer(customer?._id);
                    }}
                  >
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
      { selectedCustomer &&
      <Grid container marginTop={1}>
        <Grid item sm={12} md={12} lg={6}>
          <Card>
            <CardHeader
              title="Domicilio del cliente"
              action={
                <Box>
                  <Button
                    startIcon={!isEditing ? <EditTwoToneIcon /> : null}
                    size="medium"
                    variant="text"
                    sx={{ marginTop: 1 }}
                    onClick={() =>{setIsEditing(!isEditing)}}
                  >
                    {isEditing ? "Cancelar":"Modificar"}
                  </Button>
                </Box>
              }
            />
            <Divider />
            <Grid container p={1}>
              <Grid item sm={3} lg={4} margin={1}>
                <Typography variant="h5">Celular</Typography>
                {!isEditing ? <Typography variant="h5" sx={{ py: 1 }} fontWeight="normal">
                  {selectedCustomer?.cell}
                </Typography> : getInfoTextField("cell", 10, 10)
                }
              </Grid>
              <Grid item sm={4} lg={7} margin={1}>
                <Typography variant="h5">Calle y Número</Typography>
                {!isEditing ?<Typography variant="h5" sx={{ py: 1 }} fontWeight="normal">
                  {selectedCustomer?.currentResidence?.street}
                </Typography>: getResidenceTextField("street", 1, 100)
                }
              </Grid>
              <Grid item sm={4} lg={4} margin={1}>
                <Typography variant="h5">Colonia</Typography>
                {!isEditing ?<Typography variant="h5" sx={{ py: 1 }} fontWeight="normal">
                  {selectedCustomer?.currentResidence?.suburb}
                </Typography>: getResidenceTextField("suburb", 1, 100)
                }
              </Grid>
              <Grid item sm={3} lg={7} margin={1}>
                <Typography variant="h5">Sector</Typography>
                {!isEditing ? <Typography variant="h5" sx={{ py: 1 }} fontWeight="normal">
                  {selectedCustomer?.currentResidence?.sector?.name}
                </Typography>: getResidenceTextField("sector", 1, 100)
              }
              </Grid>
              <Grid item sm={4} lg={4} margin={1}>
                <Typography variant="h5">Referencia domicilio</Typography>
                {!isEditing ?<Typography variant="h5" sx={{ py: 1 }} fontWeight="normal">
                  {selectedCustomer?.currentResidence?.residenceRef}
                </Typography> : getResidenceTextField("residenceRef", 1, 100)
                }
              </Grid>
              <Grid item sm={4} lg={4} margin={1}>
                <Typography variant="h5">Nombre referencia</Typography>
                {!isEditing ?<Typography variant="h5" sx={{ py: 1 }} fontWeight="normal">
                  {selectedCustomer?.currentResidence?.nameRef}
                </Typography>: getResidenceTextField("nameRef", 1, 100)
                }
              </Grid>
              <Grid item sm={4} lg={2} margin={1}>
                <Typography variant="h5">Teléfono ref.</Typography>
                {!isEditing ? <Typography variant="h5" sx={{ py: 1 }} fontWeight="normal">
                  {selectedCustomer?.currentResidence?.telRef}
                </Typography>: getResidenceTextField("telRef", 10, 10)
                }
              </Grid>
              <Grid>
              </Grid>
            </Grid>
          </Card>
        </Grid>
      </Grid>
}
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
      />
    </>
  );
};

TablaClientesRenta.propTypes = {
  customerList: PropTypes.array.isRequired,
  selectedCustomer: PropTypes.object,
  onSelectCustomer: PropTypes.func.isRequired,
};

TablaClientesRenta.defaultProps = {
  selectedCustomer: {},
  customerList: [],
};

export default TablaClientesRenta;
