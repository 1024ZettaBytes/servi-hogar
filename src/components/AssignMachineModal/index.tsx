import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
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
  FormControlLabel,
  Checkbox,
  MenuItem,
  TextField,
  Chip,
  Stack,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { updateTecnician, getTecnicianRangeInfo } from 'lib/client/usersFetch';

// Ranges are assigned in fixed, consecutive blocks of 50 machines (must match
// MACHINE_BLOCK_SIZE on the server).
const BLOCK_SIZE = 50;
const blockStart = (block) => (block - 1) * BLOCK_SIZE + 1;
const blockEnd = (block) => block * BLOCK_SIZE;
const blockOf = (machineNum) => Math.floor((machineNum - 1) / BLOCK_SIZE) + 1;

function AssignMachineModal(props) {
  const { handleOnClose, open, tecList, selectedTec } = props;

  const [isLoading, setIsLoading] = useState(false);
  const [infoLoading, setInfoLoading] = useState(true);
  const [maxMachineNum, setMaxMachineNum] = useState(null);
  const [hasError, setHasError] = useState({ error: false, msg: '' });

  const hasCurrentRange = selectedTec?.startM > 0 && selectedTec?.endM > 0;
  const [unassign, setUnassign] = useState(false);
  const [startBlock, setStartBlock] = useState(
    hasCurrentRange ? blockOf(selectedTec.startM) : null
  );
  const [endBlock, setEndBlock] = useState(
    hasCurrentRange ? blockOf(selectedTec.endM) : null
  );
  const [tecPay, setTecPay] = useState(
    selectedTec?.tecPay != null ? String(selectedTec.tecPay) : '0'
  );

  useEffect(() => {
    let active = true;
    (async () => {
      const result = await getTecnicianRangeInfo();
      if (!active) return;
      if (!result.error) {
        setMaxMachineNum(result.data?.maxMachineNum ?? 0);
      } else {
        setMaxMachineNum(0);
        setHasError({ error: true, msg: result.msg });
      }
      setInfoLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  // How many 50-machine blocks exist. Cover the highest machine number as well as
  // any range currently assigned (in case existing data goes beyond the last machine).
  const highestEnd = Math.max(
    maxMachineNum || 0,
    ...tecList.map((t) => (t.endM > 0 ? t.endM : 0)),
    selectedTec?.endM > 0 ? selectedTec.endM : 0
  );
  const numBlocks = Math.max(Math.ceil(highestEnd / BLOCK_SIZE), 1);
  const blocks = Array.from({ length: numBlocks }, (_, i) => i + 1);

  // Which technician (other than the selected one) currently owns each block.
  const blockOwners = {};
  tecList.forEach((tec) => {
    if (tec._id === selectedTec?._id) return;
    if (tec.startM > 0 && tec.endM > 0) {
      const first = blockOf(tec.startM);
      const last = blockOf(tec.endM);
      for (let b = first; b <= last; b++) blockOwners[b] = tec.name;
    }
  });

  const currentFirstBlock = hasCurrentRange ? blockOf(selectedTec.startM) : null;
  const currentLastBlock = hasCurrentRange ? blockOf(selectedTec.endM) : null;

  // Techs whose blocks would be taken over by the chosen selection.
  const affectedTechs = [];
  if (!unassign && startBlock && endBlock && startBlock <= endBlock) {
    const set = new Set();
    for (let b = startBlock; b <= endBlock; b++) {
      if (blockOwners[b]) set.add(blockOwners[b]);
    }
    affectedTechs.push(...set);
  }

  const selectionValid =
    unassign || (startBlock && endBlock && startBlock <= endBlock);

  const newStartM = unassign ? -1 : startBlock ? blockStart(startBlock) : null;
  const newEndM = unassign ? -1 : endBlock ? blockEnd(endBlock) : null;
  const currentStartM = hasCurrentRange ? selectedTec.startM : -1;
  const currentEndM = hasCurrentRange ? selectedTec.endM : -1;
  const rangeChanged = newStartM !== currentStartM || newEndM !== currentEndM;
  const payValue = Number(tecPay);
  const payChanged = payValue !== Number(selectedTec?.tecPay || 0);
  const payValid = !Number.isNaN(payValue) && payValue >= 0;

  const disabledSave =
    isLoading ||
    infoLoading ||
    !selectionValid ||
    !payValid ||
    (!rangeChanged && !payChanged);

  async function submitHandler(event) {
    event.preventDefault();
    setIsLoading(true);
    setHasError({ error: false, msg: '' });
    const result = await updateTecnician({
      id: selectedTec._id,
      startM: newStartM,
      endM: newEndM,
      tecPay: payValue
    });
    setIsLoading(false);
    if (!result.error) {
      handleOnClose(true, result.msg);
    } else {
      setHasError({ error: true, msg: result.msg });
    }
  }

  const handleClose = () => {
    handleOnClose(false);
  };

  return (
    <Dialog fullWidth open={open} scroll={'body'}>
      <Card>
        <CardHeader title={`Asignar equipos a ${selectedTec?.name}`} />
        <Divider />
        <CardContent>
          {infoLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Box component="form" onSubmit={submitHandler}>
              <Grid container spacing={2}>
                <Grid item lg={12} xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Ocupación de bloques
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {blocks.map((b) => {
                      const owner = blockOwners[b];
                      const isCurrent =
                        currentFirstBlock &&
                        b >= currentFirstBlock &&
                        b <= currentLastBlock;
                      const isSelected =
                        !unassign &&
                        startBlock &&
                        endBlock &&
                        b >= startBlock &&
                        b <= endBlock;
                      let color = 'default';
                      if (isSelected) color = 'primary';
                      else if (owner) color = 'warning';
                      else if (isCurrent) color = 'success';
                      return (
                        <Chip
                          key={b}
                          size="small"
                          color={color as any}
                          variant={isSelected ? 'filled' : 'outlined'}
                          label={
                            owner
                              ? `${blockStart(b)}-${blockEnd(b)} · ${owner}`
                              : `${blockStart(b)}-${blockEnd(b)}`
                          }
                        />
                      );
                    })}
                  </Stack>
                </Grid>

                <Grid item lg={12} xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={unassign}
                        onChange={(e) => setUnassign(e.target.checked)}
                      />
                    }
                    label="Dejar sin rango asignado (liberar equipos)"
                  />
                </Grid>

                <Grid item lg={6} xs={12}>
                  <FormControl fullWidth disabled={unassign}>
                    <InputLabel id="start-block-id">Bloque inicial</InputLabel>
                    <Select
                      labelId="start-block-id"
                      label="Bloque inicial"
                      value={startBlock ?? ''}
                      onChange={(e) => setStartBlock(Number(e.target.value))}
                    >
                      {blocks.map((b) => (
                        <MenuItem key={b} value={b}>
                          {`${blockStart(b)} - ${blockEnd(b)}`}
                          {blockOwners[b] ? ` (${blockOwners[b]})` : ''}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item lg={6} xs={12}>
                  <FormControl fullWidth disabled={unassign}>
                    <InputLabel id="end-block-id">Bloque final</InputLabel>
                    <Select
                      labelId="end-block-id"
                      label="Bloque final"
                      value={endBlock ?? ''}
                      onChange={(e) => setEndBlock(Number(e.target.value))}
                    >
                      {blocks.map((b) => (
                        <MenuItem key={b} value={b}>
                          {`${blockStart(b)} - ${blockEnd(b)}`}
                          {blockOwners[b] ? ` (${blockOwners[b]})` : ''}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item lg={6} xs={12}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Pago por mantenimiento (tecPay)"
                    value={tecPay}
                    onChange={(e) => setTecPay(e.target.value)}
                    inputProps={{ min: 0, step: 1 }}
                    error={!payValid}
                    helperText={
                      !payValid ? 'Ingrese un número válido (>= 0)' : ''
                    }
                  />
                </Grid>

                {!unassign && startBlock && endBlock && startBlock > endBlock && (
                  <Grid item lg={12} xs={12}>
                    <Alert severity="error">
                      El bloque inicial no puede ser mayor al bloque final.
                    </Alert>
                  </Grid>
                )}

                {affectedTechs.length > 0 && (
                  <Grid item lg={12} xs={12}>
                    <Alert severity="warning">
                      {`Se reasignarán bloques actualmente de: ${affectedTechs.join(
                        ', '
                      )}. Los mantenimientos pendientes y en progreso de esos equipos pasarán a ${
                        selectedTec?.name
                      }.`}
                    </Alert>
                  </Grid>
                )}

                {unassign && hasCurrentRange && (
                  <Grid item lg={12} xs={12}>
                    <Alert severity="info">
                      Los mantenimientos en curso de este técnico no se moverán
                      automáticamente al liberar el rango.
                    </Alert>
                  </Grid>
                )}

                {hasError.error && (
                  <Grid item lg={12} xs={12}>
                    <Alert severity="error">{hasError.msg}</Alert>
                  </Grid>
                )}

                <Grid item lg={12} xs={12}>
                  <Grid
                    container
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
          )}
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
