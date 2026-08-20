import PropTypes from "prop-types";
import { useState } from "react";
import Dialog from "@mui/material/Dialog";
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
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  TextField,
  InputAdornment
} from "@mui/material";
import { LoadingButton } from "@mui/lab";

function CompleteCollectionModal(props) {
  const { open, handleOnClose, handleOnConfirm, isLoading, sale } = props;

  const [outcome, setOutcome] = useState('PROMESA');
  const [paymentInCash, setPaymentInCash] = useState(false);
  const [cashAmount, setCashAmount] = useState('');
  const [hasError, setHasError] = useState({ error: false, msg: "" });

  // El efectivo solo aplica cuando el cliente ya pagó durante la visita
  const isCashPayment = outcome === 'PAGO' && paymentInCash;
  const parsedCashAmount = Number(cashAmount);
  const isCashAmountValid =
    cashAmount !== '' && Number.isFinite(parsedCashAmount) && parsedCashAmount > 0;

  const saveButtonEnabled = !isCashPayment || isCashAmountValid;

  const resetForm = () => {
    setOutcome('PROMESA');
    setPaymentInCash(false);
    setCashAmount('');
    setHasError({ error: false, msg: "" });
  };

  const handleOutcomeChange = (value) => {
    setOutcome(value);
    if (value !== 'PAGO') {
      // Si no pagó, no hay efectivo que registrar
      setPaymentInCash(false);
      setCashAmount('');
    }
  };

  async function submitHandler(event) {
    event.preventDefault();
    setHasError({ error: false, msg: "" });

    if (isCashPayment && !isCashAmountValid) {
      setHasError({
        error: true,
        msg: "Indique la cantidad de efectivo recibida."
      });
      return;
    }

    handleOnConfirm({
      outcome,
      paymentInCash: isCashPayment,
      cashAmount: isCashPayment ? parsedCashAmount : null
    });
  }

  const handleClose = () => {
    resetForm();
    handleOnClose();
  };

  return (
    <Dialog open={open} maxWidth="xs" scroll={"body"} fullWidth>
      <Card>
        <CardHeader title="Completar Cobranza" />
        <Divider />
        <CardContent>
          <Box component="form" onSubmit={submitHandler}>
            <Grid container spacing={2}>

              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  ¿Con qué resultado se completó la visita?
                </Typography>
                <FormControl component="fieldset" fullWidth>
                  <RadioGroup
                    name="outcome"
                    value={outcome}
                    onChange={(e) => handleOutcomeChange(e.target.value)}
                  >
                    <FormControlLabel
                      value="PROMESA"
                      control={<Radio />}
                      label="Promesa de pago"
                    />
                    <FormControlLabel
                      value="PAGO"
                      control={<Radio />}
                      label="Ya pagó"
                    />
                  </RadioGroup>
                </FormControl>
              </Grid>

              {outcome === 'PAGO' && (
                <Grid item xs={12}>
                  <Divider sx={{ mb: 1 }} />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={paymentInCash}
                        onChange={(e) => {
                          setPaymentInCash(e.target.checked);
                          if (!e.target.checked) setCashAmount('');
                        }}
                      />
                    }
                    label="El pago fue en efectivo y lo recibí yo"
                  />
                </Grid>
              )}

              {isCashPayment && (
                <Grid item xs={12}>
                  <TextField
                    label="Cantidad recibida"
                    type="number"
                    fullWidth
                    autoFocus
                    size="small"
                    variant="outlined"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    error={cashAmount !== '' && !isCashAmountValid}
                    helperText={
                      cashAmount !== '' && !isCashAmountValid
                        ? "Ingrese una cantidad mayor a 0"
                        : "Se registrará como abono a la venta y en su corte de caja"
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">$</InputAdornment>
                      ),
                      inputProps: { min: 0, step: "0.01" }
                    }}
                  />
                  {Boolean(sale?.weeklyPayment || sale?.remainingAmount) && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      component="div"
                      sx={{ mt: 1 }}
                    >
                      {sale?.weeklyPayment
                        ? `Pago semanal: $${sale.weeklyPayment}`
                        : ''}
                      {sale?.weeklyPayment && sale?.remainingAmount ? ' · ' : ''}
                      {sale?.remainingAmount
                        ? `Saldo: $${sale.remainingAmount}`
                        : ''}
                    </Typography>
                  )}
                </Grid>
              )}

              <Grid item xs={12}>
                {hasError.error ? (
                  <Box mb={2}>
                    <Alert severity="error">{hasError?.msg}</Alert>
                  </Box>
                ) : null}
              </Grid>

              <Grid item xs={12}>
                <Grid
                  container
                  alignItems={"center"}
                  direction="row"
                  justifyContent="flex-end"
                  spacing={2}
                >
                  <Grid item>
                    <Button
                      size="large"
                      variant="outlined"
                      onClick={handleClose}
                      disabled={isLoading}
                      color="error"
                    >
                      Cancelar
                    </Button>
                  </Grid>
                  <Grid item>
                    <LoadingButton
                      disabled={!saveButtonEnabled}
                      type="submit"
                      loading={isLoading}
                      size="large"
                      variant="contained"
                    >
                      Completar
                    </LoadingButton>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </Dialog>
  );
}

CompleteCollectionModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleOnClose: PropTypes.func.isRequired,
  handleOnConfirm: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  sale: PropTypes.object
};

CompleteCollectionModal.defaultProps = {
  isLoading: false,
  sale: null
};

export default CompleteCollectionModal;
