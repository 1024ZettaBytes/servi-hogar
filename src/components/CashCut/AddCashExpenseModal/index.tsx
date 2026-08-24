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
import { MuiFileInput } from 'mui-file-input';
import { createCashExpense } from '../../../../lib/client/cashCutsFetch';
import { compressImage } from '../../../../lib/client/utils';
import { CASH_EXPENSE_CONCEPTS } from '../../../../lib/consts/OBJ_CONTS';

const money = (value) => `$${Number(value || 0).toLocaleString('es-MX')}`;

/**
 * Gasto o compra pagada con el efectivo de la caja de oficina.
 * El recibo es obligatorio.
 */
function AddCashExpenseModal(props) {
  const { open, handleOnClose, availableBalance } = props;

  const [concept, setConcept] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState({ error: false, msg: '' });

  const parsedAmount = Number(amount);
  const isAmountValid =
    amount !== '' && Number.isFinite(parsedAmount) && parsedAmount > 0;
  const exceedsBalance = isAmountValid && parsedAmount > (availableBalance || 0);
  const canSubmit =
    isAmountValid && !exceedsBalance && !!concept && !!receiptFile;

  const handleClose = (success = false, msg = '') => {
    setConcept('');
    setDescription('');
    setAmount('');
    setReceipt(null);
    setReceiptFile(null);
    setHasError({ error: false, msg: '' });
    handleOnClose(success, msg);
  };

  const handleFileChange = async (file) => {
    setReceipt(file);
    if (!file) {
      setReceiptFile(null);
      return;
    }

    // Los PDF se suben tal cual; las fotos se comprimen antes de subir.
    if (file.type?.includes('image/')) {
      const result = await compressImage(file);
      if (!result) {
        setHasError({
          error: true,
          msg: 'El formato de la imagen no es válido.'
        });
        setReceipt(null);
        setReceiptFile(null);
        return;
      }
      setReceiptFile(result.file);
    } else if (file.type?.includes('/pdf')) {
      setReceiptFile(file);
    } else {
      setHasError({ error: true, msg: 'Suba una imagen o un PDF.' });
      setReceipt(null);
      setReceiptFile(null);
      return;
    }
    setHasError({ error: false, msg: '' });
  };

  async function submitHandler(event) {
    event.preventDefault();
    setHasError({ error: false, msg: '' });

    if (!canSubmit) {
      setHasError({
        error: true,
        msg: 'Complete concepto, monto y suba el recibo.'
      });
      return;
    }

    setIsLoading(true);
    const result = await createCashExpense({
      concept,
      description,
      amount: parsedAmount,
      date: null,
      receiptFile
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
          title="Registrar gasto de caja"
          subheader={`Disponible: ${money(availableBalance)}`}
        />
        <Divider />
        <CardContent>
          <Box component="form" onSubmit={submitHandler}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel id="expense-concept-label">Concepto*</InputLabel>
                  <Select
                    labelId="expense-concept-label"
                    label="Concepto*"
                    value={concept}
                    onChange={(e) => setConcept(e.target.value)}
                  >
                    {Object.keys(CASH_EXPENSE_CONCEPTS).map((key) => (
                      <MenuItem key={key} value={key}>
                        {CASH_EXPENSE_CONCEPTS[key]}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Monto*"
                  type="number"
                  fullWidth
                  size="small"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  error={amount !== '' && (!isAmountValid || exceedsBalance)}
                  helperText={
                    exceedsBalance
                      ? `No hay suficiente efectivo en caja (${money(
                          availableBalance
                        )})`
                      : ''
                  }
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
                  label="Descripción"
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <MuiFileInput
                  fullWidth
                  size="small"
                  label="Recibo*"
                  placeholder="No seleccionado"
                  value={receipt}
                  onChange={handleFileChange}
                />
                <Typography variant="caption" color="text.secondary">
                  Todo gasto de caja requiere recibo.
                </Typography>
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
                    Registrar gasto
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

AddCashExpenseModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleOnClose: PropTypes.func.isRequired,
  availableBalance: PropTypes.number
};

AddCashExpenseModal.defaultProps = {
  availableBalance: 0
};

export default AddCashExpenseModal;
