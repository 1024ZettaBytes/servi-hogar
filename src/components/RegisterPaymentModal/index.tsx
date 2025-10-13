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
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { DesktopDatePicker } from "@mui/x-date-pickers";
import { registerPayment } from "../../../lib/client/salesFetch";
import numeral from "numeral";
import { convertDateToTZ } from "../../../lib/client/utils";

function RegisterPaymentModal(props) {
  const { handleOnClose, open, sale } = props;
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState({ error: false, msg: "" });
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date());

  // Reset state when modal opens with a new sale
  useEffect(() => {
    if (open && sale) {
      setPaymentAmount("");
      setPaymentDate(new Date());
      setHasError({ error: false, msg: "" });
    }
  }, [open, sale]);

  if (!sale) return null;

  const machineInfo = sale.machine
    ? `#${sale.machine.machineNum} - ${sale.machine.brand}`
    : sale.serialNumber || 'N/A';
  const customerName = sale.customer?.name || 'Sin cliente';

  // Calculate how many weeks will be covered by the payment
  const weeksCovered = paymentAmount && sale.weeklyPayment > 0
    ? Math.floor(parseFloat(paymentAmount) / sale.weeklyPayment)
    : 0;

  const newRemainingAmount = paymentAmount
    ? Math.max(0, sale.remainingAmount - parseFloat(paymentAmount))
    : sale.remainingAmount;

  const newPaidWeeks = sale.paidWeeks + weeksCovered;

  async function submitHandler(event) {
    event.preventDefault();
    setIsLoading(true);
    setHasError({ error: false, msg: "" });

    const amount = parseFloat(paymentAmount);
    const minPayment = Math.min(sale.weeklyPayment, sale.remainingAmount);

    if (!amount || amount <= 0) {
      setHasError({ error: true, msg: "El monto debe ser mayor a 0" });
      setIsLoading(false);
      return;
    }

    if (amount < minPayment) {
      setHasError({ 
        error: true, 
        msg: `El monto mínimo es $${numeral(minPayment).format('0,0.00')} (pago semanal)` 
      });
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

    const result = await registerPayment({
      saleId: sale._id,
      paymentAmount: amount,
      paymentDate: convertDateToTZ(paymentDate),
    });

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
                    min: sale.weeklyPayment, 
                    step: "any", 
                    max: sale.remainingAmount 
                  }}
                  helperText={`Mínimo: $${numeral(Math.min(sale.weeklyPayment, sale.remainingAmount)).format('0,0.00')} | Máximo: $${numeral(sale.remainingAmount).format('0,0.00')}`}
                />
              </Grid>

              {/* Payment Calculation Preview */}
              {paymentAmount && parseFloat(paymentAmount) > 0 && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    <Typography variant="body2" gutterBottom>
                      <strong>Este pago cubrirá:</strong>
                    </Typography>
                    <Typography variant="body2">
                      • {weeksCovered} semana{weeksCovered !== 1 ? 's' : ''}
                    </Typography>
                    <Typography variant="body2">
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
                      !paymentAmount || 
                      parseFloat(paymentAmount) < Math.min(sale.weeklyPayment, sale.remainingAmount)
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
