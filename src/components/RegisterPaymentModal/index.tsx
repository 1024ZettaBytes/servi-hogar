import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  TextField,
  Alert,
  Typography,
  Chip,
  CardMedia,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { DesktopDatePicker } from "@mui/x-date-pickers";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import DeleteIcon from "@mui/icons-material/Delete";
import { registerPayment } from "../../../lib/client/salesFetch";
import { PAYMENT_METHODS } from "../../../lib/consts/OBJ_CONTS";
import { useGetPaymentAccounts, getFetcher } from "../../../pages/api/useRequest";
import numeral from "numeral";
import { convertDateToTZ, compressImage } from "../../../lib/client/utils";
import { useCheckBlocking } from "src/hooks/useCheckBlocking";
import PaymentReceipt from "../PaymentReceipt";

function RegisterPaymentModal(props) {
  const { handleOnClose, open, sale } = props;
  const { checkBlocking } = useCheckBlocking();
  const { paymentAccounts } = useGetPaymentAccounts(getFetcher);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState({ error: false, msg: "" });
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date());
  const [paymentMethod, setPaymentMethod] = useState("");
  const [selectedPaymentAccount, setSelectedPaymentAccount] = useState<any>(null);
  const [paymentImage, setPaymentImage] = useState(null);
  const [paymentImagePreview, setPaymentImagePreview] = useState(null);
  const [receipt, setReceipt] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [isCashSettlement, setIsCashSettlement] = useState(false);
  const [cashPriceInput, setCashPriceInput] = useState("");

  // Reset state when modal opens with a new sale
  useEffect(() => {
    if (open && sale) {
      setPaymentAmount("");
      setPaymentDate(new Date());
      setPaymentMethod("");
      setSelectedPaymentAccount(null);
      setHasError({ error: false, msg: "" });
      setPaymentImage(null);
      setPaymentImagePreview(null);
      setReceipt(null);
      setShowReceipt(false);
      setIsCashSettlement(false);
      setCashPriceInput("");
    }
  }, [open, sale]);

  if (!sale) return null;
  const requiresImage = paymentMethod === 'TRANSFER' || paymentMethod === 'DEP';

  // Calculate if cash settlement is available (delivery completed <= 30 days ago)
  const deliveryCompletedAt = sale.delivery?.completedAt;
  const daysSinceDelivery = deliveryCompletedAt 
    ? Math.floor((new Date().getTime() - new Date(deliveryCompletedAt).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const canUseCashSettlement = deliveryCompletedAt && daysSinceDelivery !== null && daysSinceDelivery <= 30;

  // Determine the cash price to use
  const effectiveCashPrice = sale.cashPrice || (cashPriceInput ? parseFloat(cashPriceInput) : null);
  
  // Calculate previous payments (excluding initial payment)
  const previousPaymentsTotal = sale.totalAmount - sale.initialPayment - sale.remainingAmount;
  
  // Calculate cash settlement amount
  const cashSettlementAmount = effectiveCashPrice 
    ? Math.max(0, effectiveCashPrice - sale.initialPayment - previousPaymentsTotal)
    : null;

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

    // Use the reusable compression helper
    const result = await compressImage(imageFile);
    if (result) {
      setPaymentImage(result.file);
      setPaymentImagePreview(result.url);
    } else {
      // Fallback to original file if compression fails validation
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

  const machineInfo = sale.machine
    ? `#${sale.machine.machineNum} - ${sale.machine.brand}`
    : sale.serialNumber || 'N/A';
  const customerName = sale.customer?.name || 'Sin cliente';

  // Calculate accumulated payment and weeks covered
  const currentAccumulated = sale.accumulatedPayment || 0;
  const totalAccumulated = paymentAmount 
    ? currentAccumulated + parseFloat(paymentAmount)
    : currentAccumulated;
  
  const weeksCovered = paymentAmount && sale.weeklyPayment > 0
    ? Math.floor(totalAccumulated / sale.weeklyPayment)
    : 0;
  
  const newAccumulatedPayment = paymentAmount
    ? totalAccumulated % sale.weeklyPayment
    : currentAccumulated;

  const newRemainingAmount = paymentAmount
    ? Math.max(0, sale.remainingAmount - parseFloat(paymentAmount))
    : sale.remainingAmount;

  const newPaidWeeks = sale.paidWeeks + weeksCovered;

  async function submitHandler(event) {
    event.preventDefault();
    setIsLoading(true);
    setHasError({ error: false, msg: "" });

    // For cash settlement, use calculated amount
    const amount = isCashSettlement && cashSettlementAmount 
      ? cashSettlementAmount 
      : parseFloat(paymentAmount);

    if (!amount || amount <= 0) {
      setHasError({ error: true, msg: "El monto debe ser mayor a 0" });
      setIsLoading(false);
      return;
    }

    if (!paymentMethod) {
      setHasError({ error: true, msg: "Debe seleccionar un método de pago" });
      setIsLoading(false);
      return;
    }

    // Validate cash settlement requirements
    if (isCashSettlement) {
      if (!effectiveCashPrice) {
        setHasError({ error: true, msg: "Debe ingresar el precio de contado" });
        setIsLoading(false);
        return;
      }
      if (effectiveCashPrice >= sale.totalAmount) {
        setHasError({ error: true, msg: "El precio de contado debe ser menor al precio a crédito" });
        setIsLoading(false);
        return;
      }
    }

    // Account is required for TRANSFER and DEP methods
    if (requiresImage && !selectedPaymentAccount) {
      setHasError({ error: true, msg: "Debe seleccionar una cuenta de pago" });
      setIsLoading(false);
      return;
    }

    // Image is only required for TRANSFER and DEP methods
    if (requiresImage && !paymentImage) {
      setHasError({ error: true, msg: "Debe adjuntar una foto del comprobante de pago" });
      setIsLoading(false);
      return;
    }
 
    if (!isCashSettlement && amount > sale.remainingAmount) {
      setHasError({ 
        error: true, 
        msg: `El monto no puede ser mayor al saldo restante ($${numeral(sale.remainingAmount).format('0,0.00')})` 
      });
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('saleId', sale._id);
    formData.append('paymentAmount', amount.toString());
    formData.append('paymentDate', convertDateToTZ(paymentDate).toISOString());
    formData.append('paymentMethod', paymentMethod);
    if (selectedPaymentAccount) {
      formData.append('paymentAccountId', selectedPaymentAccount._id);
    }
    if (paymentImage) {
      formData.append('paymentImage', paymentImage);
    }
    // Add cash settlement fields
    if (isCashSettlement) {
      formData.append('isCashSettlement', 'true');
      if (!sale.cashPrice && effectiveCashPrice) {
        formData.append('cashPriceOverride', effectiveCashPrice.toString());
      }
    }

    const result = await registerPayment(formData);

    setIsLoading(false);
    if (!result.error) {
      // Check if user was blocked
      await checkBlocking(result.wasBlocked);
      // Show the receipt
      setReceipt(result.data);
      setShowReceipt(true);
    } else {
      handleErrorOnSave(result.msg);
    }
  }

  const handleClose = () => {
    setHasError({ error: false, msg: "" });
    setIsLoading(false);
    setPaymentAmount("");
    setPaymentDate(new Date());
    setPaymentMethod("");
    setSelectedPaymentAccount(null);
    if (paymentImagePreview) {
      URL.revokeObjectURL(paymentImagePreview);
    }
    setPaymentImage(null);
    setPaymentImagePreview(null);
    setReceipt(null);
    setShowReceipt(false);
    setIsCashSettlement(false);
    setCashPriceInput("");
    handleOnClose(false);
  };

  const handleCloseReceipt = () => {
    setShowReceipt(false);
    setReceipt(null);
    handleOnClose(true, 'Pago registrado con éxito');
  };

  const handleErrorOnSave = (msg) => {
    setHasError({ error: true, msg });
  };

  return (
    <>
    <Dialog open={open} fullWidth={true} maxWidth="sm" scroll={"body"}>
      <Card>
        <CardHeader title="Registrar Pago" />
        <Divider />
        <CardContent>
          <Box component="form" onSubmit={submitHandler}>
            <Grid
              container
              direction="column"
              justifyContent="center"
              spacing={2}
            >
              {/* Sale Information */}
              <Grid item xs={12}>
                <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Folio
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        #{sale.saleNum}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Estado
                      </Typography>
                      <Box mt={0.5}>
                        <Chip 
                          label={sale.status === 'ACTIVA' ? 'Activa' : sale.status} 
                          color="info" 
                          size="small"
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        Equipo
                      </Typography>
                      <Typography variant="body2">
                        {machineInfo}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        Cliente
                      </Typography>
                      <Typography variant="body2">
                        {customerName}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>

              {/* Payment Details */}
              <Grid item xs={12}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Total de la venta
                    </Typography>
                    <Typography variant="h6">
                      ${numeral(sale.totalAmount).format('0,0.00')}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Saldo restante
                    </Typography>
                    <Typography variant="h6" color="warning.main">
                      ${numeral(sale.remainingAmount).format('0,0.00')}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Pago semanal
                    </Typography>
                    <Typography variant="body2">
                      ${numeral(sale.weeklyPayment).format('0,0.00')}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Semanas pagadas
                    </Typography>
                    <Typography variant="body2">
                      {sale.paidWeeks}/{sale.totalWeeks}
                    </Typography>
                  </Grid>
                  {currentAccumulated > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        Pago acumulado (hacia próxima semana)
                      </Typography>
                      <Typography variant="body2" color="info.main">
                        ${numeral(currentAccumulated).format('0,0.00')} / ${numeral(sale.weeklyPayment).format('0,0.00')}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <Divider />
              </Grid>

              {/* Cash Settlement Option */}
              {canUseCashSettlement && (
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      <strong>Pago de contado disponible</strong> - Entrega hace {daysSinceDelivery} días
                    </Typography>
                  </Alert>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={isCashSettlement}
                        onChange={(e) => {
                          setIsCashSettlement(e.target.checked);
                          if (!e.target.checked) {
                            setCashPriceInput("");
                          }
                        }}
                        color="success"
                      />
                    }
                    label="Liquidar con pago de contado"
                  />
                  
                  {isCashSettlement && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 1, color: 'success.contrastText' }}>
                      {!sale.cashPrice ? (
                        <TextField
                          type="number"
                          autoComplete="off"
                          required
                          id="cashPriceInput"
                          name="cashPriceInput"
                          label="Precio de Contado ($)"
                          fullWidth
                          value={cashPriceInput}
                          onChange={(e) => setCashPriceInput(e.target.value)}
                          inputProps={{ min: 1, step: "any", max: sale.totalAmount - 1 }}
                          helperText={`Debe ser menor a $${numeral(sale.totalAmount).format('0,0.00')} (precio a crédito)`}
                          sx={{ mb: 2, bgcolor: 'background.paper', borderRadius: 1 }}
                        />
                      ) : (
                        <Typography variant="body2" gutterBottom>
                          <strong>Precio de contado registrado:</strong> ${numeral(sale.cashPrice).format('0,0.00')}
                        </Typography>
                      )}
                      
                      {effectiveCashPrice && (
                        <>
                          <Typography variant="body2">
                            • Precio de contado: ${numeral(effectiveCashPrice).format('0,0.00')}
                          </Typography>
                          <Typography variant="body2">
                            • Pago inicial: -${numeral(sale.initialPayment).format('0,0.00')}
                          </Typography>
                          {previousPaymentsTotal > 0 && (
                            <Typography variant="body2">
                              • Pagos anteriores: -${numeral(previousPaymentsTotal).format('0,0.00')}
                            </Typography>
                          )}
                          <Divider sx={{ my: 1, borderColor: 'success.dark' }} />
                          <Typography variant="h6">
                            Monto a pagar: ${numeral(cashSettlementAmount).format('0,0.00')}
                          </Typography>
                          <Typography variant="caption">
                            Ahorro: ${numeral(sale.remainingAmount - cashSettlementAmount).format('0,0.00')}
                          </Typography>
                        </>
                      )}
                    </Box>
                  )}
                </Grid>
              )}

              {/* Payment Date Input */}
              <Grid item xs={12}>
                <DesktopDatePicker
                  label="Fecha de pago"
                  inputFormat="dd/MM/yyyy"
                  value={paymentDate}
                  maxDate={new Date()}
                  onChange={(newValue) => setPaymentDate(newValue)}
                  renderInput={(params) => <TextField {...params} required fullWidth />}
                />
              </Grid>

              {/* Payment Method Select */}
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
                      // Clear account when switching to cash methods
                      if (e.target.value !== 'TRANSFER' && e.target.value !== 'DEP') {
                        setSelectedPaymentAccount(null);
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

              {/* Payment Account Select (only for TRANSFER/DEP) */}
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

              {/* Payment Amount Input */}
              {!isCashSettlement && (
              <Grid item xs={12}>
                <TextField
                  type="number"
                  autoComplete="off"
                  required
                  id="paymentAmount"
                  name="paymentAmount"
                  label="Monto del Pago ($)"
                  fullWidth
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  inputProps={{ 
                    min: 1, 
                    step: "any", 
                    max: sale.remainingAmount 
                  }}
                  helperText={`Máximo: $${numeral(sale.remainingAmount).format('0,0.00')}`}
                />
              </Grid>
              )}

              {
              /* Payment Image Upload */
              requiresImage && (
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

              {/* Payment Calculation Preview */}
              {!isCashSettlement && paymentAmount && parseFloat(paymentAmount) > 0 && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    <Typography variant="body2" gutterBottom>
                      <strong>Resumen del pago:</strong>
                    </Typography>
                    {currentAccumulated > 0 && (
                      <Typography variant="body2">
                        • Pago acumulado anterior: ${numeral(currentAccumulated).format('0,0.00')}
                      </Typography>
                    )}
                    <Typography variant="body2">
                      • Pago actual: ${numeral(parseFloat(paymentAmount)).format('0,0.00')}
                    </Typography>
                    <Typography variant="body2">
                      • Total acumulado: ${numeral(totalAccumulated).format('0,0.00')}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>• Semanas cubiertas con este pago: {weeksCovered}</strong>
                    </Typography>
                    {newAccumulatedPayment > 0 && weeksCovered > 0 && (
                      <Typography variant="body2" color="info.main">
                        • Nuevo pago acumulado: ${numeral(newAccumulatedPayment).format('0,0.00')} / ${numeral(sale.weeklyPayment).format('0,0.00')}
                      </Typography>
                    )}
                    {weeksCovered === 0 && (
                      <Typography variant="body2" color="warning.main">
                        • Este pago no completa una semana aún. Falta: ${numeral(sale.weeklyPayment - totalAccumulated).format('0,0.00')}
                      </Typography>
                    )}
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      • Semanas totales pagadas: {newPaidWeeks}/{sale.totalWeeks}
                    </Typography>
                    <Typography variant="body2">
                      • Nuevo saldo: ${numeral(newRemainingAmount).format('0,0.00')}
                    </Typography>
                    {newRemainingAmount === 0 && (
                      <Typography variant="body2" color="success.main" fontWeight="bold" mt={1}>
                        ✓ Este pago completará la venta
                      </Typography>
                    )}
                  </Alert>
                </Grid>
              )}

              {hasError.error && (
                <Grid item xs={12}>
                  <Alert severity="error">{hasError.msg}</Alert>
                </Grid>
              )}

              <Grid
                item
                container
                direction="row"
                justifyContent="center"
                xs={12}
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
                    color={isCashSettlement ? "success" : "primary"}
                    disabled={
                      (!isCashSettlement && !paymentAmount) || 
                      (isCashSettlement && !effectiveCashPrice) ||
                      !paymentMethod || 
                      ((paymentMethod === 'TRANSFER' || paymentMethod === 'DEP') && (!paymentImage || !selectedPaymentAccount))
                    }
                  >
                    {isCashSettlement ? 'Liquidar Venta' : 'Registrar Pago'}
                  </LoadingButton>
                </Grid>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </Dialog>

    {/* Receipt Dialog */}
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

RegisterPaymentModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleOnClose: PropTypes.func.isRequired,
  sale: PropTypes.object,
};

export default RegisterPaymentModal;
