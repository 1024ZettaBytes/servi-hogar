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
  FormControl,
  Select,
  MenuItem,
  Alert,
  Tooltip,
} from "@mui/material";
import EditTwoToneIcon from "@mui/icons-material/EditTwoTone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { updateCustomerResidence } from "../../lib/client/customersFetch";
import { useSnackbar } from "notistack";
import Label from "@/components/Label";
import { CustomerLevel } from "@/models/crypto_order";
import SearchIcon from "@mui/icons-material/Search";
import { LoadingButton } from "@mui/lab";
import numeral from "numeral";

interface TablaClientesRentaProps {
  className?: string;
  role: string;
  customerList: any[];
  selectedCustomer?: any;
  citiesList: any[];
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
  role,
  customerList,
  citiesList,
  selectedCustomer,
  onSelectCustomer,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [customerToEdit, setCustomerToEdit] = useState<any>({ isSet: false });
  const [isEditing, setIsEditing] = useState<any>(false);
  const [isUpdating, setIsUpdating] = useState<any>(false);
  const [hasErrorUpdating, setHasErrorUpdating] = useState<any>({
    error: false,
    msg: "",
  });
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(10);
  const [filter, setFilter] = useState<string>("");
  const userIsAdmin = role === "ADMIN";
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
  function handleCitySelection(cityId) {
    const filteredCity = citiesList.filter((c) => c._id === cityId);
    const city = filteredCity[0];
    const sector = {};
    setCustomerToEdit({
      ...customerToEdit,
      currentResidence: { ...customerToEdit.currentResidence, city, sector },
    });
  }

