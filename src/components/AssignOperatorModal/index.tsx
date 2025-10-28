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
import { assignSaleToOperator } from '../../../lib/client/salesFetch';

const fetcher = (url) => fetch(url).then((res) => res.json());

function AssignOperatorModal(props) {
  const { handleOnClose, open, sale } = props;

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

    const result = await assignSaleToOperator({
      saleId: sale._id,
      operatorId: selectedOperator.id
    });

    setIsLoading(false);
    if (!result.error) {
      handleAssigned(result.msg);
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
    handleOnClose(true, successMessage);
  };

  const handleErrorOnAssign = (msg) => {
    setHasError({ error: true, msg });
  };

  const machineInfo = sale?.machine
    ? `#${sale.machine.machineNum} - ${sale.machine.brand}`
    : sale?.serialNumber || 'N/A';

  return (
    <Dialog open={open} fullWidth={true} maxWidth="xs" scroll={'body'}>
      <Card>
        <CardHeader title="Asignar Operador" />
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
              {/* Sale Information */}
              <Grid item lg={12}>
                <Box sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Folio
                  </Typography>
                  <Typography variant="h6" gutterBottom>
                    #{sale?.saleNum}
                  </Typography>
                  
                  <Typography variant="caption" color="text.secondary">
                    Equipo
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    {machineInfo}
                  </Typography>
                  
                  {sale?.customer && (
                    <>
                      <Typography variant="caption" color="text.secondary">
                        Cliente
                      </Typography>
                      <Typography variant="body2">
                        {sale.customer.name}
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
                      <TextField {...params} label="Seleccionar Operador" required />
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
                    Asignar
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

AssignOperatorModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleOnClose: PropTypes.func.isRequired,
  sale: PropTypes.object
};

export default AssignOperatorModal;
