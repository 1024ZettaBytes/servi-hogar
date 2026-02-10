import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
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
  Autocomplete
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { saveExtraTrip } from '../../../lib/client/extraTripsFetch';
import { useGetOperators, getFetcher } from '../../../pages/api/useRequest';

function AddExtraTripModal(props) {
  const { handleOnClose, open } = props;
  const { operatorsList, operatorsError } = useGetOperators(getFetcher);

  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState({ error: false, msg: '' });
  const [destination, setDestination] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedOperator, setSelectedOperator] = useState(null);
  const [scheduledTime, setScheduledTime] = useState(null);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setDestination('');
      setReason('');
      setNotes('');
      setSelectedOperator(null);
      setScheduledTime(null);
      setHasError({ error: false, msg: '' });
    }
  }, [open]);

  async function submitHandler(event) {
    event.preventDefault();
    setIsLoading(true);
    setHasError({ error: false, msg: '' });

    if (!destination.trim()) {
      setHasError({ error: true, msg: 'El destino es requerido' });
      setIsLoading(false);
      return;
    }

    if (!reason.trim()) {
      setHasError({ error: true, msg: 'La razón es requerida' });
      setIsLoading(false);
      return;
    }

    const result = await saveExtraTrip({
      destination: destination.trim(),
      reason: reason.trim(),
      notes: notes.trim(),
      operatorId: selectedOperator?._id || null,
      scheduledTime: scheduledTime ? scheduledTime.toISOString() : null
    });

    setIsLoading(false);
    if (!result.error) {
      handleSavedTrip(result.msg, result.data);
    } else {
      handleErrorOnSave(result.msg);
    }
  }

  const handleClose = () => {
    setHasError({ error: false, msg: '' });
    setIsLoading(false);
    setDestination('');
    setReason('');
    setNotes('');
    setSelectedOperator(null);
    setScheduledTime(null);
    handleOnClose(false);
  };

  const handleSavedTrip = (successMessage, tripData) => {
    handleOnClose(true, successMessage, tripData);
  };

  const handleErrorOnSave = (msg) => {
    setHasError({ error: true, msg });
  };

  return (
    <Dialog open={open} fullWidth={true} maxWidth="sm" scroll={'body'}>
      <Card>
        <CardHeader title="Registrar Vuelta Extra" />
        <Divider />
        <CardContent>
          <Box component="form" onSubmit={submitHandler}>
            <Grid
              container
              direction="column"
              justifyContent="center"
              spacing={2}
            >
              <Grid item xs={12}>
                <TextField
                  autoComplete="off"
                  required
                  id="destination"
                  name="destination"
                  label="Destino"
                  placeholder="Ej: Bodega Central, Sucursal Norte..."
                  fullWidth={true}
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  autoComplete="off"
                  required
                  id="reason"
                  name="reason"
                  label="Razón"
                  placeholder="Ej: Recoger material, Entregar documentos..."
                  fullWidth={true}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  autoComplete="off"
                  id="notes"
                  name="notes"
                  label="Notas adicionales (opcional)"
                  fullWidth={true}
                  multiline
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                {operatorsError ? (
                  <Alert severity="error">{operatorsError?.message}</Alert>
                ) : !operatorsList ? (
                  <Skeleton
                    variant="rectangular"
                    width={'100%'}
                    height={56}
                    animation="wave"
                  />
                ) : (
                  <Autocomplete
                    disablePortal
                    options={operatorsList}
                    getOptionLabel={(option) => option.name}
                    value={selectedOperator}
                    onChange={(_event, newValue) => {
                      setSelectedOperator(newValue);
                    }}
                    isOptionEqualToValue={(option, value) =>
                      option._id === value._id
                    }
                    renderInput={(params) => (
                      <TextField {...params} label="Operador (opcional)" />
                    )}
                  />
                )}
              </Grid>

              {hasError.error && (
                <Grid item xs={12}>
                  <Alert severity="error">{hasError.msg}</Alert>
                </Grid>
              )}

              <Grid
                item
                container
                direction="row"
                justifyContent="center"
                xs={12}
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

AddExtraTripModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleOnClose: PropTypes.func.isRequired
};

export default AddExtraTripModal;
