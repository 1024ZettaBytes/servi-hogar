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
  Skeleton,
  Autocomplete,
  TextField,
  Typography
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import useSWR from 'swr';
import { assignExtraTrip } from '../../../lib/client/extraTripsFetch';

const fetcher = (url) => fetch(url).then((res) => res.json());

function AssignExtraTripOperatorModal(props) {
  const { handleOnClose, open, trip } = props;

  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState({ error: false, msg: '' });
  const [selectedOperator, setSelectedOperator] = useState(null);

  // Fetch operators list
  const { data: operatorsData, error: operatorsError } = useSWR(
    open ? '/api/operators' : null,
    fetcher
  );

  const operatorsList = operatorsData?.data || [];

  async function submitHandler(event) {
    event.preventDefault();
    setIsLoading(true);
    setHasError({ error: false, msg: '' });

    if (!selectedOperator) {
      setHasError({ error: true, msg: 'Debe seleccionar un operador' });
      setIsLoading(false);
      return;
    }

    const result = await assignExtraTrip(trip._id, selectedOperator.id);

    setIsLoading(false);
    if (!result.error) {
      handleAssigned(result.msg || 'Operador asignado correctamente');
    } else {
      handleErrorOnAssign(result.msg);
    }
  }

  const handleClose = () => {
    setHasError({ error: false, msg: '' });
    setIsLoading(false);
    setSelectedOperator(null);
    handleOnClose(false);
  };

  const handleAssigned = (successMessage) => {
    setHasError({ error: false, msg: '' });
    setIsLoading(false);
    setSelectedOperator(null);
    handleOnClose(true, successMessage);
  };

  const handleErrorOnAssign = (msg) => {
    setHasError({ error: true, msg });
  };

  return (
    <Dialog open={open} fullWidth={true} maxWidth="xs" scroll={'body'}>
      <Card>
        <CardHeader title="Asignar Operador a Vuelta Extra" />
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
                        Operador Actual
                      </Typography>
                      <Typography variant="body2" color="warning.main" fontWeight="bold">
                        {trip.assignedTo.name}
                      </Typography>
                    </>
                  )}
                </Box>
              </Grid>

              {/* Operator Selection */}
              <Grid item lg={12}>
                {operatorsError ? (
                  <Alert severity="error">{operatorsError?.message}</Alert>
                ) : !operatorsData ? (
                  <Skeleton
                    variant="rectangular"
                    width={'100%'}
                    height={56}
                    animation="wave"
                  />
                ) : (
                  <Autocomplete
                    options={operatorsList.map((operator) => ({
                      label: operator.name,
                      id: operator._id
                    }))}
                    value={selectedOperator}
                    onChange={(_event, newValue) => {
                      setSelectedOperator(newValue);
                    }}
                    isOptionEqualToValue={(option: any, value: any) =>
                      option.id === value.id
                    }
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label={trip?.assignedTo ? 'Cambiar Operador' : 'Seleccionar Operador'} 
                        required 
                      />
                    )}
                  />
                )}
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
                    {trip?.assignedTo ? 'Cambiar' : 'Asignar'}
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

AssignExtraTripOperatorModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleOnClose: PropTypes.func.isRequired,
  trip: PropTypes.object
};

export default AssignExtraTripOperatorModal;
