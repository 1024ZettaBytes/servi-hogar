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
import { confirmOfficeCashCut } from '../../../../lib/client/cashCutsFetch';

const money = (value) => `$${Number(value || 0).toLocaleString('es-MX')}`;

/**
 * La persona que entra al turno cuenta el efectivo y confirma de recibido.
 * Su conteo pasa a ser el saldo con el que abre la caja.
 */
function ConfirmBoxModal(props) {
  const { open, handleOnClose, cut } = props;

  const [confirmedAmount, setConfirmedAmount] = useState(
    String(cut?.declaredAmount ?? '')
  );
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState({ error: false, msg: '' });

  const parsedAmount = Number(confirmedAmount);
  const isAmountValid =
    confirmedAmount !== '' &&
    Number.isFinite(parsedAmount) &&
    parsedAmount >= 0;
  const difference = isAmountValid
    ? parsedAmount - (cut?.declaredAmount || 0)
    : 0;

  const handleClose = (success = false, msg = '') => {
    setConfirmedAmount(String(cut?.declaredAmount ?? ''));
    setNotes('');
    setHasError({ error: false, msg: '' });
    handleOnClose(success, msg);
  };

  async function submitHandler(event) {
    event.preventDefault();
    setHasError({ error: false, msg: '' });

    if (!isAmountValid) {
      setHasError({ error: true, msg: 'Indique el monto que contó.' });
      return;
    }

    setIsLoading(true);
    const result = await confirmOfficeCashCut({
      cutId: cut._id,
      confirmedAmount: parsedAmount,
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
        <CardHeader
          title="Contar y recibir caja"
          subheader={
            cut?.user?.name ? `Entregada por ${cut.user.name}` : undefined
          }
        />
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
                    Le están entregando
                  </Typography>
                  <Typography variant="h2" fontWeight="bold">
                    {money(cut?.declaredAmount)}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Alert severity="info">
                  Cuente el efectivo antes de confirmar. El monto que registre
                  es con el que queda su caja.
                </Alert>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Monto que contó*"
                  type="number"
                  fullWidth
                  autoFocus
                  size="small"
                  value={confirmedAmount}
                  onChange={(e) => setConfirmedAmount(e.target.value)}
                  error={confirmedAmount !== '' && !isAmountValid}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">$</InputAdornment>
                    ),
                    inputProps: { min: 0, step: '0.01' }
                  }}
                />
                {isAmountValid && difference !== 0 && (
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    {difference < 0
                      ? `Está recibiendo ${money(Math.abs(difference))} menos de lo declarado`
                      : `Está recibiendo ${money(difference)} más de lo declarado`}
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
                    color="success"
                    loading={isLoading}
                    disabled={!isAmountValid}
                  >
                    Contado y recibido
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

ConfirmBoxModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleOnClose: PropTypes.func.isRequired,
  cut: PropTypes.object
};

ConfirmBoxModal.defaultProps = {
  cut: null
};

export default ConfirmBoxModal;
