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
  TextField,
  InputAdornment,
  Stack
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import {
  editCashCutAmount,
  editCashExpenseAmount
} from '../../../../lib/client/cashCutsFetch';

/**
 * Corrección administrativa de un monto. Cada cambio queda registrado en la
 * bitácora del corte o del gasto, nunca se sobrescribe en silencio.
 */
function EditAmountModal(props) {
  const { open, handleOnClose, target } = props;

  const [newValue, setNewValue] = useState(String(target?.currentValue ?? ''));
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState({ error: false, msg: '' });

  const parsedValue = Number(newValue);
  const isValueValid =
    newValue !== '' && Number.isFinite(parsedValue) && parsedValue >= 0;
  const canSubmit = isValueValid && reason.trim() !== '';

  const handleClose = (success = false, msg = '') => {
    setNewValue(String(target?.currentValue ?? ''));
    setReason('');
    setHasError({ error: false, msg: '' });
    handleOnClose(success, msg);
  };

  async function submitHandler(event) {
    event.preventDefault();
    setHasError({ error: false, msg: '' });

    if (!canSubmit) {
      setHasError({
        error: true,
        msg: 'Indique el monto corregido y el motivo.'
      });
      return;
    }

    setIsLoading(true);
    const result =
      target.kind === 'EXPENSE'
        ? await editCashExpenseAmount({
            expenseId: target.id,
            newValue: parsedValue,
            reason
          })
        : await editCashCutAmount({
            cutId: target.id,
            field: target.field,
            newValue: parsedValue,
            reason
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
        <CardHeader title="Corregir monto" subheader={target?.label} />
        <Divider />
        <CardContent>
          <Box component="form" onSubmit={submitHandler}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Alert severity="warning">
                  La corrección queda registrada con su nombre y el motivo.
                </Alert>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Monto corregido*"
                  type="number"
                  fullWidth
                  autoFocus
                  size="small"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  error={newValue !== '' && !isValueValid}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">$</InputAdornment>
                    ),
                    inputProps: { min: 0, step: '0.01' }
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Motivo de la corrección*"
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
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
                    disabled={!canSubmit}
                  >
                    Guardar corrección
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

EditAmountModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleOnClose: PropTypes.func.isRequired,
  target: PropTypes.object
};

EditAmountModal.defaultProps = {
  target: null
};

export default EditAmountModal;
