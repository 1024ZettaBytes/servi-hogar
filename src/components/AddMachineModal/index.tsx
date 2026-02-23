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
  Skeleton,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import {
  useGetAllWarehousesOverview,
  getFetcher,
  useGetAllVehicles,
  useGetPartners,
} from "../../../pages/api/useRequest";
import { saveMachine } from "../../../lib/client/machinesFetch";
import { MACHINE_STATUS_LIST } from "../../../lib/consts/OBJ_CONTS";
import { compressImage } from "../../../lib/client/utils";

function AddMachineModal(props) {
  const { warehousesList, warehousesError } = useGetAllWarehousesOverview(
    getFetcher
  );
  const { vehiclesList, vehiclesError } = useGetAllVehicles(getFetcher);
  const { partnersList, partnersError } = useGetPartners(getFetcher);
  const { handleOnClose, open, machinesStatusList } = props;
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState({ error: false, msg: "" });
  const [selectedStatus, setSelectedStatus] = useState({
    _id: "",
    id: "",
    typeWarehouse: false,
  });
  const [selectedLocation, setSelectedLocation] = useState();
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [photo1, setPhoto1] = useState(null);
  const [photo2, setPhoto2] = useState(null);
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
    
    if (!photo1 || !photo2) {
      setHasError({
        error: true,
        msg: "Debe subir ambas fotos del equipo"
      });
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("brand", event.target.brand.value);
    formData.append("cost", event.target.cost.value);
    formData.append("status", selectedStatus?._id);
    formData.append("location", selectedLocation || "");
    formData.append("partner", selectedPartner || "");
    formData.append("photo1", photo1);
    formData.append("photo2", photo2);

    const result = await saveMachine(formData);

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
    setPhoto1(null);
    setPhoto2(null);
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
        <CardHeader 
          title="Ingrese datos de nuevo equipo" 
          subheader="El número de equipo se asignará automáticamente"  
        />
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
                  id="brand"
                  name="brand"
                  label="Marca"
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
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  color={photo1 ? "success" : "primary"}
                >
                  {photo1 ? `Foto 1: ${photo1.name}` : "Seleccionar Foto 1 *"}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={async (e) => {
                      if (e.target.files?.[0]) {
                        const result = await compressImage(e.target.files[0]);
                        if (result) {
                          setPhoto1(result.file);
                        }
                      }
                    }}
                  />
                </Button>
              </Grid>

              <Grid item lg={12}>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  color={photo2 ? "success" : "primary"}
                >
                  {photo2 ? `Foto 2: ${photo2.name}` : "Seleccionar Foto 2 *"}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={async (e) => {
                      if (e.target.files?.[0]) {
                        const result = await compressImage(e.target.files[0]);
                        if (result) {
                          setPhoto2(result.file);
                        }
                      }
                    }}
                  />
                </Button>
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
                {partnersError ? (
                  <Alert severity="error">{partnersError?.message}</Alert>
                ):!partnersList?<Skeleton
                variant="rectangular"
                width={"100%"}
                height={500}
                animation="wave"
              />:<FormControl fullWidth>
              <InputLabel id="partner-id">Socio (opcional)</InputLabel>
              <Select
                labelId="partner-id"
                id="partner"
                name="partner"
                label="Socio"
                autoComplete="off"
                value={selectedPartner || ""}
                onChange={(event) =>
                  setSelectedPartner(event.target.value)
                }
              >
                {partnersList
                  ? partnersList.map((partner) => (
                      <MenuItem key={partner._id} value={partner._id}>
                        {partner.name}
                      </MenuItem>
                    ))
                  : null}
              </Select>
            </FormControl>}

              </Grid>
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
