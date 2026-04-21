import PropTypes from 'prop-types';
import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  InputAdornment,
  TextField,
  Typography
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { sellRentMachine } from '../../../lib/client/rentsFetch';

function SellRentMachineModal({ open, handleOnClose, rent }) {
  const [isLoading, setIsLoading] = useState(false);
  const [cashPrice, setCashPrice] = useState<string>('');
  const [hasError, setHasError] = useState({ error: false, msg: '' });

  const machineName = rent?.machine?.machineNum
    ? `Equipo #${rent.machine.machineNum}`
    : 'el equipo';
  const customerName = rent?.customer?.name || 'el cliente';
  const parsedPrice = parseFloat(cashPrice);
  const isValid = !isNaN(parsedPrice) && parsedPrice > 0;

  async function submitHandler(event) {
    event.preventDefault();
    setIsLoading(true);
    setHasError({ error: false, msg: '' });

    const result = await sellRentMachine({ rentId: rent._id, cashPrice: parsedPrice });

    setIsLoading(false);
    if (!result.error) {
      handleOnClose(true, result.msg);
    } else {
      setHasError({ error: true, msg: result.msg });
    }
  }

  const handleClose = () => {
    setHasError({ error: false, msg: '' });
    setCashPrice('');
    setIsLoading(false);
    handleOnClose(false);
  };

  return (
    <Dialog open={open} maxWidth="xs" scroll="body">
      <Card>
        <CardHeader title="Vender máquina rentada" />
        <Divider />
        <CardContent>
          <Box component="form" onSubmit={submitHandler}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Alert severity="warning">
                  Al confirmar:
                  <ul style={{ margin: '4px 0 0 0', paddingLeft: 18 }}>
                    <li>
                      Se creará un registro de venta para <strong>{customerName}</strong>.
                    </li>
                    <li>
                      <strong>{machineName}</strong> será desactivado del inventario de renta.
                    </li>
                    <li>La renta actual quedará como finalizada.</li>
                  </ul>
                </Alert>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Ingrese el precio de venta (contado):
                </Typography>
                <TextField
                  label="Precio de venta"
                  type="number"
                  fullWidth
                  value={cashPrice}
                  variant="outlined"
                  size="small"
                  autoFocus
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">$</InputAdornment>
                    ),
                    inputProps: { min: 1 }
                  }}
                  onChange={(e) => setCashPrice(e.target.value)}
                />
              </Grid>
              {hasError.error && (
                <Grid item xs={12}>
                  <Alert severity="error">{hasError.msg}</Alert>
                </Grid>
              )}
              <Grid item xs={12}>
                <Grid container direction="row" justifyContent="flex-end" spacing={2}>
                  <Grid item>
                    <Button
                      size="large"
                      variant="outlined"
                      onClick={handleClose}
                      disabled={isLoading}
                    >
                      Cancelar
                    </Button>
                  </Grid>
                  <Grid item>
                    <LoadingButton
                      disabled={!isValid}
                      type="submit"
                      loading={isLoading}
                      size="large"
                      variant="contained"
                      color="warning"
                    >
                      Confirmar venta
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

SellRentMachineModal.propTypes = {
  handleOnClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  rent: PropTypes.object.isRequired
};

export default SellRentMachineModal;
