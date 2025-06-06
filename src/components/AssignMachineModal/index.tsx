import PropTypes from 'prop-types';
import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  InputLabel,
  Select,
  FormControl,
  MenuItem,
  Alert
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { updateTecnician } from 'lib/client/usersFetch';
const machineRanges = [
  { id: '1 - 200', startM: 1, endM: 200 },
  { id: '201 - 400', startM: 201, endM: 400 },
  { id: '401 - 600', startM: 401, endM: 600 }
];
function AssignMachineModal(props) {
  const { handleOnClose, open, tecList, selectedTec } = props;

  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState({ error: false, msg: '' });
  const [selectedRange, setSelectedRange] = useState(
    selectedTec?.startM > 0 && selectedTec?.endM > 0
      ? {
          id: `${selectedTec.startM} - ${selectedTec.endM}`,
          startM: selectedTec.startM,
          endM: selectedTec.endM
        }
      : null
  );
  const currentRangesMap = new Map();
  tecList.forEach((tec) => {
    if (tec.startM > 0 && tec.endM > 0) {
      const k = `${tec.startM} - ${tec.endM}`;
      currentRangesMap.set(k, { ...tec });
    }
  });
  const isRangeAlreadyAssigned =
    selectedRange &&
    currentRangesMap.has(selectedRange.id) &&
    currentRangesMap.get(selectedRange.id).id !== selectedTec.id;

  const disabledSave =
    !selectedRange ||
    isLoading ||
    (selectedRange.startM === selectedTec.startM &&
      selectedRange.endM === selectedTec.endM);
  function handleRangeSelection(r) {
    const selected = machineRanges.find((mr) => mr.id === r);
    setSelectedRange(selected);
  }

  async function submitHandler(event) {
    event.preventDefault();
    setIsLoading(true);
    setHasError({ error: false, msg: '' });
    const result = await updateTecnician({
      id: selectedTec._id,
      startM: selectedRange.startM,
      endM: selectedRange.endM
    });
    setIsLoading(false);
    if (!result.error) {
      handleSavedTecnician(result.msg);
    } else {
      handleErrorOnSave(result.msg);
    }
  }
  const handleClose = () => {
    handleOnClose(false);
  };
  const handleSavedTecnician = (successMessage) => {
    handleOnClose(true, successMessage);
  };

  const handleErrorOnSave = (msg) => {
    setHasError({ error: true, msg });
  };

  return (
    <Dialog fullWidth open={open} scroll={'body'}>
      <Card>
        <CardHeader title={`Asignar equipos a ${selectedTec?.name}`} />
        <Divider />
        <CardContent>
          <Box component="form" onSubmit={submitHandler}>
            <Grid container spacing={2}>
              <Grid item lg={12}>
                <FormControl fullWidth>
                  <InputLabel id="status-id">Rango de equipos</InputLabel>
                  <Select
                    labelId="status-id"
                    id="status"
                    name="status"
                    label="Rango de equipos"
                    required
                    autoComplete="off"
                    value={
                      selectedRange
                        ? `${selectedRange.startM} - ${selectedRange.endM}`
                        : ''
                    }
                    onChange={(event) =>
                      handleRangeSelection(event.target.value)
                    }
                  >
                    {machineRanges.map((r) => (
                      <MenuItem key={r.id} value={r.id}>
                        {r.id}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              {isRangeAlreadyAssigned && (
                <Grid item lg={12}>
                  <Grid item>
                    <br />
                    <Alert severity="warning">
                      {"El rango de equipos ya está asignado al técnico '" +
                        currentRangesMap.get(selectedRange.id).name +
                        "'.\n Se asignarán los mantenimientos pendientes a este técnico."}
                    </Alert>
                  </Grid>
                </Grid>
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
                  alignItems={'right'}
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
                      disabled={disabledSave}
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

AssignMachineModal.propTypes = {
  handleOnClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  tecList: PropTypes.array.isRequired,
  selectedTec: PropTypes.object.isRequired
};

export default AssignMachineModal;
