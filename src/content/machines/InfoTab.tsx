import { capitalizeFirstLetter, formatTZDate } from "../../../lib/client/utils";
import {
  Grid,
  Typography,
  CardContent,
  Card,
  Box,
  Divider,
  Button,
  TextField,
  Alert,
  FormControl,
  Select,
  MenuItem,
} from "@mui/material";
import { MACHINE_STATUS_LIST } from "../../../lib/consts/OBJ_CONTS";
import { useSnackbar } from "notistack";
import { Skeleton } from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import TablaHistorialEquipos from "./TablaHistorialEquipos";
import EditTwoToneIcon from "@mui/icons-material/EditTwoTone";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import CurrencyExchangeIcon from "@mui/icons-material/CurrencyExchange";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import BuildIcon from "@mui/icons-material/Build";
import Text from "@/components/Text";
import Label from "@/components/Label";
import { useState } from "react";
import { updateMachine } from "lib/client/machinesFetch";
import { LoadingButton } from "@mui/lab";
import numeral from "numeral";
import {
  getFetcher,
  useGetAllVehicles,
  useGetAllWarehousesOverview,
} from "pages/api/useRequest";
const getStatusDescription = (
  status: String,
  rent: any,
  vehicle: any,
  warehouse: any
) => {
  const notAvailable = "Información no disponible";
  switch (status) {
    case MACHINE_STATUS_LIST.RENTADO:
      return rent ? `Renta #${rent?.num}` : notAvailable;
    case MACHINE_STATUS_LIST.VEHI:
      return vehicle
        ? vehicle.operator.name
        : notAvailable;
    default:
      return warehouse ? warehouse?.name : notAvailable;
  }
};
const getStatusLabel = (
  status: String,
  rent: any,
  vehicle: any,
  warehouse: any
) => {
  const notAvailable = "Información no disponible";
  switch (status) {
    case MACHINE_STATUS_LIST.PERDIDA:
      return (
        <Label color="secondary">
          <SearchIcon fontSize="small" />
         <b>En investigación</b>
        </Label>
      );
    case MACHINE_STATUS_LIST.RENTADO:
      return (
        <Label color="secondary">
          <CurrencyExchangeIcon fontSize="small" />
          <b>{rent ? `Rentado (Renta ${rent?.num})` : notAvailable}</b>
        </Label>
      );
    case MACHINE_STATUS_LIST.VEHI:
      return (
        <Label color="info">
          <LocalShippingIcon fontSize="small" />
          <b>
            {vehicle ? `En vehículo` : notAvailable}
          </b>
        </Label>
      );
    case MACHINE_STATUS_LIST.ESPE:
      return (
        <Label color="warning">
          <HourglassEmptyIcon fontSize="small" />
          <b>{warehouse ? `Pendiente (${warehouse?.name})` : notAvailable}</b>
        </Label>
      );
    case MACHINE_STATUS_LIST.LISTO:
      return (
        <Label color="warning">
          <EventAvailableIcon fontSize="small" />
          <b>{warehouse ? `Disponible (${warehouse?.name})` : notAvailable}</b>
        </Label>
      );
    case MACHINE_STATUS_LIST.MANTE:
      return (
        <Label color="warning">
          <BuildIcon fontSize="small" />
          <b>
            {warehouse ? `En mantenimiento (${warehouse?.name})` : notAvailable}
          </b>
        </Label>
      );
      case MACHINE_STATUS_LIST.REC:
        return (
          <Label color="warning">
            <HourglassEmptyIcon fontSize="small" />
            <b>
              Recolectada (en vehículo)
            </b>
          </Label>
        );
  }
};
const getIdOperation = (type: string) => (
  <TextField
    id="type"
    name="type"
    variant="outlined"
    size="small"
    sx={{ display: "none" }}
    value={type}
  />
);

