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
  TextField,
  Alert,
  Typography
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { completeExtraTrip } from '../../../lib/client/extraTripsFetch';

function CompleteExtraTripModal(props) {
  const { handleOnClose, open, trip } = props;

  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState({ error: false, msg: '' });
  const [completionNotes, setCompletionNotes] = useState('');

  if (!trip) return null;

  async function submitHandler(event) {
    event.preventDefault();
    setIsLoading(true);
    setHasError({ error: false, msg: '' });

    const result = await completeExtraTrip(trip._id, completionNotes.trim());

    setIsLoading(false);
    if (!result.error) {
      handleOnClose(true, result.msg);
    } else {
      setHasError({ error: true, msg: result.msg });
    }
  }

  const handleClose = () => {
    setHasError({ error: false, msg: '' });
    setIsLoading(false);
    setCompletionNotes('');
    handleOnClose(false);
  };

  return (
    <Dialog open={open} fullWidth={true} maxWidth="sm" scroll={'body'}>
      <Card>
        <CardHeader title="Completar Vuelta Extra" />
        <Divider />
        <CardContent>
          <Box component="form" onSubmit={submitHandler}>
            <Grid
              container
              direction="column"
              justifyContent="center"
              spacing={2}
            >
              {/* Trip Information */}
              <Grid item xs={12}>
                <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Grid container spacing={1}>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        Vuelta #
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {trip.tripNumber}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        Destino
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {trip.destination}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        Razón
                      </Typography>
                      <Typography variant="body2">
                        {trip.reason}
                      </Typography>
                    </Grid>
                    {trip.notes && (
                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary">
                          Notas
                        </Typography>
                        <Typography variant="body2">
                          {trip.notes}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Divider />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  autoComplete="off"
                  id="completionNotes"
                  name="completionNotes"
                  label="Notas de finalización (opcional)"
                  placeholder="Ej: Se recogió el material sin problemas..."
                  fullWidth={true}
                  multiline
                  rows={3}
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                />
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
                    color="success"
                  >
                    Completar Vuelta
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

CompleteExtraTripModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleOnClose: PropTypes.func.isRequired,
  trip: PropTypes.object
};

export default CompleteExtraTripModal;
