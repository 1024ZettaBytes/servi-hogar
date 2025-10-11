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
  TextField,
  Alert,
  Skeleton,
  FormControlLabel,
  Switch,
  Autocomplete,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import {
  useGetAllMachines,
  getFetcher,
  useGetAllCustomers,
} from "../../../pages/api/useRequest";
import { saveSale } from "../../../lib/client/salesFetch";

function AddSaleModal(props) {
  const { handleOnClose, open } = props;
  const { machinesData, machinesError } = useGetAllMachines(getFetcher);
  const { customerList, customerError } = useGetAllCustomers(getFetcher, false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState({ error: false, msg: "" });
  const [useExistingMachine, setUseExistingMachine] = useState(true);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [serialNumber, setSerialNumber] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [initialPayment, setInitialPayment] = useState("");
  const [totalWeeks, setTotalWeeks] = useState("");

  // Get available machines (active ones that are not rented)
  const machinesList = machinesData?.machinesList || [];
  const availableMachines = machinesList.filter(
    (machine) => machine.active && machine.status?.id !== 'RENT'
  );

  const weeklyPayment = totalWeeks && totalAmount && initialPayment
    ? ((parseFloat(totalAmount) - parseFloat(initialPayment)) / parseFloat(totalWeeks)).toFixed(2)
    : "0.00";

  async function submitHandler(event) {
    event.preventDefault();
    setIsLoading(true);
    setHasError({ error: false, msg: "" });

    if (useExistingMachine && !selectedMachine) {
      setHasError({ error: true, msg: "Debe seleccionar un equipo" });
      setIsLoading(false);
      return;
    }

    if (!useExistingMachine && !serialNumber.trim()) {
      setHasError({ error: true, msg: "Debe ingresar un número de serie" });
      setIsLoading(false);
      return;
    }

    const result = await saveSale({
      machineId: useExistingMachine ? selectedMachine?._id : null,
      serialNumber: useExistingMachine ? "" : serialNumber,
      customerId: selectedCustomer?._id || null,
      totalAmount: parseFloat(totalAmount),
      initialPayment: parseFloat(initialPayment),
      totalWeeks: parseInt(totalWeeks),
    });

    setIsLoading(false);
    if (!result.error) {
      handleSavedSale(result.msg);
    } else {
      handleErrorOnSave(result.msg);
    }
  }

  const handleClose = () => {
    setHasError({ error: false, msg: "" });
    setIsLoading(false);
    setUseExistingMachine(true);
    setSelectedMachine(null);
    setSelectedCustomer(null);
    setSerialNumber("");
    setTotalAmount("");
    setInitialPayment("");
    setTotalWeeks("");
    handleOnClose(false);
  };

  const handleSavedSale = (successMessage) => {
    handleOnClose(true, successMessage);
  };

  const handleErrorOnSave = (msg) => {
    setHasError({ error: true, msg });
  };

  return (
    <Dialog open={open} fullWidth={true} maxWidth="xs" scroll={"body"}>
      <Card>
        <CardHeader title="Registrar Nueva Venta" />
        <Divider />
        <CardContent>
          <Box component="form" onSubmit={submitHandler}>
            <Grid
              container
              direction="column"
              justifyContent="center"
              spacing={2}
              maxWidth="xs"
            >
              <Grid item lg={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={useExistingMachine}
                      onChange={(e) => {
                        setUseExistingMachine(e.target.checked);
                        setSelectedMachine(null);
                        setSerialNumber("");
                      }}
                    />
                  }
                  label="Usar equipo existente"
                />
              </Grid>

              {useExistingMachine ? (
                <Grid item lg={12}>
                  {machinesError ? (
                    <Alert severity="error">{machinesError?.message}</Alert>
                  ) : !machinesList ? (
                    <Skeleton
                      variant="rectangular"
                      width={"100%"}
                      height={56}
                      animation="wave"
                    />
                  ) : (
                    <Autocomplete
                      options={availableMachines}
                      getOptionLabel={(option) =>
                        `#${option.machineNum} - ${option.brand} ${option.capacity || ''}`
                      }
                      value={selectedMachine}
                      onChange={(_event, newValue) => {
                        setSelectedMachine(newValue);
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Seleccionar Equipo"
                          required
                        />
                      )}
                    />
                  )}
                </Grid>
              ) : (
                <Grid item lg={12}>
                  <TextField
                    autoComplete="off"
                    required
                    id="serialNumber"
                    name="serialNumber"
                    label="Número de Serie"
                    fullWidth={true}
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                  />
                </Grid>
              )}

              <Grid item lg={12}>
                {customerError ? (
                  <Alert severity="error">{customerError?.message}</Alert>
                ) : !customerList ? (
                  <Skeleton
                    variant="rectangular"
                    width={"100%"}
                    height={56}
                    animation="wave"
                  />
                ) : (
                  <Autocomplete
                    options={customerList}
                    getOptionLabel={(option) => option.name}
                    value={selectedCustomer}
                    onChange={(_event, newValue) => {
                      setSelectedCustomer(newValue);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Cliente (opcional)"
                      />
                    )}
                  />
                )}
              </Grid>

              <Grid item lg={12}>
                <TextField
                  type="number"
                  autoComplete="off"
                  required
                  id="totalAmount"
                  name="totalAmount"
                  label="Monto Total ($)"
                  fullWidth={true}
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>

              <Grid item lg={12}>
                <TextField
                  type="number"
                  autoComplete="off"
                  required
                  id="initialPayment"
                  name="initialPayment"
                  label="Pago Inicial ($)"
                  fullWidth={true}
                  value={initialPayment}
                  onChange={(e) => setInitialPayment(e.target.value)}
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>

              <Grid item lg={12}>
                <TextField
                  type="number"
                  autoComplete="off"
                  required
                  id="totalWeeks"
                  name="totalWeeks"
                  label="Número de Semanas"
                  fullWidth={true}
                  value={totalWeeks}
                  onChange={(e) => setTotalWeeks(e.target.value)}
                  inputProps={{ min: 1, step: 1 }}
                />
              </Grid>

              {totalWeeks && totalAmount && initialPayment && (
                <Grid item lg={12}>
                  <Alert severity="info">
                    Pago semanal: <strong>${weeklyPayment}</strong>
                    <br />
                    Saldo restante: <strong>${(parseFloat(totalAmount) - parseFloat(initialPayment)).toFixed(2)}</strong>
                  </Alert>
                </Grid>
              )}

              {hasError.error && (
                <Grid item lg={12}>
                  <Alert severity="error">{hasError.msg}</Alert>
                </Grid>
              )}

              <Grid
                item
                container
                direction="row"
                justifyContent="center"
                lg={12}
                spacing={2}
              >
                <Grid item>
                  <Button onClick={handleClose} color="error">
                    Cancelar
                  </Button>
                </Grid>
                <Grid item>
                  <LoadingButton
                    loading={isLoading}
                    type="submit"
                    variant="contained"
                  >
                    Guardar
                  </LoadingButton>
                </Grid>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </Dialog>
  );
}

AddSaleModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleOnClose: PropTypes.func.isRequired,
  userId: PropTypes.string.isRequired,
};

export default AddSaleModal;
