import PropTypes from "prop-types";
import { useState } from "react";
import Dialog from "@mui/material/Dialog";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  InputLabel,
  TextField,
  Select,
  FormControl,
  MenuItem,
  Alert,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import {
  useGetAllWarehousesOverview,
  getFetcher,
  useGetAllVehicles,
} from "../../../pages/api/useRequest";
import { saveMachine } from "../../../lib/client/machinesFetch";
import { MACHINE_STATUS_LIST } from "../../../lib/consts/OBJ_CONTS";
function AddMachineModal(props) {
  const { warehousesList, warehousesError } = useGetAllWarehousesOverview(
    getFetcher
  );
  const { vehiclesList, vehiclesError } = useGetAllVehicles(getFetcher);
  const { handleOnClose, open, machinesStatusList } = props;
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState({ error: false, msg: "" });
  const [selectedStatus, setSelectedStatus] = useState({
    _id: "",
    id: "",
    typeWarehouse: false,
  });
  const [selectedLocation, setSelectedLocation] = useState();
  const isWarehouseStatus = selectedStatus?.typeWarehouse;
  const isVehicleStatus = selectedStatus?.id === MACHINE_STATUS_LIST.VEHI;
  function handleStatusSelection(status) {
    const selected = machinesStatusList.find((s) => s._id === status);
    setSelectedStatus(selected);
    if (!selected.typeWarehouse) {
      setSelectedLocation(undefined);
    }
  }
  function handleLocationSelection(location) {
    setSelectedLocation(location);
  }
  async function submitHandler(event) {
    event.preventDefault();
    setIsLoading(true);
    setHasError({ error: false, msg: "" });
    const result = await saveMachine({
      machineNum: event.target.machineNum.value,
      brand: event.target.brand.value,
      capacity: event.target.capacity.value,
      cost: event.target.cost.value,
      status: selectedStatus?._id,
      location: selectedLocation,
    });
    setIsLoading(false);
    if (!result.error) {
      handleSavedCustomer(result.msg);
    } else {
      handleErrorOnSave(result.msg);
    }
  }
  const handleClose = () => {
    setHasError({ error: false, msg: "" });
    setIsLoading(false);
    handleOnClose(false);
  };
  const handleSavedCustomer = (successMessage) => {
    handleOnClose(true, successMessage);
  };

  const handleErrorOnSave = (msg) => {
    setHasError({ error: true, msg });
  };

  return (
    <Dialog open={open} fullWidth={true} scroll={"body"}>
      <Card>
        <CardHeader title="Ingrese datos de nuevo equipo" />
        <Divider />
        <CardContent>
          <Box component="form" onSubmit={submitHandler}>
            <Grid
              container
              direction="column"
              justifyContent="center"
              spacing={2}
              maxWidth="lg"
            >
              <Grid item lg={12}>
                <TextField
                  autoComplete="off"
                  required
                  id="machineNum"
                  name="machineNum"
                  label="# de Equipo"
                  fullWidth={true}
                />
              </Grid>
              <Grid item lg={12}>
                <TextField
                  autoComplete="off"
                  required
                  id="brand"
                  name="brand"
                  label="Marca"
                  fullWidth={true}
                />
              </Grid>
              <Grid item lg={12}>
                <TextField
                  autoComplete="off"
                  id="capacity"
                  name="capacity"
                  label="Capacidad"
                  fullWidth={true}
                />
              </Grid>
              <Grid item lg={12}>
                <TextField
                  type="number"
                  autoComplete="off"
                  id="cost"
                  name="cost"
                  label="Costo ($)"
                  fullWidth={true}
                />
              </Grid>
              <Grid item lg={12}>
                <FormControl fullWidth>
                  <InputLabel id="status-id">Estado actual</InputLabel>
                  <Select
                    labelId="status-id"
                    id="status"
                    name="status"
                    label="Estado actual"
                    required
                    autoComplete="off"
                    value={selectedStatus?._id || ""}
                    onChange={(event) =>
                      handleStatusSelection(event.target.value)
                    }
                  >
                    {machinesStatusList
                      ? machinesStatusList.map((status) => (
                          <MenuItem key={status._id} value={status._id}>
                            {status.description}
                          </MenuItem>
                        ))
                      : null}
                  </Select>
                </FormControl>
              </Grid>
              {isWarehouseStatus && (
                <>
                  {warehousesError && (
                    <Grid item lg={12}>
                      <Alert severity="error">{warehousesError?.message}</Alert>
                    </Grid>
                  )}
                  <Grid item lg={12}>
                    <FormControl fullWidth>
                      <InputLabel id="warehouse-id">Bodega</InputLabel>
                      <Select
                        labelId="warehouse-id"
                        id="warehouse"
                        name="warehouse"
                        label="Bodega"
                        required
                        autoComplete="off"
                        value={selectedLocation || ""}
                        onChange={(event) =>
                          handleLocationSelection(event.target.value)
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
                      <Alert severity="error">{vehiclesError?.message}</Alert>
                    </Grid>
                  )}
                  <Grid item lg={12}>
                    <FormControl fullWidth>
                      <InputLabel id="vehicle-id">Operador</InputLabel>
                      <Select
                        labelId="vehicle-id"
                        id="vehicle"
                        name="vehicle"
                        label="Operador"
                        required
                        autoComplete="off"
                        value={selectedLocation || ""}
                        onChange={(event) =>
                          handleLocationSelection(event.target.value)
                        }
                      >
                        {vehiclesList
                          ? vehiclesList.map((vehicle) => (
                              <MenuItem key={vehicle._id} value={vehicle._id}>
                                {vehicle.operator.name}
                              </MenuItem>
                            ))
                          : null}
                      </Select>
                    </FormControl>
                  </Grid>
                </>
              )}
              <Grid item lg={12}>
                {hasError.error ? (
                  <Grid item>
                    <br />
                    <Alert severity="error">{hasError?.msg}</Alert>
                  </Grid>
                ) : null}
              </Grid>

              <Grid item lg={12}>
                <Grid
                  container
                  alignItems={"right"}
                  direction="row"
                  justifyContent="right"
                  spacing={2}
                >
                  <Grid item>
                    <Button
                      size="large"
                      variant="outlined"
                      onClick={() => handleClose()}
                    >
                      Cancelar
                    </Button>
                  </Grid>
                  <Grid item>
                    <LoadingButton
                      disabled={
                        (isWarehouseStatus && warehousesError) ||
                        (isVehicleStatus && vehiclesError)
                      }
                      type="submit"
                      loading={isLoading}
                      size="large"
                      variant="contained"
                    >
                      Guardar
                    </LoadingButton>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </Dialog>
  );
}

AddMachineModal.propTypes = {
  handleOnClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  machinesStatusList: PropTypes.array.isRequired,
};

export default AddMachineModal;
