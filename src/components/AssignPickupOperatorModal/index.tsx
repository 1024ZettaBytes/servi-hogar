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
  Autocomplete,
  TextField,
  Typography
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import useSWR from 'swr';

const fetcher = (url) => fetch(url).then((res) => res.json());

function AssignPickupOperatorModal(props) {
  const { handleOnClose, open, pickup, isAssigning } = props;

  const [hasError, setHasError] = useState({ error: false, msg: '' });
  const [selectedOperator, setSelectedOperator] = useState(null);

  // Fetch operators list
  const { data: operatorsData } = useSWR(
    open ? '/api/operators' : null,
    fetcher
  );

  const operatorsList = operatorsData?.data || [];

  async function submitHandler(event) {
    event.preventDefault();
    setHasError({ error: false, msg: '' });

    if (!selectedOperator) {
      setHasError({ error: true, msg: 'Debe seleccionar un operador' });
      return;
    }

    // Close with operator ID for parent component to handle
    const operatorId = selectedOperator._id || selectedOperator.id;
    handleOnClose(true, operatorId);
  }

  const handleClose = () => {
    setHasError({ error: false, msg: '' });
    setSelectedOperator(null);
    handleOnClose(false);
  };

  const customer = pickup?.sale?.customer;
  const machine = pickup?.machine;

  return (
    <Dialog open={open} fullWidth={true} maxWidth="xs" scroll={'body'}>
      <Card>
        <CardHeader title="Asignar Operador a Recolección" />
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
              {/* Pickup Information */}
              <Grid item lg={12}>
                <Box sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Cliente
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {customer?.name || 'N/A'}
                  </Typography>
                  
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Máquina
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    #{machine?.machineNum || 'N/A'} - {machine?.brand || 'N/A'}
                  </Typography>
                  
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Razón
                  </Typography>
                  <Typography variant="body2">
                    {pickup?.reason || 'N/A'}
                  </Typography>
                </Box>
              </Grid>

              {/* Operator Selection */}
              <Grid item lg={12}>
                <Autocomplete
                  options={operatorsList}
                  getOptionLabel={(option) => option.name}
                  value={selectedOperator}
                  onChange={(_event, newValue) => {
                    setSelectedOperator(newValue);
                    setHasError({ error: false, msg: '' });
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Operador"
                      required
                      error={hasError.error && !selectedOperator}
                    />
                  )}
                  disabled={isAssigning}
                />
              </Grid>

              {/* Error Message */}
              {hasError.error && (
                <Grid item lg={12}>
                  <Alert severity="error">{hasError.msg}</Alert>
                </Grid>
              )}

              {/* Action Buttons */}
              <Grid item lg={12}>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <Button
                    onClick={handleClose}
                    variant="outlined"
                    disabled={isAssigning}
                  >
                    Cancelar
                  </Button>
                  <LoadingButton
                    type="submit"
                    variant="contained"
                    loading={isAssigning}
                  >
                    Asignar
                  </LoadingButton>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </Dialog>
  );
}

AssignPickupOperatorModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleOnClose: PropTypes.func.isRequired,
  pickup: PropTypes.object,
  isAssigning: PropTypes.bool
};

export default AssignPickupOperatorModal;
