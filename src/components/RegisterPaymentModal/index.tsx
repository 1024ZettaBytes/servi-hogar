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
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { DesktopDatePicker } from "@mui/x-date-pickers";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import DeleteIcon from "@mui/icons-material/Delete";
import { registerPayment } from "../../../lib/client/salesFetch";
import numeral from "numeral";
import { convertDateToTZ } from "../../../lib/client/utils";
import Compressor from "compressorjs";
import imageConversion from "image-conversion";

function RegisterPaymentModal(props) {
  const { handleOnClose, open, sale } = props;
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState({ error: false, msg: "" });
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date());
  const [paymentImage, setPaymentImage] = useState(null);
  const [paymentImagePreview, setPaymentImagePreview] = useState(null);

  // Reset state when modal opens with a new sale
  useEffect(() => {
    if (open && sale) {
      setPaymentAmount("");
      setPaymentDate(new Date());
      setHasError({ error: false, msg: "" });
      setPaymentImage(null);
      setPaymentImagePreview(null);
    }
  }, [open, sale]);

  if (!sale) return null;

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

    let compressedFile;
    let url;
    try {
      compressedFile = new File(
        [await imageConversion.compress(imageFile, 0.2)],
        imageFile.name
      );
    } catch (error) {
      compressedFile = new File(
        [
          await new Promise((resolve, reject) => {
            new Compressor(imageFile, {
              quality: 0.6,
              success: resolve,
              error: reject
            });
          })
        ],
        imageFile.name
      );
    }
    try {
      url = URL.createObjectURL(compressedFile);
    } catch (error) {
      console.error(error);
      url = URL.createObjectURL(imageFile);
    }
    
    setPaymentImage(compressedFile);
    setPaymentImagePreview(url);
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

    const amount = parseFloat(paymentAmount);

    if (!amount || amount <= 0) {
      setHasError({ error: true, msg: "El monto debe ser mayor a 0" });
      setIsLoading(false);
      return;
    }

    if (!paymentImage) {
      setHasError({ error: true, msg: "Debe adjuntar una foto del pago" });
      setIsLoading(false);
      return;
    }
 
    if (amount > sale.remainingAmount) {
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
    formData.append('paymentImage', paymentImage);

    const result = await registerPayment(formData);

    setIsLoading(false);
    if (!result.error) {
      handleSavedPayment(result.msg);
    } else {
      handleErrorOnSave(result.msg);
    }
  }

  const handleClose = () => {
    setHasError({ error: false, msg: "" });
    setIsLoading(false);
    setPaymentAmount("");
    setPaymentDate(new Date());
    if (paymentImagePreview) {
      URL.revokeObjectURL(paymentImagePreview);
    }
    setPaymentImage(null);
    setPaymentImagePreview(null);
    handleOnClose(false);
  };

  const handleSavedPayment = (successMessage) => {
    handleOnClose(true, successMessage);
  };

  const handleErrorOnSave = (msg) => {
    setHasError({ error: true, msg });
  };

  return (
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

              {/* Payment Amount Input */}
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

              {/* Payment Image Upload */}
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

              {/* Payment Calculation Preview */}
              {paymentAmount && parseFloat(paymentAmount) > 0 && (
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
                    disabled={
                      !paymentAmount || !paymentImage
                    }
                  >
                    Registrar Pago
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

RegisterPaymentModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleOnClose: PropTypes.func.isRequired,
  sale: PropTypes.object,
};

export default RegisterPaymentModal;
