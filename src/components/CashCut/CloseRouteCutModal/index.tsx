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
  Stack
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { createRouteCashCut } from '../../../../lib/client/cashCutsFetch';

/**
 * Cierre de turno del personal de ruta. El sistema indica cuánto debe
 * entregar; la persona confirma el monto que trae físicamente.
 */
function CloseRouteCutModal(props) {
  const { open, handleOnClose, systemAmount, count } = props;

  const [declaredAmount, setDeclaredAmount] = useState(String(systemAmount ?? ''));
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState({ error: false, msg: '' });

  const parsedAmount = Number(declaredAmount);
  const isAmountValid =
    declaredAmount !== '' && Number.isFinite(parsedAmount) && parsedAmount >= 0;
  const difference = isAmountValid ? parsedAmount - (systemAmount || 0) : 0;

  const handleClose = (success = false, msg = '') => {
    setDeclaredAmount(String(systemAmount ?? ''));
    setNotes('');
    setHasError({ error: false, msg: '' });
    handleOnClose(success, msg);
  };

  async function submitHandler(event) {
    event.preventDefault();
    setHasError({ error: false, msg: '' });

    if (!isAmountValid) {
      setHasError({ error: true, msg: 'Indique el monto que está entregando.' });
      return;
    }

    setIsLoading(true);
    const result = await createRouteCashCut({
      declaredAmount: parsedAmount,
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
    <Dialog open={open} maxWidth="xs" scroll="body" fullWidth>
      <Card>
        <CardHeader title="Cerrar corte de ruta" />
        <Divider />
        <CardContent>
          <Box component="form" onSubmit={submitHandler}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    bgcolor: 'background.default',
                    textAlign: 'center'
                  }}
                >
                  <Typography variant="subtitle2" color="text.secondary">
                    Debe entregar
                  </Typography>
                  <Typography variant="h2" fontWeight="bold">
                    ${systemAmount?.toLocaleString('es-MX')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {count} cobro(s) en efectivo
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Monto que entrega"
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
                {isAmountValid && difference !== 0 && (
                  <Alert
                    severity={difference < 0 ? 'warning' : 'info'}
                    sx={{ mt: 1 }}
                  >
                    {difference < 0
                      ? `Faltante de $${Math.abs(difference).toLocaleString('es-MX')}`
                      : `Sobrante de $${difference.toLocaleString('es-MX')}`}
                  </Alert>
                )}
              </Grid>

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
                    Generar corte
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

CloseRouteCutModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleOnClose: PropTypes.func.isRequired,
  systemAmount: PropTypes.number,
  count: PropTypes.number
};

CloseRouteCutModal.defaultProps = {
  systemAmount: 0,
  count: 0
};

export default CloseRouteCutModal;
