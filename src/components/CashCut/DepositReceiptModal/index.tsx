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
import { registerCashCutDeposit } from '../../../../lib/client/cashCutsFetch';
import { compressImage } from '../../../../lib/client/utils';
import { getFetcher, useGetPaymentAccounts } from 'pages/api/useRequest';

/**
 * Comprobante del depósito de un corte de ruta. El recibo es obligatorio.
 */
function DepositReceiptModal(props) {
  const { open, handleOnClose, cut } = props;
  const { paymentAccounts } = useGetPaymentAccounts(getFetcher);

  const [accountId, setAccountId] = useState('');
  const [amount, setAmount] = useState(String(cut?.declaredAmount ?? ''));
  const [folio, setFolio] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState({ error: false, msg: '' });

  const parsedAmount = Number(amount);
  const isAmountValid =
    amount !== '' && Number.isFinite(parsedAmount) && parsedAmount > 0;
  const canSubmit = isAmountValid && !!accountId && !!receiptFile;

  const resetForm = () => {
    setAccountId('');
    setAmount(String(cut?.declaredAmount ?? ''));
    setFolio('');
    setReceipt(null);
    setReceiptFile(null);
    setHasError({ error: false, msg: '' });
  };

  const handleClose = (success = false, msg = '') => {
    resetForm();
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
        msg: 'Indique cuenta, monto y suba el comprobante.'
      });
      return;
    }

    setIsLoading(true);
    const result = await registerCashCutDeposit({
      cutId: cut._id,
      depositAccountId: accountId,
      depositAmount: parsedAmount,
      depositFolio: folio,
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
          title="Registrar depósito"
          subheader={cut ? `Corte #${cut.cutNumber}` : ''}
        />
        <Divider />
        <CardContent>
          <Box component="form" onSubmit={submitHandler}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Monto del corte
                </Typography>
                <Typography variant="h3" fontWeight="bold">
                  ${cut?.declaredAmount?.toLocaleString('es-MX')}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel id="deposit-account-label">Cuenta*</InputLabel>
                  <Select
                    labelId="deposit-account-label"
                    label="Cuenta*"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                  >
                    {(paymentAccounts || [])
                      .filter((account) => account.active)
                      .map((account) => (
                        <MenuItem key={account._id} value={account._id}>
                          {account.bank} — {account.number}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Monto depositado*"
                  type="number"
                  fullWidth
                  size="small"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  error={amount !== '' && !isAmountValid}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">$</InputAdornment>
                    ),
                    inputProps: { min: 0, step: '0.01' }
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Folio"
                  fullWidth
                  size="small"
                  value={folio}
                  onChange={(e) => setFolio(e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <MuiFileInput
                  fullWidth
                  size="small"
                  label="Comprobante de depósito*"
                  placeholder="No seleccionado"
                  value={receipt}
                  onChange={handleFileChange}
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
                    Guardar depósito
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

DepositReceiptModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleOnClose: PropTypes.func.isRequired,
  cut: PropTypes.object
};

DepositReceiptModal.defaultProps = {
  cut: null
};

export default DepositReceiptModal;
