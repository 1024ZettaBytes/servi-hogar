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
  CardMedia,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import DeleteIcon from '@mui/icons-material/Delete';
import { sellRentMachine } from '../../../lib/client/rentsFetch';
import { getFetcher, useGetPaymentAccounts } from '../../../pages/api/useRequest';
import { PAYMENT_METHODS } from '../../../lib/consts/OBJ_CONTS';
import { compressImage } from '../../../lib/client/utils';
import PaymentReceipt from '../PaymentReceipt';

function SellRentMachineModal({ open, handleOnClose, rent }) {
  const { paymentAccounts } = useGetPaymentAccounts(getFetcher);
  
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState({ error: false, msg: '' });
  
  // Price fields
  const [cashPrice, setCashPrice] = useState<string>('');
  const [totalAmount, setTotalAmount] = useState<string>('');
  const [initialPayment, setInitialPayment] = useState<string>('');
  const [totalWeeks, setTotalWeeks] = useState<string>('');
  
  // Upfront cash payment states
  const [isUpfrontCashPayment, setIsUpfrontCashPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [selectedPaymentAccount, setSelectedPaymentAccount] = useState<any>(null);
  const [paymentImage, setPaymentImage] = useState(null);
  const [paymentImagePreview, setPaymentImagePreview] = useState(null);
  const [receipt, setReceipt] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const machineName = rent?.machine?.machineNum
    ? `Equipo #${rent.machine.machineNum}`
    : 'el equipo';
  const customerName = rent?.customer?.name || 'el cliente';
  
  const requiresImage = paymentMethod === 'TRANSFER' || paymentMethod === 'DEP';
  
  const weeklyPayment =
    totalWeeks && totalAmount && initialPayment
      ? (
          (parseFloat(totalAmount) - parseFloat(initialPayment)) /
          parseFloat(totalWeeks)
        ).toFixed(2)
      : '0.00';

  const handleImageUpload = async (event) => {
    const imageFile = event.target.files[0];

    if (
      imageFile &&
      (!imageFile.type.includes('image/') || imageFile.type.includes('/heic'))
    ) {
      setHasError({ error: true, msg: 'Formato de imagen no válido' });
      return;
    }

    if (!imageFile) {
      setPaymentImage(null);
      setPaymentImagePreview(null);
      return;
    }

    const result = await compressImage(imageFile);
    if (result) {
      setPaymentImage(result.file);
      setPaymentImagePreview(result.url);
    } else {
      setPaymentImage(imageFile);
      setPaymentImagePreview(URL.createObjectURL(imageFile));
    }
  };

  const handleRemoveImage = () => {
    if (paymentImagePreview) {
      URL.revokeObjectURL(paymentImagePreview);
    }
    setPaymentImage(null);
    setPaymentImagePreview(null);
  };

  async function submitHandler(event) {
    event.preventDefault();
    setIsLoading(true);
    setHasError({ error: false, msg: '' });

    // Validation
    if (isUpfrontCashPayment) {
      if (!cashPrice || parseFloat(cashPrice) <= 0) {
        setHasError({ error: true, msg: 'Debe ingresar el precio de contado' });
        setIsLoading(false);
        return;
      }
      if (!paymentMethod) {
        setHasError({ error: true, msg: 'Debe seleccionar un método de pago' });
        setIsLoading(false);
        return;
      }
      if (requiresImage && !selectedPaymentAccount) {
        setHasError({ error: true, msg: 'Debe seleccionar una cuenta de pago' });
        setIsLoading(false);
        return;
      }
      if (requiresImage && !paymentImage) {
        setHasError({ error: true, msg: 'Debe adjuntar una foto del comprobante de pago' });
        setIsLoading(false);
        return;
      }
    } else {
      if (!totalAmount || parseFloat(totalAmount) <= 0) {
        setHasError({ error: true, msg: 'Debe ingresar el precio a crédito' });
        setIsLoading(false);
        return;
      }
      if (!initialPayment || parseFloat(initialPayment) < 0) {
        setHasError({ error: true, msg: 'Debe ingresar el pago inicial (enganche)' });
        setIsLoading(false);
        return;
      }
      if (parseFloat(initialPayment) > parseFloat(totalAmount)) {
        setHasError({ error: true, msg: 'El pago inicial no puede ser mayor al precio a crédito' });
        setIsLoading(false);
        return;
      }
      if (!totalWeeks || parseInt(totalWeeks) <= 0) {
        setHasError({ error: true, msg: 'Debe ingresar el número de semanas' });
        setIsLoading(false);
        return;
      }
    }

    const formData = new FormData();
    formData.append('rentId', rent._id);
    formData.append('isUpfrontCashPayment', isUpfrontCashPayment ? 'true' : 'false');
    formData.append('cashPrice', cashPrice || '');

    if (isUpfrontCashPayment) {
      formData.append('paymentMethod', paymentMethod);
      if (selectedPaymentAccount) {
        formData.append('paymentAccountId', selectedPaymentAccount._id);
      }
      if (paymentImage) {
        formData.append('paymentImage', paymentImage);
      }
    } else {
      formData.append('totalAmount', totalAmount);
      formData.append('initialPayment', initialPayment);
      formData.append('totalWeeks', totalWeeks);
    }

    const result = await sellRentMachine(formData);

    setIsLoading(false);
    if (!result.error) {
      if (result.data?.receipt) {
        setReceipt(result.data.receipt);
        setShowReceipt(true);
      } else {
        handleOnClose(true, result.msg);
      }
    } else {
      setHasError({ error: true, msg: result.msg });
    }
  }

  const handleClose = () => {
    setHasError({ error: false, msg: '' });
    setCashPrice('');
    setTotalAmount('');
    setInitialPayment('');
    setTotalWeeks('');
    setIsUpfrontCashPayment(false);
    setPaymentMethod('');
    setSelectedPaymentAccount(null);
    if (paymentImagePreview) {
      URL.revokeObjectURL(paymentImagePreview);
    }
    setPaymentImage(null);
    setPaymentImagePreview(null);
    setReceipt(null);
    setShowReceipt(false);
    setIsLoading(false);
    handleOnClose(false);
  };

  const handleCloseReceipt = () => {
    setShowReceipt(false);
    setReceipt(null);
    handleOnClose(true, 'Venta registrada con éxito');
  };

  return (
    <>
      <Dialog open={open} fullWidth maxWidth="xs" scroll="body">
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

                {/* Upfront Cash Payment Switch */}
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={isUpfrontCashPayment}
                        onChange={(e) => {
                          setIsUpfrontCashPayment(e.target.checked);
                          if (!e.target.checked) {
                            setPaymentMethod('');
                            setSelectedPaymentAccount(null);
                            handleRemoveImage();
                          }
                        }}
                        color="success"
                      />
                    }
                    label="Pago de contado inmediato"
                  />
                </Grid>

                {/* Cash Price - shown always but required only when upfront */}
                <Grid item xs={12}>
                  <TextField
                    label="Precio de Contado ($)"
                    type="number"
                    fullWidth
                    value={cashPrice}
                    required={isUpfrontCashPayment}
                    onChange={(e) => setCashPrice(e.target.value)}
                    inputProps={{ min: 0, step: 0.01 }}
                    helperText={
                      isUpfrontCashPayment
                        ? 'Monto que el cliente pagará de contado'
                        : 'Precio si el cliente paga en los primeros 30 días (opcional)'
                    }
                  />
                </Grid>

                {/* Upfront Payment Info */}
                {isUpfrontCashPayment && cashPrice && (
                  <Grid item xs={12}>
                    <Alert severity="success">
                      <Typography variant="body2">
                        <strong>La venta se registrará como PAGADA</strong>
                      </Typography>
                      <Typography variant="body2">
                        Monto: <strong>${parseFloat(cashPrice).toFixed(2)}</strong>
                      </Typography>
                    </Alert>
                  </Grid>
                )}

                {/* Payment Method - only for upfront cash payment */}
                {isUpfrontCashPayment && (
                  <>
                    <Grid item xs={12}>
                      <FormControl fullWidth required>
                        <InputLabel id="payment-method-label">Método de Pago</InputLabel>
                        <Select
                          labelId="payment-method-label"
                          id="paymentMethod"
                          value={paymentMethod}
                          label="Método de Pago"
                          onChange={(e) => {
                            setPaymentMethod(e.target.value);
                            if (e.target.value !== 'TRANSFER' && e.target.value !== 'DEP') {
                              setSelectedPaymentAccount(null);
                              handleRemoveImage();
                            }
                          }}
                        >
                          {Object.keys(PAYMENT_METHODS).map((key) => (
                            <MenuItem key={key} value={key}>
                              {PAYMENT_METHODS[key]}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Payment Account - only for TRANSFER/DEP */}
                    {requiresImage && (
                      <Grid item xs={12}>
                        <FormControl fullWidth required>
                          <InputLabel id="payment-account-label">Cuenta</InputLabel>
                          <Select
                            labelId="payment-account-label"
                            id="paymentAccount"
                            value={selectedPaymentAccount?._id || ''}
                            label="Cuenta"
                            onChange={(e) => {
                              const selected = paymentAccounts?.find(
                                (acc) => acc._id === e.target.value
                              );
                              setSelectedPaymentAccount(selected);
                            }}
                          >
                            {paymentAccounts?.map((acc) => (
                              <MenuItem key={acc._id} value={acc._id}>
                                {`${acc.bank} ${acc.count} (${acc.number.slice(-4)})`}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    )}

                    {/* Payment Image - only for TRANSFER/DEP */}
                    {requiresImage && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" gutterBottom>
                          Foto del comprobante de pago *
                        </Typography>
                        {!paymentImagePreview ? (
                          <Button
                            variant="outlined"
                            component="label"
                            fullWidth
                            startIcon={<PhotoCamera />}
                            sx={{ height: 56 }}
                          >
                            Seleccionar foto
                            <input
                              hidden
                              accept="image/*"
                              type="file"
                              onChange={handleImageUpload}
                            />
                          </Button>
                        ) : (
                          <Card>
                            <CardMedia
                              component="img"
                              height="200"
                              image={paymentImagePreview}
                              alt="Comprobante de pago"
                            />
                            <Box sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
                              <IconButton
                                color="error"
                                onClick={handleRemoveImage}
                                size="small"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          </Card>
                        )}
                      </Grid>
                    )}
                  </>
                )}

                {/* Credit fields - hidden when upfront cash payment */}
                {!isUpfrontCashPayment && (
                  <>
                    <Grid item xs={12}>
                      <TextField
                        type="number"
                        autoComplete="off"
                        required
                        id="totalAmount"
                        name="totalAmount"
                        label="Precio a Crédito ($)"
                        fullWidth
                        value={totalAmount}
                        onChange={(e) => setTotalAmount(e.target.value)}
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        type="number"
                        autoComplete="off"
                        required
                        id="initialPayment"
                        name="initialPayment"
                        label="Pago Inicial / Enganche ($)"
                        fullWidth
                        value={initialPayment}
                        onChange={(e) => setInitialPayment(e.target.value)}
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        type="number"
                        autoComplete="off"
                        required
                        id="totalWeeks"
                        name="totalWeeks"
                        label="Número de Semanas"
                        fullWidth
                        value={totalWeeks}
                        onChange={(e) => setTotalWeeks(e.target.value)}
                        inputProps={{ min: 1, step: 1 }}
                      />
                    </Grid>

                    {totalWeeks && totalAmount && initialPayment && (
                      <Grid item xs={12}>
                        <Alert severity="info">
                          Pago semanal: <strong>${weeklyPayment}</strong>
                          <br />
                          Saldo restante:{' '}
                          <strong>
                            $
                            {(
                              parseFloat(totalAmount) - parseFloat(initialPayment)
                            ).toFixed(2)}
                          </strong>
                        </Alert>
                      </Grid>
                    )}
                  </>
                )}

                {hasError.error && (
                  <Grid item xs={12}>
                    <Alert severity="error">{hasError.msg}</Alert>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Grid container direction="row" justifyContent="flex-end" spacing={2}>
                    <Grid item>
                      <Button
                        variant="outlined"
                        onClick={handleClose}
                        disabled={isLoading}
                      >
                        Cancelar
                      </Button>
                    </Grid>
                    <Grid item>
                      <LoadingButton
                        type="submit"
                        loading={isLoading}
                        variant="contained"
                        color={isUpfrontCashPayment ? 'success' : 'warning'}
                      >
                        {isUpfrontCashPayment ? 'Registrar y Pagar' : 'Confirmar venta'}
                      </LoadingButton>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </Card>
      </Dialog>

      {/* Receipt Dialog for upfront cash payment */}
      {showReceipt && (
        <PaymentReceipt
          receipt={receipt}
          open={showReceipt}
          onClose={handleCloseReceipt}
        />
      )}
    </>
  );
}

SellRentMachineModal.propTypes = {
  handleOnClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  rent: PropTypes.object.isRequired
};

export default SellRentMachineModal;