  function handleSectorSelection(sectorId) {
    const sector = { _id: sectorId };
    setCustomerToEdit({
      ...customerToEdit,
      currentResidence: { ...customerToEdit.currentResidence, sector },
    });
  }
  const getResidenceTextField = (
    field: string,
    minLength: number,
    maxLength: number,
    required
  ) => (
    <TextField
      fullWidth
      inputProps={{ minLength, maxLength }}
      autoComplete="off"
      required={required}
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

  const handleUpdateResidence = async (event) => {
    event.preventDefault();
    setHasErrorUpdating({ error: false, msg: "" });
    setIsUpdating(true);
    const result = await updateCustomerResidence(customerToEdit);
    setIsUpdating(false);
    if (!result.error) {
      setIsEditing(false);
      enqueueSnackbar(result.msg, {
        variant: "success",
        anchorOrigin: {
          vertical: "top",
          horizontal: "center",
        },
        autoHideDuration: 1500,
      });
    } else {
      setHasErrorUpdating({ error: true, msg: result.msg });
    }
  };

  const filteredCostumers = applyFilters(customerList, filter);
  const paginatedCustomers = applyPagination(filteredCostumers, page, limit);
  const theme = useTheme();
  if (
    (!customerToEdit.isSet && selectedCustomer) ||
    customerToEdit?._id?.toString() !== selectedCustomer?._id?.toString()
  ) {
    setHasErrorUpdating({ error: false, msg: "" });
    let currentResidence;
    if (selectedCustomer?.currentResidence?.city?.sectors) {
      currentResidence = selectedCustomer.currentResidence;
      currentResidence.city.sectors = citiesList.find(
        (city) => city.id === currentResidence?.city?.id
      ).sectors;
    }
    setCustomerToEdit({ ...selectedCustomer, currentResidence, isSet: true });
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
                <TableCell align="center">Nivel</TableCell>
                <TableCell align="center">Celular</TableCell>
                <TableCell align="center">Domicilio</TableCell>
                <TableCell align="center">Ciudad</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedCustomers.map((customer) => {
                const isSelected = selectedCustomer?._id === customer?._id;
                const isBadCustomer = customer.level.id === "conflictivo";
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
                      cursor:
                        !isBadCustomer || userIsAdmin
                          ? "pointer"
                          : "not-allowed",
                    }}
                    onClick={() => {
                      (!isBadCustomer || userIsAdmin) &&
                        !isUpdating &&
                        onSelectCustomer(customer._id);
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
                      {getStatusLabel(customer?.level?.id)}
                      {(isBadCustomer || customer?.comments !== "") && (
                        <Tooltip title={customer.comments} arrow>
                          <InfoOutlinedIcon fontSize="small" />
                        </Tooltip>
                      )}
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
      {selectedCustomer && selectedCustomer.balance < 0 && (
        <Grid item sm={12} md={12} lg={5} m={2}>
          <Alert severity="warning">{`ATENCIÓN: Este cliente tiene saldo pendiente de $${numeral(
            selectedCustomer?.balance
          ).format(`${selectedCustomer?.balance}0,0.00`)}`}</Alert>
        </Grid>
      )}
      {selectedCustomer && (
        <Grid container marginTop={1}>
          <Grid item sm={12} md={12} lg={5}>
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
                      onClick={() => {
                        setHasErrorUpdating({ error: false, msg: "" });
                        setCustomerToEdit({ ...selectedCustomer });
                        setIsEditing(!isEditing);
                      }}
                    >
                      {isEditing ? "Cancelar" : "Modificar"}
                    </Button>
                  </Box>
                }
              />
              <Divider />
              <Box component="form" onSubmit={handleUpdateResidence}>
                <Grid container p={1}>
                  <Grid item xs={4} sm={3} lg={4} margin={1}>
                    <Typography variant="h5">Celular</Typography>
                    {!isEditing ? (
                      <Typography
                        variant="h5"
                        sx={{ py: 1 }}
                        fontWeight="normal"
                      >
                        {selectedCustomer?.cell}
                      </Typography>
                    ) : (
                      getInfoTextField("cell", 10, 10)
                    )}
                  </Grid>
                  <Grid item xs={6} sm={4} lg={7} margin={1}>
                    <Typography variant="h5">Calle y Número</Typography>
                    {!isEditing ? (
                      <Typography
                        variant="h5"
                        sx={{ py: 1 }}
                        fontWeight="normal"
                      >
                        {selectedCustomer?.currentResidence?.street}
                      </Typography>
                    ) : (
                      getResidenceTextField("street", 1, 100, true)
                    )}
                  </Grid>
                  <Grid item xs={4} sm={4} lg={4} margin={1}>
                    <Typography variant="h5">Colonia</Typography>
                    {!isEditing ? (
                      <Typography
                        variant="h5"
                        sx={{ py: 1 }}
                        fontWeight="normal"
                      >
                        {selectedCustomer?.currentResidence?.suburb}
                      </Typography>
                    ) : (
                      getResidenceTextField("suburb", 1, 100, true)
                    )}
                  </Grid>
                  <Grid item xs={6} sm={3} lg={5} margin={1}>
                    <Typography variant="h5">Sector</Typography>
                    {!isEditing ? (
                      <Typography
                        variant="h5"
                        sx={{ py: 1 }}
                        fontWeight="normal"
                      >
                        {selectedCustomer?.currentResidence?.sector?.name}
                      </Typography>
                    ) : (
                      <FormControl sx={{ width: "100%" }}>
                        <Select
                          labelId="sector-id"
                          id="sector"
                          name="sector"
                          required
                          autoComplete="off"
                          size="small"
                          placeholder="Seleccione un valor"
                          value={
                            customerToEdit?.currentResidence?.sector?._id || ""
                          }
                          onChange={(event) =>
                            handleSectorSelection(event.target.value)
                          }
                        >
                          {customerToEdit?.currentResidence?.city?.sectors
                            ?.length > 0
                            ? customerToEdit?.currentResidence?.city?.sectors?.map(
                                (sector) => (
                                  <MenuItem key={sector._id} value={sector._id}>
                                    {sector.name}
                                  </MenuItem>
                                )
                              )
                            : null}
                        </Select>
                      </FormControl>
                    )}
                  </Grid>
                  <Grid item xs={4} sm={4} lg={4} margin={1}>
                    <Typography variant="h5">Ciudad</Typography>
                    {!isEditing ? (
                      <Typography
                        variant="h5"
                        sx={{ py: 1 }}
                        fontWeight="normal"
                      >
                        {selectedCustomer?.currentResidence?.city?.name}
                      </Typography>
                    ) : (
                      <FormControl sx={{ width: "100%" }}>
                        <Select
                          labelId="city-id"
                          id="city"
                          name="city"
                          required
                          autoComplete="off"
                          size="small"
                          value={
                            customerToEdit?.currentResidence?.city?._id || ""
                          }
                          onChange={(event) =>
                            handleCitySelection(event.target.value)
                          }
                        >
                          {citiesList
                            ? citiesList.map((city) => (
                                <MenuItem key={city._id} value={city._id}>
                                  {city.name}
                                </MenuItem>
                              ))
                            : null}
                        </Select>
                      </FormControl>
                    )}
                  </Grid>
                  <Grid item xs={6} sm={4} lg={5} margin={1}>
                    <Typography variant="h5">Referencia domicilio</Typography>
                    {!isEditing ? (
                      <Typography
                        variant="h5"
                        sx={{ py: 1 }}
                        fontWeight="normal"
                      >
                        {selectedCustomer?.currentResidence?.residenceRef}
                      </Typography>
                    ) : (
                      getResidenceTextField("residenceRef", 1, 250, true)
                    )}
                  </Grid>
                  <Grid item xs={4} sm={3} lg={4} margin={1}>
                    <Typography variant="h5">Nombre ref.</Typography>
                    {!isEditing ? (
                      <Typography
                        variant="h5"
                        sx={{ py: 1 }}
                        fontWeight="normal"
                      >
                        {selectedCustomer?.currentResidence?.nameRef}
                      </Typography>
                    ) : (
                      getResidenceTextField("nameRef", 1, 100, false)
                    )}
                  </Grid>
                  <Grid item xs={6} sm={6} lg={5} margin={1}>
                    <Typography variant="h5">Teléfono ref.</Typography>
                    {!isEditing ? (
                      <Typography
                        variant="h5"
                        sx={{ py: 1 }}
                        fontWeight="normal"
                      >
                        {selectedCustomer?.currentResidence?.telRef}
                      </Typography>
                    ) : (
                      getResidenceTextField("telRef", 10, 10, false)
                    )}
                  </Grid>
                  <Grid item xs={12} sm={12} lg={12} margin={1}>
                    {!isEditing ? (
                      selectedCustomer?.currentResidence?.maps && (
                        <Button
                          fullWidth
                          variant="text"
                          href={`${selectedCustomer?.currentResidence?.maps}`}
                          target="_blank"
                          startIcon={<LocationOnIcon />}
                        >
                          Ver Ubicación
                        </Button>
                      )
                    ) : (
                      <>
                        <Typography variant="h5">Ubicación</Typography>
                        <TextField
                          autoComplete="off"
                          id="maps"
                          name="maps"
                          multiline
                          maxRows={3}
                          fullWidth={true}
                          value={customerToEdit?.currentResidence?.maps}
                          onChange={(e) => {
                            setCustomerToEdit({
                              ...customerToEdit,
                              currentResidence: {
                                ...customerToEdit.currentResidence,
                                maps: e.target.value,
                              },
                            });
                          }}
                        />
                      </>
                    )}
                  </Grid>
                  {isEditing && hasErrorUpdating.error && (
                    <Grid item xs={12} sm={12} md={12} p={1}>
                      <Alert severity="error">{hasErrorUpdating.msg}</Alert>
                    </Grid>
                  )}
                  {isEditing && (
                    <>
                      <Grid item sm={4} lg={4}></Grid>
                      <Grid item xs={12} sm={4} lg={4}>
                        <LoadingButton
                          loading={isUpdating}
                          fullWidth
                          variant="outlined"
                          type="submit"
                        >
                          Guardar
                        </LoadingButton>
                      </Grid>
                      <Grid item sm={4} lg={4}></Grid>
                    </>
                  )}
                  <Grid></Grid>
                </Grid>
              </Box>
            </Card>
          </Grid>
        </Grid>
      )}
    </>
  );
};

TablaClientesRenta.propTypes = {
  role: PropTypes.string.isRequired,
  customerList: PropTypes.array.isRequired,
  citiesList: PropTypes.array.isRequired,
  selectedCustomer: PropTypes.object,
  onSelectCustomer: PropTypes.func.isRequired,
};

TablaClientesRenta.defaultProps = {
  selectedCustomer: {},
  citiesList: [],
  customerList: [],
};

export default TablaClientesRenta;
