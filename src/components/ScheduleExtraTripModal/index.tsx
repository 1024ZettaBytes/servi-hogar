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
  Alert,
  Typography
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import TextField from '@mui/material/TextField';
import { scheduleExtraTrip } from '../../../lib/client/extraTripsFetch';

function ScheduleExtraTripModal(props) {
  const { handleOnClose, open, trip } = props;

  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState({ error: false, msg: '' });
  const [selectedTime, setSelectedTime] = useState<Date | null>(
    trip?.scheduledTime ? new Date(trip.scheduledTime) : null
  );

  async function submitHandler(event) {
    event.preventDefault();
    setIsLoading(true);
    setHasError({ error: false, msg: '' });

    if (!selectedTime) {
      setHasError({ error: true, msg: 'Debe seleccionar una hora' });
      setIsLoading(false);
      return;
    }

    const result = await scheduleExtraTrip(trip._id, selectedTime.toISOString());

    setIsLoading(false);
    if (!result.error) {
      handleScheduled(result.msg || 'Hora programada correctamente');
    } else {
      handleErrorOnSchedule(result.msg);
    }
  }

  const handleClose = () => {
    setHasError({ error: false, msg: '' });
    setIsLoading(false);
    setSelectedTime(null);
    handleOnClose(false);
  };

  const handleScheduled = (successMessage) => {
    setHasError({ error: false, msg: '' });
    setIsLoading(false);
    setSelectedTime(null);
    handleOnClose(true, successMessage);
  };

  const handleErrorOnSchedule = (msg) => {
    setHasError({ error: true, msg });
  };

  return (
    <Dialog open={open} fullWidth={true} maxWidth="xs" scroll={'body'}>
      <Card>
        <CardHeader title="Programar Hora de Vuelta Extra" />
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
              {/* Trip Information */}
              <Grid item lg={12}>
                <Box sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Número de Vuelta
                  </Typography>
                  <Typography variant="h6" gutterBottom>
                    #{trip?.tripNumber}
                  </Typography>
                  
                  <Typography variant="caption" color="text.secondary">
                    Destino
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    {trip?.destination || 'Sin destino'}
                  </Typography>
                  
                  <Typography variant="caption" color="text.secondary">
                    Motivo
                  </Typography>
                  <Typography variant="body2">
                    {trip?.reason || 'Sin motivo'}
                  </Typography>

                  {trip?.assignedTo && (
                    <>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Operador Asignado
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {trip.assignedTo.name}
                      </Typography>
                    </>
                  )}
                </Box>
              </Grid>

              {/* Time Selection */}
              <Grid item lg={12}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <TimePicker
                    label="Hora programada"
                    value={selectedTime}
                    onChange={(newValue: Date | null) => setSelectedTime(newValue)}
                    renderInput={(params) => (
                      <TextField {...params} fullWidth required />
                    )}
                  />
                </LocalizationProvider>
              </Grid>

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
                    Programar
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

ScheduleExtraTripModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleOnClose: PropTypes.func.isRequired,
  trip: PropTypes.object
};

export default ScheduleExtraTripModal;