function MachineInfoTab({ role, machine, statusList }) {
  const { enqueueSnackbar } = useSnackbar();
  const { warehousesList, warehousesError } = useGetAllWarehousesOverview(
    getFetcher
  );
  const { vehiclesList, vehiclesError } = useGetAllVehicles(getFetcher);
  const [isEditing, setIsEditing] = useState<any>({
    info: false,
    residence: false,
  });
  const [machineToEdit, setMachineToEdit] = useState<any>({ isSet: false });
  const [selectedLocation, setSelectedLocation] = useState();
  const isOnRentStatus =  machineToEdit.status?.id === MACHINE_STATUS_LIST.RENTADO;
  const isWarehouseStatus = machineToEdit.status?.typeWarehouse;
  const isVehicleStatus = machineToEdit.status?.id === MACHINE_STATUS_LIST.VEHI;
  const [isUpdating, setIsUpdating] = useState<any>({ info: false });
  const [hasErrorUpdating, setHasErrorUpdating] = useState<any>({
    info: { error: false, msg: "" },
  });

  async function handleUpdateMachine(event) {
    event.preventDefault();
    const type = event.target.type.value;
    setHasErrorUpdating({
      ...hasErrorUpdating,
      [type]: { error: false, msg: "" },
    });
    setIsUpdating({ ...isUpdating, [type]: true });
    const result = await updateMachine({
      ...machineToEdit,
      location: selectedLocation,
      [type]: true,
    });
    setIsUpdating({ ...isUpdating, [type]: false });
    if (!result.error) {
      setIsEditing({ ...isEditing, [type]: false });
      enqueueSnackbar(result.msg, {
        variant: "success",
        anchorOrigin: {
          vertical: "top",
          horizontal: "center",
        },
        autoHideDuration: 1500,
      });
    } else {
      setHasErrorUpdating({
        ...hasErrorUpdating,
        [type]: { error: true, msg: result.msg },
      });
    }
  }
  function handleStatusSelection(status) {
    const selected = statusList.find((s) => s._id === status);
    setMachineToEdit({
      ...machineToEdit,
      status: selected,
    });
      setSelectedLocation(undefined);
  }
  function handleLocationSelection(location) {
    setSelectedLocation(location);
  }
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
      value={machineToEdit[field]}
      onChange={(e) => {
        setMachineToEdit({
          ...machineToEdit,
          [field]: e.target.value,
        });
      }}
    />
  );

  if (!machineToEdit.isSet && machine) {
    setMachineToEdit({ ...machine, isSet: true });
  }
  const getErrorMessage = (message: string) => (
    <Typography variant="h5" component="h5" color="error" textAlign="left">
      {message}
    </Typography>
  );
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <Box
            p={3}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="h4" gutterBottom>
                Datos generales
              </Typography>
            </Box>
            {!isEditing.info && ["ADMIN", "AUX", "OPE"].includes(role) && (
              <Button
                variant="text"
                startIcon={<EditTwoToneIcon />}
                onClick={() => {
                  setMachineToEdit({ ...machine, isSet: true });
                  setIsEditing({ ...isEditing, info: true });
                }}
              >
                Modificar
              </Button>
            )}
          </Box>
          <Divider />
          <CardContent sx={{ p: 4 }}>
            <Typography variant="subtitle2">
              <Box component="form" onSubmit={handleUpdateMachine}>
                <Grid
                  container
                  direction={"row"}
                  alignItems="left"
                  justifyItems="left"
                >
                  <Grid container item spacing={0} xs={12} sm={6} md={6}>
                    <Grid item xs={3} sm={6} md={6} textAlign={{ sm: "right" }}>
                      <Box pr={2} pb={2}>
                        # de Equipo:
                      </Box>
                    </Grid>
                    <Grid item xs={9} sm={6} md={6}>
                      {machine ? (
                        !isEditing.info ? (
                          <Text color="black">{machine?.machineNum}</Text>
                        ) : (
                          getInfoTextField("machineNum", 1, 5)
                        )
                      ) : (
                        <Skeleton
                          variant="text"
                          sx={{ fontSize: "1rem", width: "100px" }}
                        />
                      )}
                    </Grid>
                    <Grid item xs={3} sm={6} md={6} textAlign={{ sm: "right" }}>
                      <Box pr={2} pb={2}>
                        Marca:
                      </Box>
                    </Grid>
                    <Grid item xs={9} sm={6} md={6}>
                      <Box sx={{ maxWidth: { xs: "auto", sm: 300 } }}>
                        {machine ? (
                          !isEditing.info ? (
                            <Text color="black">{machine?.brand}</Text>
                          ) : (
                            getInfoTextField("brand", 1, 20)
                          )
                        ) : (
                          <Skeleton
                            variant="text"
                            sx={{ fontSize: "1rem", width: "100px" }}
                          />
                        )}
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={6} md={6} textAlign={{ sm: "right" }}>
                      <Box pr={2} pb={2}>
                        Características:
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={6} md={6}>
                      <Box sx={{ maxWidth: { xs: "auto", sm: 300 } }}>
                        {machine ? (
                          !isEditing.info ? (
                            <Text color="black">{machine?.capacity}</Text>
                          ) : (
                            getInfoTextField("capacity", 1, 8)
                          )
                        ) : (
                          <Skeleton
                            variant="text"
                            sx={{ fontSize: "1rem", width: "100px" }}
                          />
                        )}
                      </Box>
                    </Grid>

                    <Grid item xs={3} sm={6} md={6} textAlign={{ sm: "right" }}>
                      <Box pr={2} pb={2}>
                        Estado actual:
                      </Box>
                    </Grid>

                    <Grid item xs={9} sm={6} md={6}>
                      {machine ? (
                        isOnRentStatus || !isEditing.info ? (
                          getStatusLabel(
                            machine?.status?.id,
                            machine?.lastRent,
                            machine?.currentVehicle,
                            machine?.currentWarehouse
                          )
                        ) : statusList ? (
                          <FormControl>
                            <Select
                              size="small"
                              labelId="level-id"
                              id="level"
                              name="level"
                              required
                              autoComplete="off"
                              value={machineToEdit?.status._id || ""}
                              onChange={(event) =>
                                handleStatusSelection(event.target.value)
                              }
                            >
                              {statusList
                                ? statusList.map((status) => (
                                    <MenuItem
                                      key={status._id}
                                      value={status._id}
                                    >
                                      {status.description}
                                    </MenuItem>
                                  ))
                                : null}
                            </Select>
                          </FormControl>
                        ) : (
                          getErrorMessage("Error al obtener los estados")
                        )
                      ) : (
                        <Skeleton
                          variant="text"
                          sx={{ fontSize: "1rem", width: "100px" }}
                        />
                      )}
                    </Grid>

