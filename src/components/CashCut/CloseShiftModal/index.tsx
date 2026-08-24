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
  Typography,
  TextField,
  InputAdornment,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { createOfficeCashCut } from '../../../../lib/client/cashCutsFetch';

const money = (value) => `$${Number(value || 0).toLocaleString('es-MX')}`;

/**
 * Cierre de turno de oficina: se declara el total físico en caja y se elige a
 * quién se entrega para que lo cuente y confirme.
 */
function CloseShiftModal(props) {
  const { open, handleOnClose, box } = props;

  const [declaredAmount, setDeclaredAmount] = useState(
    String(box?.expectedBalance ?? '')
  );
  const [handedToUserId, setHandedToUserId] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState({ error: false, msg: '' });

  const parsedAmount = Number(declaredAmount);
  const isAmountValid =
    declaredAmount !== '' && Number.isFinite(parsedAmount) && parsedAmount >= 0;
  const difference = isAmountValid
    ? parsedAmount - (box?.expectedBalance || 0)
    : 0;

  const handleClose = (success = false, msg = '') => {
    setDeclaredAmount(String(box?.expectedBalance ?? ''));
    setHandedToUserId('');
    setNotes('');
    setHasError({ error: false, msg: '' });
    handleOnClose(success, msg);
  };

  async function submitHandler(event) {
    event.preventDefault();
    setHasError({ error: false, msg: '' });

    if (!isAmountValid) {
      setHasError({ error: true, msg: 'Indique el total que hay en caja.' });
      return;
    }

    setIsLoading(true);
    const result = await createOfficeCashCut({
      declaredAmount: parsedAmount,
      handedToUserId: handedToUserId || null,
      notes
    });
    setIsLoading(false);

    if (result.error) {
      setHasError({ error: true, msg: result.msg });
      return;
    }

    handleClose(true, result.msg);
  }

  return (
    <Dialog open={open} maxWidth="sm" scroll="body" fullWidth>
      <Card>
        <CardHeader title="Cerrar turno de caja" />
        <Divider />
        <CardContent>
          <Box component="form" onSubmit={submitHandler}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ p: 2, borderRadius: 1, bgcolor: 'background.default' }}>
                  <Stack spacing={0.5}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Saldo inicial
                      </Typography>
                      <Typography variant="body2">
                        {money(box?.previousBalance)}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Cobros en efectivo
                      </Typography>
                      <Typography variant="body2" color="success.main">
                        + {money(box?.cashIn)}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Gastos y compras
                      </Typography>
                      <Typography variant="body2" color="error.main">
                        − {money(box?.expensesTotal)}
                      </Typography>
                    </Stack>
                    <Divider sx={{ my: 1 }} />
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="h4" fontWeight="bold">
                        Debe haber en caja
                      </Typography>
                      <Typography variant="h4" fontWeight="bold">
                        {money(box?.expectedBalance)}
                      </Typography>
                    </Stack>
                  </Stack>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Total contado en caja*"
                  type="number"
                  fullWidth
                  autoFocus
                  size="small"
                  value={declaredAmount}
                  onChange={(e) => setDeclaredAmount(e.target.value)}
                  error={declaredAmount !== '' && !isAmountValid}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">$</InputAdornment>
                    ),
                    inputProps: { min: 0, step: '0.01' }
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel id="handed-to-label">Entregar a</InputLabel>
                  <Select
                    labelId="handed-to-label"
                    label="Entregar a"
                    value={handedToUserId}
                    onChange={(e) => setHandedToUserId(e.target.value)}
                  >
                    <MenuItem value="">
                      <em>Nadie por ahora</em>
                    </MenuItem>
                    {(box?.availableUsers || []).map((user) => (
                      <MenuItem key={user._id} value={user._id}>
                        {user.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {isAmountValid && difference !== 0 && (
                <Grid item xs={12}>
                  <Alert severity={difference < 0 ? 'warning' : 'info'}>
                    {difference < 0
                      ? `Faltan ${money(Math.abs(difference))} respecto a lo esperado`
                      : `Sobran ${money(difference)} respecto a lo esperado`}
                  </Alert>
                </Grid>
              )}

              {!handedToUserId && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    Si no elige a quién entregar, la caja queda pendiente de
                    confirmar y la contará quien entre en el siguiente turno.
                  </Alert>
                </Grid>
              )}

              <Grid item xs={12}>
                <TextField
                  label="Observaciones"
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </Grid>

              {hasError.error && (
                <Grid item xs={12}>
                  <Alert severity="error">{hasError.msg}</Alert>
                </Grid>
              )}

              <Grid item xs={12}>
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => handleClose()}
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                  <LoadingButton
                    type="submit"
                    variant="contained"
                    loading={isLoading}
                    disabled={!isAmountValid}
                  >
                    Cerrar turno
                  </LoadingButton>
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </Dialog>
  );
}

CloseShiftModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleOnClose: PropTypes.func.isRequired,
  box: PropTypes.object
};

CloseShiftModal.defaultProps = {
  box: null
};

export default CloseShiftModal;
