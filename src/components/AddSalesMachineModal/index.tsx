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
  Alert
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { saveSalesMachine } from '../../../lib/client/salesMachinesFetch';

function AddSalesMachineModal(props) {
  const { handleOnClose, open } = props;

  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState({ error: false, msg: '' });
  const [brand, setBrand] = useState('');
  const [capacity, setCapacity] = useState('');
  const [cost, setCost] = useState('');
  const [serialNumber, setSerialNumber] = useState('');

  async function submitHandler(event) {
    event.preventDefault();
    setIsLoading(true);
    setHasError({ error: false, msg: '' });

    if (!brand || !cost) {
      setHasError({ 
        error: true, 
        msg: 'Por favor complete todos los campos requeridos' 
      });
      setIsLoading(false);
      return;
    }

    const result = await saveSalesMachine({
      brand,
      capacity,
      cost: parseFloat(cost),
      serialNumber
    });

    setIsLoading(false);
    if (!result.error) {
      handleSaved(result.msg);
    } else {
      handleErrorOnSave(result.msg);
    }
  }

  const handleClose = () => {
    setHasError({ error: false, msg: '' });
    setIsLoading(false);
    setBrand('');
    setCapacity('');
    setCost('');
    setSerialNumber('');
    handleOnClose(false);
  };

  const handleSaved = (successMessage) => {
    handleOnClose(true, successMessage);
  };

  const handleErrorOnSave = (msg) => {
    setHasError({ error: true, msg });
  };

  return (
    <Dialog open={open} fullWidth={true} maxWidth="xs" scroll={'body'}>
      <Card>
        <CardHeader 
          title="Agregar Equipo de Venta" 
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
              maxWidth="xs"
            >
              <Grid item lg={12}>
                <TextField
                  autoComplete="off"
                  required
                  id="brand"
                  name="brand"
                  label="Marca"
                  fullWidth={true}
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                />
              </Grid>

              <Grid item lg={12}>
                <TextField
                  autoComplete="off"
                  id="capacity"
                  name="capacity"
                  label="Capacidad"
                  fullWidth={true}
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                />
              </Grid>

              <Grid item lg={12}>
                <TextField
                  type="number"
                  autoComplete="off"
                  required
                  id="cost"
                  name="cost"
                  label="Costo ($)"
                  fullWidth={true}
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>

              <Grid item lg={12}>
                <TextField
                  autoComplete="off"
                  id="serialNumber"
                  name="serialNumber"
                  label="Número de Serie"
                  fullWidth={true}
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                />
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

AddSalesMachineModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleOnClose: PropTypes.func.isRequired
};

export default AddSalesMachineModal;