{!isOnRentStatus &&
<>
                    <Grid item xs={3} sm={6} md={6} textAlign={{ sm: "right" }}>
                      <Box pr={2} pb={2}>
                        Ubicación:
                      </Box>
                    </Grid>

                    <Grid item xs={9} sm={6} md={6}>
                      {!isEditing.info ? (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          noWrap
                        >
                          {getStatusDescription(
                            machine?.status?.id,
                            machine?.lastRent,
                            machine?.currentVehicle,
                            machine?.currentWarehouse
                          )}
                        </Typography>
                      ) : (
                        <>
                          {isWarehouseStatus && (
                            <>
                              {warehousesError && (
                                <Grid item lg={12}>
                                  <Alert severity="error">
                                    {warehousesError?.message}
                                  </Alert>
                                </Grid>
                              )}
                              <Grid item lg={12}>
                                <FormControl fullWidth>
                                  <Select
                                  size="small"
                                    id="warehouse"
                                    name="warehouse"
                                    required
                                    autoComplete="off"
                                    value={selectedLocation || ""}
                                    onChange={(event) =>
                                      handleLocationSelection(
                                        event.target.value
                                      )
                                    }
                                  >
                                    {warehousesList
                                      ? warehousesList.map((warehouse) => (
                                          <MenuItem
                                            key={warehouse._id}
                                            value={warehouse._id}
                                          >
                                            {warehouse.name}
                                          </MenuItem>
                                        ))
                                      : null}
                                  </Select>
                                </FormControl>
                              </Grid>
                            </>
                          )}

                          {isVehicleStatus && (
                            <>
                              {vehiclesError && (
                                <Grid item lg={12}>
                                  <Alert severity="error">
                                    {vehiclesError?.message}
                                  </Alert>
                                </Grid>
                              )}
                              <Grid item lg={12}>
                                <FormControl fullWidth>
                                  <Select
                                    id="vehicle"
                                    name="vehicle"
                                    required
                                    size="small"
                                    autoComplete="off"
                                    value={selectedLocation || ""}
                                    onChange={(event) =>
                                      handleLocationSelection(
                                        event.target.value
                                      )
                                    }
                                  >
                                    {vehiclesList
                                      ? vehiclesList.map((vehicle) => (
                                          <MenuItem
                                            key={vehicle._id}
                                            value={vehicle._id}
                                          >
                                            {vehicle.operator.name}
                                          </MenuItem>
                                        ))
                                      : null}
                                  </Select>
                                </FormControl>
                              </Grid>
                            </>
                          )}
                        </>
                      )}
                    </Grid>
                    </>
}
                    <Grid item xs={3} sm={6} md={6} textAlign={{ sm: "right" }}>
                      <Box pr={2} pb={2}>
                        Cambios:
                      </Box>
                    </Grid>
                    <Grid item xs={9} sm={6} md={6}>
                      {machine ? (
                        <Text color="black">{machine?.totalChanges}</Text>
                      ) : (
                        <Skeleton
                          variant="text"
                          sx={{ fontSize: "1rem", width: "100px" }}
                        />
                      )}
                    </Grid>
                    <Grid item xs={6} sm={6} md={6} textAlign={{ sm: "right" }}>
                      <Box pr={2} pb={2}>
                        Fecha de ingreso:
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={6} md={6}>
                      {machine ? (
                        <Text color="black">
                          {capitalizeFirstLetter(
                            formatTZDate(
                              new Date(machine?.createdAt),
                              "MMMM DD YYYY HH:mm:ss"
                            )
                          )}
                        </Text>
                      ) : (
                        <Skeleton
                          variant="text"
                          sx={{ fontSize: "1rem", width: "100px" }}
                        />
                      )}
                    </Grid>
                  </Grid>
                </Grid>
                {isEditing.info && (
                  <>
                    {hasErrorUpdating.info.error && (
                      <Grid item xs={12} sm={12} md={12} textAlign={"center"}>
                        <br />
                        <Alert severity="error">
                          {hasErrorUpdating.info.msg}
                        </Alert>
                      </Grid>
                    )}
                    <Grid
                      item
                      xs={0}
                      sm={0}
                      md={0}
                      textAlign={{ sm: "right" }}
                    ></Grid>
                    <Grid
                      item
                      xs={12}
                      sm={12}
                      md={12}
                      textAlign={"center"}
                      marginTop={2}
                    >
                      <Button
                        variant="outlined"
                        size="medium"
                        onClick={() => {
                          setIsEditing({ ...isEditing, info: false });
                          setHasErrorUpdating({
                            ...hasErrorUpdating,
                            info: false,
                          });
                          setIsUpdating({ ...isUpdating, info: false });
                        }}
                      >
                        Cancelar
                      </Button>

                      <LoadingButton
                        sx={{ marginLeft: 1 }}
                        type="submit"
                        size="medium"
                        loading={isUpdating.info}
                        variant="contained"
                      >
                        Guardar
                      </LoadingButton>
                      {getIdOperation("info")}
                    </Grid>
                  </>
                )}
              </Box>
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12}>
        <Card>
          <Box
            p={3}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="h4" gutterBottom>
                Historial de movimientos
              </Typography>
            </Box>
          </Box>
          <Divider />
          <CardContent sx={{ p: 4 }}>
            <Grid container>
              <Grid item xs={12} md={12} lg={12}>
                {machine?.movements ? (
                  <TablaHistorialEquipos movements={machine?.movements} />
                ) : (
                  <Skeleton
                    variant="rectangular"
                    width={"100%"}
                    height={500}
                    animation="wave"
                  />
                )}
              </Grid>

              {machine ? (
                <Grid item xs={12} md={12} lg={12}>
                  <Grid container padding={3}>
                    <Grid item xs={12} md={4} lg={3}>
                      <Typography variant="h5">
                        {"Costo: $" +
                          numeral(machine?.cost).format(
                            `${machine?.cost}0,0.00`
                          )}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4} lg={3}>
                      <Typography variant="h5">
                        {"Gastos: $" +
                          numeral(machine?.expenses).format(
                            `${machine?.expenses}0,0.00`
                          )}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4} lg={3}>
                      <Typography
                        variant="h5"
                        color={machine?.earnings > 0.0 ? "success" : "error"}
                      >
                        {"Generado: $" +
                          numeral(machine?.earnings).format(
                            `${machine?.earnings}0,0.00`
                          )}
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>
              ) : (
                <Skeleton variant="text" width={"100%"} animation="wave" />
              )}
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export default MachineInfoTab;
